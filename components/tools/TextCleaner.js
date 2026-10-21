"use client";
import { useMemo, useState } from "react";

const options = [
  { key: "trim", label: "Trim spaces at the start and end of each line" },
  { key: "spaces", label: "Turn repeated spaces into one space" },
  { key: "empty", label: "Remove empty lines" },
  { key: "dupes", label: "Remove duplicate lines" },
  { key: "join", label: "Join everything into one paragraph" },
];

function clean(text, o) {
  let lines = text.replace(/\r\n/g, "\n").split("\n");
  if (o.trim) lines = lines.map((l) => l.trim());
  if (o.spaces) lines = lines.map((l) => l.replace(/[ \t]{2,}/g, " "));
  if (o.empty) lines = lines.filter((l) => l.trim() !== "");
  if (o.dupes) {
    const seen = new Set();
    lines = lines.filter((l) => {
      const k = l.trim().toLowerCase();
      if (k === "") return true;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  let out = o.join ? lines.join(" ").replace(/ {2,}/g, " ").trim() : lines.join("\n");
  if (o.caseMode === "lower") out = out.toLowerCase();
  else if (o.caseMode === "upper") out = out.toUpperCase();
  else if (o.caseMode === "title") out = out.toLowerCase().replace(/(^|\s)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  else if (o.caseMode === "sentence") out = out.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  return out;
}

function stats(t) {
  return { chars: t.length, words: (t.match(/\S+/g) || []).length, lines: t ? t.split("\n").length : 0 };
}

export default function TextCleaner() {
  const [input, setInput] = useState("");
  const [opts, setOpts] = useState({ trim: true, spaces: true, empty: false, dupes: false, join: false, caseMode: "none" });
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => clean(input, opts), [input, opts]);
  const before = stats(input);
  const after = stats(output);

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const area = "mt-1.5 h-72 w-full rounded-xl border border-slate-300 bg-white p-4 text-base text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block text-sm font-bold text-ink">
          Your text
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste or type your messy text here..." className={area} />
          <span className="mt-1.5 block text-xs font-medium text-slate-600">{before.chars} characters · {before.words} words · {before.lines} lines</span>
        </label>
        <label className="block text-sm font-bold text-ink">
          Cleaned text
          <textarea value={output} readOnly placeholder="Your cleaned text appears here." className={`${area} bg-slate-50`} />
          <span className="mt-1.5 block text-xs font-medium text-slate-600">{after.chars} characters · {after.words} words · {after.lines} lines</span>
        </label>
      </div>

      <div className="mt-6 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-bold text-ink">Clean-up options</p>
          {options.map((o) => (
            <label key={o.key} className="flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input type="checkbox" checked={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.checked })} className="mt-0.5 h-4 w-4" />
              {o.label}
            </label>
          ))}
        </div>
        <div>
          <label className="block text-sm font-bold text-ink">
            Change letter case
            <select value={opts.caseMode} onChange={(e) => setOpts({ ...opts, caseMode: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100">
              <option value="none">Leave as it is</option>
              <option value="lower">all lowercase</option>
              <option value="upper">ALL UPPERCASE</option>
              <option value="title">Title Case</option>
              <option value="sentence">Sentence case</option>
            </select>
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={copy} disabled={!output} className="btn-primary !py-2.5 text-sm disabled:opacity-50">{copied ? "Copied!" : "Copy cleaned text"}</button>
            <button onClick={() => setInput("")} disabled={!input} className="btn-outline !py-2.5 text-sm disabled:opacity-50">Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}
