import fs from "fs";
import path from "path";
import { createPublicClient } from "@/lib/supabase/public";
import { supabaseConfigured } from "@/lib/supabase/config";

const POSTS_FILE = path.join(process.cwd(), "data", "community_posts.json");
const COMMENTS_FILE = path.join(process.cwd(), "data", "community_comments.json");

// Initial Seed Discussions for open Community Q&A
const initialSeedPosts = [
  {
    id: "welcome-discussion",
    title: "Welcome to the One Lab Community! What projects are you working on?",
    content: "Welcome everyone! This community is open to all discussions across media editing, visual design, audio engineering, automation, and AI workflows. Feel free to ask technical questions, request project critiques, or share useful workflows and prompt templates. Introduce yourself and what tools you use daily!",
    author_name: "One Lab Team",
    author_role: "admin",
    author_avatar: null,
    likes_count: 52,
    comments_count: 12,
    views_count: 640,
    is_pinned: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    tags: ["welcome", "community", "projects"],
  },
  {
    id: "export-settings-workflow",
    title: "What is your go-to media export workflow for highest quality vs file size?",
    content: "I am balancing bitrate and render times across multiple media projects. What settings and codecs do you find strike the best balance between crisp visual quality and manageable upload file sizes?",
    author_name: "Hamza Tariq",
    author_role: "pro",
    author_avatar: null,
    likes_count: 38,
    comments_count: 7,
    views_count: 420,
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    tags: ["workflow", "media", "export", "quality"],
  },
  {
    id: "ctr-psychology",
    title: "What is your target Click-Through Rate (CTR) for YouTube thumbnails?",
    content: "I have been testing different styles using the One Lab Thumbnail Maker. My impressions went up, but my CTR on browse features is hovering around 5.4%. What CTR do you consider a green flag in the first 24 hours of publishing? What tweaks make the biggest difference for you?",
    author_name: "Farhan Ali",
    author_role: "member",
    author_avatar: null,
    likes_count: 26,
    comments_count: 6,
    views_count: 310,
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    tags: ["thumbnails", "ctr", "analytics"],
  },
  {
    id: "shorts-pacing-tips",
    title: "How to keep Short-form retention above 80%? Where are people dropping off?",
    content: "When looking at YouTube Studio audience retention curves on my Shorts, I see a sharp 30% drop right at second 3 to 4. What do you do in the first 3 seconds to lock viewers in? Fast zoom? Sound effect? Text hook?",
    author_name: "Zayd Khan",
    author_role: "member",
    author_avatar: null,
    likes_count: 31,
    comments_count: 9,
    views_count: 450,
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    tags: ["shorts", "retention", "editing"],
  },
  {
    id: "groq-prompt-formula",
    title: "What are your best AI prompts for generating viral video ideas and hooks?",
    content: "Most generic ChatGPT prompts give boring results like '5 tips to be productive'. Has anyone built a good prompt template for Groq or Claude that generates contrarian or curiosity-driven titles and hooks?",
    author_name: "Bilal Ahmed",
    author_role: "pro",
    author_avatar: null,
    likes_count: 45,
    comments_count: 8,
    views_count: 580,
    is_pinned: false,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    tags: ["ai", "prompts", "scriptwriting"],
  },
  {
    id: "microphone-noise-removal",
    title: "How to remove background fan/room noise from microphone recordings cleanly?",
    content: "Recording in a room with PC fan noise and mild reverb. Are you using AI noise removal tools or OBS / Audacity noise gates? Does AI transcription or voice cloning work better if audio is pre-cleaned?",
    author_name: "Sarah Jenkins",
    author_role: "member",
    author_avatar: null,
    likes_count: 19,
    comments_count: 4,
    views_count: 240,
    is_pinned: false,
    created_at: new Date(Date.now() - 25200000).toISOString(),
    tags: ["audio", "microphone", "sound"],
  },
];

const initialSeedComments = {
  "welcome-discussion": [
    {
      id: "c-100",
      author_name: "Bilal Ahmed",
      author_role: "pro",
      content: "Great to have this open space! Working on several video editing workflows and audio mastering setups. Excited to exchange tips with everyone.",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      likes_count: 9,
    },
    {
      id: "c-101",
      author_name: "Hamza Tariq",
      author_role: "member",
      content: "Building an automated channel for documentary-style history shorts. The music library and caption tool are saving me hours.",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      likes_count: 6,
    },
  ],
  "export-settings-workflow": [
    {
      id: "c-201",
      author_name: "One Lab Team",
      author_role: "admin",
      content: "For 1080p 60fps Shorts, H.264 Main profile at 12–15 Mbps with 2-pass VBR gives nearly lossless sharpness without file bloat. For 4K long-form, HEVC (H.265) at 35–45 Mbps is ideal.",
      created_at: new Date(Date.now() - 86400000 * 1.8).toISOString(),
      likes_count: 14,
    },
  ],
};

function ensureStorageFiles() {
  const dir = path.dirname(POSTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(initialSeedPosts, null, 2), "utf-8");
  }
  if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(initialSeedComments, null, 2), "utf-8");
  }
}

function readStoredPosts() {
  ensureStorageFiles();
  try {
    const raw = fs.readFileSync(POSTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading community posts file:", err);
    return initialSeedPosts;
  }
}

function writeStoredPosts(posts) {
  ensureStorageFiles();
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
}

function readStoredComments() {
  ensureStorageFiles();
  try {
    const raw = fs.readFileSync(COMMENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading community comments file:", err);
    return initialSeedComments;
  }
}

function writeStoredComments(comments) {
  ensureStorageFiles();
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf-8");
}

function withTimeout(promise, ms = 2000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Database operation timed out")), ms)),
  ]);
}

