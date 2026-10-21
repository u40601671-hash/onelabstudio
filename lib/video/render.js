// The MP4 render pipeline (browser only, FFmpeg.wasm). Steps:
//   1. check the project
//   2. draw every caption as a transparent PNG with the Canvas API (same drawing code as the live preview)
//   3. make one clip per scene: the picture is pre-sized in a canvas, the captions for that scene are burned in
//   4. join the clips: straight cut (stream copy, very fast) or cross-transitions (xfade)
//   5. add the voice (and music) and write the MP4 (the video is copied, not re-encoded)
// Every clip length is counted in whole FRAMES from the scene start times, so pictures can never drift away from the voice.
import { exclusive, exec, write, read, remove, terminateEngine, loadEngine, extOf } from "./ffmpegClient.js";
import { tile } from "./scenes.js";
import { captionChunks, chunkStates, captionPng, layoutCaption, makeCanvas, canvasBlob, canEncodePng, encodePng } from "./captions.js";
import { FPS, ASPECTS, TRANSITIONS, MOTIONS, outputSize, even } from "./options.js";

export { FPS, ASPECTS, TRANSITIONS, MOTIONS, outputSize };

export class RenderError extends Error {}
export class RenderCancelled extends Error {
  constructor() {
    super("Render cancelled.");
  }
}

const q = (n) => Number(n.toFixed(5));

/**
 * Photo → JPEG already at the size FFmpeg needs (the browser decodes it, so HEIC/WebP/odd formats, rotation and huge
 * photos all work, and FFmpeg does not have to scale every frame).
 *   cover   : fills the frame, extra is cropped          contain : whole picture on a blurred copy of itself
 *   zoom    : cover at 1.5x size (the slow zoom/pan crops from this)
 */
async function preparePicture(file, W, H, mode) {
  let bmp;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new RenderError(`"${file.name}" could not be read as a picture. Try a JPG or PNG.`);
  }
  const k = mode === "zoom" ? 1.5 : 1;
  const cw = even(W * k);
  const ch = even(H * k);
  const canvas = makeCanvas(cw, ch);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const cover = Math.max(cw / bmp.width, ch / bmp.height);
  const drawCover = () => ctx.drawImage(bmp, (cw - bmp.width * cover) / 2, (ch - bmp.height * cover) / 2, bmp.width * cover, bmp.height * cover);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);
  if (mode === "contain") {
    ctx.save();
    ctx.filter = "blur(28px) brightness(0.7)";
    drawCover();
    ctx.restore();
    const fit = Math.min(cw / bmp.width, ch / bmp.height);
    ctx.drawImage(bmp, (cw - bmp.width * fit) / 2, (ch - bmp.height * fit) / 2, bmp.width * fit, bmp.height * fit);
  } else drawCover();
  bmp.close?.();
  if (document.hidden && canEncodePng()) {
    // tab in the background: canvas encoders are throttled to one image per second, so encode the pixels ourselves
    return { bytes: await encodePng(cw, ch, ctx.getImageData(0, 0, cw, ch).data), ext: "png" };
  }
  const blob = await canvasBlob(canvas, "image/jpeg", 0.94);
  if (!blob) throw new RenderError(`"${file.name}" could not be converted.`);
  return { bytes: new Uint8Array(await blob.arrayBuffer()), ext: "jpg" };
}

/** FFmpeg arguments for one scene clip. `cap` = { list } when captions are burned in. */
function sceneArgs({ inArgs, core, cap, boxY, frames, out, crf }) {
  const graph = cap
    ? `${core}[bg];[1:v]fps=${FPS},format=rgba[cap];[bg][cap]overlay=0:${boxY}:eof_action=pass:format=auto,format=yuv420p[v]`
    : `${core}[bg];[bg]format=yuv420p[v]`;
  return [
    ...inArgs,
    ...(cap ? ["-f", "concat", "-safe", "0", "-i", cap.list] : []),
    "-filter_complex", graph, "-map", "[v]", "-frames:v", String(frames),
    "-c:v", "libx264", "-preset", "ultrafast", "-crf", String(crf), "-pix_fmt", "yuv420p", "-r", String(FPS), "-an", out,
  ];
}

