import fs from "fs";
import path from "path";

const VIDEOS_FILE = path.join(process.cwd(), "data", "videos.json");

// Extract standard 11-char YouTube ID from any link or short URL
export function extractYouTubeId(url) {
  if (!url) return null;
  const str = url.trim();
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = str.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  return null;
}

export function getYouTubeThumbnail(videoId) {
  if (!videoId) return "/hero-studio-mockup.png";
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

const initialSeedVideos = [
  {
    id: "vid-1",
    title: "Mastering Short-Form Video Retention: 3-Second Hook Secret",
    description: "Learn how top creators keep audience retention above 80% on YouTube Shorts, TikTok and Reels using rapid sound transitions and kinetic captions.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtube_id: "dQw4w9WgXcQ",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    category: "Video Editing",
    duration: "10:24",
    views: "24.5k",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "vid-2",
    title: "How to Design 15%+ CTR YouTube Thumbnails (Step-by-Step)",
    description: "Deep dive into visual hierarchy, font weights, color contrast, and background separation to maximize click-through rate.",
    youtube_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    youtube_id: "jNQXAC9IVRw",
    thumbnail_url: "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    category: "Thumbnails",
    duration: "14:12",
    views: "18.2k",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "vid-3",
    title: "Audio Mastering & Background Music Pacing for Video Bots",
    description: "Complete guide on ducking, EQ balancing, and picking the right background tracks to keep viewers immersed throughout your video.",
    youtube_url: "https://www.youtube.com/watch?v=L_LUpnjgPso",
    youtube_id: "L_LUpnjgPso",
    thumbnail_url: "https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg",
    category: "Audio & SFX",
    duration: "08:45",
    views: "12.8k",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

function ensureVideosFile() {
  const dir = path.dirname(VIDEOS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(VIDEOS_FILE)) {
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(initialSeedVideos, null, 2), "utf-8");
  }
}

export function loadVideos() {
  ensureVideosFile();
  try {
    const raw = fs.readFileSync(VIDEOS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading videos file:", err);
    return initialSeedVideos;
  }
}

export function saveVideos(videos) {
  ensureVideosFile();
  fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), "utf-8");
}

export function addVideo({
  title,
  youtube_url,
  thumbnail_url,
  description = "",
  category = "Tutorial",
  duration = "Video",
}) {
  const videos = loadVideos();
  const ytid = extractYouTubeId(youtube_url) || "";
  const finalThumbnail = thumbnail_url?.trim() || (ytid ? getYouTubeThumbnail(ytid) : "/hero-studio-mockup.png");

  const newEntry = {
    id: "vid-" + Date.now(),
    title: title.trim(),
    description: description.trim(),
    youtube_url: youtube_url.trim(),
    youtube_id: ytid,
    thumbnail_url: finalThumbnail,
    category: category.trim() || "Tutorial",
    duration: duration.trim() || "Video",
    views: "New",
    created_at: new Date().toISOString(),
  };

  videos.unshift(newEntry);
  saveVideos(videos);
  return newEntry;
}

export function deleteVideo(id) {
  const videos = loadVideos();
  const filtered = videos.filter((v) => v.id !== id);
  if (filtered.length !== videos.length) {
    saveVideos(filtered);
    return true;
  }
  return false;
}
