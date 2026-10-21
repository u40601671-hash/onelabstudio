import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function count(query) {
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminDashboard() {
  const session = await requireAdmin("/admin"); // pages guard themselves: layouts and pages render in parallel
  if (!session.configured) return null;
  const supabase = createClient();
  const all = () => supabase.from("tools").select("*", { count: "exact", head: true });
  const [total, live, paid, users] = await Promise.all([
    count(all()),
    count(all().eq("status", "live")),
    count(all().eq("access", "paid")),
    count(supabase.from("profiles").select("*", { count: "exact", head: true })),
  ]);

  const cards = [
    { label: "Tools in total", value: total },
    { label: "Live on the website", value: live },
    { label: "Paid (Pro) tools", value: paid },
    { label: "Registered users", value: users },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Dashboard</h1>
      <p className="mt-1 text-slate-700">A quick look at your studio.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card !p-6">
            <p className="font-display text-4xl font-extrabold text-brand-700">{c.value}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-8 !p-7">
        <h2 className="text-xl font-bold">What do you want to do?</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/tools/new" className="btn-primary !py-2.5 text-sm">
            Add a new tool
          </Link>
          <Link href="/admin/tools" className="btn-outline !py-2.5 text-sm">
            Manage tools
          </Link>
        </div>
      </div>
    </div>
  );
}
