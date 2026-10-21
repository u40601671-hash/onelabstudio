import { NextResponse } from "next/server";
import { toggleCommunityLike } from "@/lib/community";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const result = await toggleCommunityLike({ postId: id, userId: body.user_id });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
