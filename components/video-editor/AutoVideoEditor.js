"use client";
// Auto Video Editor: one page. Settings on the left (numbered sections), preview in the middle, timeline below.
// Everything runs in the visitor's browser. Nothing is uploaded and nothing is saved.
import { useEffect } from "react";
import { EditorContext } from "./EditorContext";
import { useEditorState } from "./useEditorState";
import { VoicePanel, TimingPanel, MusicPanel, MediaPanel } from "./panels1";
import { StoryboardPanel, CaptionsPanel, OutputPanel } from "./panels2";
import Preview from "./Preview";
import Timeline from "./Timeline";
import RenderDialog from "./RenderDialog";
import { Btn, Notice, cx } from "./ui";

function Step({ done, label }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", done ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>
      <span aria-hidden>{done ? "✓" : "○"}</span>
      {label}
    </span>
  );
}

export default function AutoVideoEditor() {
  const editor = useEditorState();
  const { voice, scenes, media, notice, setNotice, actions, hist, play, render } = editor;

  // keyboard: Space = play/pause, Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z or Ctrl+Y = redo (not while typing)
  useEffect(() => {
    const onKey = (ev) => {
      const tag = (ev.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select" || ev.target?.isContentEditable;
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && !typing && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        ev.shiftKey ? hist.redo() : hist.undo();
      } else if (mod && !typing && ev.key.toLowerCase() === "y") {
        ev.preventDefault();
        hist.redo();
      } else if (ev.code === "Space" && !typing && tag !== "button" && tag !== "a") {
        ev.preventDefault();
        play.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hist, play]);

  const hasPictures = scenes.length > 0 && scenes.every((s) => s.mediaId);

  return (
    <EditorContext.Provider value={editor}>
      <div className="space-y-4 [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2" aria-label="Progress">
            <Step done={!!voice} label="Voiceover" />
            <Step done={scenes.length > 0} label="Scenes" />
            <Step done={hasPictures && media.length > 0} label="Pictures" />
            <Step done={render.status === "done"} label="Rendered" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-[11px] font-semibold text-slate-500 sm:inline">🔒 Runs in your browser. Nothing is uploaded or saved.</span>
            <Btn size="sm" onClick={hist.undo} disabled={!hist.canUndo} aria-label="Undo">↶</Btn>
            <Btn size="sm" onClick={hist.redo} disabled={!hist.canRedo} aria-label="Redo">↷</Btn>
            <Btn size="sm" variant="danger" onClick={actions.startOver}>Start over</Btn>
            <Btn variant="primary" onClick={actions.startRender} disabled={render.status === "running"}>
              {render.status === "running" ? `Rendering ${render.pct}%` : "Render MP4"}
            </Btn>
          </div>
        </div>

        {notice && (
          <Notice type={notice.type} onClose={() => setNotice(null)}>
            {notice.text}
          </Notice>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(340px,410px)_minmax(0,1fr)]">
          <aside aria-label="Editor settings" className="order-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-1 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <VoicePanel />
            <TimingPanel />
            <MusicPanel />
            <MediaPanel />
            <StoryboardPanel />
            <CaptionsPanel />
            <OutputPanel />
          </aside>
          <div className="order-1 min-w-0 space-y-4 lg:order-2">
            <Preview />
            <Timeline />
          </div>
        </div>
      </div>
      <RenderDialog />
    </EditorContext.Provider>
  );
}
