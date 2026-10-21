"use client";

import { useState, useMemo } from "react";

const SAMPLE_TEXT = `One Lab Studio provides a comprehensive browser-based workspace for media production, visual design, audio libraries, and intelligent utilities. Digital creators can draft scripts, format video pacing, count words, and analyze text density with zero lag. All processing happens directly inside your web browser using modern client-side WebAssembly.`;

const PLATFORM_LIMITS = [
  { name: "X (Twitter)", limit: 280, type: "chars" },
  { name: "SEO Title", limit: 60, type: "chars" },
  { name: "SEO Meta Desc", limit: 160, type: "chars" },
  { name: "Instagram Caption", limit: 2200, type: "chars" },
];

export default function WordCounter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  // Statistics Calculations
  const stats = useMemo(() => {
    const raw = text;
    const trimmed = raw.trim();

    // Words
    const wordMatches = trimmed.length > 0 ? trimmed.match(/\S+/g) : null;
    const words = wordMatches ? wordMatches.length : 0;

    // Characters
    const charsWithSpaces = raw.length;
    const charsWithoutSpaces = raw.replace(/\s/g, "").length;

    // Sentences
    const sentenceMatches = trimmed.length > 0 ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0) : [];
    const sentences = sentenceMatches.length;

    // Paragraphs
    const paragraphMatches = raw.split(/\n+/).filter((p) => p.trim().length > 0);
    const paragraphs = paragraphMatches.length;

    // Reading & Speaking times
    const readMinutes = words / 200;
    const readSec = Math.round(readMinutes * 60);
    const readingTime = readSec < 60 ? `${readSec}s` : `${Math.floor(readSec / 60)}m ${readSec % 60}s`;

    const speakMinutes = words / 130;
    const speakSec = Math.round(speakMinutes * 60);
    const speakingTime = speakSec < 60 ? `${speakSec}s` : `${Math.floor(speakSec / 60)}m ${speakSec % 60}s`;

    // Average word length
    const avgWordLength = words > 0 ? (charsWithoutSpaces / words).toFixed(1) : "0.0";

    // Top keyword frequencies
    const stopWords = new Set([
      "a", "about", "above", "after", "again", "all", "am", "an", "and", "any", "are", "as", "at",
      "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
      "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further",
      "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself",
      "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
      "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or",
      "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so",
      "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
      "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up",
      "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
      "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
    ]);

    const freqMap = {};
    if (wordMatches) {
      wordMatches.forEach((w) => {
        const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (clean.length > 2 && !stopWords.has(clean)) {
          freqMap[clean] = (freqMap[clean] || 0) + 1;
        }
      });
    }

    const sortedKeywords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word, count]) => ({
        word,
        count,
        percent: words > 0 ? Math.round((count / words) * 100) : 0,
      }));

    return {
      words,
      charsWithSpaces,
      charsWithoutSpaces,
      sentences,
      paragraphs,
      readingTime,
      speakingTime,
      avgWordLength,
      sortedKeywords,
    };
  }, [text]);

  // Actions
  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleClear = () => {
    setText("");
  };

  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
  };

  // Case Transform Functions
  const transformCase = (mode) => {
    if (!text) return;
    if (mode === "upper") {
      setText(text.toUpperCase());
    } else if (mode === "lower") {
      setText(text.toLowerCase());
    } else if (mode === "title") {
      setText(
        text.toLowerCase().replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase())
      );
    } else if (mode === "sentence") {
      setText(
        text
          .toLowerCase()
          .replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())
      );
    } else if (mode === "clean-spaces") {
      setText(text.replace(/[ \t]{2,}/g, " ").trim());
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-blue-500/5 overflow-hidden transition hover:border-blue-300">
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-slate-50/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 font-display text-lg font-bold text-white shadow-md shadow-blue-500/20">
            📊
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              Live Word Counter &amp; Text Analyzer
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200">
                100% In-Browser
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Instant real-time counts, reading speed, and platform limits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-600 shadow-xs transition"
          >
            Sample Text
          </button>
          <button
            onClick={handleClear}
            disabled={!text}
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-rose-500 hover:text-rose-600 disabled:opacity-40 shadow-xs transition"
          >
            Clear
          </button>
          <button
            onClick={handleCopy}
            disabled={!text}
            type="button"
            className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] disabled:opacity-40 transition"
          >
            {copied ? "✓ Copied!" : "Copy Text"}
          </button>
        </div>
      </div>

      {/* 2. LIVE METRICS GRID */}
      <div className="grid grid-cols-2 divide-y divide-slate-100 sm:divide-y-0 sm:divide-x sm:divide-slate-100 sm:grid-cols-4 lg:grid-cols-6 border-b border-slate-200/80 bg-gradient-to-b from-blue-50/30 to-transparent">
        <div className="p-4 text-center">
          <div className="text-3xl font-extrabold text-blue-600">{stats.words}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Words</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl font-extrabold text-slate-900">{stats.charsWithSpaces}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Characters</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl font-extrabold text-slate-700">{stats.charsWithoutSpaces}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">No Spaces</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl font-extrabold text-indigo-600">{stats.sentences}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Sentences</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl font-extrabold text-cyan-700">{stats.readingTime}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Reading Time</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl font-extrabold text-emerald-600">{stats.speakingTime}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Speaking Time</div>
        </div>
      </div>

      {/* 3. MAIN TEXTAREA WORKSPACE */}
      <div className="p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type, paste, or drag your text here to count words, characters, sentences, and analyze reading time in real time..."
          rows={9}
          className="w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition shadow-inner font-sans"
        />

        {/* 4. CASE TRANSFORMATION & FORMATTING BAR */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider mr-1 text-[11px]">
              Format Case:
            </span>
            <button
              onClick={() => transformCase("sentence")}
              disabled={!text}
              type="button"
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 transition"
            >
              Sentence case
            </button>
            <button
              onClick={() => transformCase("lower")}
              disabled={!text}
              type="button"
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 transition"
            >
              lower case
            </button>
            <button
              onClick={() => transformCase("upper")}
              disabled={!text}
              type="button"
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 transition"
            >
              UPPER CASE
            </button>
            <button
              onClick={() => transformCase("title")}
              disabled={!text}
              type="button"
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 transition"
            >
              Title Case
            </button>
            <button
              onClick={() => transformCase("clean-spaces")}
              disabled={!text}
              type="button"
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 transition"
            >
              Tidy Spaces
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            <span>Avg. Word Length: <strong className="text-slate-900">{stats.avgWordLength}</strong> chars</span>
            <span className="mx-2 text-slate-300">•</span>
            <span>Paragraphs: <strong className="text-slate-900">{stats.paragraphs}</strong></span>
          </div>
        </div>

        {/* 5. PLATFORM LIMITS & KEYWORDS PREVIEW */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 pt-6 border-t border-slate-200/80">
          {/* Social & SEO Limits */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Social &amp; SEO Character Limits
            </h4>
            <div className="mt-3 space-y-2.5">
              {PLATFORM_LIMITS.map((p) => {
                const count = stats.charsWithSpaces;
                const percent = Math.min(100, Math.round((count / p.limit) * 100));
                const isOver = count > p.limit;

                return (
                  <div key={p.name} className="text-xs">
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>{p.name}</span>
                      <span className={isOver ? "font-bold text-rose-600" : "text-slate-500"}>
                        {count} / {p.limit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOver ? "bg-rose-500" : percent > 85 ? "bg-amber-500" : "bg-gradient-to-r from-blue-600 to-cyan-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Keyword Density */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Top Keywords &amp; Density
            </h4>
            {stats.sortedKeywords.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400 italic">
                Type or paste text above to see high-frequency words and density statistics.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {stats.sortedKeywords.map((k) => (
                  <div key={k.word} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 capitalize">
                      {k.word}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {k.count}× ({k.percent}%)
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                          style={{ width: `${Math.min(100, k.percent * 3)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
