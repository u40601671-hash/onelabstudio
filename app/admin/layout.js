import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import SetupNotice from "@/components/SetupNotice";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/videos", label: "Videos" },
];

export default async function AdminLayout({ children }) {
  const session = await requireAdmin();

  if (!session.configured) {
    return (
      <section className="wrap py-16">
        <h1 className="text-4xl font-extrabold">Admin panel</h1>
        <SetupNotice className="mt-6 max-w-2xl" />
      </section>
    );
  }

  return (
    <div className="wrap grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <aside>
        <div className="card !p-4">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Admin</p>
          <nav className="flex gap-1 lg:flex-col" aria-label="Admin">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 font-bold text-slate-800 hover:bg-brand-50 hover:text-brand-700">
                {n.label}
              </Link>
            ))}
            <Link href="/" className="rounded-lg px-3 py-2 font-bold text-slate-600 hover:bg-slate-50 lg:mt-3 lg:border-t lg:border-slate-100 lg:pt-4">
              ← Back to site
            </Link>
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
