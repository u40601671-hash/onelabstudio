"use client";
// Live preview. It approximates the final render: the voice is the clock, pictures change on the scene starts,
// captions are drawn by the SAME function the renderer uses. Transitions are previewed in a simplified way.
import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "./EditorContext";
import { Btn, Segmented, cx } from "./ui";
import { tile, sceneIndexAt } from "@/lib/video/scenes";
import { chunkAt, drawCaption } from "@/lib/video/captions";
import { ASPECTS, outputSize } from "@/lib/video/options";
import { clock } from "@/lib/video/time";

const clamp01 = (n) => Math.max(0, Math.min(1, n));

function MediaLayer({ media, scene, seg, t, playing, motion, style: extra }) {
  const ref = useRef(null);
  const local = Math.max(0, t - seg.from);
  const fit = scene.fit === "contain" ? "contain" : "cover";
  const pr = clamp01((t - seg.from) / Math.max(0.1, seg.to - seg.from));
  const mo = scene.motion && scene.motion !== "default" ? scene.motion : motion;
  let transform = "none";
  if (media.kind === "image" && fit === "cover") {
    if (mo === "zoomin") transform = `scale(${1 + 0.14 * pr})`;
    else if (mo === "zoomout") transform = `scale(${1.14 - 0.14 * pr})`;
    else if (mo === "pan") transform = `scale(1.14) translateX(${(0.5 - pr) * 11}%)`;
  }

  useEffect(() => {
    const v = ref.current;
    if (!v || media.kind !== "video") return;
    const d = v.duration;
    const want = Number.isFinite(d) && d > 0 ? local % d : local;
    if (!playing || Math.abs(v.currentTime - want) > 0.4) {
      try {
        v.currentTime = want;
      } catch {
        /* not ready */
      }
    }
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [local, playing, media]);

  const common = { className: "absolute inset-0 h-full w-full", style: { objectFit: fit, transform, background: "#000", ...extra } };
  return media.kind === "image" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={media.url} alt="" draggable={false} {...common} />
  ) : (
    <video ref={ref} src={media.url} muted playsInline loop preload="auto" {...common} />
  );
}

function CaptionCanvas({ frame, chunks, style, t, size }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !size.w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    if (!style.enabled) return;
    const hit = chunkAt(chunks, t, style.highlight);
    if (!hit) return;
    const k = (size.w / frame.W) * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawCaption(ctx, frame, hit.chunk.tokens, hit.active, style);
  }, [frame, chunks, style, t, size]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}

