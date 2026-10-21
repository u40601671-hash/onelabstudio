import { NextResponse } from "next/server";
import { loadVideos, addVideo, deleteVideo } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const videos = loadVideos();
    return NextResponse.json({ status: "success", count: videos.length, videos });
  } catch (err) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, youtube_url, thumbnail_url, description, category, duration } = body;

    if (!title || !youtube_url) {
      return NextResponse.json(
        { status: "error", message: "Title and YouTube URL are required." },
        { status: 400 }
      );
    }

    const created = addVideo({
      title,
      youtube_url,
      thumbnail_url,
      description,
      category,
      duration,
    });

    return NextResponse.json({
      status: "success",
      message: "Video added successfully!",
      video: created,
    });
  } catch (err) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) {
      return NextResponse.json({ status: "error", message: "Video ID is required" }, { status: 400 });
    }

    const success = deleteVideo(id);
    if (!success) {
      return NextResponse.json({ status: "error", message: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "Video deleted successfully" });
  } catch (err) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
