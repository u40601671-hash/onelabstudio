"use client";
// The editor's brain: all state and every action in one place. Panels only display and call these actions.
// Heavy code (FFmpeg, Groq, ZIP) is imported on demand, so the page itself stays light.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, usePlayback } from "./hooks";
import { uid } from "@/lib/video/time";
import { parseTimingFile, validateRows, splitSentences } from "@/lib/video/timing";
import {
  buildScenes, equalRows, estimateFromScript, totalDuration, sceneIssues, setSceneTimes, moveBoundary, shiftScenes,
  updateSceneText, duplicateScene, splitScene, swapVisuals, dropMedia, planCuts, cutSeconds, applyCuts, assignMediaInOrder,
} from "@/lib/video/scenes";
import { makeCaptionStyle, captionChunks, chunksToSrt } from "@/lib/video/captions";
import { planByPictures } from "@/lib/video/plan";

const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|oga|opus|webm|mp4|flac|mov|m4v)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;
const VIDEO_EXT = /\.(mp4|mov|webm|m4v|mkv)$/i;
const kindOf = (f) => (f.type.startsWith("image/") || IMAGE_EXT.test(f.name) ? "image" : f.type.startsWith("video/") || VIDEO_EXT.test(f.name) ? "video" : null);
// pictures are kept in file-name order (scene-01, scene-02 ... scene-10), so numbered files land on the right sentences
const nameOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const sortMedia = (list) => [...list].sort((a, b) => nameOrder.compare(a.name, b.name));
/**
 * Scenes for the timing rows. Mode "pictures" (default): exactly one scene per picture, cut where the narration allows
 * (see lib/video/plan.js). Mode 1-4: that many sentences share a picture. Without pictures yet, one scene per sentence.
 */
function buildFor(rows, mediaList, mode, keep = []) {
  const ids = mediaList.map((m) => m.id);
  if (mode === "pictures") {
    if (!ids.length) return { scenes: buildScenes(rows, 1, [], keep), used: 0, wanted: 0 };
    const plan = planByPictures(rows, ids);
    return plan;
  }
  const scenes = buildScenes(rows, Number(mode) || 1, ids, keep);
  return { scenes, used: ids.length, wanted: ids.length };
}
const autoChars = (aspect) => (aspect === "9:16" ? 26 : aspect === "1:1" ? 30 : 40);