export default function Preview() {
  const { scenes, mediaById, play, chunks, style, out, total, sel, setSel, actions } = useEditor();
  const { t, playing } = play;
  const { W, H } = outputSize(out.aspect, out.quality);
  const frame = useMemo(() => ({ W, H }), [W, H]);
  const stageRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [safe, setSafe] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [W, H]);

  const segs = useMemo(() => tile(scenes, total), [scenes, total]);
  const idx = scenes.length ? sceneIndexAt(scenes, t) : -1;
  const scene = scenes[idx];
  const seg = segs[idx];
  const media = scene ? mediaById.get(scene.mediaId) : null;

  // simplified transition preview: the next picture comes in during the last moments before its scene starts
  const next = scenes[idx + 1];
  const nextSeg = segs[idx + 1];
  const nextType = next ? (next.transition && next.transition !== "default" ? next.transition : out.transition) : "cut";
  const tLen = next && nextSeg ? Math.min(out.transitionLength, (seg.to - seg.from) / 2, (nextSeg.to - nextSeg.from) / 2) : 0;
  const into = next && nextType !== "cut" && tLen > 0 && t >= nextSeg.from - tLen && t < nextSeg.from ? clamp01((t - (nextSeg.from - tLen)) / tLen) : null;
  const nextMedia = next ? mediaById.get(next.mediaId) : null;
  const nextStyle =
    into == null ? null
      : nextType === "slide" ? { transform: `translateX(${(1 - into) * 100}%)` }
      : nextType === "wipe" ? { clipPath: `inset(0 ${(1 - into) * 100}% 0 0)` }
      : nextType === "zoom" ? { opacity: into, transform: `scale(${1.25 - 0.25 * into})` }
      : { opacity: into };

  const portrait = H > W;
  const stageStyle = { aspectRatio: `${W} / ${H}`, ...(portrait || W === H ? { height: "min(56vh, 620px)" } : { width: "min(100%, calc(min(56vh, 620px) * 1.7778))" }), maxWidth: "100%" };

  return (
    <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-white/70">
          <span className={cx("inline-block h-2 w-2 rounded-full", playing ? "bg-red-500" : "bg-emerald-400")} />
          Preview
          <span className="font-semibold normal-case tracking-normal text-white/50">
            {W}×{H}
          </span>
        </div>
        <Segmented dark size="sm" label="Video shape" value={out.aspect} onChange={(v) => actions.patchOut({ aspect: v })} options={Object.entries(ASPECTS).map(([v, label]) => [v, v, label.split(" ")[0]])} />
      </div>

      <div className="flex justify-center">
        <div ref={stageRef} style={stageStyle} className="relative overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
          {media && scene ? (
            <>
              <MediaLayer media={media} scene={scene} seg={seg} t={t} playing={playing} motion={out.motion} />
              {into != null && nextMedia && nextSeg && <MediaLayer media={nextMedia} scene={next} seg={nextSeg} t={t} playing={playing} motion={out.motion} style={nextStyle} />}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-4xl" aria-hidden>🎬</span>
              <p className="text-sm font-bold">{scenes.length ? "This scene has no picture yet" : "Your video appears here"}</p>
              <p className="max-w-xs text-xs text-white/60">{scenes.length ? "Pick a picture for it in the Storyboard section." : "Add a voiceover, then create scenes in section 2."}</p>
            </div>
          )}
          <CaptionCanvas frame={frame} chunks={chunks} style={style} t={t} size={size} />
          {safe && (
            <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-amber-300/80" aria-hidden>
              <div className="absolute inset-x-0 top-0 h-[8%] bg-amber-300/15" />
              <div className="absolute inset-x-0 bottom-0 h-[16%] bg-amber-300/15" />
              <div className="absolute inset-y-0 right-0 w-[11%] bg-amber-300/15" />
              <span className="absolute bottom-[17%] left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">Keep captions and faces inside</span>
            </div>
          )}
          {scene && <span className="absolute left-2 top-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-extrabold tracking-wider">SCENE {idx + 1} / {scenes.length}</span>}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={play.toggle}
          disabled={!scenes.length && !total}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg text-white shadow hover:bg-brand-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:opacity-40"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <span className="w-24 shrink-0 text-xs font-bold tabular-nums text-white/80">
          {clock(t)} / {clock(total)}
        </span>
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={Math.max(0.1, total)}
          step={0.01}
          value={Math.min(t, total)}
          onChange={(e) => {
            const v = Number(e.target.value);
            play.seek(v);
            if (scenes.length) setSel(sceneIndexAt(scenes, v));
          }}
          className="h-2 min-w-0 flex-1 accent-brand-500"
        />
        <Btn variant="dark" size="sm" onClick={() => setSafe((s) => !s)} aria-pressed={safe} title="Show the areas that apps cover with their own buttons">
          Safe zones
        </Btn>
      </div>
      <p className="mt-2 min-h-[2.5rem] rounded-lg bg-white/5 px-3 py-2 text-sm text-white/85" dir="auto">
        <span className="mr-2 text-[10px] font-extrabold uppercase tracking-wider text-brand-300">Now saying</span>
        {scene ? scene.text : "…"}
      </p>
      <p className="mt-1.5 text-[11px] font-medium text-white/45">The preview is close to, but not identical to, the final video: transitions are simplified here. The render is exact.</p>
    </div>
  );
}
