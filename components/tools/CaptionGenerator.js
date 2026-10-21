"use client";
import { useState } from "react";

// Template-based (not AI): fast, free and predictable. Edit the results to make them yours.
// Tokens: {t} = your topic, [emoji] = emoji (removed when emojis are switched off).
const templates = {
  Friendly: [
    "Let's talk about {t}. [💬] What's your biggest takeaway so far?",
    "Here's something I wish I knew sooner about {t}. [✨]",
    "Quick reminder: {t} gets easier every single day. Keep going. [💪]",
    "Small steps, big results. Today it's all about {t}. [🌱]",
    "If {t} has been on your mind, this one is for you. [💙]",
    "Sharing my honest thoughts on {t}, no filters. [🙌]",
    "Tell me in the comments: what's your favorite thing about {t}? [👇]",
  ],
  Professional: [
    "Three lessons I've learned about {t} and how they changed my approach.",
    "{t}: what works, what doesn't, and what to try next.",
    "A practical look at {t} for anyone building something meaningful. [📈]",
    "Why {t} deserves more attention than it gets.",
    "Key insights on {t} that can save you time and effort.",
    "Consistency beats intensity. That's the lesson {t} keeps teaching me.",
    "Let's break down {t} into clear, simple steps. [✅]",
  ],
  Funny: [
    "Me explaining {t} to everyone who didn't ask. [😅]",
    "{t}: because who needs sleep anyway? [😂]",
    "Plot twist: {t} was easier than my group chat drama. [🤣]",
    "Nobody: absolutely nobody. Me: let's talk about {t}. [🙃]",
    "My relationship with {t} is complicated, but we're working on it. [😬]",
    "Tried {t} so you don't have to. You're welcome. [😎]",
    "{t} is my love language and my biggest distraction. [🤷]",
  ],
  Inspiring: [
    "Start where you are. Use what you have. Do what you can. That's {t}. [🌟]",
    "Every expert was once a beginner at {t}. Take the first step. [🚀]",
    "Your story with {t} is just beginning. Make it a great one. [🔥]",
    "Dream big, start small, and never stop learning about {t}. [🌈]",
    "Progress, not perfection. That's the heart of {t}. [💫]",
    "The best time to start {t} was yesterday. The next best time is now. [⏳]",
    "Believe in the work you're doing on {t}. It matters. [❤️]",
  ],
};

const platforms = {
  Instagram: { cta: "Save this post for later! [📌]", tags: ["#instagood", "#creator", "#contentcreator"], limit: 2200 },
  TikTok: { cta: "Follow for more! [🎵]", tags: ["#fyp", "#tiktokcreator", "#learnontiktok"], limit: 2200 },
  LinkedIn: { cta: "What do you think? Share your thoughts in the comments.", tags: ["#careergrowth", "#learning", "#leadership"], limit: 3000 },
  YouTube: { cta: "Watch the full video on the channel! [▶️]", tags: ["#youtube", "#youtuber", "#contentcreation"], limit: 5000 },
  X: { cta: "", tags: ["#growth"], limit: 280 },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashtagsFor(topic, platform, count) {
  const words = topic.toLowerCase().match(/[a-z0-9]+/g) || [];
  const set = new Set();
  if (words.length > 1) set.add(`#${words.join("")}`);
  words.forEach((w) => w.length > 2 && set.add(`#${w}`));
  platforms[platform].tags.forEach((t) => set.add(t));
  return [...set].slice(0, count).join(" ");
}

function fill(template, topic, emojis) {
  return template
    .replace(/\{t\}/g, topic)
    .replace(/\s?\[([^\]]+)\]/g, (m, e) => (emojis ? ` ${e}` : ""))
    .trim();
}

const field = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";
const label = "block text-sm font-bold text-ink";

export default function CaptionGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Friendly");
  const [emojis, setEmojis] = useState(true);
  const [hashtags, setHashtags] = useState(true);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(-1);

  function generate(e) {
    e?.preventDefault();
    const t = topic.trim();
    if (!t) return setError("Type a topic first, for example “morning routine” or “learning guitar”.");
    setError("");
    const p = platforms[platform];
    const picks = shuffle(templates[tone]).slice(0, 5);
    setResults(
      picks.map((tpl) => {
        let text = fill(tpl, t, emojis);
        const cta = fill(p.cta, t, emojis);
        if (cta && platform !== "X") text += `\n\n${cta}`;
        if (hashtags) text += `\n\n${hashtagsFor(t, platform, platform === "X" ? 2 : 6)}`;
        return text;
      })
    );
  }

  async function copy(text, i) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(i);
    setTimeout(() => setCopied(-1), 1800);
  }

  const limit = platforms[platform].limit;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={generate} className="card h-fit space-y-5 !p-6" noValidate>
        <label className={label}>
          What is your post about?
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. morning routine" className={field} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className={label}>
            Platform
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={field}>
              {Object.keys(platforms).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Tone
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={field}>
              {Object.keys(templates).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-5 text-sm font-bold text-ink">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={emojis} onChange={(e) => setEmojis(e.target.checked)} className="h-4 w-4" /> Emojis
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hashtags} onChange={(e) => setHashtags(e.target.checked)} className="h-4 w-4" /> Hashtags
          </label>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <button type="submit" className="btn-primary w-full">{results.length ? "Generate new captions" : "Generate captions"}</button>
        <p className="text-xs font-medium leading-relaxed text-slate-600">
          These captions are built from smart templates, not AI. Add your own details to make each one sound like you.
        </p>
      </form>

      <div className="space-y-4">
        {results.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-600">
            <p className="font-display text-xl font-bold text-ink">Your captions will appear here</p>
            <p className="mt-1">Enter a topic and press “Generate captions”.</p>
          </div>
        )}
        {results.map((text, i) => {
          const over = text.length > limit;
          return (
            <div key={i} className="card !p-5">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-ink">{text}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className={`text-xs font-bold ${over ? "text-red-700" : "text-slate-600"}`}>
                  {text.length} / {limit} characters{over ? " (too long for " + platform + ")" : ""}
                </span>
                <button onClick={() => copy(text, i)} className="btn-outline !px-4 !py-1.5 text-sm">{copied === i ? "Copied!" : "Copy"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
