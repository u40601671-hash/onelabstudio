"use client";
// Left-panel sections 5-7: storyboard, captions, output & export.
import { useEffect, useState } from "react";
import { useEditor } from "./EditorContext";
import { Btn, Field, Notice, Section, Segmented, Toggle, inputCls, cx } from "./ui";
import { clock } from "@/lib/video/time";
import { CAPTION_PRESETS, FONT_LABELS } from "@/lib/video/captions";
import { ASPECTS, MOTIONS, TRANSITIONS } from "@/lib/video/options";

const sel = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";

function Thumb({ media, className }) {
  if (!media) return <div className={cx("flex items-center justify-center bg-red-50 text-[10px] font-bold text-red-600", className)}>no picture</div>;
  return media.kind === "image" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={media.url} alt="" className={cx("object-cover", className)} />
  ) : (
    <video src={media.url} muted preload="metadata" className={cx("object-cover", className)} />
  );
}

function NumberField({ label, value, onCommit, min = 0 }) {
  const [text, setText] = useState(value.toFixed(2));
  useEffect(() => setText(value.toFixed(2)), [value]);
  const commit = () => {
    const n = Number(text);
    if (Number.isFinite(n) && n >= min && Math.abs(n - value) > 0.0005) onCommit(n);
    else setText(value.toFixed(2));
  };
  return (
    <Field label={label}>
      {(id) => <input id={id} className={inputCls} inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />}
    </Field>
  );
}

