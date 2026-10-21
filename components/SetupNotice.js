// Shown when the database is not connected yet.
export default function SetupNotice({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-amber-500/40 bg-amber-500/15 p-5 text-sm text-amber-200 backdrop-blur-md ${className}`}>
      <p className="font-bold text-white">The database is not connected yet</p>
      <p className="mt-1 leading-relaxed">
        Login and the admin panel need Supabase. Open <code className="rounded bg-black/40 px-1.5 py-0.5 font-semibold text-amber-300">SETUP.md</code> in the
        project folder, follow the 4 short steps, and add your two keys to <code className="rounded bg-black/40 px-1.5 py-0.5 font-semibold text-amber-300">.env.local</code>.
      </p>
    </div>
  );
}
