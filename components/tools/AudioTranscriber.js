"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  planWindows, windowWords, collapseRepeats, correctTimings, cleanTimings, shiftWords, buildCues,
  toSrt, toVtt, toPlainText, toTimestampedText, wordAt, clock,
} from "@/lib/transcribe-utils";

const SAMPLE_RATE = 16000;
const MAX_MINUTES = 30;
const MAX_FILE_MB = 500;

const MODELS = [
  { id: "Xenova/whisper-tiny", name: "Fast", size: "≈ 40 MB", note: "Quickest. Good for clear English." },
  { id: "Xenova/whisper-base", name: "Balanced", size: "≈ 75 MB", note: "Best for most recordings." },
  { id: "Xenova/whisper-small", name: "Accurate", size: "≈ 240 MB", note: "Best quality and other languages. Slower." },
];

const LANGUAGES = [
  ["", "Detect automatically"], ["english", "English"], ["urdu", "Urdu"], ["hindi", "Hindi"], ["arabic", "Arabic"],
  ["spanish", "Spanish"], ["french", "French"], ["german", "German"], ["portuguese", "Portuguese"], ["italian", "Italian"],
  ["russian", "Russian"], ["turkish", "Turkish"], ["indonesian", "Indonesian"], ["bengali", "Bengali"], ["punjabi", "Punjabi"],
  ["chinese", "Chinese"], ["japanese", "Japanese"], ["korean", "Korean"], ["dutch", "Dutch"], ["persian", "Persian"],
];

const mb = (n) => (n / 1048576).toFixed(0);
const dur = (s) => {
  s = Math.max(0, Math.round(s));
  return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
};

