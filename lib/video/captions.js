// Captions: cut scene text into on-screen chunks, draw them with the Canvas API, export SRT/VTT.
// The SAME drawCaption() draws the live preview and the PNGs that FFmpeg burns into the MP4, so both always match.
// The browser (not FFmpeg) does the text shaping, so Arabic/Urdu, Hindi, CJK and emoji work with the user's own fonts.
import { estimateWords } from "./scenes.js";
import { isCjk, wordCount } from "./timing.js";
import { srtTime, vttTime } from "./time.js";

export const FONT_STACKS = {
  sans: '"Segoe UI", Inter, system-ui, -apple-system, Roboto, Arial, "Noto Sans", "Noto Sans Arabic", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC", "Noto Sans Devanagari", sans-serif',
  bold: '"Arial Black", Impact, "Segoe UI", Arial, "Noto Sans", "Noto Sans Arabic", sans-serif',
  serif: 'Georgia, "Times New Roman", "Noto Serif", "Noto Naskh Arabic", serif',
  rounded: '"Trebuchet MS", "Segoe UI", Verdana, "Noto Sans", sans-serif',
  mono: 'Consolas, "Courier New", monospace',
};
export const FONT_LABELS = { sans: "Clean sans", bold: "Heavy", serif: "Serif", rounded: "Rounded", mono: "Typewriter" };

export const CAPTION_PRESETS = {
  clean: { label: "Clean", fontKey: "sans", weight: 700, sizePct: 6, color: "#ffffff", strokeColor: "#000000", strokeEm: 0.1, bgColor: "#000000", bgOpacity: 0, highlight: false, highlightColor: "#fde047", uppercase: false, shadow: true },
  creator: { label: "Bold creator", fontKey: "bold", weight: 900, sizePct: 7, color: "#ffffff", strokeColor: "#000000", strokeEm: 0.16, bgColor: "#000000", bgOpacity: 0, highlight: true, highlightColor: "#facc15", uppercase: true, shadow: false },
  karaoke: { label: "Word highlight", fontKey: "sans", weight: 800, sizePct: 6.5, color: "#ffffff", strokeColor: "#0b1220", strokeEm: 0.14, bgColor: "#000000", bgOpacity: 0, highlight: true, highlightColor: "#38bdf8", uppercase: false, shadow: true },
  boxed: { label: "Boxed", fontKey: "sans", weight: 700, sizePct: 5.5, color: "#ffffff", strokeColor: "#000000", strokeEm: 0, bgColor: "#000000", bgOpacity: 0.72, highlight: false, highlightColor: "#fde047", uppercase: false, shadow: false },
  minimal: { label: "Minimal", fontKey: "sans", weight: 500, sizePct: 5.2, color: "#ffffff", strokeColor: "#000000", strokeEm: 0, bgColor: "#000000", bgOpacity: 0, highlight: false, highlightColor: "#fde047", uppercase: false, shadow: true },
};

export function makeCaptionStyle(preset = "creator", keep = {}) {
  return { preset, enabled: true, pos: "bottom", maxChars: 28, ...CAPTION_PRESETS[preset], ...keep };
}

// ---------- chunks ----------
/** Words of one scene with their times. Real word times when we have them, otherwise an even spread (flagged estimated). */
export function sceneTokens(scene) {
  const text = (scene.text || "").trim();
  const cjk = isCjk(text);
  const textTokens = cjk ? Array.from(text.replace(/\s/g, "")) : text.split(/\s+/).filter(Boolean);
  if (scene.words && scene.words.length) {
    if (scene.words.length === textTokens.length) return scene.words.map((w, i) => ({ word: textTokens[i], start: w.start, end: w.end, estimated: !!w.estimated }));
    return scene.words.map((w) => ({ word: w.word, start: w.start, end: w.end, estimated: !!w.estimated }));
  }
  return estimateWords(text, scene.start, scene.end);
}

