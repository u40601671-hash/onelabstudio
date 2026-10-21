import Link from "next/link";
import Icon from "@/components/Icon";
import { site } from "@/lib/site";

export const metadata = {
  title: "About & FAQs - One Lab Studio",
  description:
    "Learn about One Lab Studio, our mission, privacy-first browser architecture, and complete creator Q&A.",
  alternates: { canonical: "/about" },
};

const qnaCategories = [
  {
    category: "General & Platform Architecture",
    items: [
      {
        q: "What is One Lab Studio?",
        a: "One Lab Studio is a modern browser-based production suite combining media editing, visual design, audio assets, and intelligent utilities into one unified workspace for digital creators, developers, designers, and marketers.",
      },
      {
        q: "Do I need to install heavy software or configure hardware?",
        a: "No installation is required. Everything operates directly inside your web browser using modern client-side WebAssembly, fast media pipelines, and cloud acceleration. No GPU drivers or license keys needed.",
      },
      {
        q: "Is One Lab Studio suitable for beginners and professionals?",
        a: "Yes. The streamlined interface allows beginners to produce finished media assets in minutes, while delivering granular controls, multi-track timelines, and export configurations that professional creators rely on.",
      },
      {
        q: "Which browsers and operating systems are supported?",
        a: "One Lab Studio runs smoothly on modern versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari across Windows, macOS, Linux, and modern tablets.",
      },
    ],
  },
  {
    category: "Tools, Processing & Privacy",
    items: [
      {
        q: "Where does my media processing happen?",
        a: "Core editing, format conversion, and timeline assembly take place locally in your device's browser memory using WebAssembly. Your source footage and voice recordings stay on your machine.",
      },
      {
        q: "What file formats and resolutions can I export?",
        a: "We support standard digital production formats: MP4 and WebM for video (up to 1080p and 4K), MP3 and WAV for audio, and PNG, WebP, and JPG for visual graphics. All without watermarks.",
      },
      {
        q: "How does One Lab Studio protect user privacy?",
        a: "Because processing runs in client-side sandboxes, your private raw video and audio are not uploaded to remote analytics servers. We do not sell or monetize personal creator assets.",
      },
    ],
  },
  {
    category: "Commercial Rights & Audio Vault",
    items: [
      {
        q: "Are the tools and audio library free for commercial projects?",
        a: "Yes. Core tools and all 1,290+ curated tracks in the audio vault are free for both personal and commercial creative work with zero copyright restrictions or claims.",
      },
      {
        q: "Will I receive copyright claims or strikes on YouTube or TikTok?",
        a: "No. All tracks and media assets provided by One Lab Studio are copyright-cleared for digital monetization across YouTube, TikTok, Instagram Reels, Twitch, podcasts, and commercial campaigns.",
      },
    ],
  },
  {
    category: "Community, Plans & Support",
    items: [
      {
        q: "How does the Community Forum work?",
        a: "The community is an open, unconstrained knowledge base where members share workflows, project critiques, tool recommendations, and technical answers without rigid category boundaries.",
      },
      {
        q: "What does the Pro plan include, and is there a free tier?",
        a: "Core studio tools remain free forever. The upcoming Pro tier unlocks high-capacity cloud compute, priority batch rendering, advanced AI pipelines, and an ad-free studio experience.",
      },
      {
        q: "How can I suggest a new tool or get technical help?",
        a: "You can post a question directly in our Community forum or contact our team via the Contact page. We actively review creator feedback to build requested tools.",
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white text-slate-700 cyber-grid">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-blue-50/50 via-slate-50/30 to-white py-16 sm:py-24">
        <div className="wrap relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-xs backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
            <span>About One Lab Studio</span>
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.1]">
            Empowering Digital Creators
            <br />
            <span className="gold-text">&amp; Modern Builders.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            One Lab Studio is a unified creative production suite combining client-side media utilities, graphic design tools, audio libraries, and a collaborative community into one seamless browser workspace.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-xs">
              <div className="text-2xl font-extrabold text-slate-900 sm:text-3xl">14+</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">Creative Tools</div>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-xs">
              <div className="text-2xl font-extrabold text-slate-900 sm:text-3xl">1,290+</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">Audio Tracks</div>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-xs">
              <div className="text-2xl font-extrabold text-slate-900 sm:text-3xl">1.2k+</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">Active Creators</div>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-xs">
              <div className="text-2xl font-extrabold text-emerald-600 sm:text-3xl">100%</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">In-Browser</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OUR STORY & PHILOSOPHY */}
      <section className="wrap py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="eyebrow">OUR MISSION</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Creative Production Without Heavy Overhead
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              For too long, digital creators and builders have had to juggle bloated desktop software, expensive monthly subscriptions, and confusing license agreements just to produce clean videos, graphics, or audio assets.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              We built {site.name} on a simple premise: powerful media tools should run instantly in any web browser, respect creator privacy, and remain accessible to everyone with a free forever tier.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/tools" className="btn-primary !px-7 !py-3 text-sm">
                Explore Studio Tools →
              </Link>
              <Link href="/community" className="btn-outline !px-6 !py-3 text-sm">
                Join Creator Community
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 shadow-xs hover:border-blue-300 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 ring-1 ring-blue-100">
                  ⚡
                </span>
                <h3 className="text-lg font-bold text-slate-900">Client-Side Speed</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Leveraging WebAssembly to process media right on your computer. Instant trimming, fast exports, and zero server rendering queues.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 shadow-xs hover:border-indigo-300 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600 ring-1 ring-indigo-100">
                  🛡️
                </span>
                <h3 className="text-lg font-bold text-slate-900">Privacy &amp; Ownership</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Your footage, audio recordings, and creative concepts belong exclusively to you. Nothing is logged, monetized, or stored on remote tracking databases.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 shadow-xs hover:border-emerald-300 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600 ring-1 ring-emerald-100">
                  🌐
                </span>
                <h3 className="text-lg font-bold text-slate-900">Commercial Freedom</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                All audio tracks and output files are cleared for personal and commercial distribution across YouTube, TikTok, social ads, and client deliverables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPLETE Q&A (FREQUENTLY ASKED QUESTIONS) */}
      <section className="border-t border-slate-200/80 bg-slate-50/40 py-16 sm:py-20">
        <div className="wrap max-w-4xl">
          <div className="text-center">
            <span className="eyebrow">QUESTIONS &amp; ANSWERS</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need To Know
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              Clear answers regarding our tools, browser technology, audio licensing, and collaborative community.
            </p>
          </div>

          <div className="mt-12 space-y-10">
            {qnaCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-4">
                <h3 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                    0{catIdx + 1}
                  </span>
                  {cat.category}
                </h3>

                <div className="grid gap-3.5">
                  {cat.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition hover:border-blue-300"
                    >
                      <h4 className="text-base font-bold text-slate-900 flex items-start gap-2.5">
                        <span className="text-blue-600 font-extrabold shrink-0">Q:</span>
                        <span>{item.q}</span>
                      </h4>
                      <p className="mt-2 pl-6 text-sm leading-relaxed text-slate-600">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. GET IN TOUCH / COMMUNITY CALLOUT */}
      <section className="wrap py-16">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50/40 to-blue-50 p-10 sm:p-14 text-center shadow-xs">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Still Have Questions or Feedback?
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Our team and creator community are always active. Ask questions in the community forum or contact our support team directly.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Link href="/community" className="btn-primary !px-7 !py-3 text-sm">
                Ask in Community
              </Link>
              <Link href="/contact" className="btn-outline !px-7 !py-3 text-sm">
                Contact Support Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
