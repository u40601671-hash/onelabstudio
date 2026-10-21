import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { verifyMusicApiKey } from "@/lib/musicApiKey";

function resolveAudioFilePath(relPath) {
  const candidateBases = [
    path.resolve(process.cwd(), "..", "..", "music", "assets"),
    path.resolve(process.cwd(), "..", "music", "assets"),
    path.resolve(process.cwd(), "public", "music_assets"),
    path.resolve("c:/Users/user/Downloads/competitor thumnail/ai videi bot/gallery/music/assets"),
  ];

  for (const base of candidateBases) {
    const full = path.join(base, relPath);
    if (fs.existsSync(full)) {
      return full;
    }
  }
  return null;
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams?.id;
    if (!rawId) {
      return NextResponse.json({ error: "Missing track ID" }, { status: 400 });
    }

    const trackId = decodeURIComponent(rawId);

    // Optional API key validation (tracks usage if provided)
    const { searchParams } = new URL(request.url);
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization") ||
      searchParams.get("api_key");

    if (apiKey) {
      // If provided, we verify it. If invalid, reject.
      const verified = verifyMusicApiKey(apiKey);
      if (!verified) {
        return NextResponse.json(
          {
            error: "INVALID_API_KEY",
            message: "The provided Music API key is invalid or revoked. Expected format: ols_music_live_...",
          },
          { status: 401 }
        );
      }
    }

    // Locate track in catalog
    const jsonPath = path.join(process.cwd(), "data", "music_library.json");
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ error: "Music catalog not found" }, { status: 500 });
    }

    const lib = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const track = (lib.tracks || []).find((t) => t.id === trackId || t.name === trackId);

    if (!track || !track.rel_path) {
      return NextResponse.json({ error: "Track not found in catalog" }, { status: 404 });
    }

    const filePath = resolveAudioFilePath(track.rel_path);
    if (!filePath) {
      return NextResponse.json({ error: "Audio file not found on disk" }, { status: 404 });
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const range = request.headers.get("range");

    if (range) {
      // Range header handling for seeking / scrubbing
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new Response(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(fileStream);

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunksize),
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Full audio stream
    const fileStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(fileStream);

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Length": String(fileSize),
        "Content-Type": "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Stream route error:", err);
    return NextResponse.json({ error: "Failed to stream audio file" }, { status: 500 });
  }
}
