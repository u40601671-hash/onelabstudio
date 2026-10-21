// Optional speech-to-text with the USER'S OWN Groq API key. Nothing here runs unless the user clicks the button and agrees.
// The audio is sent from the user's browser straight to Groq (Groq allows browser requests), never through our server.
// The key is never logged or stored by this module.
import { exclusive, exec, write, read, remove, extOf } from "./ffmpegClient.js";
import { rowsFromTranscript } from "./timing.js";

export const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
export const GROQ_MODEL = "whisper-large-v3-turbo";
const CHUNK_SECONDS = 600; // 10 minutes per request keeps every request small

export class GroqError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms, signal) =>
  new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      rej(new DOMException("Cancelled", "AbortError"));
    }, { once: true });
  });

async function send(bytes, name, { apiKey, language, signal, onStatus }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "audio/flac" }), name);
    form.append("model", GROQ_MODEL);
    form.append("response_format", "verbose_json");
    form.append("temperature", "0");
    form.append("timestamp_granularities[]", "word");
    form.append("timestamp_granularities[]", "segment");
    if (language) form.append("language", language);
    let res;
    try {
      res = await fetch(GROQ_URL, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form, signal });
    } catch (e) {
      if (e?.name === "AbortError") throw e;
      throw new GroqError("Could not reach Groq. Check your internet connection and try again.");
    }
    if (res.ok) return res.json();
    let detail = "";
    try {
      detail = (await res.json())?.error?.message || "";
    } catch {
      /* no body */
    }
    if (res.status === 401) throw new GroqError("Groq did not accept this API key. Check that you copied the whole key.", 401);
    if (res.status === 413) throw new GroqError("Groq says this audio part is too large.", 413);
    if (res.status === 429) {
      const wait = Math.min(60, Number(res.headers.get("retry-after")) || 20);
      if (attempt < 2) {
        onStatus?.(`Groq rate limit reached. Waiting ${wait} s, then trying again…`);
        await sleep(wait * 1000, signal);
        continue;
      }
      throw new GroqError("You have reached your Groq rate limit. Wait a few minutes (or until tomorrow on the free plan) and try again.", 429);
    }
    if (res.status === 400) throw new GroqError(`Groq could not use this audio: ${detail || "unsupported format"}`, 400);
    throw new GroqError(detail || `Groq returned an error (${res.status}).`, res.status);
  }
  throw new GroqError("Groq did not answer. Try again later.");
}

/** Convert to small mono FLAC parts (so every upload is small), cut every 10 minutes. */
function makeParts(file) {
  return exclusive(async () => {
    const id = Math.random().toString(36).slice(2, 7);
    const input = `gq_${id}.${extOf(file, "mp3")}`;
    const outs = [];
    try {
      await write(input, file);
      await exec(["-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "flac", "-f", "segment", "-segment_time", String(CHUNK_SECONDS), `gq_${id}_%03d.flac`]);
      for (let i = 0; i < 400; i++) {
        const name = `gq_${id}_${String(i).padStart(3, "0")}.flac`;
        let data;
        try {
          data = await read(name);
        } catch {
          break;
        }
        outs.push({ name, data: new Uint8Array(data) });
      }
      if (!outs.length) throw new GroqError("The audio could not be prepared for upload.");
      return outs;
    } finally {
      await remove(input, ...outs.map((o) => o.name));
      for (let i = 0; i < outs.length + 1; i++) await remove(`gq_${id}_${String(i).padStart(3, "0")}.flac`);
    }
  });
}

/** Transcribe with Groq. Returns { rows, words, language }. Rows carry real word times. */
export async function transcribeWithGroq(file, { apiKey, language = "", signal, onStatus } = {}) {
  const key = String(apiKey || "").trim();
  if (!key) throw new GroqError("Enter your Groq API key first.");
  onStatus?.("Preparing the audio…");
  const parts = await makeParts(file);
  const segments = [];
  const words = [];
  let detected = "";
  for (let i = 0; i < parts.length; i++) {
    onStatus?.(`Sending part ${i + 1} of ${parts.length} to Groq…`);
    const json = await send(parts[i].data, parts[i].name, { apiKey: key, language, signal, onStatus });
    const offset = i * CHUNK_SECONDS;
    detected = detected || json.language || "";
    (json.segments || []).forEach((s) => segments.push({ ...s, start: s.start + offset, end: s.end + offset }));
    (json.words || []).forEach((w) => words.push({ ...w, start: w.start + offset, end: w.end + offset }));
  }
  const rows = rowsFromTranscript(segments, words);
  if (!rows.length) throw new GroqError("Groq did not find any speech in this audio.");
  return { rows, words, language: detected, wordTimes: words.length > 0 };
}
