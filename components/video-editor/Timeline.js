"use client";
// Timeline: voice waveform, scenes (drag the edge between two scenes to retime them), caption lines and music.
// Everything you drag here changes the real scene data, which the preview and the render both use.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "./EditorContext";
import { Btn, cx } from "./ui";
import { tile } from "@/lib/video/scenes";
import { clock } from "@/lib/video/time";

const LABEL_W = 84;
const ROW = { ruler: 26, voice: 46, scenes: 62, caps: 28, music: 24 };

function Waveform({ peaks, duration, pps, height }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !peaks) return;
    const w = Math.max(1, Math.min(30000, Math.round(duration * pps)));
    c.width = w;
    c.height = height;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, w, height);
    ctx.fillStyle = "#60a5fa";
    const per = peaks.perSec;
    const mid = height / 2;
    for (let x = 0; x < w; x++) {
      const a = Math.floor((x / pps) * per);
      const b = Math.max(a + 1, Math.floor(((x + 1) / pps) * per));
      let m = 0;
      for (let i = a; i < b && i < peaks.peaks.length; i++) if (peaks.peaks[i] > m) m = peaks.peaks[i];
      const h = Math.max(1, Math.min(1, m * 1.6) * (height - 6));
      ctx.fillRect(x, mid - h / 2, 1, h);
    }
  }, [peaks, duration, pps, height]);
  return <canvas ref={ref} style={{ width: Math.max(1, Math.min(30000, Math.round(duration * pps))), height }} aria-hidden />;
}

