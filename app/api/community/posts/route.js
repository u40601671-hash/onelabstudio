import { NextResponse } from "next/server";
import { getCommunityPosts, createCommunityPost } from "@/lib/community";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "trending";

    const posts = await getCommunityPosts({ search, sort });
    return NextResponse.json({ success: true, posts });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, content, tags, author_name, author_role, user_id } = body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Question title and details are required." }, { status: 400 });
    }

    const post = await createCommunityPost({
      title,
      content,
      tags: tags || [],
      author_name: author_name || "Creator",
      author_role: author_role || "member",
      user_id: user_id || null,
    });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
