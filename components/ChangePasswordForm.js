"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = String(new FormData(form).get("password") || "");
    if (password.length < 8) return setMsg({ type: "error", text: "Your new password must be at least 8 characters." });
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setMsg({ type: "error", text: error.message });
    form.reset();
    setMsg({ type: "ok", text: "Password updated successfully." });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition"
        />
      </label>
      {msg.text && (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold border ${msg.type === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary !py-2.5 text-sm disabled:opacity-60">
        {busy ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}
