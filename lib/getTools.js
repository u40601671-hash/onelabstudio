// Loads tools from the database when Supabase is connected, otherwise from the built-in sample list.
import { tools as sampleTools } from "@/lib/tools";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { runners } from "@/components/tools/registry";

const typeLabel = { js: "JavaScript", python: "Python", download: "Download" };

export function normalizeTool(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    icon: row.icon || "🛠️",
    art: row.art || 1,
    type: typeLabel[row.type] || "JavaScript",
    access: row.access,
    desc: row.description || "",
    entry: row.entry || "",
  };
}

export async function getTools() {
  let list = sampleTools;

  if (supabaseConfigured) {
    try {
      const fetchPromise = createPublicClient()
        .from("tools")
        .select("*")
        .eq("status", "live")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      // 2.5 second timeout safeguard so pages never hang if network/supabase is slow
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase fetch timeout")), 2500)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (!error && data && data.length > 0) {
        const dbTools = data.map(normalizeTool);
        const existingSlugs = new Set(dbTools.map((t) => t.slug));
        const merged = [...dbTools];
        sampleTools.forEach((st) => {
          if (!existingSlugs.has(st.slug)) {
            merged.push(st);
          }
        });
        list = merged;
      }
    } catch {
      list = sampleTools;
    }
  }

  // Strictly filter out any coming-soon/placeholder tools: only return 100% active working tools!
  const workingTools = list.filter((t) => Boolean(runners[t.slug]));

  // Ensure high-priority working tools appear in logical top order
  const prioritySlugs = [
    "music-sfx-vault",
    "music-and-sfx-vault",
    "image-compressor",
    "thumbnail-maker",
    "auto-video-editor",
    "qr-code-generator",
    "word-counter",
    "caption-generator",
    "audio-transcriber",
    "text-cleaner",
  ];

  workingTools.sort((a, b) => {
    const idxA = prioritySlugs.indexOf(a.slug);
    const idxB = prioritySlugs.indexOf(b.slug);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  return workingTools;
}
