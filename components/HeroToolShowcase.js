"use client";

import { useState, useEffect } from "react";

const slides = [
  {
    id: "video-editor",
    title: "Multi-Track Timeline & 4K Video Studio",
    tag: "Timeline Active • 4K 60FPS Sandbox",
    image: "/hero-studio-mockup.png",
  },
  {
    id: "audio-deck",
    title: "Music & SFX Vault • 1,290+ Royalty-Free Tracks & Bot API",
    tag: "1,290+ Audio Library • Live API",
    image: "/hero-music-tool.png",
  },
  {
    id: "ai-image",
    title: "Generative AI Cyberpunk Visual Canvas",
    tag: "Ultra-HD Render • Dynamic Canvas",
    image: "/hero-image-tool.png",
  },
  {
    id: "motion-studio",
    title: "Kinetic 3D Motion & Vector Typography",
    tag: "Real-Time Bezier • 3D Workspace",
    image: "/hero-motion-tool.png",
  },
  {
    id: "voice-synth",
    title: "AI Voice-Over & Neural Speech Synthesizer",
    tag: "Kokoro & Edge-TTS • Multi-Speaker",
    image: "/tool-voice-studio.png",
  },
  {
    id: "thumbnail-maker",
    title: "YouTube Thumbnail Maker & Graphic Canvas",
    tag: "High-CTR Presets • Layer Inspector",
    image: "/tool-thumbnail-studio.png",
  },
  {
    id: "auto-captions",
    title: "Auto-Captions & Subtitle Sync Studio",
    tag: "Word-by-Word Sync • Kinetic Typography",
    image: "/tool-caption-studio.png",
  },
  {
    id: "color-grading",
    title: "Cinema LUTs & 3-Way Color Wheels Studio",
    tag: "RGB Parade • Lift / Gamma / Gain",
    image: "/tool-color-studio.png",
  },
  {
    id: "qr-studio",
    title: "Universal QR Code Studio & Vector Engine",
    tag: "Lossless SVG • Instant Camera Readable",
    image: "/tool-qr-studio.png",
  },
  {
    id: "word-analytics",
    title: "Live Word Counter & Text Analytics Engine",
    tag: "Reading Speed • Real-Time Density",
    image: "/tool-word-studio.png",
  },
];

export default function HeroToolShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance through all genuine software tool interfaces
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const current = slides[currentIndex];

  return (
    <div className="relative mt-8 w-full max-w-5xl mx-auto">
      {/* Ambient Lighting Backdrop */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl opacity-30 blur-3xl -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(147,197,253,0.35) 45%, transparent 75%)",
        }}
      />

      {/* Pure, Clean Cinematic Window (Zero Cluttered Side Options) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-2 sm:p-3 shadow-2xl shadow-blue-900/10 ring-1 ring-slate-900/5">
        {/* Sleek macOS Chrome Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
            <span className="ml-2.5 font-mono text-xs font-semibold text-slate-700">
              OneLab Studio • Tool Suite {currentIndex + 1} of {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE ROTATION
            </span>
          </div>
        </div>

        {/* Cinematic Auto-Advancing Tool Interface Canvas */}
        <div className="relative mt-2 overflow-hidden rounded-xl sm:rounded-2xl border border-slate-900/10 bg-slate-950 aspect-[16/9] sm:aspect-[21/11]">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentIndex ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 pointer-events-none scale-[1.01]"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover transition-transform duration-1000 ease-out"
              />
            </div>
          ))}

          {/* Vignette & Glossy Highlight */}
          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-white/5" />

          {/* Minimal Floating HUD Status Pill inside Image */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-30 flex items-center justify-between rounded-xl bg-black/70 px-3.5 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md text-xs text-white border border-white/10 shadow-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="font-semibold text-white truncate text-[11px] sm:text-xs">
                {current.title}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-300 shrink-0">
              <span className="rounded bg-blue-600/90 px-2 py-0.5 font-bold text-white shadow-xs">
                {current.tag}
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Progress Line Indicator */}
        <div className="mt-2.5 flex items-center justify-center gap-1 px-4">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-6 bg-blue-600"
                  : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
