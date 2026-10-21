"use client";

import { useState, useEffect, useRef, useMemo } from "react";

export default function MusicVault() {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'music' | 'sfx'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTracks, setTotalTracks] = useState(0);

  // Audio player state
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isLooping, setIsLooping] = useState(false);
  const audioRef = useRef(null);

  // API Key management state
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [keyGenerating, setKeyGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [apiTestResponse, setApiTestResponse] = useState(null);
  const [testingApi, setTestingApi] = useState(false);
  const [selectedLang, setSelectedLang] = useState("curl"); // 'curl' | 'python' | 'node'

  // Fetch catalog tracks
  useEffect(() => {
    let isCancelled = false;
    async function fetchCatalog() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeTab !== "all") params.set("type", activeTab);
        if (selectedCategory !== "all") params.set("category", selectedCategory);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        params.set("page", String(page));
        params.set("limit", "36");

        const res = await fetch(`/api/v1/music/tracks?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load tracks");
        const data = await res.json();

        if (!isCancelled) {
          setTracks(data.tracks || []);
          if (data.categories && categories.length === 0) {
            setCategories(data.categories);
          }
          if (data.pagination) {
            setTotalPages(data.pagination.total_pages || 1);
            setTotalTracks(data.pagination.total_tracks || 0);
          }
        }
      } catch (err) {
        console.error("Error loading music catalog:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    const timer = setTimeout(fetchCatalog, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, selectedCategory, searchQuery, page]);

  // Load existing API keys
  const loadKeys = async () => {
    try {
      const res = await fetch("/api/v1/music/keys");
      const data = await res.json();
      if (data.status === "success") {
        setApiKeys(data.keys || []);
      }
    } catch (e) {
      console.error("Error fetching keys:", e);
    }
  };

  useEffect(() => {
    if (showApiModal) {
      loadKeys();
    }
  }, [showApiModal]);

  // Handle Play/Pause
  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.src = track.stream_url;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => console.log("Audio play error:", err));
      }
    }
  };

  // Audio events
  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const onSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const onVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Generate new dedicated key
  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setKeyGenerating(true);
    try {
      const res = await fetch("/api/v1/music/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setGeneratedKey(data.key);
        setNewKeyName("");
        loadKeys();
      }
    } catch (err) {
      alert("Failed to create API key");
    } finally {
      setKeyGenerating(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Run live API test from UI
  const handleRunApiTest = async () => {
    setTestingApi(true);
    setApiTestResponse(null);
    try {
      const activeKey =
        generatedKey?.key ||
        apiKeys.find((k) => k.status === "active")?.key ||
        "ols_music_demo_2026_unlimited";
      const res = await fetch("/api/v1/music/tracks?limit=2", {
        headers: { "x-api-key": activeKey },
      });
      const data = await res.json();
      setApiTestResponse(data);
    } catch (err) {
      setApiTestResponse({ error: "Failed to connect to Music API endpoint" });
    } finally {
      setTestingApi(false);
    }
  };

  const activeDemoKey = useMemo(() => {
    return (
      generatedKey?.key ||
      apiKeys.find((k) => k.status === "active")?.key ||
      "ols_music_live_YOUR_KEY_HERE"
    );
  }, [generatedKey, apiKeys]);

  const filteredCategories = useMemo(() => {
    if (activeTab === "all") return categories;
    return categories.filter((c) => c.type === activeTab);
  }, [categories, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 text-slate-800">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
        loop={isLooping}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-white shadow-xs">
        <div className="absolute inset-0 bg-linear-to-r from-blue-50/50 via-cyan-50/20 to-purple-50/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                1,290+ Royalty-Free Tracks & SFX
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                Music & SFX Vault
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Professional soundtrack library categorized for YouTube cash-cow channels, reels,
                documentaries, and game dev. Stream live, download MP3s, or access via dedicated Bot API keys.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowApiModal(true)}
                className="group inline-flex items-center gap-2.5 rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
              >
                <svg className="h-4 w-4 text-blue-200 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Music API Key & Docs</span>
                <span className="rounded bg-blue-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Live
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar & Media Tabs */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Type selector */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => {
                  setActiveTab("all");
                  setSelectedCategory("all");
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Audio ({totalTracks})
              </button>
              <button
                onClick={() => {
                  setActiveTab("music");
                  setSelectedCategory("all");
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "music"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎵 Music Tracks
              </button>
              <button
                onClick={() => {
                  setActiveTab("sfx");
                  setSelectedCategory("all");
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "sfx"
                    ? "bg-white text-cyan-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🔊 Sound Effects
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tracks, tags, mood (e.g. mystery, epic, whoosh)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categories Pill Scroller */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              All Categories
            </button>
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  setPage(1);
                }}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  selectedCategory === c.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                    selectedCategory === c.id ? "bg-blue-700 text-blue-100" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200/60 bg-white p-4 shadow-xs" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
              🎵
            </div>
            <h3 className="text-base font-bold text-slate-900">No tracks found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try searching with different keywords or switch categories.
            </p>
            <button
              onClick={() => {
                setActiveTab("all");
                setSelectedCategory("all");
                setSearchQuery("");
                setPage(1);
              }}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {tracks.length} of {totalTracks} tracks</span>
              <span>Page {page} of {totalPages}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((track) => {
                const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                return (
                  <div
                    key={track.id}
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 transition-all hover:shadow-md ${
                      isThisPlaying
                        ? "border-blue-500 ring-2 ring-blue-100 shadow-blue-50"
                        : "border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      {/* Top meta */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">
                            {track.category_icon || (track.type === "music" ? "🎵" : "🔊")}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[140px]">
                            {track.category_name}
                          </span>
                        </div>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600">
                          {track.duration || "0:00"}
                        </span>
                      </div>

                      {/* Track name */}
                      <h3
                        title={track.name}
                        className="mt-2 text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors"
                      >
                        {track.name}
                      </h3>

                      {/* Tags */}
                      {track.tags && track.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {track.tags.slice(0, 3).map((tg, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 text-[9px] text-slate-500"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom controls */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      {/* Play/Pause Button */}
                      <button
                        onClick={() => handlePlayTrack(track)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          isThisPlaying
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        {isThisPlaying ? (
                          <>
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Play</span>
                          </>
                        )}
                      </button>

                      {/* Download Button */}
                      <a
                        href={track.download_url}
                        download
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                        title="Download MP3"
                      >
                        <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{track.size_mb ? `${track.size_mb} MB` : "MP3"}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="px-3 text-xs font-semibold text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Sticky Music Player Bar (When a track is active) */}
      {currentTrack && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[95%] max-w-4xl -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-sm">
                {currentTrack.category_icon || "🎵"}
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-500" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{currentTrack.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentTrack.category_name} • {currentTrack.type.toUpperCase()}</p>
              </div>
            </div>

            {/* Scrubber & Controls */}
            <div className="flex flex-1 flex-col items-center gap-1 max-w-md">
              <div className="flex w-full items-center gap-3">
                <span className="w-10 text-right text-[10px] font-mono text-slate-500">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={onSeek}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                />
                <span className="w-10 text-[10px] font-mono text-slate-500">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  title="Loop track"
                  className={`rounded p-1 text-xs transition-colors ${
                    isLooping ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  🔁
                </button>

                <button
                  onClick={() => handlePlayTrack(currentTrack)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95"
                >
                  {isPlaying ? (
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <a
                  href={currentTrack.download_url}
                  download
                  title="Download MP3 file"
                  className="rounded p-1 text-slate-400 hover:text-slate-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Volume slider */}
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-xs text-slate-400">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={onVolumeChange}
                className="h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Music API Key & Developer Access Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                  <span>Tool Scoped Key</span>
                  <span>•</span>
                  <span>ols_music_live_...</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Dedicated Music & SFX API
                </h2>
                <p className="text-xs text-slate-500">
                  Generate dedicated API keys specifically for the Music tool. Connect your automated CapCut / Premiere / Python video editing bots.
                </p>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Notice about dedicated tool-scoped API */}
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <span>🛡️ Individual Tool Security</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-700 leading-relaxed">
                This key only grants access to the <strong>Music & SFX Vault</strong>. As per system security design, each OneLab Studio tool has its own separate API key to prevent cross-tool authorization risks.
              </p>
            </div>

            {/* Create New Key Section */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Generate New Music API Key
              </h3>
              <form onSubmit={handleCreateKey} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Bot or Project Name (e.g. YouTube Shorts Bot, Video Editor)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <button
                  type="submit"
                  disabled={keyGenerating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {keyGenerating ? "Creating..." : "+ Generate Key"}
                </button>
              </form>

              {/* Freshly Generated Key Alert */}
              {generatedKey && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">
                      🎉 New API Key Generated for {generatedKey.name}:
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedKey.key, "new")}
                      className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                    >
                      {copiedKey === "new" ? "Copied!" : "Copy Key"}
                    </button>
                  </div>
                  <div className="mt-2 rounded-lg bg-white p-2 font-mono text-xs font-semibold text-blue-800 break-all select-all border border-blue-200/60">
                    {generatedKey.key}
                  </div>
                  <p className="mt-1.5 text-[10px] text-blue-600">
                    Prefix: <code className="font-mono">ols_music_live_...</code> • Daily Limit: 1,000 calls
                  </p>
                </div>
              )}
            </div>

            {/* Existing Keys List */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Your Active Music API Keys ({apiKeys.length})
              </h3>
              <div className="mt-2 space-y-2 max-h-44 overflow-y-auto pr-1">
                {apiKeys.length === 0 ? (
                  <p className="py-2 text-xs text-slate-400 italic">No keys created yet.</p>
                ) : (
                  apiKeys.map((k) => (
                    <div
                      key={k.key}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{k.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[9px] font-bold uppercase ${
                              k.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {k.status}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slate-500 truncate">
                          {k.key}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline text-[10px] text-slate-400">
                          {k.requests_today} / {k.rate_limit} reqs
                        </span>
                        <button
                          onClick={() => copyToClipboard(k.key, k.key)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {copiedKey === k.key ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Developer Code Snippets */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Bot Integration Snippets
                </h3>
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
                  <button
                    onClick={() => setSelectedLang("curl")}
                    className={`rounded-md px-2.5 py-1 ${
                      selectedLang === "curl" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setSelectedLang("python")}
                    className={`rounded-md px-2.5 py-1 ${
                      selectedLang === "python" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setSelectedLang("node")}
                    className={`rounded-md px-2.5 py-1 ${
                      selectedLang === "node" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Node.js
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="relative mt-3 rounded-2xl bg-slate-900 p-4 font-mono text-xs text-slate-200">
                <button
                  onClick={() => {
                    const code =
                      selectedLang === "curl"
                        ? `curl -X GET "http://localhost:3000/api/v1/music/tracks?category=01_mystery_history&limit=5" \\\n  -H "x-api-key: ${activeDemoKey}"`
                        : selectedLang === "python"
                        ? `import requests\n\nheaders = {"x-api-key": "${activeDemoKey}"}\nres = requests.get("http://localhost:3000/api/v1/music/tracks", params={"category": "01_mystery_history", "limit": 5}, headers=headers)\ntracks = res.json()["tracks"]\nprint(f"Loaded {len(tracks)} tracks")`
                        : `const res = await fetch("http://localhost:3000/api/v1/music/tracks?limit=5", {\n  headers: { "x-api-key": "${activeDemoKey}" }\n});\nconst data = await res.json();\nconsole.log(data.tracks);`;
                    copyToClipboard(code, "code");
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="absolute right-3 top-3 rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
                >
                  {copiedCode ? "Copied!" : "Copy Code"}
                </button>

                <pre className="overflow-x-auto text-[11px] leading-relaxed">
                  {selectedLang === "curl" && (
                    <code>
{`# Fetch Mystery & History tracks with your music key:
curl -X GET "http://localhost:3000/api/v1/music/tracks?category=01_mystery_history&limit=5" \\
  -H "x-api-key: ${activeDemoKey}"`}
                    </code>
                  )}
                  {selectedLang === "python" && (
                    <code>
{`import requests

url = "http://localhost:3000/api/v1/music/tracks"
headers = {"x-api-key": "${activeDemoKey}"}
params = {"category": "01_mystery_history", "limit": 5}

response = requests.get(url, headers=headers, params=params)
data = response.json()

for track in data.get("tracks", []):
    print(f"🎵 {track['name']} -> Stream: {track['stream_url']}")`}
                    </code>
                  )}
                  {selectedLang === "node" && (
                    <code>
{`const res = await fetch("http://localhost:3000/api/v1/music/tracks?limit=5", {
  headers: {
    "x-api-key": "${activeDemoKey}"
  }
});
const { tracks } = await res.json();
console.log("Top tracks:", tracks.map(t => t.name));`}
                    </code>
                  )}
                </pre>
              </div>

              {/* Interactive Endpoint Tester Button */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-600">
                  Want to verify key authorization right now?
                </span>
                <button
                  onClick={handleRunApiTest}
                  disabled={testingApi}
                  className="rounded-xl border border-blue-600 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {testingApi ? "Testing..." : "⚡ Test Live API"}
                </button>
              </div>

              {/* Test Response Preview */}
              {apiTestResponse && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
                  <div className="mb-1 text-[10px] uppercase font-bold text-slate-400">
                    Live Response (HTTP 200 OK):
                  </div>
                  <pre className="max-h-40 overflow-y-auto">
                    {JSON.stringify(apiTestResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowApiModal(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
