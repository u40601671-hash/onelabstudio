import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { toggleAccess, toggleStatus, deleteTool } from "@/app/admin/actions";
import ConfirmButton from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

const typeLabel = { js: "JavaScript", python: "Python", download: "Download" };

export default async function AdminTools({ searchParams }) {
  const session = await requireAdmin("/admin/tools");
  if (!session.configured) return null;
  const { data: tools, error } = await createClient()
    .from("tools")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Tools</h1>
          <p className="mt-1 text-slate-700">Add tools, switch them between Free and Paid, and choose what is live.</p>
        </div>
        <Link href="/admin/tools/new" className="btn-primary !py-2.5 text-sm">
          + Add tool
        </Link>
      </div>

      {searchParams?.saved && <p role="status" className="mt-6 rounded-xl bg-emerald-50 px-5 py-3 font-semibold text-emerald-800">Saved. The website is updated.</p>}
      {searchParams?.deleted && <p role="status" className="mt-6 rounded-xl bg-emerald-50 px-5 py-3 font-semibold text-emerald-800">Tool deleted.</p>}
      {(searchParams?.error || error) && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-5 py-3 font-semibold text-red-700">{searchParams?.error || error.message}</p>
      )}

      <div className="card mt-8 overflow-x-auto !p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-5 py-3">Tool</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Access</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(tools || []).map((t) => (
              <tr key={t.id} className="align-middle">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile !h-10 !w-10 !text-xl">{t.icon}</span>
                    <div>
                      <p className="font-bold text-ink">{t.name}</p>
                      <p className="text-xs text-slate-600">{t.category} · /{t.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 font-semibold text-slate-700">{typeLabel[t.type]}</td>
                <td className="px-3 py-3.5">
                  <form action={toggleAccess}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="to" value={t.access === "free" ? "paid" : "free"} />
                    <button
                      type="submit"
                      title={t.access === "free" ? "Click to make this tool Paid" : "Click to make this tool Free"}
                      className={`rounded-full px-3.5 py-1 text-xs font-bold ring-1 ${t.access === "free" ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100" : "bg-orange-100 text-orange-800 ring-orange-300 hover:bg-orange-200"}`}
                    >
                      {t.access === "free" ? "FREE" : "PAID"}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-3.5">
                  <form action={toggleStatus}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="to" value={t.status === "live" ? "draft" : "live"} />
                    <button
                      type="submit"
                      title={t.status === "live" ? "Click to hide this tool (draft)" : "Click to publish this tool"}
                      className={`rounded-full px-3.5 py-1 text-xs font-bold ring-1 ${t.status === "live" ? "bg-brand-50 text-brand-700 ring-brand-200 hover:bg-brand-100" : "bg-slate-100 text-slate-700 ring-slate-300 hover:bg-slate-200"}`}
                    >
                      {t.status === "live" ? "LIVE" : "DRAFT"}
                    </button>
                  </form>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/tools/${t.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-800 hover:border-brand-600 hover:text-brand-700">
                      Edit
                    </Link>
                    <form action={deleteTool}>
                      <input type="hidden" name="id" value={t.id} />
                      <ConfirmButton message={`Delete "${t.name}"? This cannot be undone.`} className="rounded-lg border border-red-200 px-3 py-1.5 font-bold text-red-700 hover:bg-red-50">
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(!tools || tools.length === 0) && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-600">
                  No tools yet. Run <code className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold">supabase/schema.sql</code> to add the 12 sample tools, or click &ldquo;Add tool&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
