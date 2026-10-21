"use client";
// The render window: honest progress while FFmpeg works, then the finished MP4 to watch and download.
import { useEffect, useRef } from "react";
import { useEditor } from "./EditorContext";
import { Btn, ProgressBar, mb } from "./ui";
import { downloadUrl } from "./useEditorState";
import { clock } from "@/lib/video/time";

export default function RenderDialog() {
  const { render, actions } = useEditor();
  const closeRef = useRef(null);
  const open = render.open;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && render.status !== "running" && actions.closeRender();
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, render.status, actions]);

  if (!open) return null;
  const { status, result } = render;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="render-title">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="render-title" className="font-display text-2xl font-extrabold text-ink">
          {status === "running" ? "Rendering your video" : status === "done" ? "Your video is ready" : status === "cancelled" ? "Render cancelled" : "Could not render"}
        </h2>

        {status === "running" && (
          <div className="mt-5 space-y-3" role="status" aria-live="polite">
            <p className="text-sm font-bold text-ink">{render.stage}</p>
            <ProgressBar pct={render.pct} label="Render progress" />
            <p className="text-xs font-medium text-slate-600">{render.pct}%. This happens inside your browser, so keep this tab open. Your files are not uploaded.</p>
            <Btn variant="danger" onClick={actions.cancelRender}>Cancel</Btn>
          </div>
        )}

        {status === "done" && result && (
          <div className="mt-4 space-y-4">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={result.url} controls playsInline className="mx-auto max-h-[50vh] w-full rounded-lg bg-black" />
            <p className="text-xs font-semibold text-slate-700">
              {result.width}×{result.height} · {clock(result.seconds)} · {mb(result.bytes)} MB · MP4 (H.264 + AAC) · captions {result.captionsBurned ? "are burned into the picture" : "are not included"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Btn variant="primary" onClick={() => downloadUrl(result.url, "video.mp4")}>⬇ Download MP4</Btn>
              <Btn ref={closeRef} onClick={actions.closeRender}>Back to the editor</Btn>
            </div>
          </div>
        )}

        {(status === "error" || status === "cancelled") && (
          <div className="mt-4 space-y-4">
            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-800" role="alert">
              {status === "cancelled" ? "The render was stopped. Nothing was saved." : render.error}
            </p>
            <div className="flex flex-wrap gap-2">
              <Btn variant="primary" onClick={actions.startRender}>Try again</Btn>
              <Btn onClick={actions.closeRender}>Close</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
