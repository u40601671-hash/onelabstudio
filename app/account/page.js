import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SetupNotice from "@/components/SetupNotice";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Account({ searchParams }) {
  const { configured, user, profile } = await getSession();

  if (!configured) {
    return (
      <section className="wrap py-16">
        <h1 className="text-4xl font-extrabold text-white">Your account</h1>
        <SetupNotice className="mt-6 max-w-2xl" />
      </section>
    );
  }
  if (!user) redirect("/login?next=/account");

  const isAdmin = profile?.role === "admin";
  const plan = profile?.plan || "free";

  return (
    <section className="wrap py-14">
      <span className="eyebrow">ACCOUNT SETTINGS</span>
      <h1 className="mt-2 text-4xl font-extrabold text-white">Hi, {profile?.display_name || user.email}</h1>
      <p className="mt-2 text-base text-slate-300">Manage your profile, preferences, and subscription plan.</p>

      {searchParams?.denied && (
        <p role="alert" className="mt-6 max-w-2xl rounded-xl bg-red-500/20 px-5 py-4 font-semibold text-rose-300 border border-rose-500/30">
          That area is for admins only.
        </p>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card !p-8">
          <h2 className="font-display text-xl font-bold text-white">Profile Details</h2>
          <dl className="mt-6 space-y-4 text-slate-300">
            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
              <dt className="font-semibold text-slate-400">Name</dt>
              <dd className="font-bold text-white">{profile?.display_name || "Not set"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
              <dt className="font-semibold text-slate-400">Email</dt>
              <dd className="font-bold text-white">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
              <dt className="font-semibold text-slate-400">Plan</dt>
              <dd>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan === "pro" ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40" : "bg-blue-500/20 text-sky-400 ring-1 ring-blue-500/40"}`}>
                  {plan === "pro" ? "PRO CREATOR" : "FREE TIER"}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-slate-400">Role</dt>
              <dd className="font-bold text-white">{isAdmin ? "Team Admin" : "Member"}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAdmin && (
              <Link href="/admin" className="btn-primary !py-2.5 text-sm">
                Open Admin Panel →
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-outline !py-2.5 text-sm">
                Log Out
              </button>
            </form>
          </div>
        </div>

        <div className="card !p-8">
          <h2 className="font-display text-xl font-bold text-white">Security & Password</h2>
          <p className="mt-1 mb-6 text-sm text-slate-300">Pick a new secure password for your account.</p>
          <ChangePasswordForm />
        </div>
      </div>
    </section>
  );
}
