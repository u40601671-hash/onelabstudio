// Pure helper functions for the browser audio transcriber (no browser APIs here, so they can be unit-tested).

export const WINDOW_S = 30; // Whisper reads 30 seconds at a time
export const HOP_S = 25; // each window starts 25 s after the previous one (5 s overlap)
const TRIM_S = (WINDOW_S - HOP_S) / 2; // each side of an overlap is trusted up to its middle

/** Split a recording into overlapping 30 s windows. Words are kept by their midpoint, so no word is lost or doubled. */
export function planWindows(totalSeconds) {
  const windows = [];
  let start = 0;
  for (let index = 0; ; index++) {
    const end = Math.min(start + WINDOW_S, totalSeconds);
    const last = end >= totalSeconds - 1e-6;
    windows.push({
      index,
      start,
      end,
      keepFrom: index === 0 ? 0 : start + TRIM_S,
      keepTo: last ? Infinity : end - TRIM_S,
      last,
    });
    if (last) break;
    start += HOP_S;
  }
  return windows;
}

const NON_SPEECH = /^[\[(♪*].*[\])♪*]$/; // [BLANK_AUDIO], (music), ♪ ...

/** Turn raw Whisper chunks ({text, timestamp:[s,e]}) of one window into absolute-time words. */
export function windowWords(chunks, offsetSeconds, window) {
  const words = [];
  for (const c of chunks || []) {
    const text = String(c.text ?? "").trim();
    if (!text || NON_SPEECH.test(text)) continue;
    const ts = c.timestamp || [];
    const s = Number(ts[0]);
    if (!Number.isFinite(s)) continue;
    let e = Number(ts[1]);
    if (!Number.isFinite(e) || e < s) e = s + 0.3;
    const start = offsetSeconds + s;
    const end = offsetSeconds + e;
    const mid = (start + end) / 2;
    if (window && (mid < window.keepFrom || mid >= window.keepTo)) continue;
    words.push({ word: text, start, end });
  }
  return words;
}

/**
 * Whisper's word times (via cross-attention) arrive about one word late: each word's start really is where the
 * previous word's start was reported. This re-aligns them. Checked against Edge-TTS ground truth on 5 clips
 * (English x3, Urdu, Spanish): median start error 208 ms -> 46 ms, 88% of words within 150 ms.
 * Also drops a "ghost" word that Whisper sometimes invents right at the very end of the audio.
 */
export function correctTimings(words, totalSeconds = Infinity) {
  const raw = words.filter((w) => !(Number.isFinite(totalSeconds) && w.start >= totalSeconds - 0.05));
  const starts = raw.map((w, j) => {
    const s = w.start;
    const prev = raw[j - 1];
    const afterPause = !prev || s - prev.end >= 0.25;
    const guess = afterPause ? s - 0.2 : prev.start;
    return Math.min(Math.max(guess, s - 0.32), s - 0.12);
  });
  return raw.map((w, j) => {
    const next = raw[j + 1];
    const start = Math.max(0, starts[j]);
    let end;
    if (next && next.start - w.end < 0.25) end = Math.max(starts[j + 1], start + 0.08);
    else end = Math.max(w.end - 0.2, start + 0.12);
    if (Number.isFinite(totalSeconds)) end = Math.min(end, totalSeconds);
    return { ...w, start, end };
  });
}

const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Remove "stuck" repeats (the same word more than 3 times in a row), a known Whisper glitch in silence/noise. */
export function collapseRepeats(words) {
  const out = [];
  let run = 0;
  for (const w of words) {
    const prev = out[out.length - 1];
    if (prev && norm(prev.word) && norm(prev.word) === norm(w.word)) run++;
    else run = 1;
    if (run <= 3) out.push(w);
  }
  return out;
}

/** Make timings tidy: in order, never negative, no overlaps, every word at least a little visible. */
export function cleanTimings(words, totalSeconds = Infinity) {
  const out = [];
  for (const w of words) {
    let start = Math.max(0, w.start);
    let end = Math.max(w.end, start + 0.05);
    const prev = out[out.length - 1];
    if (prev) {
      if (start < prev.start) start = prev.start;
      if (prev.end > start) prev.end = Math.max(prev.start + 0.03, start); // trim overlap
      if (end <= start) end = start + 0.05;
    }
    if (Number.isFinite(totalSeconds)) {
      start = Math.min(start, totalSeconds);
      end = Math.min(end, totalSeconds);
      if (end <= start) end = Math.min(totalSeconds, start + 0.05);
    }
    out.push({ ...w, start, end });
  }
  return out;
}

