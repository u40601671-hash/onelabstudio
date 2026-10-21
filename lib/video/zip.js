// ZIP hand-off package: your media, scene list and captions, built locally in the browser.
// It is NOT a rendered video and NOT a CapCut project; it is source files plus clear metadata.
import JSZip from "jszip";
import { tile } from "./scenes.js";
import { chunksToSrt } from "./captions.js";

const safe = (name) => String(name || "file").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").replace(/^\.+/, "") || "file";

/** Unique names: photo.png, photo-2.png ... (a repeated name must never overwrite another file). */
export function uniqueNamer() {
  const used = new Set();
  return (name) => {
    const n = safe(name);
    const dot = n.lastIndexOf(".");
    const base = dot > 0 ? n.slice(0, dot) : n;
    const ext = dot > 0 ? n.slice(dot) : "";
    let out = n;
    let i = 2;
    while (used.has(out.toLowerCase())) out = `${base}-${i++}${ext}`;
    used.add(out.toLowerCase());
    return out;
  };
}

export async function buildZip({ scenes, media, voice, music, settings, chunks, total }, onProgress = () => {}) {
  if (!scenes.length && !media.length && !voice) throw new Error("There is nothing to pack yet. Add audio, scenes or media first.");
  const zip = new JSZip();
  const name = uniqueNamer();
  const paths = new Map();
  const STORE = { compression: "STORE" };
  let done = 0;
  const count = media.length + (voice ? 1 : 0) + (music ? 1 : 0);
  const tick = () => onProgress(Math.round((++done / Math.max(1, count + 1)) * 90));

  let voicePath = null;
  if (voice?.file) {
    voicePath = `audio/${name(`voiceover-${voice.name || voice.file.name}`)}`;
    zip.file(voicePath, voice.file, STORE);
    tick();
  }
  let musicPath = null;
  if (music?.file) {
    musicPath = `audio/${name(`music-${music.name || music.file.name}`)}`;
    zip.file(musicPath, music.file, STORE);
    tick();
  }
  for (const m of media) {
    const p = `media/${name(m.name)}`;
    paths.set(m.id, p);
    zip.file(p, m.file, STORE);
    tick();
  }

  const segs = tile(scenes, total);
  const manifest = {
    format: "One Lab Studio video package",
    version: 1,
    createdAt: new Date().toISOString(),
    note: "Source media and edit data. This is not a rendered MP4 and not a CapCut project.",
    totalSeconds: Number(total.toFixed(3)),
    settings,
    voiceover: voicePath,
    music: musicPath,
    captionsFile: chunks.length ? "captions.srt" : null,
    scenes: scenes.map((s, i) => ({
      scene: i + 1,
      speechStart: s.start,
      speechEnd: s.end,
      shownFrom: Number(segs[i].from.toFixed(3)),
      shownTo: Number(segs[i].to.toFixed(3)),
      text: s.text,
      media: s.mediaId ? paths.get(s.mediaId) || null : null,
      fit: s.fit,
      motion: s.motion,
      transition: s.transition,
    })),
  };
  zip.file("scenes.json", JSON.stringify(manifest, null, 2));
  if (chunks.length) zip.file("captions.srt", chunksToSrt(chunks));
  zip.file(
    "README.txt",
    [
      "ONE LAB STUDIO - VIDEO PACKAGE",
      "",
      "audio/       your voiceover (and music if you added one)",
      "media/       your pictures and clips, with unique file names",
      "scenes.json  every scene: when it is spoken (speechStart/End), when its picture is on screen (shownFrom/To),",
      "             the text, the picture file, fit, motion and transition, plus the output settings",
      "captions.srt subtitles (if captions were enabled)",
      "",
      "This package was created in your browser. Nothing was uploaded.",
      "It is not a finished video and not a native project of any editing app: import the files into your editor of choice.",
    ].join("\n"),
  );
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 3 } }, (m) => onProgress(90 + Math.round(m.percent / 10)));
  onProgress(100);
  return blob;
}
