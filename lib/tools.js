// Real Tool catalogue (Only 100% active, fully-working tools)
export const categories = ["All", "Content Creation", "Audio & Music", "AI Utilities"];

const rawTools = [
  {
    id: 16,
    icon: "🎵",
    name: "Music & SFX Vault",
    category: "Audio & Music",
    type: "JavaScript",
    access: "free",
    desc: "1,290+ Royalty-Free Tracks & SFX across 47 categories with real-time audio player, instant download & dedicated Developer API.",
  },
  {
    id: 15,
    icon: "🗜️",
    name: "Image Compressor",
    category: "Content Creation",
    type: "JavaScript",
    access: "free",
    desc: "Compress and convert images to JPG, PNG, or WebP with real-time size reduction.",
  },
  {
    id: 2,
    icon: "🖼️",
    name: "Thumbnail Maker",
    category: "Content Creation",
    type: "JavaScript",
    access: "free",
    desc: "Design eye-catching YouTube thumbnails in minutes with custom backgrounds and text.",
  },
  {
    id: 17,
    icon: "🎞️",
    name: "Auto Video Editor",
    category: "Content Creation",
    type: "JavaScript",
    access: "free",
    desc: "Turn voiceover, pictures, clips, and subtitles into finished MP4 videos directly in your browser.",
  },
  {
    id: 14,
    icon: "📱",
    name: "QR Code Generator",
    category: "Content Creation",
    type: "JavaScript",
    access: "free",
    desc: "Generate custom styled QR codes for URLs, WiFi, vCards, WhatsApp, Email and more.",
  },
  {
    id: 1,
    icon: "📊",
    name: "Word Counter",
    category: "Content Creation",
    type: "JavaScript",
    access: "free",
    desc: "Live word, character, sentence counter with reading speed and platform limits.",
  },
  {
    id: 3,
    icon: "✍️",
    name: "Caption Generator",
    category: "Content Creation",
    type: "JavaScript",
    access: "free",
    desc: "Write engaging viral captions and hashtags for Instagram, TikTok, YouTube, and X.",
  },
  {
    id: 10,
    icon: "🧹",
    name: "Text Cleaner",
    category: "AI Utilities",
    type: "JavaScript",
    access: "free",
    desc: "Fix spacing, remove duplicates, strip blank lines and tidy any text.",
  },
  {
    id: 18,
    icon: "🎧",
    name: "Audio Transcriber",
    category: "AI Utilities",
    type: "JavaScript",
    access: "free",
    desc: "In-browser Whisper AI speech-to-text generating word-exact SRT & VTT subtitles.",
  },
];

// Every tool also gets a URL slug and an illustration number (art).
export const tools = rawTools.map((t) => ({
  ...t,
  art: t.id,
  slug: t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
}));
