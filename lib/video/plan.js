// Picture planner: decides where the voiceover is cut so that EVERY picture gets exactly one scene.
//
// The problem: you may have 12 sentences and 150 pictures, or 150 sentences and 40 pictures. Scenes must follow the
// narration (cuts in the right place) and use every picture once, in order.
//
// The method (dynamic programming, exact, runs in milliseconds):
//   - the narration is a list of words with times; after each word we know how good a place it is to cut:
//       end of a sentence (best)  >  comma / clause end  >  a real pause  >  anywhere between words (worst)
//   - we choose N-1 cut points (N = number of pictures) so that
//       (a) every scene lasts about the same time (total time / N), and
//       (b) the cuts sit on the best places available.
//     Each scene's cost = how far its length is from the ideal length + a penalty for a poor cut. The cheapest set wins.
//   - With fewer pictures than sentences, sentences are merged (cuts land on sentence ends).
//     With more pictures than sentences, long sentences are split (cuts land on commas and pauses first).
// This uses the timing of the narration only. It does not look at what is IN the pictures (that needs an image-reading model).
import { sceneTokens } from "./captions.js";
import { isCjk } from "./timing.js";
import { uid, round3 } from "./time.js";
import { MIN_SCENE } from "./scenes.js";

const SENT_END = /[.!?…。！？؟۔]["')\]”’]*$/;
const CLAUSE_END = /[,;:،؛、，：；]["')\]”’]*$/;

/** Every word of the narration in order, with a score for how good a cut after it would be. */
export function narrationAtoms(rows) {
  const atoms = [];
  rows.forEach((row, ri) => {
    const toks = sceneTokens({ text: row.text, words: row.words, start: row.start, end: row.end });
    toks.forEach((t, k) => atoms.push({ word: t.word, start: t.start, end: t.end, estimated: !!t.estimated, lastOfRow: k === toks.length - 1, row: ri }));
  });
  atoms.sort((a, b) => a.start - b.start);
  atoms.forEach((a, i) => {
    const next = atoms[i + 1];
    const gap = next ? Math.max(0, next.start - a.end) : 0;
    let q = 0;
    if (a.lastOfRow || SENT_END.test(a.word)) q = 3 + Math.min(gap, 1);
    else if (CLAUSE_END.test(a.word)) q = 1.6 + Math.min(gap, 1) * 0.5;
    else if (gap >= 0.25) q = 1 + Math.min(gap, 1) * 0.5;
    a.q = q;
  });
  return atoms;
}

const CUT_WEIGHT = 0.35; // how much a poor cut place costs compared to an uneven scene length

/** Cut the narration into exactly `count` parts (fewer only if the audio is too short). Returns [[firstAtom, lastAtom], ...]. */
export function cutNarration(atoms, count, minSpan = 0.5) {
  const M = atoms.length;
  const spanEnd = (j) => (j + 1 < M ? atoms[j + 1].start : atoms[j].end);
  const total = spanEnd(M - 1) - atoms[0].start;
  let N = Math.max(1, Math.min(count, M, Math.floor(total / minSpan) || 1));
  const penalty = (e) => (e === M - 1 ? 0 : CUT_WEIGHT * (4 - atoms[e].q));

  for (; N >= 1; N--) {
    const T = total / N;
    const maxSpan = Math.max(3.5 * T, minSpan * 2);
    const INF = 1e12;
    const f = Array.from({ length: N + 1 }, () => new Float64Array(M).fill(INF));
    const back = Array.from({ length: N + 1 }, () => new Int32Array(M).fill(-1));
    const dev = (span) => ((span - T) / T) ** 2;
    for (let e = 0; e < M; e++) {
      const span = spanEnd(e) - atoms[0].start;
      if (span >= minSpan || N === 1) f[1][e] = dev(span) + penalty(e) + (e === 0 ? 0.7 : e === 1 ? 0.3 : 0);
    }
    for (let j = 2; j <= N; j++) {
      for (let e = j - 1; e < M; e++) {
        let best = INF;
        let from = -1;
        for (let s = e; s >= j - 1; s--) {
          const span = spanEnd(e) - atoms[s].start;
          if (span > maxSpan) break;
          if (span < minSpan) continue;
          const prev = f[j - 1][s - 1];
          if (prev >= INF) continue;
          const words = e - s + 1;
          const orphan = words === 1 ? 0.7 : words === 2 ? 0.3 : 0; // a scene of one or two words looks abrupt
          const v = prev + dev(span) + penalty(e) + orphan;
          if (v < best) {
            best = v;
            from = s;
          }
        }
        f[j][e] = best;
        back[j][e] = from;
      }
    }
    if (f[N][M - 1] < INF) {
      const parts = [];
      let e = M - 1;
      for (let j = N; j >= 1; j--) {
        const s = j === 1 ? 0 : back[j][e];
        parts.unshift([s, e]);
        e = s - 1;
      }
      return parts;
    }
  }
  return [[0, M - 1]];
}

/**
 * Scenes for the given rows and pictures: one scene per picture, in order.
 * Returns { scenes, used, wanted } (`used` < `wanted` only when the voiceover is too short for that many pictures).
 */
export function planByPictures(rows, mediaIds) {
  const atoms = narrationAtoms(rows);
  if (!atoms.length || !mediaIds.length) return { scenes: [], used: 0, wanted: mediaIds.length };
  const parts = cutNarration(atoms, mediaIds.length);
  const cjk = isCjk(atoms.map((a) => a.word).join(""));
  const scenes = parts.map(([a, b], i) => {
    const toks = atoms.slice(a, b + 1);
    const real = toks.every((t) => !t.estimated);
    const start = round3(toks[0].start);
    return {
      id: uid("scene"),
      start,
      end: round3(Math.max(toks[toks.length - 1].end, start + MIN_SCENE)),
      text: toks.map((t) => t.word).join(cjk ? "" : " "),
      words: real ? toks.map((t) => ({ word: t.word, start: t.start, end: t.end })) : null,
      mediaId: mediaIds[i],
      fit: "cover",
      motion: "default",
      transition: "default",
    };
  });
  return { scenes, used: scenes.length, wanted: mediaIds.length };
}
