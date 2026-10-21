"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("Tutorial");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const loadVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (data.status === "success") {
        setVideos(data.videos || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setIsSubmitting(true);
    setMsg("");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          youtube_url: url.trim(),
          thumbnail_url: thumbnailUrl.trim() || undefined,
          category,
          duration: duration.trim() || "Video",
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data.status === "success") {
        setVideos((prev) => [data.video, ...prev]);
        setTitle("");
        setUrl("");
        setThumbnailUrl("");
        setDuration("");
        setDescription("");
        setShowAddForm(false);
        setMsg("Video published successfully!");
        setTimeout(() => setMsg(""), 3500);
      } else {
        setMsg(data.message || "Failed to add video");
      }
    } catch (err) {
      setMsg("Error submitting video");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
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
    } catch (e) {
      alert("Error deleting video");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manage Videos</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Add YouTube video links, set thumbnails, and manage public tutorials.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
        >
          {showAddForm ? "✕ Cancel" : "+ Add YouTube Video"}
        </button>
      </div>

      {msg && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-800">
          {msg}
        </div>
      )}

      {/* Add Video Form Drawer */}
      {showAddForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
            Add New YouTube Video
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                YouTube Link *
              </label>
              <input
                type="text"
                required
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Video Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5 Pacing Hacks for Viral Shorts"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="Video Editing">Video Editing</option>
                  <option value="Thumbnails">Thumbnails</option>
                  <option value="Audio & SFX">Audio &amp; SFX</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="AI Automation">AI Automation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Duration (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Custom Thumbnail URL (optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank to use YouTube's HD thumbnail"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Description (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Summary of this video tutorial..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Video"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Videos List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500 animate-pulse">
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No videos added yet. Click &quot;+ Add YouTube Video&quot; above to add your first tutorial!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-slate-200">
                    <img
                      src={vid.thumbnail_url || `https://img.youtube.com/vi/${vid.youtube_id}/hqdefault.jpg`}
                      alt={vid.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = "/hero-studio-mockup.png";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                      {vid.category}
                    </span>
                    <h4 className="mt-1 text-xs font-bold text-slate-900 truncate">
                      {vid.title}
                    </h4>
                    <a
                      href={vid.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline truncate block"
                    >
                      {vid.youtube_url}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[11px] font-mono text-slate-500">
                    {vid.duration}
                  </span>
                  <a
                    href={`/videos`}
                    target="_blank"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(vid.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
