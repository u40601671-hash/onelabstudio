import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

export async function POST(request) {
  if (supabaseConfigured) {
    try {
      await createClient().auth.signOut();
    } catch {
      // A brief network problem must not break logging out; the visitor still lands on the home page.
    }
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
