"use client";
// Left-panel sections 1-4: voiceover (with the silence remover), timing, music, media.
import { useEffect, useRef, useState } from "react";
import { useEditor } from "./EditorContext";
import { Btn, Field, Notice, ProgressBar, Section, Segmented, inputCls, cx, mb } from "./ui";
import { clock } from "@/lib/video/time";
import { splitSentences } from "@/lib/video/timing";

/** Drop zone + button. Calls onFiles(FileList). */
function Drop({ accept, multiple, onFiles, title, sub, disabled }) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onFiles(e.dataTransfer.files);
      }}
      className={cx("rounded-xl border-2 border-dashed p-4 text-center transition", over ? "border-brand-600 bg-brand-50" : "border-slate-300 bg-slate-50")}
    >
      <p className="text-sm font-bold text-ink">{title}</p>
      {sub && <p className="mt-0.5 text-[11px] font-medium text-slate-500">{sub}</p>}
      <Btn variant="primary" size="sm" className="mt-3" disabled={disabled} onClick={() => ref.current?.click()}>
        Choose {multiple ? "files" : "a file"}
      </Btn>
      <input
        ref={ref}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- 1. voiceover
export function VoicePanel() {
  const { voice, busy, silence, setSilence, actions, peaks } = useEditor();
  const p = silence.params;
  const r = silence.result;
  return (
    <Section n={1} title="Voiceover" status={voice ? clock(voice.duration) : "Required"} defaultOpen>
      {!voice ? (
        <Drop accept="audio/*,video/mp4,video/webm,.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,.webm,.mp4" onFiles={(f) => actions.addVoice(f?.[0])} disabled={busy.voice} title={busy.voice ? "Reading your file…" : "Drop your voiceover here"} sub="MP3, WAV, M4A, OGG, WEBM, MP4. Any length." />
      ) : (
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink" title={voice.name}>{voice.name}</p>
              <p className="text-xs text-slate-600">{clock(voice.duration)} · {mb(voice.file.size)} MB{silence.applied ? ` · ${silence.applied.count} silences removed` : ""}</p>
            </div>
            <Btn size="sm" onClick={actions.removeVoice}>Remove</Btn>
          </div>
          {!peaks && <p className="mt-2 text-[11px] font-medium text-slate-500">Drawing the waveform…</p>}
        </div>
      )}

      {voice && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink">Silence remover</h3>
          <p className="mt-1 text-[11px] font-medium text-slate-600">Cuts the long pauses out of your voiceover. Scenes and captions move with the audio, and a short natural pause is always kept.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label={`Shortest pause to cut: ${p.minGap.toFixed(1)} s`}>
              {(id) => <input id={id} type="range" min={0.3} max={3} step={0.1} value={p.minGap} onChange={(e) => setSilence((s) => ({ ...s, params: { ...s.params, minGap: Number(e.target.value) }, result: null }))} className="w-full accent-brand-600" />}
            </Field>
            <Field label={`Counts as silent below ${p.noiseDb} dB`}>
              {(id) => <input id={id} type="range" min={-55} max={-20} step={1} value={p.noiseDb} onChange={(e) => setSilence((s) => ({ ...s, params: { ...s.params, noiseDb: Number(e.target.value) }, result: null }))} className="w-full accent-brand-600" />}
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn size="sm" onClick={actions.analyseSilence} disabled={!!busy.silence}>{busy.silence && !r ? busy.silence : "Find silences"}</Btn>
            {r && r.count > 0 && <Btn size="sm" variant="primary" onClick={actions.applySilence} disabled={!!busy.silence}>{busy.silence ? busy.silence : `Remove ${r.count} silence${r.count > 1 ? "s" : ""}`}</Btn>}
            {silence.snapshot && <Btn size="sm" variant="danger" onClick={actions.restoreSilence}>Restore original audio</Btn>}
          </div>
          {r && (
            <p className="mt-2 text-xs font-bold text-ink">
              {r.count ? `Found ${r.count} silence(s). Removing them saves ${r.saved.toFixed(1)} s (${clock(r.duration)} → ${clock(r.duration - r.saved)}).` : "No silences that long were found. Try a shorter pause length or a higher threshold."}
            </p>
          )}
          <p className="mt-1 text-[11px] font-medium text-slate-500">After removing, the edited audio replaces the original in this editor. Undo history starts fresh.</p>
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- 2. timing
const GROQ_KEY = "ols_groq_key";
export function TimingPanel() {
  const { voice, script, setScript, rows, rowMeta, timingIssues, perScene, scenes, busy, actions } = useEditor();
  const [tab, setTab] = useState("file");
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [agree, setAgree] = useState(false);
  const [lang, setLang] = useState("");
  const fileRef = useRef(null);
  const sentences = splitSentences(script).length;

  useEffect(() => {
    try {
      const k = localStorage.getItem(GROQ_KEY);
      if (k) {
        setApiKey(k);
        setRemember(true);
      }
    } catch {
      /* private mode */
    }
  }, []);
  const saveKey = (k, rem) => {
    try {
      if (rem && k) localStorage.setItem(GROQ_KEY, k);
      else localStorage.removeItem(GROQ_KEY);
    } catch {
      /* ignore */
    }
  };

  const working = !!busy.timing;
  const status = scenes.length ? `${scenes.length} scenes` : "Required";
  const source = rowMeta ? { file: `File: ${rowMeta.name}`, groq: "Groq transcript", script: "Script estimate", equal: "Equal time" }[rowMeta.source] : "";

  return (
    <Section n={2} title="Timing & script" status={status} defaultOpen>
      <p className="text-xs font-medium text-slate-600">Scenes follow your sentences. Choose how the sentence times are found.</p>
      <Segmented label="Timing method" size="sm" value={tab} onChange={setTab} options={[["file", "Timing file"], ["groq", "Groq"], ["script", "Script"], ["equal", "Equal"]]} />

      {tab === "file" && (
        <div className="space-y-3">
          <Field label="Your script (optional)" hint="Word-by-word files carry no punctuation. Paste your script BEFORE choosing the file and sentences will break exactly where you wrote them.">
            {(id) => <textarea id={id} className={cx(inputCls, "h-20 resize-y")} dir="auto" value={script} onChange={(e) => setScript(e.target.value)} placeholder="Optional. Paste the narration text here…" />}
          </Field>
          <Drop accept=".srt,.vtt,.json,.txt,application/json" onFiles={(f) => actions.importTimingFile(f?.[0])} title="Drop a timing file" sub="SRT, VTT, or JSON (my TTS tool, Whisper or Groq style). Exact times, no waiting." />
          <p className="text-[11px] font-medium text-slate-500">Word-level JSON gives real word-by-word captions. SRT/VTT gives sentence times; the words inside each line are spread evenly (marked as estimated).</p>
        </div>
      )}

      {tab === "groq" && (
        <div className="space-y-3">
          <Notice type="warn">This sends your voiceover to Groq (an outside company) to be transcribed with YOUR own Groq API key. Nothing is sent unless you press the button and agree below. Your key is used in this browser only.</Notice>
          <Field label="Groq API key" hint="Create a free key at console.groq.com. It is used only for this request and is kept only in this browser tab unless you tick the box.">
            {(id) => (
              <input id={id} type="password" autoComplete="off" spellCheck={false} className={inputCls} value={apiKey} onChange={(e) => { setApiKey(e.target.value); if (remember) saveKey(e.target.value, true); }} placeholder="gsk_…" />
            )}
          </Field>
          <label className="flex items-start gap-2 text-xs font-semibold text-ink">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={remember} onChange={(e) => { setRemember(e.target.checked); saveKey(apiKey, e.target.checked); }} />
            Remember the key in this browser (only on a computer you trust)
          </label>
          <Field label="Spoken language (optional)" hint="Leave empty to detect automatically. A language code like en, ur, hi, ar, es, ja.">
            {(id) => <input id={id} className={inputCls} value={lang} onChange={(e) => setLang(e.target.value.trim().toLowerCase().slice(0, 3))} placeholder="auto" />}
          </Field>
          <label className="flex items-start gap-2 text-xs font-bold text-ink">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I understand my voiceover will be sent to Groq.
          </label>
          <div className="flex gap-2">
            <Btn variant="primary" size="sm" disabled={!voice || !apiKey.trim() || !agree || working} onClick={() => actions.runGroq({ apiKey, language: lang })}>{working ? "Working…" : "Transcribe with Groq"}</Btn>
            {working && <Btn size="sm" onClick={actions.cancelGroq}>Cancel</Btn>}
          </div>
          {working && <p className="text-xs font-bold text-brand-700" role="status">{busy.timing}</p>}
          {!voice && <p className="text-[11px] font-medium text-slate-500">Add your voiceover in section 1 first.</p>}
        </div>
      )}

      {tab === "script" && (
        <div className="space-y-3">
          <Field label="Your script" hint={`${sentences} sentence${sentences === 1 ? "" : "s"}. Paste exactly what is spoken in the voiceover.`}>
            {(id) => <textarea id={id} className={cx(inputCls, "h-32 resize-y")} dir="auto" value={script} onChange={(e) => setScript(e.target.value)} placeholder="Paste the narration text here…" />}
          </Field>
          <Notice type="warn">This is an ESTIMATE, not speech recognition. It spreads your sentences over the audio using its pauses, and can be off by half a second or more. Check the result and drag scene edges on the timeline.</Notice>
          <Btn variant="primary" size="sm" disabled={!voice || !sentences || working} onClick={actions.runScriptEstimate}>{working ? busy.timing : "Create scenes from script"}</Btn>
        </div>
      )}

      {tab === "equal" && (
        <div className="space-y-3">
          <Notice type="warn">Splits the voiceover into scenes of equal length (one per sentence of your script, or per picture if there is no script). Placeholder timing only.</Notice>
          <Field label="Script (optional)">
            {(id) => <textarea id={id} className={cx(inputCls, "h-20 resize-y")} dir="auto" value={script} onChange={(e) => setScript(e.target.value)} placeholder="Optional…" />}
          </Field>
          <Btn variant="primary" size="sm" disabled={!voice} onClick={actions.runEqual}>Create equal scenes</Btn>
        </div>
      )}

      {rowMeta && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs">
          <p className="font-bold text-ink">{source}: {rows.length} sentence(s){rowMeta.hasWords ? ", real word times" : ", word times estimated"}</p>
          {rowMeta.estimated && <p className="mt-1 font-semibold text-amber-700">These timings are estimated. Check them.</p>}
          {rowMeta.note && <p className="mt-1 text-slate-600">{rowMeta.note}</p>}
        </div>
      )}
      {timingIssues.length > 0 && (
        <ul className="space-y-1">
          {timingIssues.slice(0, 5).map((i, k) => <li key={k}><Notice type={i.level === "error" ? "error" : "warn"}>{i.text}</Notice></li>)}
          {timingIssues.length > 5 && <li className="text-[11px] font-semibold text-slate-500">…and {timingIssues.length - 5} more.</li>}
        </ul>
      )}

      <Field label="How scenes are cut" hint="One per picture (recommended): the voiceover is cut into exactly as many scenes as you have pictures, at the end of a sentence wherever possible, so every picture is used once and in order. Or choose how many sentences share one picture.">
        {() => <Segmented label="How scenes are cut" size="sm" value={perScene} onChange={actions.changePerScene} options={[["pictures", "One per picture"], ["1", "1 sentence"], ["2", "2"], ["3", "3"], ["4", "4"]]} />}
      </Field>

      {scenes.length > 0 && (
        <Field label="Shift all timing" hint="If everything is a little early or late against the voice, nudge it here.">
          {() => (
            <div className="flex flex-wrap gap-2">
              {[-1, -0.1, 0.1, 1].map((d) => <Btn key={d} size="sm" onClick={() => actions.shiftAll(d)}>{d > 0 ? "+" : ""}{d} s</Btn>)}
            </div>
          )}
        </Field>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- 3. music
export function MusicPanel() {
  const { musicItem, musicVolume, setMusicVolume, musicFade, setMusicFade, actions } = useEditor();
  return (
    <Section n={3} title="Background music" status={musicItem ? "Added" : "Optional"}>
      {!musicItem ? (
        <Drop accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac" onFiles={(f) => actions.addMusic(f?.[0])} title="Drop a music track" sub="It plays under your voice and repeats if it is shorter." />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink" title={musicItem.name}>{musicItem.name}</p>
              <p className="text-xs text-slate-600">{clock(musicItem.duration)}</p>
            </div>
            <Btn size="sm" onClick={actions.removeMusic}>Remove</Btn>
          </div>
          <Field label={`Music volume: ${musicVolume}%`} hint="Around 15 to 30% keeps the voice clear.">
            {(id) => <input id={id} type="range" min={0} max={100} value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} className="w-full accent-brand-600" />}
          </Field>
          <Field label={`Fade out at the end: ${musicFade} s`}>
            {(id) => <input id={id} type="range" min={0} max={10} step={0.5} value={musicFade} onChange={(e) => setMusicFade(Number(e.target.value))} className="w-full accent-brand-600" />}
          </Field>
        </>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- 4. media
export function MediaPanel() {
  const { media, scenes, actions, perScene, edited } = useEditor();
  const used = new Set(scenes.map((s) => s.mediaId));
  const totalBytes = media.reduce((n, m) => n + m.size, 0);
  return (
    <Section n={4} title="Pictures & clips" status={media.length ? `${media.length} files` : "Required"} defaultOpen>
      <Drop accept="image/*,video/*,.heic,.heif,.mp4,.mov,.webm" multiple onFiles={actions.addMedia} title="Drop pictures and video clips" sub="JPG, PNG, WEBP, MP4, MOV, WEBM. As many as you like." />
      {totalBytes > 800 * 1048576 && <Notice type="warn">Your files add up to {mb(totalBytes)} MB. Rendering may run out of memory in the browser; try fewer or smaller files.</Notice>}
      {media.length > 0 && (
        <>
          <ul className="grid grid-cols-3 gap-2">
            {media.map((m) => (
              <li key={m.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <div className="aspect-square">
                  {m.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <video src={m.url} muted preload="metadata" className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-bold text-white">{m.kind === "video" ? `▶ ${m.duration ? clock(m.duration) : "clip"}` : "photo"}</span>
                {!used.has(m.id) && scenes.length > 0 && <span className="absolute bottom-6 left-1 rounded bg-amber-500 px-1 text-[10px] font-bold text-white">unused</span>}
                {m.broken && <span className="absolute inset-x-0 top-0 bg-red-600 px-1 text-center text-[10px] font-bold text-white">unreadable</span>}
                <p className="truncate bg-white px-1.5 py-1 text-[10px] font-semibold text-slate-700" title={m.name}>{m.name}</p>
                <button type="button" aria-label={`Remove ${m.name}`} onClick={() => actions.removeMedia(m.id)} className="absolute right-1 top-1 h-5 w-5 rounded-full bg-black/70 text-xs font-bold leading-5 text-white opacity-0 transition focus:opacity-100 group-hover:opacity-100">×</button>
              </li>
            ))}
          </ul>
          {media.some((m) => m.warn) && <Notice type="warn">{media.find((m) => m.warn).warn}</Notice>}
          {scenes.length > 0 && perScene === "pictures" && !edited && (
            <Notice type="success">{media.length} pictures → {scenes.length} scenes. The voiceover is cut so that each picture gets its own part, at sentence ends wherever possible.</Notice>
          )}
          {scenes.length > 0 && edited && media.length !== scenes.length && perScene === "pictures" && (
            <Notice type="warn">
              You edited the scenes by hand, so new pictures were not cut in automatically ({media.length} pictures, {scenes.length} scenes).
              <span className="mt-2 block">
                <Btn size="sm" variant="primary" onClick={actions.replan}>Cut the scenes again, one per picture</Btn>
              </span>
            </Notice>
          )}
          {scenes.length > 0 && perScene !== "pictures" && media.length !== scenes.length && (
            <Notice type="info">{scenes.length} scenes and {media.length} pictures. {media.length > scenes.length ? `${media.length - scenes.length} pictures are unused.` : "Pictures repeat."} Choose &ldquo;One per picture&rdquo; in section 2 to match them exactly.</Notice>
          )}
          <p className="text-[11px] font-medium text-slate-500">Pictures are placed by FILE NAME (01, 02, 03 …). Number your files in story order and each one lands on its own sentence.</p>
          <Btn size="sm" onClick={actions.autoAssign} disabled={!scenes.length}>Put the pictures on the scenes in file-name order</Btn>
        </>
      )}
    </Section>
  );
}