export function downloadUrl(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
export function downloadText(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  downloadUrl(url, name);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Pictures for scenes that have none: unused files first, then start over from the first one. */
function fillEmpty(scenes, media) {
  if (!media.length) return scenes;
  const used = new Set(scenes.map((s) => s.mediaId).filter(Boolean));
  const spare = media.filter((m) => !used.has(m.id)).map((m) => m.id);
  let cycle = 0;
  return scenes.map((s) => {
    if (s.mediaId) return s;
    const id = spare.length ? spare.shift() : media[cycle++ % media.length].id;
    return { ...s, mediaId: id };
  });
}

export function useEditorState() {
  const [voice, setVoice] = useState(null); // { file, name, url, duration }
  const [peaks, setPeaks] = useState(null);
  const [musicItem, setMusicItem] = useState(null);
  const [musicVolume, setMusicVolume] = useState(25);
  const [musicFade, setMusicFade] = useState(2);
  const [media, setMedia] = useState([]);
  const [script, setScript] = useState("");
  const [rows, setRows] = useState([]);
  const [rowMeta, setRowMeta] = useState(null);
  const [timingIssues, setTimingIssues] = useState([]);
  const [perScene, setPerScene] = useState("pictures");
  const [edited, setEdited] = useState(false); // true once the user changed scenes by hand (then pictures no longer re-plan by themselves)
  const hist = useHistory([]);
  const scenes = hist.present;
  const [sel, setSel] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [style, setStyle] = useState(() => ({ ...makeCaptionStyle("creator"), maxCharsAuto: true, maxChars: autoChars("9:16") }));
  const [out, setOut] = useState({ aspect: "9:16", quality: "720p", transition: "cut", transitionLength: 0.5, motion: "none" });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState({ voice: false, timing: "", silence: "", zip: -1 });
  const [silence, setSilence] = useState({ params: { minGap: 0.7, noiseDb: -35 }, result: null, snapshot: null, applied: null });
  const [render, setRender] = useState({ open: false, status: "idle", stage: "", pct: 0, error: "", result: null });
  const abortRef = useRef(null);
  const groqAbort = useRef(null);
  const noticeTimer = useRef(null);
  const urls = useRef(new Set());

  const mediaById = useMemo(() => new Map(media.map((m) => [m.id, m])), [media]);
  const total = totalDuration(scenes, voice?.duration || 0);
  const play = usePlayback({ voiceUrl: voice?.url, musicUrl: musicItem?.url, musicVolume, total });

  const notify = useCallback((type, text, sticky = false) => {
    clearTimeout(noticeTimer.current);
    setNotice({ type, text });
    if (!sticky && type !== "error") noticeTimer.current = setTimeout(() => setNotice(null), 7000);
  }, []);
  const makeUrl = useCallback((file) => {
    const u = URL.createObjectURL(file);
    urls.current.add(u);
    return u;
  }, []);
  const dropUrl = useCallback((u) => {
    if (u && urls.current.has(u)) {
      URL.revokeObjectURL(u);
      urls.current.delete(u);
    }
  }, []);

  const chunks = useMemo(() => captionChunks(scenes, style.maxChars), [scenes, style.maxChars]);
  const issues = useMemo(() => {
    const list = [];
    if (!voice) list.push({ level: "error", text: "Add your voiceover (section 1)." });
    if (!scenes.length) list.push({ level: "error", text: "Create scenes from your timing data or script (section 2)." });
    list.push(...sceneIssues(scenes, mediaById));
    if (scenes.length && media.length) {
      const used = new Set(scenes.map((s) => s.mediaId));
      const unused = media.filter((m) => !used.has(m.id)).length;
      if (unused) list.push({ level: "warn", text: `${unused} of your ${media.length} pictures are not used by any scene (section 4 can fix this).` });
    }
    scenes.forEach((s, i) => {
      if (s.mediaId && mediaById.get(s.mediaId)?.broken) list.push({ level: "error", scene: i, text: `Scene ${i + 1}: "${mediaById.get(s.mediaId).name}" cannot be read by this browser.` });
    });
    return list;
  }, [voice, scenes, mediaById, media]);

  // warn before leaving with work in the page
  useEffect(() => {
    if (!voice && !media.length && !scenes.length) return undefined;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [voice, media.length, scenes.length]);

  // free browser memory when the page is closed
  useEffect(() => {
    const set = urls.current;
    return () => {
      set.forEach((u) => URL.revokeObjectURL(u));
      set.clear();
    };
  }, []);


  // ---------- voice ----------
  const addVoice = useCallback(async (file) => {
    if (!file) return;
    if (!(file.type.startsWith("audio/") || file.type.startsWith("video/") || AUDIO_EXT.test(file.name))) {
      notify("error", "That does not look like an audio file. Use MP3, WAV, M4A, OGG, WEBM or MP4.");
      return;
    }
    setBusy((b) => ({ ...b, voice: true }));
    try {
      const { mediaDuration, waveformPeaks } = await import("@/lib/video/audio");
      const duration = await mediaDuration(file);
      if (!duration) throw new Error("This browser could not read the length of that file. Try an MP3, WAV or M4A.");
      play.pause();
      if (voice) dropUrl(voice.url);
      setVoice({ file, name: file.name, url: makeUrl(file), duration });
      setPeaks(null);
      setSilence((s) => ({ ...s, result: null, snapshot: null, applied: null }));
      waveformPeaks(file).then((p) => setPeaks(p)).catch(() => {});
      play.seek(0);
      setDirty(true);
      notify("success", `Voiceover added (${Math.floor(duration / 60)}:${String(Math.round(duration % 60)).padStart(2, "0")}).`);
    } catch (e) {
      notify("error", String(e?.message || e));
    } finally {
      setBusy((b) => ({ ...b, voice: false }));
    }
  }, [voice, notify, makeUrl, dropUrl, play]);

  const removeVoice = useCallback(() => {
    play.pause();
    if (voice) dropUrl(voice.url);
    if (silence.snapshot?.voice) dropUrl(silence.snapshot.voice.url);
    setVoice(null);
    setPeaks(null);
    setSilence((s) => ({ ...s, result: null, snapshot: null, applied: null }));
  }, [voice, silence.snapshot, dropUrl, play]);

  // ---------- music ----------
  const addMusic = useCallback(async (file) => {
    if (!file) return;
    if (!(file.type.startsWith("audio/") || AUDIO_EXT.test(file.name))) return notify("error", "That does not look like an audio file.");
    const { mediaDuration } = await import("@/lib/video/audio");
    const duration = await mediaDuration(file);
    if (!duration) return notify("error", "This browser could not read that music file. Try an MP3 or WAV.");
    if (musicItem) dropUrl(musicItem.url);
    setMusicItem({ file, name: file.name, url: makeUrl(file), duration });
    setDirty(true);
    notify("success", "Music added.");
  }, [musicItem, notify, makeUrl, dropUrl]);
  const removeMusic = useCallback(() => {
    if (musicItem) dropUrl(musicItem.url);
    setMusicItem(null);
  }, [musicItem, dropUrl]);

  // ---------- media ----------
  const addMedia = useCallback(async (list) => {
    const files = Array.from(list || []);
    const items = [];
    let rejected = 0;
    for (const f of files) {
      const kind = kindOf(f);
      if (!kind) {
        rejected++;
        continue;
      }
      items.push({ id: uid("media"), file: f, name: f.name, kind, url: makeUrl(f), size: f.size, width: 0, height: 0, duration: 0, broken: false });
    }
    if (rejected) notify("warn", `${rejected} file(s) were skipped: only pictures and video clips can be added here.`);
    if (!items.length) return;
    const nextMedia = sortMedia([...media, ...items]);
    setMedia(nextMedia);
    setDirty(true);
    if (rows.length && perScene === "pictures" && !edited) {
      // the scenes follow the pictures: cut the narration again so every picture gets its own scene
      const plan = buildFor(rows, nextMedia, "pictures");
      hist.reset(plan.scenes);
      setSel(0);
      if (plan.used < plan.wanted) notify("warn", `Your voiceover is only long enough for ${plan.used} scenes, so ${plan.wanted - plan.used} pictures are not used.`);
      else notify("success", `${nextMedia.length} pictures: the voiceover was cut into ${plan.scenes.length} scenes, one per picture, cut at sentence ends wherever possible.`);
    } else if (scenes.length) hist.replace((sc) => fillEmpty(sc, nextMedia));
    // look at each file in the background: size, length, can this browser show it?
    const { mediaDuration } = await import("@/lib/video/audio");
    for (const it of items) {
      try {
        if (it.kind === "image") {
          const bmp = await createImageBitmap(it.file);
          it.width = bmp.width;
          it.height = bmp.height;
          bmp.close?.();
          setMedia((m) => m.map((x) => (x.id === it.id ? { ...x, width: it.width, height: it.height } : x)));
        } else {
          const d = await mediaDuration(it.file);
          setMedia((m) => m.map((x) => (x.id === it.id ? { ...x, duration: d, warn: d ? "" : "This browser cannot preview this clip; rendering may still work with MP4 (H.264)." } : x)));
        }
      } catch {
        setMedia((m) => m.map((x) => (x.id === it.id ? { ...x, broken: true } : x)));
      }
    }
  }, [media, scenes.length, rows, perScene, edited, hist, makeUrl, notify]);

  const removeMedia = useCallback((id) => {
    const m = mediaById.get(id);
    if (m) dropUrl(m.url);
    const nextMedia = media.filter((x) => x.id !== id);
    setMedia(nextMedia);
    setDirty(true);
    if (rows.length && perScene === "pictures" && !edited) {
      hist.reset(buildFor(rows, nextMedia, "pictures").scenes);
      setSel(0);
    } else hist.set((sc) => dropMedia(sc, id));
  }, [mediaById, media, rows, perScene, edited, hist, dropUrl]);

  // ---------- timing ----------
  const applyRows = useCallback((newRows, meta) => {
    const plan = buildFor(newRows, media, perScene);
    setRows(newRows);
    setRowMeta(meta);
    hist.reset(plan.scenes);
    setEdited(false);
    setSel(0);
    play.seek(0);
    setDirty(true);
    if (plan.used < plan.wanted) notify("warn", `Your voiceover is only long enough for ${plan.used} scenes, so ${plan.wanted - plan.used} pictures are not used.`);
  }, [media, perScene, hist, play, notify]);

  const importTimingFile = useCallback(async (file) => {
    if (!file) return;
    try {
      const parsed = parseTimingFile(file.name, await file.text(), script);
      const issues = validateRows(parsed.rows, voice?.duration || 0);
      const bad = issues.filter((i) => i.level === "error").length;
      const valid = parsed.rows.filter((r) => r.end > r.start);
      if (!valid.length) throw new Error("Every line in this file has an invalid time range.");
      setTimingIssues(issues);
      applyRows(valid, { source: "file", name: file.name, kind: parsed.kind, estimated: parsed.estimated, wordLevel: parsed.wordLevel, hasWords: valid.some((r) => r.words?.length), note: parsed.note });
      notify(parsed.estimated || bad ? "warn" : "success", `Read ${parsed.rows.length} line(s) from ${file.name}.${parsed.estimated ? " This file says its timings are estimated, so check them." : ""}${bad ? ` ${bad} invalid line(s) were skipped.` : ""}`);
    } catch (e) {
      notify("error", String(e?.message || e));
    }
  }, [script, voice, applyRows, notify]);

  const runGroq = useCallback(async ({ apiKey, language }) => {
    if (!voice) return notify("error", "Add your voiceover first.");
    groqAbort.current = new AbortController();
    setBusy((b) => ({ ...b, timing: "Starting…" }));
    try {
      const { transcribeWithGroq } = await import("@/lib/video/groq");
      const res = await transcribeWithGroq(voice.file, { apiKey, language, signal: groqAbort.current.signal, onStatus: (s) => setBusy((b) => ({ ...b, timing: s })) });
      setTimingIssues(validateRows(res.rows, voice.duration));
      applyRows(res.rows, { source: "groq", estimated: false, hasWords: res.wordTimes, note: res.language ? `Detected language: ${res.language}` : "" });
      notify("success", `Groq found ${res.rows.length} sentence(s).${res.wordTimes ? "" : " Groq did not return word times, so word highlights will be estimated."}`);
    } catch (e) {
      if (e?.name !== "AbortError") notify("error", String(e?.message || e));
    } finally {
      setBusy((b) => ({ ...b, timing: "" }));
    }
  }, [voice, applyRows, notify]);
  const cancelGroq = useCallback(() => groqAbort.current?.abort(), []);

  const runScriptEstimate = useCallback(async () => {
    const lines = splitSentences(script);
    if (!lines.length) return notify("error", "Paste your script first.");
    if (!voice) return notify("error", "Add your voiceover first so the length is known.");
    setBusy((b) => ({ ...b, timing: "Listening for pauses in your audio…" }));
    try {
      let regions = null;
      let duration = voice.duration;
      let note = "Estimated from your script and the pauses in the audio.";
      try {
        const { detectSilences, speechRegions } = await import("@/lib/video/audio");
        const r = await detectSilences(voice.file, { noiseDb: -35, minSec: 0.25, duration: voice.duration });
        duration = r.duration || voice.duration;
        regions = speechRegions(r.silences, duration);
      } catch (e) {
        note = `Could not analyse the pauses (${String(e?.message || e)}); timing is spread by sentence length only.`;
      }
      const est = estimateFromScript(lines, duration, regions);
      setTimingIssues([]);
      applyRows(est, { source: "script", estimated: true, hasWords: false, note });
      notify("warn", "Scenes created from an ESTIMATE. They can be off by half a second or more: check them and drag the boundaries on the timeline.", true);
    } catch (e) {
      notify("error", String(e?.message || e));
    } finally {
      setBusy((b) => ({ ...b, timing: "" }));
    }
  }, [script, voice, applyRows, notify]);

  const runEqual = useCallback(() => {
    if (!voice) return notify("error", "Add your voiceover first so the length is known.");
    const r = equalRows(splitSentences(script), media.length, voice.duration);
    setTimingIssues([]);
    applyRows(r, { source: "equal", estimated: true, hasWords: false, note: "Equal time: every scene has the same length." });
    notify("warn", "Scenes were split into equal parts. This is not speech recognition: adjust the boundaries on the timeline.", true);
  }, [voice, script, media.length, applyRows, notify]);

  const changePerScene = useCallback((v) => {
    if (edited && scenes.length && rows.length && !window.confirm("Changing this rebuilds the scenes from the timing data. Your text and timing edits will be lost. Continue?")) return;
    setPerScene(v);
    if (rows.length) {
      hist.reset(buildFor(rows, media, v, scenes).scenes);
      setSel(0);
      setEdited(false);
    }
  }, [edited, scenes, rows, media, hist]);

  /** Cut the scenes again from the narration and the pictures (throws away hand edits). */
  const replan = useCallback(() => {
    if (!rows.length) return;
    if (edited && !window.confirm("This rebuilds the scenes from the pictures and drops your hand edits. Continue?")) return;
    const plan = buildFor(rows, media, perScene);
    hist.reset(plan.scenes);
    setSel(0);
    setEdited(false);
    if (plan.used < plan.wanted) notify("warn", `Your voiceover is only long enough for ${plan.used} scenes, so ${plan.wanted - plan.used} pictures are not used.`);
    else notify("success", `${plan.scenes.length} scenes, one per picture.`);
  }, [rows, media, perScene, edited, hist, notify]);

  // ---------- scene editing ----------
  const edit = useCallback((fn) => {
    hist.set(fn);
    setDirty(true);
    setEdited(true);
  }, [hist]);
  const updateScene = useCallback((i, patch) => edit((sc) => sc.map((s, k) => (k === i ? { ...s, ...patch } : s))), [edit]);
  const setTimes = useCallback((i, a, b) => edit((sc) => setSceneTimes(sc, i, a, b)), [edit]);
  const setText = useCallback((i, text) => edit((sc) => sc.map((s, k) => (k === i ? updateSceneText(s, text) : s))), [edit]);
  const moveVisual = useCallback((i, dir) => edit((sc) => swapVisuals(sc, i, i + dir)), [edit]);
  const dupScene = useCallback((i) => edit((sc) => duplicateScene(sc, i)), [edit]);
  const deleteScene = useCallback((i) => {
    edit((sc) => sc.filter((_, k) => k !== i));
    setSel((s) => Math.max(0, Math.min(s, scenes.length - 2)));
  }, [edit, scenes.length]);
  const splitAtPlayhead = useCallback((i) => {
    const next = splitScene(scenes, i, play.t);
    if (!next) return notify("warn", "Move the playhead inside the scene (not at its very edge) to split it there.");
    edit(() => next);
  }, [scenes, play.t, edit, notify]);
  const shiftAll = useCallback((d) => edit((sc) => shiftScenes(sc, d)), [edit]);
  const autoAssign = useCallback(() => hist.set((sc) => assignMediaInOrder(sc, media.map((m) => m.id))), [hist, media]);
  const dragStart = useCallback(() => hist.checkpoint(), [hist]);
  const dragMove = useCallback((i, t) => {
    hist.replace((sc) => moveBoundary(sc, i, t));
    setDirty(true);
    setEdited(true);
  }, [hist]);

  // ---------- silence remover ----------
  const analyseSilence = useCallback(async () => {
    if (!voice) return;
    setBusy((b) => ({ ...b, silence: "Listening for silences…" }));
    try {
      const { detectSilences } = await import("@/lib/video/audio");
      const p = silence.params;
      const r = await detectSilences(voice.file, { noiseDb: p.noiseDb, minSec: Math.max(0.2, p.minGap), duration: voice.duration });
      const cuts = planCuts(r.silences, { minGap: p.minGap, pad: 0.2, duration: r.duration || voice.duration });
      setSilence((s) => ({ ...s, result: { cuts, saved: cutSeconds(cuts), count: cuts.length, duration: r.duration || voice.duration } }));
    } catch (e) {
      notify("error", `Could not analyse the audio: ${String(e?.message || e)}`);
    } finally {
      setBusy((b) => ({ ...b, silence: "" }));
    }
  }, [voice, silence.params, notify]);

  const applySilence = useCallback(async () => {
    const r = silence.result;
    if (!voice || !r || !r.cuts.length) return;
    setBusy((b) => ({ ...b, silence: "Cutting the silences out…" }));
    try {
      const { cutAudio, mediaDuration, waveformPeaks } = await import("@/lib/video/audio");
      const file = await cutAudio(voice.file, r.cuts, r.duration);
      const duration = await mediaDuration(file);
      if (!duration) throw new Error("The edited audio could not be read.");
      play.pause();
      const snapshot = { voice, peaks, scenes, rows, rowMeta };
      setVoice({ file, name: file.name, url: makeUrl(file), duration });
      hist.reset(applyCuts(scenes, r.cuts));
      setRows(applyCuts(rows, r.cuts));
      setPeaks(null);
      waveformPeaks(file).then(setPeaks).catch(() => {});
      setSilence((s) => ({ ...s, snapshot: s.snapshot || snapshot, applied: { count: r.cuts.length, saved: r.saved }, result: null }));
      play.seek(0);
      setDirty(true);
      notify("success", `Removed ${r.cuts.length} silence(s) and saved ${r.saved.toFixed(1)} s. Scenes and captions moved with the audio.`);
    } catch (e) {
      notify("error", String(e?.message || e));
    } finally {
      setBusy((b) => ({ ...b, silence: "" }));
    }
  }, [silence.result, voice, peaks, scenes, rows, rowMeta, hist, makeUrl, notify, play]);

  const restoreSilence = useCallback(() => {
    const snap = silence.snapshot;
    if (!snap) return;
    if (!window.confirm("Go back to the original audio? Edits you made after removing silences will be lost.")) return;
    play.pause();
    if (voice) dropUrl(voice.url);
    setVoice(snap.voice);
    setPeaks(snap.peaks);
    hist.reset(snap.scenes);
    setRows(snap.rows);
    setRowMeta(snap.rowMeta);
    setSilence((s) => ({ ...s, snapshot: null, applied: null, result: null }));
    play.seek(0);
  }, [silence.snapshot, voice, hist, dropUrl, play]);

  // ---------- caption style / output ----------
  const patchStyle = useCallback((p) => setStyle((s) => ({ ...s, ...p, ...(p.maxChars != null ? { maxCharsAuto: false } : {}) })), []);
  const pickPreset = useCallback((preset) => setStyle((s) => ({ ...makeCaptionStyle(preset, { enabled: s.enabled, pos: s.pos, maxChars: s.maxChars }), maxCharsAuto: s.maxCharsAuto })), []);
  const patchOut = useCallback((p) => {
    setOut((o) => ({ ...o, ...p }));
    if (p.aspect) setStyle((s) => (s.maxCharsAuto ? { ...s, maxChars: autoChars(p.aspect) } : s));
  }, []);

  // ---------- exports ----------
  const downloadSrt = useCallback(() => {
    if (!chunks.length) return notify("error", "There are no captions yet.");
    downloadText("captions.srt", chunksToSrt(chunks), "application/x-subrip");
  }, [chunks, notify]);

  const downloadZip = useCallback(async () => {
    if (busy.zip >= 0) return;
    setBusy((b) => ({ ...b, zip: 0 }));
    try {
      const { buildZip } = await import("@/lib/video/zip");
      const blob = await buildZip({
        scenes, media, voice: voice ? { file: voice.file, name: voice.name } : null, music: musicItem ? { file: musicItem.file, name: musicItem.name } : null,
        settings: { aspect: out.aspect, quality: out.quality, fps: 30, transition: out.transition, transitionSeconds: out.transitionLength, motion: out.motion, musicVolumePercent: musicVolume, captions: style },
        chunks, total,
      }, (p) => setBusy((b) => ({ ...b, zip: p })));
      const url = URL.createObjectURL(blob);
      downloadUrl(url, "video-package.zip");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      notify("success", "Package downloaded: your media, scenes.json and captions.srt. It is not a rendered video.");
    } catch (e) {
      notify("error", `The package could not be created: ${String(e?.message || e)}`);
    } finally {
      setBusy((b) => ({ ...b, zip: -1 }));
    }
  }, [busy.zip, scenes, media, voice, musicItem, out, musicVolume, style, chunks, total, notify]);

  // ---------- render ----------
  const startRender = useCallback(async () => {
    if (render.status === "running") return;
    const errors = issues.filter((i) => i.level === "error");
    if (errors.length) {
      setRender({ open: true, status: "error", stage: "", pct: 0, error: `Fix these first: ${errors.slice(0, 4).map((e) => e.text).join(" ")}`, result: null });
      return;
    }
    play.pause();
    if (render.result?.url) dropUrl(render.result.url);
    abortRef.current = new AbortController();
    setRender({ open: true, status: "running", stage: "Starting…", pct: 0, error: "", result: null });
    try {
      const { renderVideo, RenderCancelled } = await import("@/lib/video/render");
      try {
        const res = await renderVideo({
          scenes, mediaById, voice: { file: voice.file }, music: musicItem ? { file: musicItem.file, volume: musicVolume, fadeOut: musicFade } : null,
          aspect: out.aspect, quality: out.quality, transition: { type: out.transition, length: out.transitionLength }, motion: out.motion,
          captions: style.enabled ? style : null, total,
        }, { signal: abortRef.current.signal, onProgress: (p) => setRender((r) => (r.status === "running" ? { ...r, stage: p.stage, pct: p.pct } : r)) });
        const url = makeUrl(res.blob);
        setRender({ open: true, status: "done", stage: "Done", pct: 100, error: "", result: { url, bytes: res.bytes, seconds: res.seconds, width: res.width, height: res.height, captionsBurned: res.captionsBurned } });
      } catch (e) {
        if (e instanceof RenderCancelled || abortRef.current?.signal.aborted) setRender({ open: true, status: "cancelled", stage: "", pct: 0, error: "", result: null });
        else setRender({ open: true, status: "error", stage: "", pct: 0, error: String(e?.message || e), result: null });
      }
    } catch (e) {
      setRender({ open: true, status: "error", stage: "", pct: 0, error: String(e?.message || e), result: null });
    }
  }, [render.status, render.result, issues, scenes, mediaById, voice, musicItem, musicVolume, musicFade, out, style, total, play, dropUrl, makeUrl]);
  const cancelRender = useCallback(() => abortRef.current?.abort(), []);
  const closeRender = useCallback(() => setRender((r) => (r.status === "running" ? r : { ...r, open: false })), []);
  const openRender = useCallback(() => setRender((r) => ({ ...r, open: true })), []);

  // ---------- start over ----------
  const startOver = useCallback(async () => {
    const has = voice || media.length || scenes.length || musicItem;
    if (has && !window.confirm("Start over? Everything in the editor will be cleared. Nothing is saved anywhere.")) return;
    abortRef.current?.abort();
    groqAbort.current?.abort();
    play.pause();
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current.clear();
    setVoice(null); setPeaks(null); setMusicItem(null); setMedia([]); setScript(""); setRows([]); setRowMeta(null); setTimingIssues([]);
    setPerScene("pictures"); hist.reset([]); setSel(0); setDirty(false); setEdited(false);
    setSilence({ params: { minGap: 0.7, noiseDb: -35 }, result: null, snapshot: null, applied: null });
    setRender({ open: false, status: "idle", stage: "", pct: 0, error: "", result: null });
    setStyle({ ...makeCaptionStyle("creator"), maxCharsAuto: true, maxChars: autoChars("9:16") });
    setOut({ aspect: "9:16", quality: "720p", transition: "cut", transitionLength: 0.5, motion: "none" });
    play.seek(0);
    setNotice(null);
    try {
      (await import("@/lib/video/ffmpegClient")).terminateEngine(); // frees the engine's memory too
    } catch {
      /* engine never started */
    }
  }, [voice, media.length, scenes.length, musicItem, hist, play]);

  return {
    voice, peaks, musicItem, musicVolume, setMusicVolume, musicFade, setMusicFade, media, mediaById, script, setScript, rows, rowMeta, timingIssues,
    perScene, edited, scenes, sel, setSel, dirty, style, out, notice, setNotice, busy, silence, setSilence, render, total, chunks, issues, play,
    hist,
    actions: {
      notify, addVoice, removeVoice, addMusic, removeMusic, addMedia, removeMedia, importTimingFile, runGroq, cancelGroq, runScriptEstimate, runEqual,
      changePerScene, replan, updateScene, setTimes, setText, moveVisual, dupScene, deleteScene, splitAtPlayhead, shiftAll, autoAssign, dragStart, dragMove,
      analyseSilence, applySilence, restoreSilence, patchStyle, pickPreset, patchOut, downloadSrt, downloadZip, startRender, cancelRender, closeRender,
      openRender, startOver,
    },
  };
}
