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
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
        Team Admin
      </span>
    );
  }
  if (role === "pro") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
        Pro Creator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
      Member
    </span>
  );
}

export default function DiscussionThread({ post: initialPost, comments: initialComments }) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        const name = data.user.user_metadata?.display_name || data.user.email?.split("@")[0] || "Creator";
        setAuthorName(name);
      }
    });
  }, []);

  const handleLike = async () => {
    setIsLiked((prev) => !prev);
    setPost((p) => ({
      ...p,
      likes_count: isLiked ? Math.max(0, (p.likes_count || 1) - 1) : (p.likes_count || 0) + 1,
    }));

    try {
      await fetch(`/api/community/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser?.id }),
      });
    } catch {
      // Revert if error
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          author_name: authorName.trim() || "Creator",
          author_role: currentUser ? "member" : "member",
          user_id: currentUser?.id || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
        setPost((p) => ({ ...p, comments_count: (p.comments_count || 0) + 1 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-10 text-slate-700 cyber-grid">
      <div className="wrap max-w-4xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/community" className="text-blue-600 hover:underline">
            ← Back to All Questions
          </Link>
        </div>

        {/* Main Question Card */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {post.is_pinned ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700 ring-1 ring-emerald-200">
                📌 Pinned Question
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                Question
              </span>
            )}
            <span className="text-slate-500 font-medium">Asked {timeAgo(post.created_at)}</span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {post.title}
          </h1>

          {/* Author bar */}
          <div className="mt-5 flex items-center gap-3 border-y border-slate-200 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-xs">
              {post.author_name ? post.author_name.charAt(0).toUpperCase() : "C"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{post.author_name}</span>
                <RoleBadge role={post.author_role} />
              </div>
              <div className="text-xs text-slate-500">Creator Community Member</div>
            </div>
          </div>

          {/* Content Body */}
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700 whitespace-pre-line">
            {post.content}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                isLiked
                  ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
              }`}
            >
              <svg
                className={`h-4 w-4 ${isLiked ? "scale-110 fill-current" : ""}`}
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
              <span>{post.likes_count || 0} Upvotes</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{copied ? "Link Copied!" : "Share Link"}</span>
            </button>
          </div>
        </article>

        {/* Answers Section */}
        <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Answers &amp; Advice ({comments.length})
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Community conversation
            </span>
          </div>

          {/* New Answer Form */}
          <form onSubmit={handleSubmitComment} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Your Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="mt-1 w-full max-w-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Your Answer / Advice
              </label>
              <textarea
                rows={3}
                required
                placeholder="Share your experience, solution, or tips for this question..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary !px-6 !py-2 text-sm"
              >
                {isSubmitting ? "Posting..." : "Post Answer"}
              </button>
            </div>
          </form>

          {/* Answers List */}
          <div className="mt-8 space-y-4">
            {comments.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No answers yet. Be the first creator to share your advice!
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-[10px] font-bold text-white">
                        {comment.author_name ? comment.author_name.charAt(0).toUpperCase() : "C"}
                      </div>
                      <span className="font-bold text-slate-900">{comment.author_name}</span>
                      <RoleBadge role={comment.author_role} />
                    </div>
                    <span className="text-slate-500 font-medium">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <div className="mt-2.5 text-sm leading-relaxed text-slate-700 whitespace-pre-line pl-8">
                    {comment.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
