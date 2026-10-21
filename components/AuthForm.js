"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";
import SetupNotice from "@/components/SetupNotice";

const copy = {
  login: { title: "Welcome back", sub: "Log in to your One Lab Studio account.", button: "Log in" },
  signup: { title: "Create your free account", sub: "Join the studio. Save your work and explore all free tools.", button: "Create free account" },
  forgot: { title: "Reset your password", sub: "Enter your email and we will send you a reset link.", button: "Send reset link" },
};

export default function AuthForm({ mode = "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const t = copy[mode] || copy.login;

  function safeNext() {
    return next.startsWith("/") ? next : "/";
  }

  useEffect(() => {
    setError("");
    setDone("");
  }, [mode]);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setDone("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();

    if (!email) return setError("Enter your email address.");
    if (mode !== "forgot" && password.length < 8) return setError("Your password must be at least 8 characters.");

    setBusy(true);
    const supabase = createClient();
    const origin = window.location.origin;
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(safeNext());
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name || email.split("@")[0] }, emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext())}` },
        });
        if (error) throw error;
        if (data.session) {
          router.push(safeNext());
          router.refresh();
        } else {
          setDone("Almost there! Check your email and click the confirmation link to finish.");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/account` });
        if (error) throw error;
        setDone("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const query = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  const input = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition";

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16">
      <div className="card !p-8 shadow-md">
        <h1 className="font-display text-3xl font-extrabold text-slate-900">{t.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.sub}</p>

        {!supabaseConfigured && <SetupNotice className="mt-6" />}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {mode === "signup" && (
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Your name
              <input name="name" autoComplete="name" placeholder="Alex Morgan" className={input} />
            </label>
          )}
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Email
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" className={input} />
          </label>
          {mode !== "forgot" && (
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
              <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" className={input} />
            </label>
          )}

          {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 border border-red-200">{error}</p>}
          {done && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 border border-emerald-200">{done}</p>}

          <button type="submit" disabled={busy || !supabaseConfigured} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 !py-3 mt-2">
            {busy ? "Please wait..." : t.button}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-xs font-semibold text-slate-600">
          {mode === "login" && (
            <>
              <p>
                <Link href={`/forgot-password${query}`} className="text-blue-600 hover:underline">Forgot your password?</Link>
              </p>
              <p>
                New here? <Link href={`/signup${query}`} className="text-blue-600 hover:underline">Create a free account</Link>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p>
              Already a member? <Link href={`/login${query}`} className="text-blue-600 hover:underline">Log in</Link>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              Remembered it? <Link href={`/login${query}`} className="text-blue-600 hover:underline">Back to log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