/**
 * Fetch all community discussions with optional search and sorting.
 */
export async function getCommunityPosts({ search = "", sort = "trending" } = {}) {
  let posts = null;

  if (supabaseConfigured) {
    try {
      const supabase = createPublicClient();
      let query = supabase.from("community_posts").select("*").eq("status", "published");

      if (search && search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      if (sort === "newest" || sort === "latest") {
        query = query.order("created_at", { ascending: false });
      } else if (sort === "discussed") {
        query = query.order("comments_count", { ascending: false });
      } else if (sort === "unanswered") {
        query = query.eq("comments_count", 0).order("created_at", { ascending: false });
      } else {
        query = query.order("is_pinned", { ascending: false }).order("likes_count", { ascending: false });
      }

      const { data, error } = await withTimeout(query, 2000);
      if (!error && data && data.length > 0) {
        posts = data;
      }
    } catch {
      // Fallback to disk storage
    }
  }

  // Load from permanent disk storage
  if (!posts || posts.length === 0) {
    posts = readStoredPosts();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (sort === "newest" || sort === "latest") {
      posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === "discussed") {
      posts.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
    } else if (sort === "unanswered") {
      posts = posts.filter((p) => (p.comments_count || 0) === 0);
    } else {
      // Trending (pinned first, then upvotes + comments)
      posts.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        const scoreA = (a.likes_count || 0) * 2 + (a.comments_count || 0);
        const scoreB = (b.likes_count || 0) * 2 + (b.comments_count || 0);
        return scoreB - scoreA;
      });
    }
  }

  return posts;
}

/**
 * Fetch a single community question by ID.
 */
export async function getCommunityPost(id) {
  if (supabaseConfigured) {
    try {
      const supabase = createPublicClient();
      const { data, error } = await withTimeout(
        supabase.from("community_posts").select("*").eq("id", id).maybeSingle(),
        2000
      );

      if (!error && data) return data;
    } catch {
      // Fallback
    }
  }

  const posts = readStoredPosts();
  return posts.find((p) => String(p.id) === String(id)) || null;
}

/**
 * Fetch answers/comments for a specific question.
 */
export async function getCommunityComments(postId) {
  if (supabaseConfigured) {
    try {
      const supabase = createPublicClient();
      const { data, error } = await withTimeout(
        supabase.from("community_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true }),
        2000
      );

      if (!error && data && data.length > 0) return data;
    } catch {
      // Fallback
    }
  }

  const comments = readStoredComments();
  return comments[postId] || [];
}

/**
 * Create a new question / post and PERMANENTLY save it to disk and/or Supabase.
 */
export async function createCommunityPost({
  title,
  content,
  tags = [],
  author_name = "Creator",
  author_role = "member",
  user_id = null,
}) {
  const newPost = {
    id: "q-" + Date.now(),
    title: title.trim(),
    content: content.trim(),
    tags: Array.isArray(tags) && tags.length > 0 ? tags : ["creator", "discussion"],
    author_name: author_name.trim() || "Creator",
    author_role: author_role || "member",
    author_avatar: null,
    user_id: user_id || null,
    likes_count: 1,
    comments_count: 0,
    views_count: 1,
    is_pinned: false,
    status: "published",
    created_at: new Date().toISOString(),
  };

  if (supabaseConfigured && user_id) {
    try {
      const supabase = createPublicClient();
      const { data, error } = await withTimeout(
        supabase
          .from("community_posts")
          .insert({
            title: newPost.title,
            content: newPost.content,
            tags: newPost.tags,
            author_name: newPost.author_name,
            author_role: newPost.author_role,
            user_id,
          })
          .select()
          .single(),
        2000
      );

      if (!error && data) return data;
    } catch {
      // Fallback
    }
  }

  // Save permanently to disk
  const posts = readStoredPosts();
  posts.unshift(newPost);
  writeStoredPosts(posts);

  return newPost;
}

/**
 * Add an answer / comment to a question and PERMANENTLY save it.
 */
export async function addCommunityComment({
  postId,
  content,
  author_name = "Creator",
  author_role = "member",
  user_id = null,
}) {
  const newComment = {
    id: "ans-" + Date.now(),
    post_id: postId,
    content: content.trim(),
    author_name: author_name.trim() || "Creator",
    author_role: author_role || "member",
    user_id: user_id || null,
    likes_count: 0,
    created_at: new Date().toISOString(),
  };

  if (supabaseConfigured && user_id) {
    try {
      const supabase = createPublicClient();
      const { data, error } = await withTimeout(
        supabase
          .from("community_comments")
          .insert({
            post_id: postId,
            content: newComment.content,
            author_name: newComment.author_name,
            author_role: newComment.author_role,
            user_id,
          })
          .select()
          .single(),
        2000
      );

      if (!error && data) return data;
    } catch {
      // Fallback
    }
  }

  // Update comments file permanently
  const allComments = readStoredComments();
  if (!allComments[postId]) {
    allComments[postId] = [];
  }
  allComments[postId].push(newComment);
  writeStoredComments(allComments);

  // Update comments_count in posts file permanently
  const posts = readStoredPosts();
  const p = posts.find((post) => String(post.id) === String(postId));
  if (p) {
    p.comments_count = (p.comments_count || 0) + 1;
    writeStoredPosts(posts);
  }

  return newComment;
}

/**
 * Toggle like / upvote on a post and PERMANENTLY save it.
 */
export async function toggleCommunityLike({ postId }) {
  const posts = readStoredPosts();
  const p = posts.find((post) => String(post.id) === String(postId));
  if (p) {
    p.likes_count = (p.likes_count || 0) + 1;
    writeStoredPosts(posts);
    return { likes_count: p.likes_count };
  }
  return { likes_count: 1 };
}
