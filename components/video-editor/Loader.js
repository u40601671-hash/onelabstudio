"use client";
// Loads the editor only in the browser and only on its own page, so no other page pays for it.
import dynamic from "next/dynamic";

const AutoVideoEditor = dynamic(() => import("./AutoVideoEditor"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-600" role="status">
      Loading the video editor…
    </div>
  ),
});

export default AutoVideoEditor;