export default function Timeline() {
  const { scenes, mediaById, play, total, peaks, voice, chunks, musicItem, sel, setSel, actions, hist } = useEditor();
  const scroller = useRef(null);
  const inner = useRef(null);
  const [pps, setPps] = useState(0);
  const fitted = useRef(false);
  const maxPps = Math.max(8, Math.min(300, 30000 / Math.max(1, total)));
  const segs = useMemo(() => tile(scenes, total), [scenes, total]);

  const fit = useCallback(() => {
    const w = scroller.current?.clientWidth || 600;
    setPps(Math.max(4, Math.min(maxPps, (w - 24) / Math.max(1, total))));
  }, [total, maxPps]);

  useEffect(() => {
    if (total > 0 && !fitted.current) {
      fitted.current = true;
      fit();
    }
    if (!total) fitted.current = false;
  }, [total, fit]);

  // keep the playhead in view while playing
  useEffect(() => {
    const s = scroller.current;
    if (!s || !play.playing) return;
    const x = play.t * pps;
    if (x < s.scrollLeft + 20 || x > s.scrollLeft + s.clientWidth - 60) s.scrollLeft = Math.max(0, x - 80);
  }, [play.t, play.playing, pps]);

  const timeAt = (clientX) => {
    const r = inner.current.getBoundingClientRect();
    return Math.max(0, Math.min(total, (clientX - r.left) / pps));
  };

  const scrub = (e) => {
    if (!pps) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const go = (x) => {
      const t = timeAt(x);
      play.seek(t);
    };
    go(e.clientX);
    const move = (ev) => go(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const dragBoundary = (i) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    actions.dragStart();
    const move = (ev) => actions.dragMove(i, timeAt(ev.clientX));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const ticks = useMemo(() => {
    if (!pps) return [];
    const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800];
    const step = steps.find((s) => s * pps >= 70) || 3600;
    const list = [];
    for (let s = 0; s <= total + step; s += step) list.push(s);
    return list;
  }, [pps, total]);

  const width = Math.max(200, total * pps + 40);
  const hasMusic = !!musicItem;
  const rowsH = ROW.ruler + ROW.voice + ROW.scenes + ROW.caps + (hasMusic ? ROW.music : 0);

  return (
    <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-white/70">Timeline</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="dark" size="sm" onClick={hist.undo} disabled={!hist.canUndo} aria-label="Undo">↶ Undo</Btn>
          <Btn variant="dark" size="sm" onClick={hist.redo} disabled={!hist.canRedo} aria-label="Redo">↷ Redo</Btn>
          <Btn variant="dark" size="sm" onClick={() => actions.splitAtPlayhead(sel)} disabled={!scenes.length} title="Cut the selected scene in two at the playhead">✂ Split at playhead</Btn>
          <label className="flex items-center gap-2 text-[11px] font-bold text-white/70">
            Zoom
            <input type="range" min={4} max={maxPps} step={1} value={Math.min(pps || 4, maxPps)} onChange={(e) => setPps(Number(e.target.value))} className="w-24 accent-brand-500" aria-label="Timeline zoom" />
          </label>
          <Btn variant="dark" size="sm" onClick={fit}>Fit</Btn>
        </div>
      </div>

      {!total ? (
        <p className="rounded-lg border border-dashed border-white/20 px-4 py-8 text-center text-sm font-semibold text-white/60">The timeline appears when you add a voiceover and create scenes.</p>
      ) : (
        <div className="flex">
          <div className="shrink-0" style={{ width: LABEL_W }}>
            <div style={{ height: ROW.ruler }} />
            <div style={{ height: ROW.voice }} className="flex items-center text-[11px] font-bold text-white/60">Voice</div>
            <div style={{ height: ROW.scenes }} className="flex items-center text-[11px] font-bold text-white/60">Scenes</div>
            <div style={{ height: ROW.caps }} className="flex items-center text-[11px] font-bold text-white/60">Captions</div>
            {hasMusic && <div style={{ height: ROW.music }} className="flex items-center text-[11px] font-bold text-white/60">Music</div>}
          </div>
          <div ref={scroller} className="min-w-0 flex-1 overflow-x-auto pb-2">
            <div ref={inner} className="relative select-none" style={{ width, height: rowsH }}>
              {/* ruler: click or drag to move the playhead */}
              <div onPointerDown={scrub} className="relative cursor-pointer border-b border-white/10" style={{ height: ROW.ruler }} role="slider" aria-label="Playhead" aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(play.t)} tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") play.seek(play.t + (e.shiftKey ? 5 : 0.5));
                  if (e.key === "ArrowLeft") play.seek(play.t - (e.shiftKey ? 5 : 0.5));
                }}>
                {ticks.map((s) => (
                  <span key={s} className="absolute top-0 h-full border-l border-white/20 pl-1 text-[10px] font-semibold text-white/60" style={{ left: s * pps }}>
                    {clock(s)}
                  </span>
                ))}
              </div>

              <div onPointerDown={scrub} className="relative cursor-pointer" style={{ height: ROW.voice }}>
                {voice && peaks ? <Waveform peaks={peaks} duration={voice.duration} pps={pps} height={ROW.voice} /> : (
                  <div className="absolute inset-y-2 left-0 rounded bg-brand-500/30" style={{ width: (voice?.duration || total) * pps }} />
                )}
              </div>

              <div className="relative" style={{ height: ROW.scenes }}>
                {scenes.map((s, i) => {
                  const m = mediaById.get(s.mediaId);
                  const left = segs[i].from * pps;
                  const w = Math.max(6, (segs[i].to - segs[i].from) * pps);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSel(i);
                        play.seek(s.start);
                      }}
                      title={`Scene ${i + 1}: ${s.text}`}
                      className={cx(
                        "absolute top-1 bottom-1 overflow-hidden rounded-md border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
                        sel === i ? "border-white ring-2 ring-brand-400" : "border-white/20 hover:border-white/60",
                        !m && "bg-red-900/60",
                      )}
                      style={{ left, width: w - 2 }}
                    >
                      {m && m.kind === "image" && <span className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${m.url})` }} />}
                      {m && m.kind === "video" && <video src={m.url} muted preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="relative flex h-full items-end gap-1 px-1.5 pb-1">
                        <span className="shrink-0 rounded bg-black/60 px-1 text-[10px] font-extrabold">{i + 1}</span>
                        {w > 70 && <span className="truncate text-[10px] font-semibold text-white/90">{s.text}</span>}
                      </span>
                    </button>
                  );
                })}
                {scenes.slice(1).map((s, k) => (
                  <div
                    key={`h${s.id}`}
                    onPointerDown={dragBoundary(k)}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Drag to change where scene ${k + 2} starts`}
                    title="Drag to retime"
                    className="absolute top-0 bottom-0 z-10 flex w-3 -translate-x-1/2 cursor-ew-resize items-center justify-center"
                    style={{ left: segs[k + 1].from * pps }}
                  >
                    <span className="h-8 w-1 rounded-full bg-white/80 shadow" />
                  </div>
                ))}
              </div>

              <div className="relative" style={{ height: ROW.caps }}>
                {chunks.map((c, i) => (
                  <span
                    key={i}
                    title={c.text}
                    className={cx("absolute top-1 bottom-1 truncate rounded px-1 text-[10px] font-semibold leading-5", c.estimated ? "bg-amber-500/30 text-amber-100" : "bg-emerald-500/30 text-emerald-100")}
                    style={{ left: c.start * pps, width: Math.max(4, (c.end - c.start) * pps - 1) }}
                  >
                    {(c.end - c.start) * pps > 50 ? c.text : ""}
                  </span>
                ))}
              </div>

              {hasMusic && (
                <div className="relative" style={{ height: ROW.music }}>
                  <div className="absolute inset-y-1 left-0 truncate rounded bg-purple-500/0 px-2 text-[10px] font-bold leading-4 text-sky-100 ring-1 ring-sky-300/40" style={{ width: total * pps, background: "rgba(56,189,248,0.18)" }}>
                    ♪ {musicItem.name}
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-red-500" style={{ left: play.t * pps }}>
                <span className="absolute -left-1.5 -top-0.5 h-3 w-3 rotate-45 bg-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}
      <p className="mt-1 text-[11px] font-medium text-white/45">
        Drag the white bar between two scenes to change when the next picture appears. <span className="text-emerald-300">Green</span> captions use real word times, <span className="text-amber-300">amber</span> ones are estimated.
      </p>
    </div>
  );
}