const ENDS = /[.!?…。！？؟۔]["')\]”’]*$/;

/** Split every scene's text into short on-screen lines. */
export function captionChunks(scenes, maxChars = 28) {
  const chunks = [];
  scenes.forEach((scene, si) => {
    const tokens = sceneTokens(scene);
    const cjk = isCjk(scene.text || "");
    let cur = [];
    const len = (arr) => arr.reduce((n, t) => n + Array.from(t.word).length + (cjk ? 0 : 1), 0);
    const flush = () => {
      if (!cur.length) return;
      chunks.push({
        scene: si,
        start: cur[0].start,
        end: cur[cur.length - 1].end,
        tokens: cur,
        text: cur.map((t) => t.word).join(cjk ? "" : " "),
        estimated: cur.some((t) => t.estimated),
      });
      cur = [];
    };
    tokens.forEach((tok, i) => {
      const next = tokens[i + 1];
      if (cur.length && len(cur) + Array.from(tok.word).length > maxChars) flush();
      cur.push(tok);
      if (!next) return flush();
      const gap = next.start - tok.end;
      if ((ENDS.test(tok.word) && len(cur) >= 12) || gap >= 0.9) flush();
    });
    flush();
  });
  // a line stays up a little after its last word, but never over the next line and never too briefly
  chunks.forEach((c, i) => {
    const next = chunks[i + 1];
    let end = Math.max(c.end + 0.12, c.start + 0.45);
    if (next) end = Math.min(end, Math.max(next.start, c.end));
    c.end = Math.max(end, c.start + 0.1);
  });
  return chunks;
}

/** What is on screen during a chunk: one picture per spoken word when highlighting, else a single picture. */
export function chunkStates(chunk, highlight) {
  if (!highlight || chunk.tokens.length < 2) return [{ start: chunk.start, end: chunk.end, active: -1 }];
  return chunk.tokens.map((t, i) => ({
    start: i === 0 ? chunk.start : t.start,
    end: i === chunk.tokens.length - 1 ? chunk.end : chunk.tokens[i + 1].start,
    active: i,
  })).filter((s) => s.end - s.start > 0.001);
}

/** Chunk and active word at time t (for the preview). */
export function chunkAt(chunks, t, highlight) {
  let lo = 0;
  let hi = chunks.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (chunks[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (found < 0 || t > chunks[found].end) return null;
  const chunk = chunks[found];
  let active = -1;
  if (highlight) for (let i = 0; i < chunk.tokens.length; i++) if (chunk.tokens[i].start <= t) active = i;
  return { chunk, active };
}

export const chunksToSrt = (chunks) => chunks.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n");
export const chunksToVtt = (chunks) => "WEBVTT\n\n" + chunks.map((c, i) => `${i + 1}\n${vttTime(c.start)} --> ${vttTime(c.end)}\n${c.text}\n`).join("\n");

// ---------- drawing ----------
/** Where the caption area sits inside the frame (in output pixels). */
export function layoutCaption(W, H, pos) {
  const boxH = Math.round(H * 0.3);
  const bottomMargin = Math.round(H * (H > W ? 0.14 : 0.07)); // portrait: keep clear of the app's buttons
  const y = pos === "top" ? Math.round(H * 0.08) : pos === "middle" ? Math.round((H - boxH) / 2) : H - boxH - bottomMargin;
  return { boxY: Math.max(0, y), boxH };
}

const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draw one caption (tokens = [{word}], active = index of the highlighted word or -1) in frame coordinates.
 * The context may be scaled/translated by the caller, so the layout is identical in preview and in the render.
 */
export function drawCaption(ctx, frame, tokens, active, style) {
  const { W, H } = frame;
  const fontPx = (style.sizePct / 100) * Math.min(W, H);
  ctx.font = `${style.weight} ${fontPx}px ${FONT_STACKS[style.fontKey] || FONT_STACKS.sans}`;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  const all = tokens.map((t) => t.word).join(" ");
  const cjk = isCjk(all);
  const rtl = RTL.test(all);
  const gap = cjk ? 0 : ctx.measureText(" ").width;
  const maxW = W * 0.86;
  const show = (w) => (style.uppercase ? w.toUpperCase() : w);

  // wrap
  const lines = [];
  let line = { items: [], width: 0 };
  tokens.forEach((tok, i) => {
    const text = show(tok.word);
    const w = ctx.measureText(text).width;
    const add = line.items.length ? gap : 0;
    if (line.items.length && line.width + add + w > maxW) {
      lines.push(line);
      line = { items: [], width: 0 };
    }
    line.width += (line.items.length ? gap : 0) + w;
    line.items.push({ text, w, i });
  });
  if (line.items.length) lines.push(line);

  const lineH = fontPx * 1.28;
  const blockH = lines.length * lineH;
  const { boxY, boxH } = layoutCaption(W, H, style.pos);
  const top = style.pos === "bottom" ? boxY + boxH - blockH : style.pos === "top" ? boxY : boxY + (boxH - blockH) / 2;

  lines.forEach((ln, li) => {
    const baseline = top + li * lineH + fontPx * 1.0;
    if (style.bgOpacity > 0) {
      const padX = fontPx * 0.5;
      const bx = (W - ln.width) / 2 - padX;
      ctx.save();
      ctx.globalAlpha = style.bgOpacity;
      ctx.fillStyle = style.bgColor;
      roundRect(ctx, bx, baseline - fontPx * 0.95, ln.width + padX * 2, lineH * 0.95, fontPx * 0.28);
      ctx.fill();
      ctx.restore();
    }
    let x = rtl ? (W + ln.width) / 2 : (W - ln.width) / 2;
    ln.items.forEach((it) => {
      const px = rtl ? x - it.w : x;
      if (style.strokeEm > 0) {
        ctx.save();
        ctx.lineWidth = style.strokeEm * fontPx * 2;
        ctx.strokeStyle = style.strokeColor;
        ctx.strokeText(it.text, px, baseline);
        ctx.restore();
      }
      ctx.save();
      if (style.shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = fontPx * 0.14;
        ctx.shadowOffsetY = fontPx * 0.05;
      }
      ctx.fillStyle = style.highlight && it.i === active ? style.highlightColor : style.color;
      ctx.fillText(it.text, px, baseline);
      ctx.restore();
      x += rtl ? -(it.w + gap) : it.w + gap;
    });
  });
}

/** A drawing surface. OffscreenCanvas works without touching the page. */
export function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// ---- PNG encoder ----
// Browsers slow canvas.toBlob()/convertToBlob() down to ONE image per second when the tab is in the background
// (people switch tabs while a video renders). Reading pixels and compressing with CompressionStream is not slowed,
// so images are encoded here instead.
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
async function deflate(bytes) {
  const cs = new CompressionStream("deflate"); // zlib format, which is what PNG wants
  const w = cs.writable.getWriter();
  w.write(bytes);
  w.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}
export const canEncodePng = () => typeof CompressionStream !== "undefined";

/** Straight RGBA pixels -> PNG bytes. */
export async function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1); // filter byte stays 0
  const idat = await deflate(raw);
  const chunk = (type, data) => {
    const out = new Uint8Array(12 + data.length);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8);
    dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
    return out;
  };
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  parts.forEach((p) => {
    out.set(p, at);
    at += p.length;
  });
  return out;
}

export async function canvasBlob(canvas, type, quality) {
  if (canvas.convertToBlob) return canvas.convertToBlob({ type, quality });
  return new Promise((res) => canvas.toBlob(res, type, quality));
}

/** Render one caption as a transparent PNG covering the caption area (full width). Returns Uint8Array. */
export async function captionPng(frame, tokens, active, style) {
  const { boxY, boxH } = layoutCaption(frame.W, frame.H, style.pos);
  const canvas = makeCanvas(frame.W, boxH);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (tokens && tokens.length) {
    ctx.translate(0, -boxY);
    drawCaption(ctx, frame, tokens, active, style);
  }
  if (canEncodePng()) {
    const img = ctx.getImageData(0, 0, frame.W, boxH);
    return encodePng(frame.W, boxH, img.data);
  }
  const blob = await canvasBlob(canvas, "image/png");
  if (!blob) throw new Error("The browser could not create a caption image.");
  return new Uint8Array(await blob.arrayBuffer());
}

export { wordCount };