function sceneCore({ kind, fit, motion, W, H, frames }) {
  if (kind === "image") {
    if (motion !== "none" && fit === "cover") {
      const N = Math.max(2, frames);
      const z = motion === "zoomout" ? `1.14-0.14*on/${N}` : motion === "pan" ? "1.14" : `1+0.14*on/${N}`;
      const x = motion === "pan" ? `(iw-iw/zoom)*on/${N}` : "iw/2-(iw/zoom/2)";
      return `[0:v]zoompan=z='${z}':x='${x}':y='ih/2-(ih/zoom/2)':d=${N}:s=${W}x${H}:fps=${FPS},setsar=1`;
    }
    return "[0:v]setsar=1";
  }
  const cover = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
  if (fit === "contain") {
    return `[0:v]fps=${FPS},split[a][b];[a]${cover},boxblur=24:4[bgc];[b]scale=${W}:${H}:force_original_aspect_ratio=decrease[fg];[bgc][fg]overlay=(W-w)/2:(H-h)/2,setsar=1`;
  }
  return `[0:v]fps=${FPS},${cover},setsar=1`;
}

/**
 * Render the video.
 * project = { scenes, mediaById (Map id→{file,kind,name}), voice:{file}, music:{file,volume(0-100),fadeOut(s)}|null,
 *             aspect, quality, transition:{type,length}, motion, captions: style|null, total }
 */
