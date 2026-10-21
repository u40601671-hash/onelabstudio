import { NextResponse } from "next/server";
import { loadMusicKeys, generateMusicApiKey, revokeMusicApiKey } from "@/lib/musicApiKey";

export async function GET() {
  try {
    const data = loadMusicKeys();
    // Return keys
    const keys = (data.keys || []).map((k) => ({
      key: k.key,
      name: k.name,
      email: k.email,
      created_at: k.created_at,
      status: k.status,
      role: k.role,
      rate_limit: k.rate_limit,
      requests_today: k.requests_today || 0,
      last_used: k.last_used,
    }));

    return NextResponse.json({
      status: "success",
      count: keys.length,
      keys,
    });
  } catch (err) {
    console.error("Error retrieving music keys:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to load music API keys" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || "My Bot";
    const email = body.email || "";

    const newKey = generateMusicApiKey({ name, email });

    return NextResponse.json({
      status: "success",
      message: "Music API Key generated successfully!",
      key: newKey,
    });
  } catch (err) {
    console.error("Error creating music key:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to generate music API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = body.key;

    if (!key) {
      return NextResponse.json(
        { status: "error", message: "API key is required to revoke" },
        { status: 400 }
      );
    }

    const success = revokeMusicApiKey(key);
    if (!success) {
      return NextResponse.json(
        { status: "error", message: "Key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "API key revoked successfully",
    });
  } catch (err) {
    console.error("Error revoking music key:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to revoke music API key" },
      { status: 500 }
    );
  }
}
