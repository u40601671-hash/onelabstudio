"use client";

import { useMemo, useState } from "react";
import ToolCard from "@/components/ToolCard";

export default function ToolsBrowser({ tools, initialCategory, initialQuery }) {
  const [q, setQ] = useState(initialQuery || "");
  const [cat, setCat] = useState(initialCategory || "All");

  const categories = useMemo(() => {
    const set = new Set(tools.map((t) => t.category));
    return ["All", ...Array.from(set)];
  }, [tools]);

  const shown = useMemo(() => {
    return tools.filter((t) => {
      const matchCat = cat === "All" || t.category === cat;
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.desc.toLowerCase().includes(q.toLowerCase()) ||
        t.category.toLowerCase().includes(q.toLowerCase());
      return matchCat && matchQ;
    });
  }, [tools, cat, q]);

  return (
    <div className="wrap py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="eyebrow">STUDIO LIBRARY</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Production Tools &amp; Utilities
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl">
            A comprehensive suite of browser-based utilities for video, graphics, audio, and language workflows.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-blue-600 font-bold">{shown.length}</span> tools
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search any tool, utility, or feature..."
          aria-label="Search tools"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition shadow-xs"
        />

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                cat === c
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>

      {shown.length === 0 && (
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-base font-bold text-slate-900">No tools found matching &ldquo;{q}&rdquo;</p>
          <p className="mt-2 text-sm text-slate-600">Try searching with a broader keyword or select All categories.</p>
          <button
            onClick={() => {
              setQ("");
              setCat("All");
            }}
            className="btn-primary mt-6 !px-6 !py-2 text-xs"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