export async function renderVideo(project, { onProgress = () => {}, signal } = {}) {
  const { scenes, mediaById, voice, music, aspect, quality, transition, motion, captions, total } = project;
  const report = (stage, pct) => onProgress({ stage, pct: Math.max(0, Math.min(99, Math.round(pct))) });

  // ---- 1. check ----
  if (!voice?.file) throw new RenderError("Add a voiceover before rendering.");
  if (!scenes.length) throw new RenderError("There are no scenes yet. Create scenes in the Timing section first.");
  scenes.forEach((s, i) => {
    if (!s.mediaId) throw new RenderError(`Scene ${i + 1} has no picture or clip. Give every scene a visual.`);
    if (!mediaById.has(s.mediaId)) throw new RenderError(`Scene ${i + 1} uses a file that was removed.`);
  });
  const { W, H } = outputSize(aspect, quality);
  const segs = tile(scenes, total);
  const bounds = segs.map((sg) => Math.round(sg.from * FPS));
  bounds.push(Math.max(bounds[bounds.length - 1] + 1, Math.round(total * FPS)));
  const frames = scenes.map((_, i) => Math.max(1, bounds[i + 1] - bounds[i]));
  const totalFrames = bounds[bounds.length - 1];

  // transition INTO each scene (scene 0 has none): the new picture fades in during the frames before its start
  const typeOf = (i) => (scenes[i].transition && scenes[i].transition !== "default" ? scenes[i].transition : transition.type);
  const tFrames = scenes.map((_, i) => {
    if (i === 0 || typeOf(i) === "cut") return 0;
    const cap = Math.floor(Math.min(frames[i - 1], frames[i]) / 2);
    return Math.max(1, Math.min(Math.round(transition.length * FPS), cap));
  });
  const chain = tFrames.some((n) => n > 0);
  const head = tFrames.map((n, i) => (i === 0 ? 0 : chain ? Math.max(n, 1) : 0)); // a "cut" inside a chain still needs 1 frame
  const finalCrf = quality === "720p" ? 23 : 22;

  const names = [];
  const track = (n) => (names.push(n), n);
  const cancelNow = () => {
    if (signal?.aborted) throw new RenderCancelled();
  };
  const onAbort = () => terminateEngine();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    // ---- 2. captions (browser canvas, no engine needed yet) ----
    let capStates = null;
    let blankPng = null;
    const boxY = captions?.enabled ? layoutCaption(W, H, captions.pos).boxY : 0;
    if (captions && captions.enabled) {
      const chunks = captionChunks(scenes, captions.maxChars);
      const list = [];
      chunks.forEach((c) => chunkStates(c, captions.highlight).forEach((s) => list.push({ ...s, chunk: c })));
      if (list.length) {
        const frame = { W, H };
        for (let i = 0; i < list.length; i++) {
          cancelNow();
          list[i].png = await captionPng(frame, list[i].chunk.tokens, list[i].active, captions);
          list[i].f0 = Math.round(list[i].start * FPS);
          list[i].f1 = Math.max(list[i].f0 + 1, Math.round(list[i].end * FPS));
          if (i % 8 === 0) report("Drawing captions", 1 + (i / list.length) * 8);
          if (i % 60 === 59) await new Promise((r) => setTimeout(r, 0)); // keep the page responsive
        }
        capStates = list;
        blankPng = await captionPng(frame, [], -1, captions);
      }
    }

    report("Loading the video engine", 10);
    await exclusive(() => loadEngine());
    cancelNow();

    await exclusive(async () => {
      // ---- 3. one clip per scene ----
      const segNames = [];
      for (let i = 0; i < scenes.length; i++) {
        cancelNow();
        const sc = scenes[i];
        const m = mediaById.get(sc.mediaId);
        const fit = sc.fit || "cover";
        const mo = sc.motion && sc.motion !== "default" ? sc.motion : motion;
        const useMotion = m.kind === "image" && fit === "cover" && mo !== "none";
        const nFrames = frames[i] + head[i];
        const baseFrame = bounds[i] - head[i];

        let inArgs;
        let input;
        if (m.kind === "image") {
          const pic = await preparePicture(m.file, W, H, useMotion ? "zoom" : fit === "contain" ? "contain" : "cover");
          input = track(`in_${i}.${pic.ext}`);
          await write(input, pic.bytes);
          inArgs = useMotion ? ["-i", input] : ["-loop", "1", "-framerate", String(FPS), "-i", input];
        } else {
          input = track(`in_${i}.${extOf(m.file, "mp4")}`);
          await write(input, m.file);
          inArgs = ["-stream_loop", "-1", "-i", input];
        }

        // captions that fall inside this clip, as a timeline of PNGs that adds up to exactly nFrames
        let cap = null;
        const files = [];
        if (capStates) {
          const lines = ["ffconcat version 1.0"];
          let cursor = 0;
          let last = null;
          const blank = `cap_blank_${i}.png`;
          const push = (file, n) => {
            lines.push(`file '${file}'`, `duration ${q(n / FPS)}`);
            last = file;
          };
          let used = false;
          for (let k = 0; k < capStates.length; k++) {
            const s = capStates[k];
            const a = Math.max(0, s.f0 - baseFrame);
            const b = Math.min(nFrames, s.f1 - baseFrame);
            if (b <= a || s.f1 <= baseFrame || s.f0 >= baseFrame + nFrames) continue;
            const from = Math.max(cursor, a);
            if (b <= from) continue;
            if (from > cursor) push(blank, from - cursor);
            const f = `cap_${i}_${k}.png`;
            await write(f, s.png);
            files.push(f);
            push(f, b - from);
            cursor = b;
            used = true;
          }
          if (used) {
            await write(blank, blankPng);
            files.push(blank);
            if (cursor < nFrames) push(blank, nFrames - cursor);
            lines.push(`file '${last}'`); // the concat demuxer needs the last file repeated
            const list = `caps_${i}.txt`;
            await write(list, new TextEncoder().encode(lines.join("\n")));
            files.push(list);
            cap = { list };
          } else await remove(...files);
        }

        const out = `seg_${i}.mp4`;
        track(out);
        const args = sceneArgs({ inArgs, core: sceneCore({ kind: m.kind, fit, motion: useMotion ? mo : "none", W, H, frames: nFrames }), cap, boxY, frames: nFrames, out, crf: chain ? 16 : finalCrf });
        const base = 12 + (i / scenes.length) * 62;
        try {
          await exec(args, { onProgress: (p) => report(`Building scene ${i + 1} of ${scenes.length}`, base + (p * 62) / scenes.length) });
        } catch (e) {
          if (signal?.aborted) throw new RenderCancelled();
          if (m.kind === "video") throw new RenderError(`"${m.name}" could not be read by the video engine (${e.message}). Try an MP4 (H.264) file.`);
          throw e;
        }
        await remove(input, ...files);
        segNames.push(out);
      }

      // ---- 4. join ----
      report("Joining the scenes", 76);
      const joined = track("joined.mp4");
      if (scenes.length === 1) {
        await exec(["-i", segNames[0], "-c", "copy", joined]);
      } else if (!chain) {
        const list = track("list.txt");
        await write(list, new TextEncoder().encode(segNames.map((n) => `file '${n}'`).join("\n")));
        await exec(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined]);
      } else {
        const inputs = segNames.flatMap((n) => ["-i", n]);
        const parts = [];
        let prev = "0:v";
        for (let i = 1; i < scenes.length; i++) {
          const tf = head[i] / FPS;
          const off = bounds[i] / FPS - tf;
          parts.push(`[${prev}][${i}:v]xfade=transition=${TRANSITIONS[typeOf(i)]?.xfade || "fade"}:duration=${q(tf)}:offset=${q(off)}[x${i}]`);
          prev = `x${i}`;
        }
        await exec(
          [...inputs, "-filter_complex", parts.join(";"), "-map", `[${prev}]`, "-c:v", "libx264", "-preset", "ultrafast", "-crf", String(finalCrf), "-pix_fmt", "yuv420p", "-r", String(FPS), joined],
          { onProgress: (p) => report("Joining the scenes", 76 + p * 12) },
        );
      }
      for (const n of segNames) await remove(n);

      // ---- 5. sound → final MP4 (the picture is copied, not re-encoded) ----
      report("Adding sound", 90);
      const totalSec = totalFrames / FPS;
      const voiceName = track(`voice.${extOf(voice.file, "mp3")}`);
      await write(voiceName, voice.file);
      const args = ["-i", joined, "-i", voiceName];
      const graph = [];
      let aMap = "1:a";
      if (music?.file) {
        const mName = track(`music.${extOf(music.file, "mp3")}`);
        await write(mName, music.file);
        args.push("-stream_loop", "-1", "-i", mName);
        const vol = Math.max(0, Math.min(100, Number(music.volume) || 0)) / 100;
        const fo = Math.max(0, Math.min(Number(music.fadeOut) || 0, totalSec / 2));
        // amix divides every input by the number of inputs, so both are doubled to keep the voice at its full level
        graph.push("[1:a]aresample=44100,volume=2[voice]");
        graph.push(`[2:a]aresample=44100,volume=${q(vol * 2)},atrim=duration=${q(totalSec)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1${fo ? `,afade=t=out:st=${q(totalSec - fo)}:d=${q(fo)}` : ""}[bg]`);
        graph.push("[voice][bg]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.95[aout]");
        aMap = "[aout]";
      }
      const out = track("final.mp4");
      await exec(
        [...args, ...(graph.length ? ["-filter_complex", graph.join(";")] : []), "-map", "0:v", "-map", aMap, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(q(totalSec)), "-movflags", "+faststart", out],
        { onProgress: (p) => report("Adding sound", 90 + p * 8) },
      );
    });

    cancelNow();
    const data = await exclusive(() => read("final.mp4"));
    if (!data || !data.length) throw new RenderError("The renderer produced an empty file. Check your media files and try again.");
    return { blob: new Blob([data], { type: "video/mp4" }), width: W, height: H, seconds: totalFrames / FPS, bytes: data.length, captionsBurned: !!capStates };
  } catch (e) {
    if (signal?.aborted || e instanceof RenderCancelled) throw new RenderCancelled();
    const msg = String(e?.message || e);
    if (/memory|alloc|out of bounds|abort\(/i.test(msg)) {
      terminateEngine();
      throw new RenderError("The browser ran out of memory. Try 720p, fewer scenes, smaller files, or turn off the slow zoom.");
    }
    throw e;
  } finally {
    signal?.removeEventListener("abort", onAbort);
    if (!signal?.aborted) await exclusive(() => remove(...names, "final.mp4")).catch(() => {});
  }
}
