"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

function timeAgo(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function RoleBadge({ role }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
        Team Admin
      </span>
    );
  }
  if (role === "pro") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
        Pro Member
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      Member
    </span>
  );
}

export default function CommunityClient({ initialPosts = [] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState("trending");

  // Simple direct question typing state (No modal, no complicated forms)
  const [questionText, setQuestionText] = useState("");
  const [questionDetails, setQuestionDetails] = useState("");
  const [authorName, setAuthorName] = useState("Creator");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postSuccessMessage, setPostSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        const name =
          data.user.user_metadata?.display_name ||
          data.user.email?.split("@")[0] ||
          "Creator";
        setAuthorName(name);
      }
    });
  }, []);

  const handleLike = async (postId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const currentlyLiked = likedPosts[postId];
    setLikedPosts((prev) => ({ ...prev, [postId]: !currentlyLiked }));

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const delta = currentlyLiked ? -1 : 1;
          return { ...p, likes_count: Math.max(0, (p.likes_count || 0) + delta) };
        }
        return p;
      })
    );

    try {
      await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser?.id }),
      });
    } catch (err) {
      console.error("Failed to persist like", err);
    }
  };

  // Direct Send Question (Simple & Fast)
  const handleDirectSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = questionText.trim();
    if (!cleanTitle) {
      setErrorMessage("Please type your question before sending.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setPostSuccessMessage("");

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          content: questionDetails.trim() || cleanTitle,
          author_name: authorName.trim() || "Creator",
          author_role: currentUser ? "member" : "member",
          user_id: currentUser?.id || null,
          tags: ["discussion", "creator"],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit question");
      }

      setPosts((prev) => [data.post, ...prev]);
      setQuestionText("");
      setQuestionDetails("");
      setPostSuccessMessage("🎉 Your question has been posted to the community!");
      setTimeout(() => setPostSuccessMessage(""), 4000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to post question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPosts = posts
    .filter((post) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        (post.tags && post.tags.some((t) => t.toLowerCase().includes(q)));
      return matchSearch;
    })
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      if (activeSort === "trending") {
        return (
          (b.likes_count || 0) +
          (b.comments_count || 0) -
          ((a.likes_count || 0) + (a.comments_count || 0))
        );
      }
      if (activeSort === "latest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (activeSort === "unanswered") {
        return (a.comments_count || 0) - (b.comments_count || 0);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 text-slate-700">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER: LUXURY STUDIO PRESENTATION WITH AMBIENT GLOW           */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-14 shadow-xs">
        <div className="absolute inset-0 bg-linear-to-r from-blue-50/60 via-cyan-50/30 to-indigo-50/50" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-blue-700 shadow-xs backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>CREATOR COMMUNITY &amp; Q&amp;A HUB</span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Ask Anything, Share Workflows &amp;{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
              Grow Together.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            A collaborative knowledge forum for video editors, thumbnail designers, audio creators, and digital builders. Got a question? Type it below and get instant community advice.
          </p>

          {/* Clean Integrated Telemetry Metrics Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-xs">
              <span className="text-blue-600">👥</span>
              <span>1,240+ Active Creators</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-xs">
              <span className="text-indigo-600">💬</span>
              <span>480+ Real Discussions</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-xs">
              <span className="text-emerald-600">⚡</span>
              <span>Fast Community Answers</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-xs text-blue-600">
              <span>✨ 100% Free &amp; Open</span>
            </span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. MAIN CENTERED FEED (NO RIGHT SIDEBAR CLUTTER)                     */}
      {/* ==================================================================== */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Direct Inline Question Composer Box */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-md shadow-blue-900/5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-xs text-sm">
              {authorName ? authorName.charAt(0).toUpperCase() : "C"}
            </div>

            <form onSubmit={handleDirectSubmit} className="flex-1 space-y-3">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="What is your question or topic? (e.g. How to get smooth transitions in CapCut?)"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 outline-none border-b border-slate-200/80 pb-2.5 focus:border-blue-600 transition"
                  required
                />
                <textarea
                  rows={2}
                  placeholder="Add details, tools you're using, or extra context (optional)..."
                  value={questionDetails}
                  onChange={(e) => setQuestionDetails(e.target.value)}
                  className="w-full text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none pt-1"
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                  {errorMessage}
                </div>
              )}

              {postSuccessMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800">
                  {postSuccessMessage}
                </div>
              )}

              {/* Bottom Send Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Posting as:</span>
                  <input
                    type="text"
                    placeholder="Your Name / Handle"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!questionText.trim() || isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 transition active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>{isSubmitting ? "Posting..." : "Send Question"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Filter Controls: Search & Sort Tabs */}
        <div className="mt-8 mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search discussions by keyword, tool, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setActiveSort("trending")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeSort === "trending"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500/30 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              🔥 Trending
            </button>
            <button
              onClick={() => setActiveSort("latest")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeSort === "latest"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500/30 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ⏱️ Latest
            </button>
            <button
              onClick={() => setActiveSort("unanswered")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeSort === "unanswered"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500/30 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              💬 Unanswered
            </button>
          </div>
        </div>

        {/* Questions Feed */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <span className="text-4xl">🔍</span>
              <h3 className="mt-4 text-base font-bold text-slate-900">No questions found</h3>
              <p className="mt-1 text-xs text-slate-500">
                Be the first creator to start a conversation about this topic!
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isLiked = likedPosts[post.id];
              return (
                <article
                  key={post.id}
                  className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-blue-400 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {post.is_pinned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 ring-1 ring-emerald-600/20 text-[10px]">
                        📌 Pinned Discussion
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">Discussion</span>
                    )}
                    <span className="text-[11px] font-medium text-slate-400">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>

                  <h2 className="mt-2 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600 sm:text-lg">
                    <Link href={`/community/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-2 line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                    {post.content}
                  </p>

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-slate-50 border border-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
                        {post.author_name ? post.author_name.charAt(0).toUpperCase() : "C"}
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {post.author_name}
                      </span>
                      <RoleBadge role={post.author_role} />
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        title="Upvote"
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isLiked
                            ? "bg-rose-50 text-rose-600 ring-1 ring-rose-500/30"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <svg
                          className={`h-3.5 w-3.5 transition-transform ${
                            isLiked ? "scale-110 fill-current" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>{post.likes_count || 0}</span>
                      </button>

                      <Link
                        href={`/community/${post.id}`}
                        className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span>
                          {(post.comments_count || 0) > 0
                            ? `${post.comments_count} answers`
                            : "Reply"}
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
