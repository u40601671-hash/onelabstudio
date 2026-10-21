// Reading timing data: SRT, WebVTT and JSON (including the JSON written by my TTS tool and Whisper/Groq style files).
// Everything returns "rows": [{ text, start, end, words? }] where words = [{ word, start, end }] when real word times exist.
import { parseTimestamp, round3 } from "./time.js";

const SENTENCE_END = /[.!?…。！？؟۔]["')\]”’]*$/;
export const isCjk = (s) => /[぀-ヿ㐀-鿿]/.test(s); // Japanese and Chinese have no spaces between words (Korean does)

export const wordCount = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;

/** Split a script into sentences (works for Latin, Arabic/Urdu and CJK punctuation). */
export function splitSentences(text) {
  const clean = String(text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  if (!clean) return [];
  const out = [];
  for (const para of clean.split(/\n+/)) {
    const m = para.match(/[^.!?…。！？؟۔]+(?:[.!?…。！？؟۔]+["')\]”’]*|$)/gu);
    (m || [para]).forEach((s) => {
      const t = s.trim();
      if (t) out.push(t);
    });
  }
  return out;
}

const decodeEntities = (s) => s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** SRT / VTT text → rows. Throws a friendly Error when nothing usable is found. */
export function parseSubtitleText(raw) {
  const text = String(raw).replace(/^﻿/, "").replace(/\r/g, "");
  const blocks = text.replace(/^WEBVTT[^\n]*\n/, "").trim().split(/\n\s*\n/);
  const rows = [];
  let skipped = 0;
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const at = lines.findIndex((l) => l.includes("-->"));
    if (at < 0) {
      if (!/^(NOTE|STYLE|REGION)/.test(lines[0] || "")) skipped++;
      continue;
    }
    const [a, b] = lines[at].split("-->").map((x) => x.trim().split(/\s+/)[0]);
    const start = parseTimestamp(a);
    const end = parseTimestamp(b);
    const body = decodeEntities(lines.slice(at + 1).join(" ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (start == null || end == null || !body) {
      skipped++;
      continue;
    }
    rows.push({ text: body, start, end });
  }
  if (!rows.length) throw new Error("No subtitle lines were found. Check that this is a valid SRT or VTT file.");
  return { rows, skipped };
}

const seconds = (item, keys, msKeys) => {
  for (const k of keys) if (item[k] != null) {
    const v = parseTimestamp(item[k]);
    if (v != null) return v;
  }
  for (const k of msKeys) if (typeof item[k] === "number") return item[k] / 1000;
  return null;
};

function normItem(item) {
  if (!item || typeof item !== "object") return null;
  let start = seconds(item, ["start", "start_time", "startTime", "begin", "from"], ["start_ms", "startMs"]);
  let end = seconds(item, ["end", "end_time", "endTime", "finish", "to"], ["end_ms", "endMs"]);
  if (start == null && typeof item.offset === "number") {
    // raw Edge-TTS: offset and duration in 100-nanosecond ticks
    start = item.offset / 1e7;
    end = start + (item.duration || 0) / 1e7;
  }
  const text = item.text ?? item.sentence ?? item.word ?? item.token ?? item.content ?? item.transcript;
  if (start == null || end == null || text == null) return null;
  const t = String(text).trim();
  if (!t || end < start) return null;
  return { text: t, start, end };
}

/** Group word rows into sentences using the script (if it matches), punctuation, pauses and a max length. */
export function sentencesFromWords(words, scriptText = "") {
  if (!words.length) return [];
  const lines = splitSentences(scriptText);
  const cjk = words.some((w) => isCjk(w.word));
  const count = (l) => (cjk ? Array.from(l.replace(/\s/g, "")).length : wordCount(l));
  if (lines.length && lines.reduce((n, l) => n + count(l), 0) === words.length) {
    let i = 0;
    return lines.map((text) => {
      const part = words.slice(i, (i += count(text)));
      return { text, start: part[0].start, end: part[part.length - 1].end, words: part };
    });
  }
  const out = [];
  let cur = [];
  const join = (ws) => ws.map((w) => w.word).join(cjk ? "" : " ").replace(/\s+([,.!?،؛:;。！？…])/g, "$1");
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const gap = next ? next.start - w.end : Infinity;
    if (!next || SENTENCE_END.test(w.word) || gap >= 0.45 || cur.length >= (cjk ? 30 : 16)) {
      out.push({ text: join(cur), start: cur[0].start, end: cur[cur.length - 1].end, words: cur });
      cur = [];
    }
  });
  return out;
}

function attachWords(rows, words) {
  if (!words.length) return rows;
  const cjk = words.some((w) => isCjk(w.word));
  const count = (t) => (cjk ? Array.from(t.replace(/\s/g, "")).length : wordCount(t));
  if (rows.reduce((n, r) => n + count(r.text), 0) === words.length) {
    let i = 0;
    return rows.map((r) => ({ ...r, words: words.slice(i, (i += count(r.text))) }));
  }
  return rows.map((r) => {
    const w = words.filter((x) => (x.start + x.end) / 2 >= r.start - 0.05 && (x.start + x.end) / 2 <= r.end + 0.05);
    return w.length ? { ...r, words: w } : r;
  });
}

/**
 * Read a timing file. Returns { rows, wordLevel, estimated, kind, note }.
 *  - SRT / VTT: sentence-level rows
 *  - JSON from my TTS tool: { sentences:[{sentence,start,end}], words:[{word,start,end}], timing_estimated }
 *  - Whisper / Groq style: { segments:[{start,end,text,words?}], words:[...] }
 *  - plain arrays of {start,end,text|word}
 */
export function parseTimingFile(name, raw, scriptText = "") {
  const ext = String(name).toLowerCase().split(".").pop();
  const trimmed = String(raw).replace(/^﻿/, "").trim();
  if (!trimmed) throw new Error("This file is empty.");

  if (ext === "srt" || ext === "vtt" || trimmed.startsWith("WEBVTT") || /-->/.test(trimmed.slice(0, 400))) {
    const { rows, skipped } = parseSubtitleText(trimmed);
    return { rows, wordLevel: false, estimated: false, kind: ext === "vtt" || trimmed.startsWith("WEBVTT") ? "vtt" : "srt", note: skipped ? `${skipped} block(s) could not be read and were skipped.` : "" };
  }

  let json;
  try {
    json = JSON.parse(trimmed);
  } catch {
    throw new Error("This JSON file could not be read. It looks malformed.");
  }
  const obj = Array.isArray(json) ? { items: json } : json;
  const estimated = obj.timing_estimated === true || obj.timings_estimated === true;
  const norm = (arr) => (Array.isArray(arr) ? arr.map(normItem).filter(Boolean).sort((a, b) => a.start - b.start) : []);

  const words = norm(obj.words).map((w) => ({ word: w.text, start: w.start, end: w.end }));
  const sentences = norm(obj.sentences);
  const segments = norm(obj.segments || obj.transcription?.segments || obj.data?.segments);
  const items = norm(obj.items);

  const make = (rows, wordLevel, kind) => {
    if (!rows.length) throw new Error("No usable timed text was found. Each item needs start, end and text (or word).");
    return { rows: rows.map((r) => ({ ...r, start: round3(r.start), end: round3(r.end) })), wordLevel, estimated, kind, note: "" };
  };

  if (sentences.length) return make(attachWords(sentences, words), false, "json");
  if (segments.length) {
    const withInner = (obj.segments || []).map((s) => (Array.isArray(s?.words) ? norm(s.words).map((w) => ({ word: w.text, start: w.start, end: w.end })) : null));
    let rows = segments;
    if (withInner.some(Boolean)) rows = segments.map((r, i) => ({ ...r, words: withInner[i] || undefined }));
    else rows = attachWords(segments, words);
    return make(rows, false, "json");
  }
  const flat = words.length ? words : items.map((w) => ({ word: w.text, start: w.start, end: w.end }));
  if (!flat.length) return make([], false, "json");
  const avg = flat.reduce((n, w) => n + wordCount(w.word), 0) / flat.length;
  if (avg <= 1.4) return make(sentencesFromWords(flat, scriptText), true, "json");
  return make(flat.map((w) => ({ text: w.word, start: w.start, end: w.end })), false, "json");
}

/** Problems worth showing to the user (never blocks, except invalid ranges which are removed earlier). */
export function validateRows(rows, audioDuration = 0) {
  const issues = [];
  rows.forEach((r, i) => {
    if (!(r.end > r.start)) issues.push({ level: "error", text: `Line ${i + 1} ends before it starts.` });
    if (i > 0 && r.start < rows[i - 1].end - 0.05) issues.push({ level: "warn", text: `Lines ${i} and ${i + 1} overlap by ${(rows[i - 1].end - r.start).toFixed(2)} s.` });
    if (audioDuration && r.start > audioDuration + 0.5) issues.push({ level: "warn", text: `Line ${i + 1} starts after the audio ends (${r.start.toFixed(1)} s).` });
  });
  const last = rows[rows.length - 1];
  if (audioDuration && last && last.end > audioDuration + 1) issues.push({ level: "warn", text: `The timing file runs ${(last.end - audioDuration).toFixed(1)} s longer than your audio. Is it the right file?` });
  return issues;
}

/** Rows from a Whisper-style transcript: segments give the sentences, words give the exact timing. */
export function rowsFromTranscript(segments = [], words = []) {
  const segs = segments
    .map((s) => ({ text: String(s.text || "").trim(), start: Number(s.start), end: Number(s.end) }))
    .filter((s) => s.text && Number.isFinite(s.start) && Number.isFinite(s.end) && s.end >= s.start);
  const ws = words
    .map((w) => ({ word: String(w.word ?? w.text ?? "").trim(), start: Number(w.start), end: Number(w.end) }))
    .filter((w) => w.word && Number.isFinite(w.start) && Number.isFinite(w.end));
  return segs.length ? attachWords(segs, ws) : sentencesFromWords(ws, "");
}