const SENTENCE_END = /[.!?…۔؟。！？]["')\]]*$/;
const SOFT_BREAK = /[,;:،؛]["')\]]*$/;

/** Group words into readable subtitle cues (max 2 lines of 42 characters, max 6.5 s, breaks at sentences and pauses). */
export function buildCues(words, { maxLine = 42, maxChars = 84, maxSeconds = 6.5, pauseSeconds = 0.8 } = {}) {
  const cues = [];
  let cur = [];
  const textOf = (ws) => ws.map((w) => w.word).join(" ");
  const flush = () => {
    if (!cur.length) return;
    cues.push({ index: cues.length + 1, start: cur[0].start, end: cur[cur.length - 1].end, words: cur, text: textOf(cur) });
    cur = [];
  };
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const chars = textOf(cur).length;
    const dur = w.end - cur[0].start;
    const gap = next ? next.start - w.end : Infinity;
    const endsSentence = SENTENCE_END.test(w.word);
    const soft = SOFT_BREAK.test(w.word);
    const nextWouldOverflow = next ? chars + 1 + next.word.length > maxChars : false;
    if (
      !next ||
      (endsSentence && chars >= 18) ||
      gap >= pauseSeconds ||
      (soft && chars >= 38) ||
      nextWouldOverflow ||
      dur >= maxSeconds
    ) {
      flush();
    }
  });
  // two balanced lines when a cue is longer than one line
  cues.forEach((c) => {
    c.lines = wrapLines(c.text, maxLine);
  });
  // give very short cues a little more screen time without touching the next one
  cues.forEach((c, i) => {
    const next = cues[i + 1];
    const want = c.start + 0.8;
    if (c.end < want) c.end = next ? Math.min(want, next.start) : want;
    if (c.end <= c.start) c.end = c.start + 0.2;
  });
  return cues;
}

export function wrapLines(text, maxLine = 42) {
  if (text.length <= maxLine) return [text];
  const words = text.split(" ");
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const score = Math.abs(a.length - b.length) + (a.length > maxLine || b.length > maxLine ? 1000 : 0);
    if (!best || score < best.score) best = { score, lines: [a, b] };
  }
  return best ? best.lines : [text];
}

// ---------- formatting ----------
function parts(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000)); // rounding happens once, on the total, so .9996 carries correctly
  const ms = totalMs % 1000;
  const s = Math.floor(totalMs / 1000) % 60;
  const m = Math.floor(totalMs / 60000) % 60;
  const h = Math.floor(totalMs / 3600000);
  return [h, m, s, ms];
}
const p2 = (n) => String(n).padStart(2, "0");
export function srtTime(seconds) {
  const [h, m, s, ms] = parts(seconds);
  return `${p2(h)}:${p2(m)}:${p2(s)},${String(ms).padStart(3, "0")}`;
}
export function vttTime(seconds) {
  return srtTime(seconds).replace(",", ".");
}
export function clock(seconds) {
  const [h, m, s] = parts(seconds);
  return h ? `${h}:${p2(m)}:${p2(s)}` : `${m}:${p2(s)}`;
}

/** Apply a manual timing offset (seconds) to everything. Never goes below 0. */
export function shiftWords(words, offset) {
  return words.map((w) => ({ ...w, start: Math.max(0, w.start + offset), end: Math.max(0, w.end + offset) }));
}

export function toSrt(cues) {
  return (
    cues
      .map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.lines.join("\n")}\n`)
      .join("\n")
  );
}

export function toVtt(cues) {
  return (
    "WEBVTT\n\n" +
    cues.map((c, i) => `${i + 1}\n${vttTime(c.start)} --> ${vttTime(c.end)}\n${c.lines.join("\n")}\n`).join("\n")
  );
}

export function toPlainText(words) {
  return words.map((w) => w.word).join(" ").replace(/\s+([,.;:!?…،؛۔؟])/g, "$1");
}

export function toTimestampedText(cues) {
  return cues.map((c) => `[${clock(c.start)} - ${clock(c.end)}] ${c.lines.join(" ")}`).join("\n");
}

/** Find the word being spoken at time t (binary search). Returns -1 between words. */
export function wordAt(words, t) {
  let lo = 0;
  let hi = words.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (found >= 0 && t <= words[found].end + 0.15) return found; // small tail so the word does not flicker off
  return -1;
}
