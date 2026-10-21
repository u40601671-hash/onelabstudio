// Audio helpers: find silences, cut them out (sample-accurate), waveform peaks. Browser only.
import { exclusive, exec, write, read, remove, extOf } from "./ffmpegClient.js";
import { keptRanges } from "./scenes.js";

const stamp = () => Math.random().toString(36).slice(2, 8);

/** Find silent stretches. `noiseDb` = how quiet counts as silence, `minSec` = shortest silence reported. */
export function detectSilences(file, { noiseDb = -35, minSec = 0.5, duration = 0 } = {}) {
  return exclusive(async () => {
    const input = `sd_${stamp()}.${extOf(file, "mp3")}`;
    const silences = [];
    let pending = null;
    let found = duration;
    try {
      await write(input, file);
      await exec(["-i", input, "-vn", "-af", `silencedetect=noise=${noiseDb}dB:d=${minSec}`, "-f", "null", "-"], {
        onLog: (line) => {
          const d = line.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
          if (d) found = Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]);
          const s = line.match(/silence_start:\s*(-?[\d.]+)/);
          if (s) pending = Math.max(0, Number(s[1]));
          const e = line.match(/silence_end:\s*(-?[\d.]+)/);
          if (e && pending != null) {
            silences.push({ start: pending, end: Number(e[1]) });
            pending = null;
          }
        },
      });
      if (pending != null && found > pending) silences.push({ start: pending, end: found }); // silence runs to the end
    } finally {
      await remove(input);
    }
    return { silences, duration: found };
  });
}

/** The parts where someone is talking = everything that is not silence. */
export function speechRegions(silences, duration, minLen = 0.08, lead = 0.08) {
  const out = [];
  let at = 0;
  for (const s of silences) {
    if (s.start - at > minLen) out.push({ start: at, end: s.start });
    at = Math.max(at, s.end);
  }
  if (duration - at > minLen) out.push({ start: at, end: duration });
  // the silence detector reports an onset a little after the voice really starts, so begin each region slightly earlier
  return out.map((r, i) => ({ start: i === 0 ? r.start : Math.max(out[i - 1].end + 0.001, r.start - lead), end: r.end }));
}

/** Make a new audio file without the given cut ranges. Returns a File (AAC in an .m4a). */
export function cutAudio(file, cuts, duration) {
  return exclusive(async () => {
    const kept = keptRanges(cuts, duration);
    if (!kept.length) throw new Error("Nothing would be left after removing the silences.");
    const id = stamp();
    const input = `cut_${id}.${extOf(file, "mp3")}`;
    const script = `cut_${id}.txt`;
    const output = `cut_${id}.m4a`;
    try {
      await write(input, file);
      const parts = kept.map((k, i) => `[0:a]atrim=start=${k.from.toFixed(4)}:end=${k.to.toFixed(4)},asetpts=PTS-STARTPTS[a${i}]`);
      const graph = kept.length === 1
        ? parts[0].replace("[a0]", "[out]")
        : `${parts.join(";")};${kept.map((_, i) => `[a${i}]`).join("")}concat=n=${kept.length}:v=0:a=1[out]`;
      await write(script, new TextEncoder().encode(graph));
      await exec(["-i", input, "-filter_complex_script", script, "-map", "[out]", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output]);
      const data = await read(output);
      if (!data || !data.length) throw new Error("The audio came out empty.");
      const base = String(file.name || "voice").replace(/\.[^.]+$/, "");
      return new File([data], `${base}-no-silence.m4a`, { type: "audio/mp4" });
    } finally {
      await remove(input, script, output);
    }
  });
}

/** Peaks for drawing a waveform: one value (0..1) per 1/perSec seconds. Returns null for very large files. */
export async function waveformPeaks(file, perSec = 100) {
  if (file.size > 150 * 1024 * 1024) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  try {
    const buf = await ac.decodeAudioData(await file.arrayBuffer());
    const ch = buf.getChannelData(0);
    const bin = Math.max(1, Math.floor(buf.sampleRate / perSec));
    const n = Math.ceil(ch.length / bin);
    const peaks = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let m = 0;
      const end = Math.min(ch.length, (i + 1) * bin);
      for (let j = i * bin; j < end; j++) {
        const v = Math.abs(ch[j]);
        if (v > m) m = v;
      }
      peaks[i] = m;
    }
    return { peaks, perSec };
  } catch {
    return null;
  } finally {
    ac.close?.();
  }
}

/** Length of an audio/video file from its metadata (0 if the browser cannot read it). */
export function mediaDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    el.preload = "metadata";
    const done = (v) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : 0);
    el.onerror = () => done(0);
    setTimeout(() => done(0), 15000);
    el.src = url;
  });
}
