import Link from "next/link";
import Icon from "@/components/Icon";
import ToolCard from "@/components/ToolCard";
import HeroToolShowcase from "@/components/HeroToolShowcase";
import { getTools } from "@/lib/getTools";

export const revalidate = 30;

export default async function Page() {
  const tools = await getTools();
  return (
    <div className="relative overflow-hidden bg-white text-slate-700 cyber-grid">
      {/* 0. TOP ANNOUNCEMENT TICKER */}
      <div className="relative z-30 border-b border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-cyan-50/70 to-indigo-50/90 px-4 py-2 text-center text-xs font-semibold text-blue-900 backdrop-blur-md">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
          <span className="font-bold tracking-wide text-blue-700">ONE LAB STUDIO 2.0</span>
          <span className="hidden sm:inline text-blue-300">•</span>
          <span className="hidden sm:inline text-slate-600">Client-Side WebAssembly Processing</span>
          <span className="text-blue-300">•</span>
          <span className="text-blue-700 font-bold">100% In-Browser Privacy</span>
        </span>
      </div>

      {/* AMBIENT LIGHTING OVERLAYS (SOFT PASTEL CYAN & COBALT) */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[750px] w-[1100px] -translate-x-1/2 opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(219,234,254,0.7) 0%, rgba(224,242,254,0.35) 50%, transparent 70%)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="pointer-events-none absolute top-[900px] right-[-150px] h-[650px] w-[650px] opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(224,242,254,0.6) 0%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />
      <div
        className="pointer-events-none absolute top-[2100px] left-[-150px] h-[600px] w-[600px] opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(219,234,254,0.5) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* ==================================================================== */}
      {/* 1. HERO SECTION: CENTERED HEADLINE + EXPANSIVE TOOL SHOWCASE DECK    */}
      {/* ==================================================================== */}
      <section className="wrap pt-12 pb-16 lg:pt-16 lg:pb-24">
        {/* Centered Top Copy (Bold, Bright & Expansive) */}
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50/90 px-4 py-1.5 text-xs font-bold text-blue-800 shadow-xs backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
            <span className="tracking-wide">Unified Creative Suite • Instant &amp; In-Browser</span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl lg:text-[66px] leading-[1.12]">
            The All-In-One Creative Studio To Design, Produce &amp; Scale.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 font-black drop-shadow-[0_2px_12px_rgba(37,99,235,0.25)]">
              Where Any Vision Becomes Reality.
            </span>
          </h1>

          <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg lg:text-xl leading-relaxed text-slate-700 font-medium">
            A high-performance studio platform engineered to elevate your creative workflow effortlessly. Completely private, lightning-fast, and accessible directly in your browser.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href="#tools-section"
              className="btn-primary !px-7 !py-3.5 text-base shadow-lg shadow-blue-600/25 flex items-center gap-2 group"
            >
              <span>Explore All 9 Tools</span>
              <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.4} />
            </a>
            <Link
              href="/tools/music-sfx-vault"
              className="btn-outline !px-6 !py-3.5 text-base shadow-xs hover:border-blue-400 flex items-center gap-2"
            >
              <span>🎵 Music &amp; SFX Vault</span>
            </Link>
            <Link
              href="/tools/auto-video-editor"
              className="btn-outline !px-6 !py-3.5 text-base shadow-xs hover:border-blue-400 flex items-center gap-2"
            >
              <span>🎬 Auto Video Editor</span>
            </Link>
          </div>

          {/* Real Guarantees (Clean, Honest, No Fake Reviews) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓</span>
              Instant In-Browser Execution
            </span>
            <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">🔒</span>
              Complete Privacy Protection
            </span>
            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">⚡</span>
              Zero Setup &amp; Free Access
            </span>
          </div>
        </div>

        {/* Expansive High-Level Interactive Tool Showcase Deck */}
        <HeroToolShowcase />
      </section>

      {/* ==================================================================== */}
      {/* 2. FOUR-POINT TRUST & PERFORMANCE METRIC BAR                         */}
      {/* ==================================================================== */}
      <section className="wrap pb-16">
        <div className="grid grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm lg:grid-cols-4">
          <div className="p-4 text-center">
            <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">9</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">Active Studio Tools</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">1,290+</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">Curated Audio Tracks</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">1.2k+</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">Active Creators</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-3xl font-extrabold text-emerald-600 sm:text-4xl">100%</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">In-Browser Sandbox</div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. STUDIO PRODUCTION TOOLS (ALL 9 WORKING ENGINES)                   */}
      {/* ==================================================================== */}
      <section className="wrap py-16" id="tools-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-8 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-700 shadow-xs mb-3">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              100% In-Browser &amp; Free
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Creative Production Tools &amp; Utilities
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-2xl">
              A comprehensive suite of browser-based utilities for video, graphics, audio, and language workflows. Zero server uploads, instant execution.
            </p>
          </div>
          <Link
            href="/tools"
            className="btn-outline !py-2.5 !px-5 text-xs font-bold shrink-0 flex items-center gap-2"
          >
            <span>View Full Directory ({tools.length})</span>
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 9 Tools Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. THREE CORE PILLARS (ARCHITECTURE & ADVANTAGE)                     */}
      {/* ==================================================================== */}
      <section className="wrap py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 text-2xl">
              ⚡
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">Client-Side Speed</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Powered by modern WebAssembly and in-browser processing. Export media, convert formats, and render graphics with zero server wait times.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 text-2xl">
              🛡️
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">Privacy-First Workflow</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Your source assets, footage, and audio files stay on your machine. All core processing happens inside your browser sandbox without tracking.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 text-2xl">
              ✨
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">Zero Setup Friction</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              No bloated desktop software, license dongles, or GPU configurations. Open the URL on any device and start producing immediately.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. PRODUCTION PIPELINE (HOW WORK GETS DONE)                          */}
      {/* ==================================================================== */}
      <section className="wrap py-16">
        <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-r from-blue-50/40 via-slate-50 to-cyan-50/40 p-8 sm:p-12 shadow-xs">
          <div className="text-center">
            <span className="eyebrow">PRODUCTION PIPELINE</span>
            <h2 className="section-title text-slate-900">Designed For Seamless Execution</h2>
            <p className="section-sub text-slate-600">
              Move effortlessly from raw ideas to finished assets in three streamlined phases.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md transition">
              <span className="text-3xl font-extrabold text-blue-600">01</span>
              <h4 className="mt-3 text-lg font-bold text-slate-900">Concept &amp; Structure</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Organize assets, outline scripts, and prepare source media with fast brainstorming and structuring helpers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md transition">
              <span className="text-3xl font-extrabold text-indigo-600">02</span>
              <h4 className="mt-3 text-lg font-bold text-slate-900">Process &amp; Assemble</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Trim video, synchronize animated captions, overlay custom graphics, and integrate background music.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md transition">
              <span className="text-3xl font-extrabold text-emerald-600">03</span>
              <h4 className="mt-3 text-lg font-bold text-slate-900">Export &amp; Publish</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Export in high resolution with optimal compression, ready for distribution across platforms with complete confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. CURATED VIDEO WORKSHOPS & MASTERCLASSES                           */}
      {/* ==================================================================== */}
      <section className="wrap py-16">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/60 p-8 sm:p-14 shadow-xs">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <span className="eyebrow">VIDEO WORKSHOPS</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Watch Practical Creator Video Tutorials
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Level up your editing speed, thumbnail psychology, audio mixing, and automated video workflows with step-by-step masterclasses and practical breakdowns.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/videos" className="btn-primary !px-7 !py-3 text-sm flex items-center gap-2">
                  <span>Watch Video Masterclasses</span>
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
                <Link href="/about" className="btn-outline !px-6 !py-3 text-sm">
                  Read Studio FAQs
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-lg">🎬</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Editing Pacing &amp; Retention</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Keep viewers hooked past the 3-second drop-off curve</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 text-lg">🖼️</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">High-CTR Thumbnail Design</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Visual hierarchy, color contrast, and subject framing</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-lg">🎵</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Audio Ducking &amp; Sound FX</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Balance background music seamlessly with voiceover clarity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. BOTTOM CALL TO ACTION                                             */}
      {/* ==================================================================== */}
      <section className="wrap py-16">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50/50 to-blue-50 p-10 sm:p-16 text-center shadow-xs">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Ready to Upgrade Your Creative Workflow?
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Access professional browser-based production tools, audio libraries, and collaborative community in seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/tools" className="btn-primary !px-8 !py-3.5 text-base shadow-md shadow-blue-500/20">
                Get Started Free →
              </Link>
              <Link href="/signup" className="btn-outline !px-7 !py-3.5 text-base">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
