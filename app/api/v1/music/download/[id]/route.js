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

    // Optional API key validation
    const { searchParams } = new URL(request.url);
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization") ||
      searchParams.get("api_key");

    if (apiKey) {
      const verified = verifyMusicApiKey(apiKey);
      if (!verified) {
        return NextResponse.json(
          {
            error: "INVALID_API_KEY",
            message: "The provided Music API key is invalid or revoked.",
          },
          { status: 401 }
        );
      }
    }

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
    const safeFilename = encodeURIComponent(track.filename || `${track.name}.mp3`).replace(/['()]/g, escape);
    const fileStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(fileStream);

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Length": String(stats.size),
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${track.filename || `${track.id}.mp3`}"; filename*=UTF-8''${safeFilename}`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Download route error:", err);
    return NextResponse.json({ error: "Failed to download audio file" }, { status: 500 });
  }
}
