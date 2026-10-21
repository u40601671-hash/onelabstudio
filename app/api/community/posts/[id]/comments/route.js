import { NextResponse } from "next/server";
import { getCommunityComments, addCommunityComment } from "@/lib/community";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const comments = await getCommunityComments(id);
    return NextResponse.json({ success: true, comments });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { content, author_name, author_role, user_id } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Comment text cannot be empty." }, { status: 400 });
    }

    const comment = await addCommunityComment({
      postId: id,
      content,
      author_name: author_name || "Creator",
      author_role: author_role || "member",
      user_id: user_id || null,
    });

    return NextResponse.json({ success: true, comment });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
