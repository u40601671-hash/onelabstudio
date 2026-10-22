import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getUserMusicKeys,
  generateMusicApiKey,
  revokeUserMusicKey,
} from "@/lib/musicApiKey";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/music/keys
 * Returns ONLY the API keys that belong to the currently logged-in user.
 * 100% Privacy: Unauthenticated users are rejected with 401; users never see others' keys.
 */
export async function GET() {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          error: "AUTH_REQUIRED",
          message: "You must create a free account or log in to view and manage Music API keys.",
        },
        { status: 401 }
      );
    }

    const keys = getUserMusicKeys(user).map((k) => ({
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
      user_email: user.email,
      keys,
    });
  } catch (err) {
    console.error("Error retrieving user music keys:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to load music API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/music/keys
 * Generates a new dedicated API key for the authenticated user.
 */
export async function POST(request) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          error: "AUTH_REQUIRED",
          message: "Please sign in or create an account to generate a dedicated Music API key.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = (body.name || "My Bot").trim();

    // Check key limit per user (max 5 active keys to prevent abuse)
    const activeKeys = getUserMusicKeys(user).filter((k) => k.status === "active");
    if (activeKeys.length >= 5) {
      return NextResponse.json(
        {
          status: "error",
          message: "You have reached the maximum limit of 5 active API keys per account. Please revoke an unused key first.",
        },
        { status: 400 }
      );
    }

    const newKey = generateMusicApiKey({
      name,
      email: user.email,
      userId: user.id,
      role: "client",
    });

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

/**
 * DELETE /api/v1/music/keys
 * Revokes a key owned by the authenticated user.
 */
export async function DELETE(request) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Authentication required to revoke keys." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const key = body.key;

    if (!key) {
      return NextResponse.json(
        { status: "error", message: "API key is required to revoke" },
        { status: 400 }
      );
    }

    const success = revokeUserMusicKey(key, user);
    if (!success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Key not found or you do not have permission to revoke this key.",
        },
        { status: 403 }
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
