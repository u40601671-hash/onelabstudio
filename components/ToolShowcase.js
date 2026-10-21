"use client";
import Link from "next/link";
import { useState } from "react";
import ToolCard from "@/components/ToolCard";
import { tools, categories } from "@/lib/tools";

// Tool browser for the home page: category tabs + "free only" switch.
export default function ToolShowcase() {
  const [cat, setCat] = useState("All");
  const [freeOnly, setFreeOnly] = useState(false);

  const list = tools.filter((t) => (cat === "All" || t.category === cat) && (!freeOnly || t.access === "free"));
  const shown = list.slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors ${
              cat === c
                ? "border-brand-600/60 bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] text-white shadow-md shadow-brand-600/20"
                : "border-slate-300 bg-white text-slate-800 hover:border-brand-600 hover:text-brand-700"
            }`}
          >
            {c}
          </button>
        ))}
        <button
          onClick={() => setFreeOnly((v) => !v)}
          aria-pressed={freeOnly}
          className="flex items-center gap-2.5 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800"
        >
          <span className={`relative h-5 w-9 rounded-full ${freeOnly ? "bg-brand-500" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${freeOnly ? "left-[18px]" : "left-0.5"}`} />
          </span>
          Free only
        </button>
      </div>

      <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
        {shown.length === 0 && <p className="col-span-full text-center text-slate-600">No tools match. Try another filter.</p>}
      </div>

      <div className="mt-12 text-center">
        <Link href={cat === "All" ? "/tools" : `/tools?cat=${encodeURIComponent(cat)}`} className="btn-outline">
          {list.length > 6 ? `See all ${list.length} tools` : "Open the full toolbox"}
        </Link>
      </div>
    </div>
  );
}
