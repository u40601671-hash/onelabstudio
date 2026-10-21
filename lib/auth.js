// Server-side helpers: who is logged in, and are they an admin?
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

export async function getSession() {
  if (!supabaseConfigured) return { configured: false, user: null, profile: null };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { configured: true, user, profile };
}

// Use at the top of every admin page and every admin server action.
export async function requireAdmin(next = "/admin") {
  const session = await getSession();
  if (!session.configured) return session; // pages show the setup notice
  if (!session.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (session.profile?.role !== "admin") redirect("/account?denied=1");
  return session;
}