// ---------------------------------------------------------------- 5. storyboard
function SceneEditor() {
  const { scenes, sel: i, media, mediaById, actions, play } = useEditor();
  const s = scenes[i];
  const [text, setText] = useState(s?.text || "");
  useEffect(() => setText(s?.text || ""), [s?.id, s?.text]);
  if (!s) return null;
  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink">Scene {i + 1}</h3>
        <div className="flex gap-1.5">
          <Btn size="sm" onClick={() => play.seek(s.start)} aria-label="Go to this scene">▶ Go to</Btn>
          <Btn size="sm" variant="danger" onClick={() => actions.deleteScene(i)} aria-label={`Delete scene ${i + 1}`}>Delete</Btn>
        </div>
      </div>
      <Field label="Text (also the captions)" hint="Editing the text makes caption word times estimated.">
        {(id) => <textarea id={id} dir="auto" className={cx(inputCls, "h-20 resize-y")} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() && text !== s.text && actions.setText(i, text)} />}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Starts at (s)" value={s.start} onCommit={(n) => actions.setTimes(i, n, s.end)} />
        <NumberField label="Speech ends at (s)" value={s.end} onCommit={(n) => actions.setTimes(i, s.start, n)} />
      </div>
      <Field label="Picture or clip">
        {() => (
          <div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Pictures">
            {media.map((m) => (
              <button key={m.id} type="button" role="option" aria-selected={s.mediaId === m.id} onClick={() => actions.updateScene(i, { mediaId: m.id })} title={m.name}
                className={cx("h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200", s.mediaId === m.id ? "border-brand-600" : "border-transparent opacity-70 hover:opacity-100")}>
                <Thumb media={m} className="h-full w-full" />
              </button>
            ))}
            {!media.length && <p className="text-xs font-medium text-slate-500">Add pictures in section 4.</p>}
          </div>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="How it fills the frame">
          {(id) => (
            <select id={id} className={sel} value={s.fit} onChange={(e) => actions.updateScene(i, { fit: e.target.value })}>
              <option value="cover">Fill (crop the edges)</option>
              <option value="contain">Fit (show everything)</option>
            </select>
          )}
        </Field>
        <Field label="Motion (pictures)">
          {(id) => (
            <select id={id} className={sel} value={s.motion} onChange={(e) => actions.updateScene(i, { motion: e.target.value })}>
              <option value="default">Same as all</option>
              {Object.entries(MOTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
        </Field>
      </div>
      <Field label="Transition into this scene">
        {(id) => (
          <select id={id} className={sel} value={s.transition} onChange={(e) => actions.updateScene(i, { transition: e.target.value })} disabled={i === 0}>
            <option value="default">Same as all</option>
            {Object.entries(TRANSITIONS).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
          </select>
        )}
      </Field>
      <div className="flex flex-wrap gap-1.5">
        <Btn size="sm" disabled={i === 0} onClick={() => actions.moveVisual(i, -1)}>↑ Swap picture up</Btn>
        <Btn size="sm" disabled={i === scenes.length - 1} onClick={() => actions.moveVisual(i, 1)}>↓ Swap picture down</Btn>
        <Btn size="sm" onClick={() => actions.splitAtPlayhead(i)}>✂ Split at playhead</Btn>
        <Btn size="sm" onClick={() => actions.dupScene(i)}>Duplicate</Btn>
      </div>
    </div>
  );
}

export function StoryboardPanel() {
  const { scenes, mediaById, sel, setSel, play, issues } = useEditor();
  const bad = new Set(issues.filter((x) => x.scene != null && x.level === "error").map((x) => x.scene));
  return (
    <Section n={5} title="Storyboard" status={scenes.length ? `${scenes.length} scenes` : "Empty"} defaultOpen>
      {!scenes.length ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs font-semibold text-slate-500">Your scenes appear here after you create them in section 2.</p>
      ) : (
        <>
          <ol className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {scenes.map((s, i) => (
              <li key={s.id}>
                <button type="button" onClick={() => { setSel(i); play.seek(s.start); }} aria-current={sel === i}
                  className={cx("flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100", sel === i ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-slate-400", bad.has(i) && "border-red-300")}>
                  <Thumb media={mediaById.get(s.mediaId)} className="h-11 w-11 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-ink" dir="auto">{s.text}</span>
                    <span className="block text-[11px] font-medium text-slate-500">#{i + 1} · {clock(s.start)}–{clock(s.end)} · {(s.end - s.start).toFixed(1)} s{s.words ? "" : " · est. words"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <SceneEditor />
        </>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- 6. captions
export function CaptionsPanel() {
  const { style, actions, chunks } = useEditor();
  const set = actions.patchStyle;
  return (
    <Section n={6} title="Captions" status={style.enabled ? CAPTION_PRESETS[style.preset]?.label || "On" : "Off"}>
      <Toggle checked={style.enabled} onChange={(v) => set({ enabled: v })} label="Show captions in the video" hint="They are burned into the MP4. You can also download them as an SRT file." />
      {style.enabled && (
        <>
          <Field label="Style">
            {() => (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CAPTION_PRESETS).map(([k, p]) => (
                  <button key={k} type="button" aria-pressed={style.preset === k} onClick={() => actions.pickPreset(k)}
                    className={cx("rounded-lg border-2 px-2 py-2 text-xs font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100", style.preset === k ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-700 hover:border-slate-400")}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="Position">
            {() => <Segmented label="Caption position" size="sm" value={style.pos} onChange={(v) => set({ pos: v })} options={[["top", "Top"], ["middle", "Middle"], ["bottom", "Bottom"]]} />}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Font">
              {(id) => (
                <select id={id} className={sel} value={style.fontKey} onChange={(e) => set({ fontKey: e.target.value })}>
                  {Object.entries(FONT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label={`Size: ${style.sizePct.toFixed(1)}`}>
              {(id) => <input id={id} type="range" min={3} max={12} step={0.1} value={style.sizePct} onChange={(e) => set({ sizePct: Number(e.target.value) })} className="w-full accent-brand-600" />}
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Text">
              {(id) => <input id={id} type="color" value={style.color} onChange={(e) => set({ color: e.target.value })} className="h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />}
            </Field>
            <Field label="Outline">
              {(id) => <input id={id} type="color" value={style.strokeColor} onChange={(e) => set({ strokeColor: e.target.value })} className="h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />}
            </Field>
            <Field label="Highlight">
              {(id) => <input id={id} type="color" value={style.highlightColor} onChange={(e) => set({ highlightColor: e.target.value })} className="h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />}
            </Field>
          </div>
          <Field label={`Outline thickness: ${Math.round(style.strokeEm * 100)}`}>
            {(id) => <input id={id} type="range" min={0} max={0.3} step={0.01} value={style.strokeEm} onChange={(e) => set({ strokeEm: Number(e.target.value) })} className="w-full accent-brand-600" />}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Box colour">
              {(id) => <input id={id} type="color" value={style.bgColor} onChange={(e) => set({ bgColor: e.target.value })} className="h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />}
            </Field>
            <Field label={`Box strength: ${Math.round(style.bgOpacity * 100)}%`}>
              {(id) => <input id={id} type="range" min={0} max={1} step={0.05} value={style.bgOpacity} onChange={(e) => set({ bgOpacity: Number(e.target.value) })} className="w-full accent-brand-600" />}
            </Field>
          </div>
          <Field label={`Letters per line: ${style.maxChars}`} hint="Shorter lines are easier to read on a phone.">
            {(id) => <input id={id} type="range" min={12} max={60} value={style.maxChars} onChange={(e) => set({ maxChars: Number(e.target.value) })} className="w-full accent-brand-600" />}
          </Field>
          <Toggle checked={style.highlight} onChange={(v) => set({ highlight: v })} label="Highlight each word as it is spoken" hint="Uses real word times when you have them, otherwise estimates." />
          <Toggle checked={style.uppercase} onChange={(v) => set({ uppercase: v })} label="CAPITAL LETTERS" />
          <Toggle checked={style.shadow} onChange={(v) => set({ shadow: v })} label="Soft shadow" />
          <p className="text-[11px] font-medium text-slate-500">{chunks.length} caption lines. Arabic, Urdu, Hindi, Chinese, Japanese and Korean use the fonts installed on your computer.</p>
        </>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- 7. output
function estimate(out, captionsOn, total) {
  const hd = out.quality === "1080p" ? 2 : 1;
  const anyTransition = out.transition !== "cut";
  const factor = (1.0 + (captionsOn ? 0.3 : 0) + (out.motion !== "none" ? 1.6 : 0) + (anyTransition ? 1.4 : 0)) * hd;
  const lo = total * factor * 0.7;
  const hi = total * factor * 1.6 + 20;
  const f = (s) => (s < 90 ? `${Math.max(10, Math.round(s / 10) * 10)} s` : `${Math.round(s / 60)} min`);
  return `${f(lo)} to ${f(hi)}`;
}

export function OutputPanel() {
  const { out, style, actions, issues, total, render, busy } = useEditor();
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  return (
    <Section n={7} title="Output & export" status={`${out.aspect} · ${out.quality}`} defaultOpen>
      <Field label="Video shape">
        {() => <Segmented label="Video shape" size="sm" value={out.aspect} onChange={(v) => actions.patchOut({ aspect: v })} options={Object.entries(ASPECTS).map(([v, l]) => [v, v, l.split(" ")[0]])} />}
      </Field>
      <Field label="Quality" hint="720p renders much faster. 1080p is sharper.">
        {() => <Segmented label="Quality" size="sm" value={out.quality} onChange={(v) => actions.patchOut({ quality: v })} options={[["720p", "720p", "faster"], ["1080p", "1080p", "sharper"]]} />}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Transition between scenes">
          {(id) => (
            <select id={id} className={sel} value={out.transition} onChange={(e) => actions.patchOut({ transition: e.target.value })}>
              {Object.entries(TRANSITIONS).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Pictures move?">
          {(id) => (
            <select id={id} className={sel} value={out.motion} onChange={(e) => actions.patchOut({ motion: e.target.value })}>
              {Object.entries(MOTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
        </Field>
      </div>
      {out.transition !== "cut" && (
        <Field label={`Transition length: ${out.transitionLength.toFixed(1)} s`}>
          {(id) => <input id={id} type="range" min={0.2} max={1.5} step={0.1} value={out.transitionLength} onChange={(e) => actions.patchOut({ transitionLength: Number(e.target.value) })} className="w-full accent-brand-600" />}
        </Field>
      )}

      <div className="rounded-xl border border-slate-200 p-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink">Ready to render?</h3>
        {errors.length === 0 ? (
          <p className="mt-1 text-xs font-bold text-emerald-700">✓ Everything needed is in place.</p>
        ) : (
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs font-semibold text-red-700">
            {errors.slice(0, 5).map((e, k) => <li key={k}>{e.text}</li>)}
            {errors.length > 5 && <li>…and {errors.length - 5} more.</li>}
          </ul>
        )}
        {warns.slice(0, 3).map((e, k) => <p key={k} className="mt-1 text-[11px] font-semibold text-amber-700">⚠ {e.text}</p>)}
      </div>

      <Btn variant="primary" size="lg" className="w-full" onClick={actions.startRender} disabled={render.status === "running"}>
        {render.status === "running" ? `Rendering… ${render.pct}%` : "Render MP4"}
      </Btn>
      {total > 0 && <p className="text-[11px] font-medium text-slate-500">Rough time on an average computer: {estimate(out, style.enabled, total)}. It runs in this browser tab, so keep the tab open. Slow zoom and transitions take longer.</p>}
      {render.status === "done" && !render.open && <Btn size="sm" onClick={actions.openRender}>Show last render</Btn>}

      <div className="grid grid-cols-2 gap-2">
        <Btn size="sm" onClick={actions.downloadZip} disabled={busy.zip >= 0}>{busy.zip >= 0 ? `Packing… ${busy.zip}%` : "⬇ Package (ZIP)"}</Btn>
        <Btn size="sm" onClick={actions.downloadSrt}>⬇ Captions (SRT)</Btn>
      </div>
      <p className="text-[11px] font-medium text-slate-500">The ZIP holds your media, scenes.json and captions.srt so you can continue in another editor. It is not a rendered video.</p>
    </Section>
  );
}
