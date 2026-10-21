"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

// Right side of the header: Log in / Sign up, or Account / Admin / Log out.
export default function UserMenu() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadRole(u, attempt = 0) {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", u.id).maybeSingle();
      if (cancelled) return;
      if (error && attempt < 2) return setTimeout(() => loadRole(u, attempt + 1), 1200);
      setRole(data?.role || "");
    }

    function apply(u) {
      setUser(u);
      if (!u) return setRole("");
      loadRole(u);
    }

    supabase.auth.getUser().then(({ data }) => !cancelled && apply(data.user));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => !cancelled && apply(session?.user ?? null), 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <Link href="/admin" className="rounded-full border border-cyan-400 px-4 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 transition">
            Admin
          </Link>
        )}
        <Link href="/account" className="btn-outline !px-4 !py-1.5 text-xs">
          Account
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
            Log out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="hidden rounded-full px-4 py-1.5 text-xs font-bold text-slate-300 hover:text-cyan-300 sm:block transition">
        Log in
      </Link>
      <Link href="/signup" className="btn-primary !px-5 !py-1.5 text-xs">
        Sign up
      </Link>
    </div>
  );
}