/** Decode any audio/video file the browser understands into 16 kHz mono samples (what Whisper needs). */
async function decodeToMono16k(arrayBuffer) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    ctx.close?.();
  }
  const length = Math.ceil(decoded.duration * SAMPLE_RATE);
  const off = new OfflineAudioContext(1, length, SAMPLE_RATE);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination); // mixing down to one channel happens automatically
  src.start();
  const rendered = await off.startRendering();
  return rendered.getChannelData(0);
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function AudioTranscriber() {
  const [model, setModel] = useState(MODELS[1].id);
  const [language, setLanguage] = useState("");
  const [translate, setTranslate] = useState(false);

  const [source, setSource] = useState(null); // {name, url, seconds}
  const [phase, setPhase] = useState("idle"); // idle | decoding | loading | working | done
  const [error, setError] = useState("");
  const [download_, setDownload] = useState({ loaded: 0, total: 0 });
  const [progress, setProgress] = useState({ done: 0, total: 0, startedAt: 0 });
  const [rawWords, setRawWords] = useState([]);
  const [offset, setOffset] = useState(0);
  const [active, setActive] = useState(-1);
  const [copied, setCopied] = useState("");
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const workerRef = useRef(null);
  const pendingRef = useRef(new Map());
  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const samplesRef = useRef(null);
  const cancelRef = useRef(false);
  const recRef = useRef({ rec: null, stream: null, timer: null, chunks: [] });
  const activeCueRef = useRef(null);

  // ---------- worker plumbing ----------
  const killWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    pendingRef.current.forEach((p) => p.reject(new Error("Stopped")));
    pendingRef.current.clear();
  }, []);

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker("/workers/whisper-worker.js", { type: "module" });
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === "download") setDownload({ loaded: m.loaded, total: m.total });
      else if (m.type === "ready") pendingRef.current.get("load")?.resolve();
      else if (m.type === "window") pendingRef.current.get(m.id)?.resolve(m);
      else if (m.type === "error") (pendingRef.current.get(m.id) || pendingRef.current.get("load"))?.reject(new Error(m.message));
    };
    w.onerror = () => {
      const err = new Error("The speech engine could not start. Check your internet connection and try again.");
      pendingRef.current.forEach((p) => p.reject(err));
    };
    workerRef.current = w;
    return w;
  }, []);

  const ask = useCallback((id, message, transfer) => new Promise((resolve, reject) => {
    pendingRef.current.set(id, { resolve, reject });
    ensureWorker().postMessage({ ...message, id }, transfer || []);
  }).finally(() => pendingRef.current.delete(id)), [ensureWorker]);

  useEffect(() => () => {
    killWorker();
    const r = recRef.current;
    clearInterval(r.timer);
    r.stream?.getTracks().forEach((t) => t.stop());
  }, [killWorker]);

  // keep the object URL tidy
  useEffect(() => () => { if (source?.url) URL.revokeObjectURL(source.url); }, [source]);

  // ---------- load an audio source ----------
  async function loadBlob(blob, name) {
    setError("");
    setRawWords([]);
    setActive(-1);
    setOffset(0);
    samplesRef.current = null;
    if (blob.size > MAX_FILE_MB * 1048576) {
      setError(`This file is ${mb(blob.size)} MB. Please use a file under ${MAX_FILE_MB} MB.`);
      return;
    }
    setPhase("decoding");
    try {
      const samples = await decodeToMono16k(await blob.arrayBuffer());
      const seconds = samples.length / SAMPLE_RATE;
      if (seconds < 0.5) throw new Error("That recording is empty.");
      if (seconds > MAX_MINUTES * 60) {
        throw new Error(`This recording is ${Math.round(seconds / 60)} minutes long. The limit is ${MAX_MINUTES} minutes. Cut it into shorter parts first.`);
      }
      samplesRef.current = samples;
      setSource({ name, url: URL.createObjectURL(blob), seconds });
      setPhase("idle");
    } catch (e) {
      setSource(null);
      setPhase("idle");
      setError(
        e?.name === "EncodingError" || /decode/i.test(String(e?.message))
          ? "This file could not be read. Try an MP3, WAV, M4A, OGG, WEBM or MP4 file."
          : String(e?.message || e),
      );
    }
  }

  function onPick(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) loadBlob(f, f.name);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadBlob(f, f.name);
  }

  // ---------- microphone ----------
  async function startRecording() {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("unsupported");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const r = recRef.current;
      r.rec = rec; r.stream = stream; r.chunks = [];
      rec.ondataavailable = (e) => e.data.size && r.chunks.push(e.data);
      rec.onstop = () => {
        clearInterval(r.timer);
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(r.chunks, { type: rec.mimeType || "audio/webm" });
        loadBlob(blob, "Microphone recording");
      };
      rec.start();
      setRecSeconds(0);
      setRecording(true);
      r.timer = setInterval(() => setRecSeconds((s) => {
        if (s + 1 >= MAX_MINUTES * 60) stopRecording();
        return s + 1;
      }), 1000);
    } catch (e) {
      setError(
        e?.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow the microphone in your browser's address bar and try again."
          : e?.name === "NotFoundError"
            ? "No microphone was found on this device."
            : "Recording is not available in this browser. Upload a file instead.",
      );
    }
  }

  function stopRecording() {
    const rec = recRef.current.rec;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  // ---------- transcribe ----------
  async function start() {
    const samples = samplesRef.current;
    if (!samples) return;
    cancelRef.current = false;
    setError("");
    setRawWords([]);
    setOffset(0);
    setActive(-1);
    setDownload({ loaded: 0, total: 0 });
    try {
      setPhase("loading");
      await ask("load", { type: "load", model });
      if (cancelRef.current) return;

      const total = samples.length / SAMPLE_RATE;
      const windows = planWindows(total);
      setProgress({ done: 0, total: windows.length, startedAt: Date.now() });
      setPhase("working");

      let all = [];
      for (const w of windows) {
        if (cancelRef.current) return;
        const slice = samples.slice(Math.floor(w.start * SAMPLE_RATE), Math.floor(w.end * SAMPLE_RATE)); // copy, so it can be transferred
        const out = await ask(`w${w.index}`, {
          type: "transcribe",
          audio: slice,
          language: language || null,
          task: translate ? "translate" : "transcribe",
        }, [slice.buffer]);
        all = all.concat(windowWords(out.chunks, w.start, w));
        setProgress((p) => ({ ...p, done: w.index + 1 }));
      }
      const words = cleanTimings(correctTimings(collapseRepeats(all), total), total);
      if (!words.length) {
        setPhase("idle");
        setError("No speech was found in this audio. Check that the recording has clear voices and try again.");
        return;
      }
      setRawWords(words);
      setPhase("done");
    } catch (e) {
      if (cancelRef.current) return;
      killWorker();
      setPhase("idle");
      const msg = String(e?.message || e);
      setError(/memory|alloc/i.test(msg) ? "Your device ran out of memory. Try the Fast model or a shorter recording." : msg);
    }
  }

  function cancel() {
    cancelRef.current = true;
    killWorker();
    setPhase("idle");
  }

  function reset() {
    cancelRef.current = true;
    setSource(null);
    samplesRef.current = null;
    setRawWords([]);
    setPhase("idle");
    setError("");
  }

  // ---------- results ----------
  const words = useMemo(() => (offset ? shiftWords(rawWords, offset) : rawWords), [rawWords, offset]);
  const cues = useMemo(() => {
    const c = buildCues(words);
    let n = 0;
    c.forEach((cue) => { cue.firstIndex = n; n += cue.words.length; });
    return c;
  }, [words]);

  // follow the audio with the highlighted word
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || phase !== "done") return;
    let raf = 0;
    const tick = () => {
      setActive((prev) => {
        const i = wordAt(words, audio.currentTime);
        return i === prev ? prev : i;
      });
      if (!audio.paused) raf = requestAnimationFrame(tick);
    };
    const kick = () => { cancelAnimationFrame(raf); tick(); };
    audio.addEventListener("play", kick);
    audio.addEventListener("seeked", kick);
    audio.addEventListener("pause", kick);
    audio.addEventListener("timeupdate", kick);
    return () => {
      cancelAnimationFrame(raf);
      ["play", "seeked", "pause", "timeupdate"].forEach((ev) => audio.removeEventListener(ev, kick));
    };
  }, [words, phase, source]);

  useEffect(() => {
    if (audioRef.current && !audioRef.current.paused) activeCueRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  function seek(t) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, t);
    a.play().catch(() => {});
  }

  async function copy(kind, text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(kind);
    setTimeout(() => setCopied(""), 1800);
  }

  const baseName = (source?.name || "transcript").replace(/\.[^.]+$/, "").replace(/[^\w\- ]+/g, "").trim() || "transcript";
  const plain = useMemo(() => toPlainText(words), [words]);

  // ---------- progress text ----------
  const dlPct = download_.total ? Math.min(100, Math.round((download_.loaded / download_.total) * 100)) : 0;
  const workPct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  let eta = "";
  if (phase === "working" && progress.done > 0) {
    const per = (Date.now() - progress.startedAt) / progress.done;
    eta = ` · about ${dur((per * (progress.total - progress.done)) / 1000)} left`;
  }

  const busy = phase === "decoding" || phase === "loading" || phase === "working";
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
  const label = "block text-sm font-bold text-ink";
  const select = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100";
  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-brand-200";
  const btnLight = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand-600 hover:text-brand-700 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-brand-100";

  return (
    <div className="space-y-6">
      {/* privacy line */}
      <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-ink">
        <span aria-hidden>🔒</span>
        <span>Private by design: your audio never leaves your device. The speech model downloads once, then runs right here in your browser.</span>
      </p>

      {phase !== "done" && (
        <>
          {/* STEP 1 */}
          <section className={card}>
            <h2 className="text-lg font-bold text-ink"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm text-white">1</span>Add your audio</h2>

            {!source && !recording && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`mt-4 rounded-2xl border-2 border-dashed p-8 text-center transition ${dragOver ? "border-brand-600 bg-brand-50" : "border-slate-300 bg-slate-50"}`}
              >
                <p className="text-base font-bold text-ink">{phase === "decoding" ? "Reading your file…" : "Drop an audio or video file here"}</p>
                <p className="mt-1 text-sm text-slate-600">MP3, WAV, M4A, OGG, WEBM, MP4 · up to {MAX_MINUTES} minutes</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={btnPrimary}>Choose a file</button>
                  <button type="button" onClick={startRecording} disabled={busy} className={btnLight}>🎙️ Record with microphone</button>
                </div>
                <input ref={fileRef} type="file" accept="audio/*,video/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.flac,.aac" onChange={onPick} className="hidden" />
              </div>
            )}

            {recording && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-base font-bold text-red-700"><span className="mr-2 inline-block h-3 w-3 animate-pulse rounded-full bg-red-600" />Recording… {clock(recSeconds)}</p>
                <button type="button" onClick={stopRecording} className="mt-4 rounded-xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700">Stop recording</button>
              </div>
            )}

            {source && !recording && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-ink">{source.name}</p>
                    <p className="text-sm text-slate-600">Length {dur(source.seconds)}</p>
                  </div>
                  <button type="button" onClick={reset} disabled={busy} className={btnLight}>Change</button>
                </div>
                <audio src={source.url} controls className="mt-3 w-full" />
              </div>
            )}
          </section>

          {/* STEP 2 */}
          <section className={card}>
            <h2 className="text-lg font-bold text-ink"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm text-white">2</span>Choose quality</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {MODELS.map((m) => (
                <label key={m.id} className={`cursor-pointer rounded-xl border-2 p-4 transition ${model === m.id ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-slate-300"} ${busy ? "pointer-events-none opacity-60" : ""}`}>
                  <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={() => setModel(m.id)} className="sr-only" />
                  <span className="block text-base font-bold text-ink">{m.name}</span>
                  <span className="block text-xs font-semibold text-brand-700">{m.size} download</span>
                  <span className="mt-1 block text-sm text-slate-600">{m.note}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className={label}>
                Language spoken
                <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={busy} className={select}>
                  {LANGUAGES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                </select>
                <span className="mt-1 block text-xs font-medium text-slate-600">Picking the language is more accurate than detecting it.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 self-start rounded-xl border border-slate-200 p-4 text-sm font-bold text-ink sm:mt-[1.6rem]">
                <input type="checkbox" checked={translate} onChange={(e) => setTranslate(e.target.checked)} disabled={busy} className="mt-0.5 h-5 w-5 accent-brand-600" />
                <span>Translate into English<span className="block text-xs font-medium text-slate-600">Write the English meaning instead of the original words.</span></span>
              </label>
            </div>
          </section>

          {/* STEP 3 */}
          <section className={card}>
            <h2 className="text-lg font-bold text-ink"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm text-white">3</span>Transcribe</h2>

            {!busy && (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button type="button" onClick={start} disabled={!source || recording} className={btnPrimary}>Start transcribing</button>
                {!source && <span className="text-sm font-medium text-slate-600">Add your audio first.</span>}
                {source && <span className="text-sm font-medium text-slate-600">Expect about {dur(source.seconds * 0.8)} on an average computer, plus a one-time model download.</span>}
              </div>
            )}

            {busy && (
              <div className="mt-4" role="status" aria-live="polite">
                <p className="text-base font-bold text-ink">
                  {phase === "decoding" && "Reading your file…"}
                  {phase === "loading" && (dlPct && dlPct < 100 ? `Downloading the speech model… ${dlPct}%` : "Starting the speech model… (first time takes a minute)")}
                  {phase === "working" && `Listening… part ${Math.min(progress.done + 1, progress.total)} of ${progress.total}${eta}`}
                </p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${phase === "loading" ? dlPct : phase === "working" ? workPct : 5}%` }} />
                </div>
                {phase === "loading" && download_.total > 0 && <p className="mt-2 text-xs font-medium text-slate-600">{mb(download_.loaded)} of {mb(download_.total)} MB. It is saved in your browser, so next time it starts much faster.</p>}
                {phase !== "decoding" && <button type="button" onClick={cancel} className={`${btnLight} mt-4`}>Stop</button>}
              </div>
            )}
          </section>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}

      {/* RESULT */}
      {phase === "done" && source && (
        <section className="space-y-6">
          <div className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ink">Your transcript is ready</h2>
                <p className="truncate text-sm text-slate-600">{source.name} · {words.length} words · {cues.length} subtitle lines</p>
              </div>
              <button type="button" onClick={reset} className={btnLight}>↺ New audio</button>
            </div>
            <audio ref={audioRef} src={source.url} controls className="mt-4 w-full" />
            <p className="mt-2 text-sm font-medium text-slate-600">Press play to watch each word light up. Click any word to jump to that moment in the audio.</p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <label className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-ink">
                Timing fine-tune
                <input type="range" min="-1" max="1" step="0.05" value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="min-w-[10rem] flex-1 accent-brand-600" />
                <span className="w-20 text-right tabular-nums text-brand-700">{offset > 0 ? "+" : ""}{offset.toFixed(2)} s</span>
                <button type="button" onClick={() => setOffset(0)} className="text-xs font-bold text-brand-700 underline">Reset</button>
              </label>
              <p className="mt-1 text-xs font-medium text-slate-600">If words appear a little early or late against the voice, nudge this. It moves every word and every download.</p>
            </div>
          </div>

          <div className={card}>
            <h3 className="text-base font-bold text-ink">Download or copy</h3>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button type="button" className={btnPrimary} onClick={() => download(`${baseName}.srt`, toSrt(cues), "application/x-subrip")}>⬇ Subtitles (.srt)</button>
              <button type="button" className={btnLight} onClick={() => download(`${baseName}.vtt`, toVtt(cues), "text/vtt")}>⬇ Web subtitles (.vtt)</button>
              <button type="button" className={btnLight} onClick={() => download(`${baseName}.txt`, plain, "text/plain")}>⬇ Text (.txt)</button>
              <button type="button" className={btnLight} onClick={() => download(`${baseName}-timestamps.txt`, toTimestampedText(cues), "text/plain")}>⬇ Text with times</button>
              <button type="button" className={btnLight} onClick={() => download(`${baseName}-words.json`, JSON.stringify(words.map((w) => ({ word: w.word, start: +w.start.toFixed(3), end: +w.end.toFixed(3) })), null, 2), "application/json")}>⬇ Word timings (.json)</button>
              <button type="button" className={btnLight} onClick={() => copy("text", plain)}>{copied === "text" ? "✓ Copied" : "Copy text"}</button>
            </div>
          </div>

          <div className={card}>
            <h3 className="text-base font-bold text-ink">Transcript</h3>
            <div className="mt-3 max-h-[28rem] space-y-1 overflow-y-auto pr-1">
              {cues.map((cue) => {
                const live = active >= cue.firstIndex && active < cue.firstIndex + cue.words.length;
                return (
                  <div key={cue.index} ref={live ? activeCueRef : null} className={`flex gap-3 rounded-xl px-3 py-2 transition ${live ? "bg-brand-50" : ""}`}>
                    <button type="button" onClick={() => seek(cue.start)} className="mt-0.5 h-fit shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold tabular-nums text-slate-700 hover:bg-brand-100 hover:text-brand-700" title="Play from here">{clock(cue.start)}</button>
                    <p dir="auto" className="min-w-0 flex-1 text-base leading-8 text-ink">
                      {cue.words.map((w, k) => {
                        const gi = cue.firstIndex + k;
                        return (
                          <span key={gi}>
                            <button type="button" onClick={() => seek(w.start)} className={`rounded px-0.5 transition ${gi === active ? "bg-brand-600 text-white" : "hover:bg-brand-100"}`}>{w.word}</button>{" "}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <p className="text-xs font-medium text-slate-500">
        Powered by OpenAI Whisper (open source) running in your browser. Word times are matched to the voice to within about 0.1 second on clear speech; background noise, music and overlapping voices can reduce accuracy.
      </p>
    </div>
  );
}
