"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Video Player Modal state
  const [activePlayerVideo, setActivePlayerVideo] = useState(null);

  // Add Video Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [newCategory, setNewCategory] = useState("Tutorial");
  const [newDuration, setNewDuration] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Fetch videos from API
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (data.status === "success") {
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Extract YouTube ID helper for live preview
  const extractedId = useMemo(() => {
    if (!newUrl) return null;
    const str = newUrl.trim();
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = str.match(regExp);
    if (match && match[2].length === 11) return match[2];
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    return null;
  }, [newUrl]);

  // Live preview thumbnail
  const previewThumbnail = useMemo(() => {
    if (newThumbnail.trim()) return newThumbnail.trim();
    if (extractedId) return `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`;
    return null;
  }, [newThumbnail, extractedId]);

  // Handle Add Video
  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          youtube_url: newUrl.trim(),
          thumbnail_url: newThumbnail.trim() || undefined,
          category: newCategory.trim() || "Tutorial",
          duration: newDuration.trim() || "Video",
          description: newDescription.trim(),
        }),
      });

      const data = await res.json();
      if (data.status === "success") {
        setVideos((prev) => [data.video, ...prev]);
        setNewTitle("");
        setNewUrl("");
        setNewThumbnail("");
        setNewDuration("");
        setNewDescription("");
        setShowAddModal(false);
      } else {
        setStatusMessage(data.message || "Failed to add video");
      }
    } catch (err) {
      setStatusMessage("Error adding video. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Video
  const handleDeleteVideo = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this video?")) return;

    try {
      const res = await fetch("/api/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setVideos((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (err) {
      alert("Failed to delete video");
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(videos.map((v) => v.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [videos]);

  // Filtered list
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchCat = activeCategory === "All" || v.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [videos, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 text-slate-700">
      {/* ==================================================================== */}
      {/* 1. HERO PRESENTATION HEADER                                          */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-14 shadow-xs">
        <div className="absolute inset-0 bg-linear-to-r from-blue-50/60 via-cyan-50/30 to-indigo-50/50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-blue-700 shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span>VIDEO WORKSHOPS &amp; MASTERCLASSES</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                Creator Video Library &amp;{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                  Tutorials.
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Watch curated masterclasses on video editing pacing, CTR thumbnail psychology, audio mixing, and automated bot workflows.
              </p>
            </div>

            {/* Admin Add Video Button */}
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg transition active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add YouTube Video</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 cursor-pointer ${
                    activeCategory === c
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px] max-w-sm">
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
                placeholder="Search videos by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-xs"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. VIDEOS GRID                                                       */}
      {/* ==================================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-xs" />
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <span className="text-4xl">🎬</span>
            <h3 className="mt-4 text-base font-bold text-slate-900">No videos found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Click &quot;Add YouTube Video&quot; above to paste your first video link and thumbnail!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
            >
              + Add First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setActivePlayerVideo(vid)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer"
              >
                {/* Thumbnail Container with Play Overlay */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src={vid.thumbnail_url || `https://img.youtube.com/vi/${vid.youtube_id}/hqdefault.jpg`}
                    alt={vid.title}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = "/hero-studio-mockup.png";
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-xl backdrop-blur-md transition-transform duration-300 group-hover:scale-115 group-hover:bg-blue-600 group-hover:text-white">
                      <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>

                  {/* Top Category Badge */}
                  <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/10 uppercase tracking-wider">
                    {vid.category || "Tutorial"}
                  </span>

                  {/* Duration Badge */}
                  {vid.duration && (
                    <span className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                      {vid.duration}
                    </span>
                  )}
                </div>

                {/* Content Info */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {vid.title}
                  </h3>
                  {vid.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 flex-1">
                      {vid.description}
                    </p>
                  )}

                  {/* Bottom Action Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:underline">
                      <span>Watch Video</span>
                      <Icon name="arrow" className="h-3 w-3" />
                    </span>

                    <button
                      onClick={(e) => handleDeleteVideo(vid.id, e)}
                      title="Delete video"
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 3. INTERACTIVE THEATER VIDEO PLAYER MODAL                            */}
      {/* ==================================================================== */}
      {activePlayerVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          onClick={() => setActivePlayerVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-white">
              <div className="min-w-0 flex-1 pr-4">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {activePlayerVideo.category || "Video"}
                </span>
                <h4 className="mt-1 text-sm font-bold text-white truncate">
                  {activePlayerVideo.title}
                </h4>
              </div>
              <button
                onClick={() => setActivePlayerVideo(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Responsive 16:9 YouTube Video Embed Player */}
            <div className="relative aspect-video w-full bg-black">
              {activePlayerVideo.youtube_id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activePlayerVideo.youtube_id}?autoplay=1&rel=0`}
                  title={activePlayerVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                  <p>Cannot embed this link. <a href={activePlayerVideo.youtube_url} target="_blank" rel="noreferrer" className="text-blue-400 underline">Open on YouTube →</a></p>
                </div>
              )}
            </div>

            {/* Details Footer */}
            {activePlayerVideo.description && (
              <div className="p-5 text-xs text-slate-300 border-t border-slate-800 bg-slate-900/90 leading-relaxed">
                {activePlayerVideo.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. ADMIN ADD VIDEO MODAL                                             */}
      {/* ==================================================================== */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="eyebrow-plain">ADMIN VIDEO MANAGER</span>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Add YouTube Video Link</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {statusMessage && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {statusMessage}
              </div>
            )}

            <form onSubmit={handleAddVideo} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">
                  YouTube Video Link <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                <span className="mt-1 block text-[10px] text-slate-400">
                  Auto-extracts YouTube ID and HD thumbnail automatically!
                </span>
              </div>

              {/* Live Thumbnail Preview */}
              {previewThumbnail && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                    Live Thumbnail Preview:
                  </span>
                  <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-xl bg-slate-900">
                    <img
                      src={previewThumbnail}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = "/hero-studio-mockup.png";
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Video Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Pacing & Cut Frequency in CapCut"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Video Editing">Video Editing</option>
                    <option value="Thumbnails">Thumbnails</option>
                    <option value="Audio & SFX">Audio &amp; SFX</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="AI Automation">AI Automation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">Duration (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 12:45"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Custom Thumbnail URL (optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to use YouTube's HD thumbnail automatically"
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what creators will learn in this video..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newUrl.trim()}
                  className="rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Adding Video..." : "Save & Publish Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
