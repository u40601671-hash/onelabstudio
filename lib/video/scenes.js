// Scene logic: building scenes from timing rows, keeping them in order, timing maths and silence-cut remapping.
// Pure functions only, so they can be tested in Node.
import { uid, round3, clamp } from "./time.js";
import { isCjk, wordCount } from "./timing.js";

export const MIN_SCENE = 0.2; // shortest allowed scene in seconds

/** Spread the words of a text over [start, end] in proportion to their length. Flagged as estimated. */
export function estimateWords(text, start, end) {
  const cjk = isCjk(text);
  const tokens = cjk ? Array.from(text.replace(/\s/g, "")) : text.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const weights = tokens.map((t) => Math.max(1, Array.from(t).length) + (/[,;:،؛]$/.test(t) ? 1.5 : /[.!?…。！？؟۔]$/.test(t) ? 2.5 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let cur = start;
  return tokens.map((word, i) => {
    const len = ((end - start) * weights[i]) / total;
    const w = { word, start: round3(cur), end: round3(cur + len), estimated: true };
    cur += len;
    return w;
  });
}

/** How many sentences share one picture so that the pictures roughly cover the whole script ("Auto"). */
export const autoPerScene = (rowCount, mediaCount) => (!mediaCount || !rowCount ? 1 : Math.max(1, Math.ceil(rowCount / mediaCount)));

const joinText = (parts) => {
  const all = parts.join(" ");
  return isCjk(all) ? parts.join("") : all;
};

/** Group timing rows into scenes. `keep` is the previous scene list: media choices survive a regroup by index. */
export function buildScenes(rows, perScene, mediaIds = [], keep = []) {
  const n = Math.max(1, perScene | 0);
  const scenes = [];
  for (let i = 0; i < rows.length; i += n) {
    const part = rows.slice(i, i + n);
    const index = scenes.length;
    const hasWords = part.every((r) => Array.isArray(r.words) && r.words.length);
    scenes.push({
      id: uid("scene"),
      start: round3(part[0].start),
      end: round3(Math.max(part[part.length - 1].end, part[0].start + MIN_SCENE)),
      text: joinText(part.map((r) => r.text)),
      words: hasWords ? part.flatMap((r) => r.words) : null,
      mediaId: keep[index]?.mediaId ?? (mediaIds.length ? mediaIds[index % mediaIds.length] : null),
      fit: keep[index]?.fit || "cover",
      motion: keep[index]?.motion || "default",
      transition: keep[index]?.transition || "default",
    });
  }
  return scenes;
}

export function equalRows(lines, fallbackCount, duration) {
  const count = lines.length || Math.max(1, fallbackCount || 8);
  const total = duration > 0 ? duration : count * 3;
  return Array.from({ length: count }, (_, i) => ({
    text: lines[i] || `Scene ${i + 1}`,
    start: round3((i * total) / count),
    end: round3(((i + 1) * total) / count),
  }));
}

/**
 * Estimate sentence times from a script and the audio. `speech` = [{start,end}] regions where someone is talking
 * (from silence detection). Time is shared between sentences by their length over the SPEECH time only, then each
 * boundary snaps to the nearest real pause. Still an estimate: callers must label it so.
 */
export function estimateFromScript(lines, duration, speech) {
  if (!lines.length) return [];
  const regions = speech && speech.length ? speech : [{ start: 0, end: duration }];
  const weights = lines.map((l) => Math.max(1, Array.from(l.replace(/\s/g, "")).length) + (/[.!?…。！？؟۔]["')]*$/.test(l) ? 3 : 0));
  const sum = weights.reduce((a, b) => a + b, 0);
  const speechTotal = regions.reduce((a, r) => a + (r.end - r.start), 0);
  const toAbs = (sp) => {
    let left = sp;
    for (const r of regions) {
      const len = r.end - r.start;
      if (left <= len) return r.start + left;
      left -= len;
    }
    return regions[regions.length - 1].end;
  };
  const gaps = regions.slice(0, -1).map((r, i) => ({ from: r.end, to: regions[i + 1].start, used: false })).filter((g) => g.to > g.from);
  const bounds = []; // [endOfSentence_i, startOfSentence_i+1]
  let acc = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    acc += weights[i];
    const b = toAbs((speechTotal * acc) / sum);
    let best = null;
    for (const g of gaps) {
      if (g.used) continue;
      const d = Math.abs((g.from + g.to) / 2 - b);
      if (d <= 1.0 && (!best || d < best.d)) best = { g, d };
    }
    if (best) {
      best.g.used = true;
      bounds.push([best.g.from, best.g.to]);
    } else bounds.push([b, b]);
  }
  return lines.map((text, i) => ({
    text,
    start: round3(i === 0 ? regions[0].start : bounds[i - 1][1]),
    end: round3(i === lines.length - 1 ? regions[regions.length - 1].end : bounds[i][0]),
  }));
}

/** Total length of the video: the audio length, or the last scene if that is longer. */
export const totalDuration = (scenes, audioDuration = 0) => Math.max(audioDuration || 0, scenes.length ? scenes[scenes.length - 1].end : 0);

/**
 * Where each picture is on screen. A scene lasts from its start until the next scene starts (the first one from 0, the last
 * until the end). This keeps pictures and voice together and leaves no black gaps.
 */
export function tile(scenes, total) {
  const out = [];
  scenes.forEach((s, i) => {
    const from = i === 0 ? 0 : Math.max(out[i - 1].from + 0.05, s.start);
    out.push({ from, to: 0 });
  });
  out.forEach((seg, i) => {
    seg.to = i + 1 < out.length ? out[i + 1].from : Math.max(total, seg.from + 0.1);
  });
  return out;
}

/** Index of the scene on screen at time t (the last scene that has started). */
export function sceneIndexAt(scenes, t) {
  let idx = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (scenes[i].start <= t) idx = i;
    else break;
  }
  return idx;
}

const scaleWords = (words, from, to) => {
  if (!words) return words;
  const [a0, a1] = from;
  const [b0, b1] = to;
  const k = a1 > a0 ? (b1 - b0) / (a1 - a0) : 1;
  return words.map((w) => ({ ...w, start: round3(b0 + (w.start - a0) * k), end: round3(b0 + (w.end - a0) * k) }));
};

/** Change a scene's start/end (keeps words in proportion, keeps scenes in order and at least MIN_SCENE long). */
export function setSceneTimes(scenes, index, start, end) {
  const prev = scenes[index - 1];
  const next = scenes[index + 1];
  const s = clamp(start, prev ? prev.start + MIN_SCENE : 0, Infinity);
  const e = Math.max(end, s + MIN_SCENE);
  const limitedEnd = next ? Math.min(e, next.end - MIN_SCENE) : e;
  const cur = scenes[index];
  const finalEnd = Math.max(limitedEnd, s + MIN_SCENE);
  return scenes.map((sc, i) => (i === index ? { ...sc, start: round3(s), end: round3(finalEnd), words: scaleWords(sc.words, [cur.start, cur.end], [s, finalEnd]) } : sc));
}

/** Move the boundary between scene i and scene i+1 (the way you drag it on the timeline). */
export function moveBoundary(scenes, i, t) {
  const a = scenes[i];
  const b = scenes[i + 1];
  if (!a || !b) return scenes;
  const lo = a.start + MIN_SCENE;
  const hi = b.end - MIN_SCENE;
  const nt = round3(clamp(t, lo, hi));
  return scenes.map((sc, k) => {
    if (k === i) return { ...sc, end: nt, words: scaleWords(sc.words, [sc.start, sc.end], [sc.start, nt]) };
    if (k === i + 1) return { ...sc, start: nt, words: scaleWords(sc.words, [sc.start, sc.end], [nt, sc.end]) };
    return sc;
  });
}

export function shiftScenes(scenes, delta) {
  return scenes.map((s) => ({
    ...s,
    start: round3(Math.max(0, s.start + delta)),
    end: round3(Math.max(MIN_SCENE, s.end + delta)),
    words: s.words ? s.words.map((w) => ({ ...w, start: round3(Math.max(0, w.start + delta)), end: round3(Math.max(0, w.end + delta)) })) : s.words,
  }));
}

export function updateSceneText(scene, text) {
  const clean = text.replace(/\s+/g, " ");
  return { ...scene, text: clean, words: null }; // new text: old word times no longer fit, captions fall back to estimates
}

export function duplicateScene(scenes, index) {
  const s = scenes[index];
  const mid = round3((s.start + s.end) / 2);
  const first = { ...s, end: mid, words: s.words ? s.words.filter((w) => (w.start + w.end) / 2 < mid) : null };
  const second = { ...s, id: uid("scene"), start: mid, words: s.words ? s.words.filter((w) => (w.start + w.end) / 2 >= mid) : null };
  return [...scenes.slice(0, index), first, second, ...scenes.slice(index + 1)];
}

/** Split one scene in two at time t; the words are divided where the speech is. */
export function splitScene(scenes, index, t) {
  const s = scenes[index];
  if (!(t > s.start + MIN_SCENE && t < s.end - MIN_SCENE)) return null;
  const words = s.words || estimateWords(s.text, s.start, s.end);
  const left = words.filter((w) => (w.start + w.end) / 2 < t);
  const right = words.filter((w) => (w.start + w.end) / 2 >= t);
  if (!left.length || !right.length) return null;
  const txt = (ws) => joinText(ws.map((w) => w.word));
  const a = { ...s, end: round3(t), text: txt(left), words: s.words ? left : null };
  const b = { ...s, id: uid("scene"), start: round3(t), text: txt(right), words: s.words ? right : null };
  return [...scenes.slice(0, index), a, b, ...scenes.slice(index + 1)];
}


/** Swap the pictures of two neighbouring scenes (the words keep their time). */
export function swapVisuals(scenes, i, j) {
  if (!scenes[i] || !scenes[j]) return scenes;
  const out = scenes.map((s) => ({ ...s }));
  for (const k of ["mediaId", "fit", "motion", "transition"]) [out[i][k], out[j][k]] = [out[j][k], out[i][k]];
  return out;
}

export function assignMediaInOrder(scenes, mediaIds, onlyEmpty = false) {
  if (!mediaIds.length) return scenes;
  return scenes.map((s, i) => (onlyEmpty && s.mediaId ? s : { ...s, mediaId: mediaIds[i % mediaIds.length] }));
}

export function dropMedia(scenes, mediaId) {
  return scenes.map((s) => (s.mediaId === mediaId ? { ...s, mediaId: null } : s));
}

/** Everything the user should look at before rendering. */
export function sceneIssues(scenes, mediaById) {
  const issues = [];
  scenes.forEach((s, i) => {
    if (!(s.end - s.start > 0)) issues.push({ level: "error", scene: i, text: `Scene ${i + 1} has no length.` });
    if (!s.mediaId) issues.push({ level: "error", scene: i, text: `Scene ${i + 1} has no picture or clip.` });
    else if (!mediaById.has(s.mediaId)) issues.push({ level: "error", scene: i, text: `Scene ${i + 1} uses a file that was removed.` });
    if (i > 0 && s.start < scenes[i - 1].end - 0.05) issues.push({ level: "warn", scene: i, text: `Scenes ${i} and ${i + 1} overlap.` });
  });
  return issues;
}

// ---------- silence removal ----------
/** Turn detected silences into ranges to cut. A short natural pause (`pad`) is always kept. */
export function planCuts(silences, { minGap = 0.7, pad = 0.2, duration = Infinity } = {}) {
  const cuts = [];
  for (const s of silences) {
    const start = s.start;
    const end = Math.min(s.end, duration);
    if (end - start < minGap) continue;
    const from = start + pad / 2;
    const to = end - pad / 2;
    if (to - from > 0.05) cuts.push({ from: round3(from), to: round3(to) });
  }
  return cuts;
}
export const cutSeconds = (cuts) => cuts.reduce((a, c) => a + (c.to - c.from), 0);

/** Time after the cuts for an original time t. */
export function remapTime(t, cuts) {
  let removed = 0;
  for (const c of cuts) {
    if (t >= c.to) removed += c.to - c.from;
    else if (t > c.from) removed += t - c.from;
    else break;
  }
  return t - removed;
}

export function applyCuts(scenes, cuts) {
  if (!cuts.length) return scenes;
  return scenes.map((s) => ({
    ...s,
    start: round3(remapTime(s.start, cuts)),
    end: round3(Math.max(remapTime(s.end, cuts), remapTime(s.start, cuts) + MIN_SCENE)),
    words: s.words ? s.words.map((w) => ({ ...w, start: round3(remapTime(w.start, cuts)), end: round3(remapTime(w.end, cuts)) })) : s.words,
  }));
}

/** Ranges of audio that are KEPT, from the cut list. */
export function keptRanges(cuts, duration) {
  const out = [];
  let at = 0;
  for (const c of cuts) {
    if (c.from > at) out.push({ from: at, to: c.from });
    at = c.to;
  }
  if (duration > at) out.push({ from: at, to: duration });
  return out;
}

export { wordCount };
