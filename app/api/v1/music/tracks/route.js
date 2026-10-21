import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { verifyMusicApiKey } from "@/lib/musicApiKey";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract API Key from Header or Query
    const headerKey = request.headers.get("x-api-key") || request.headers.get("authorization");
    const queryKey = searchParams.get("api_key");
    const apiKey = headerKey || queryKey;

    // Verify key if provided
    let keyInfo = null;
    if (apiKey) {
      keyInfo = verifyMusicApiKey(apiKey);
      if (!keyInfo) {
        return NextResponse.json(
          {
            status: "error",
            error: "INVALID_API_KEY",
            message: "The provided Music API key is invalid, revoked, or formatted incorrectly. Expected format: ols_music_live_...",
          },
          { status: 401 }
        );
      }
    }

    // Load library JSON
    const jsonPath = path.join(process.cwd(), "data", "music_library.json");
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { status: "error", message: "Music catalog database not initialized." },
        { status: 500 }
      );
    }

    const lib = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    let tracks = lib.tracks || [];

    // Filter by type: 'music' or 'sfx'
    const type = searchParams.get("type");
    if (type && type !== "all") {
      tracks = tracks.filter((t) => t.type === type.toLowerCase());
    }

    // Filter by category
    const category = searchParams.get("category");
    if (category && category !== "all") {
      tracks = tracks.filter(
        (t) =>
          (t.category_id && t.category_id.toLowerCase().includes(category.toLowerCase())) ||
          (t.category_name && t.category_name.toLowerCase().includes(category.toLowerCase()))
      );
    }

    // Filter by search query (name or tags)
    const q = searchParams.get("search") || searchParams.get("q");
    if (q) {
      const query = q.toLowerCase().trim();
      tracks = tracks.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(query)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const total = tracks.length;
    const startIndex = (page - 1) * limit;
    const paginatedTracks = tracks.slice(startIndex, startIndex + limit);

    // Format output with live stream and download URLs
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    const formattedTracks = paginatedTracks.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      category_id: t.category_id,
      category_name: t.category_name,
      category_icon: t.category_icon || "🎵",
      duration: t.duration,
      duration_sec: t.duration_sec,
      size_mb: t.size_mb,
      tags: t.tags || [],
      stream_url: `${baseUrl}/api/v1/music/stream/${encodeURIComponent(t.id)}`,
      download_url: `${baseUrl}/api/v1/music/download/${encodeURIComponent(t.id)}`,
    }));

    return NextResponse.json({
      status: "success",
      authorized: Boolean(keyInfo),
      key_info: keyInfo
        ? {
            name: keyInfo.name,
            requests_today: keyInfo.requests_today,
            rate_limit: keyInfo.rate_limit,
          }
        : { note: "Public preview mode. Use your dedicated 'ols_music_...' key for unlimited bot access." },
      pagination: {
        page,
        limit,
        total_tracks: total,
        total_pages: Math.ceil(total / limit),
      },
      categories: (lib.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        count: c.count,
        type: c.type,
      })),
      tracks: formattedTracks,
    });
  } catch (err) {
    console.error("Music API Error:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve music tracks" },
      { status: 500 }
    );
  }
}
