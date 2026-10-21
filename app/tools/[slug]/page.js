import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ToolArt from "@/components/ToolArt";
import { getTools } from "@/lib/getTools";
import { getSession } from "@/lib/auth";
import { runners } from "@/components/tools/registry";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const tool = (await getTools()).find((t) => t.slug === params.slug);
  if (!tool) return { title: "Tool not found" };
  return { title: tool.name, description: tool.desc, alternates: { canonical: `/tools/${tool.slug}` } };
}

function HowItWorks({ steps }) {
  return (
    <div className="mt-10 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <h2 className="font-display text-xl font-bold text-slate-900">How it works</h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 font-semibold text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-xs">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function ToolPage({ params }) {
  const tools = await getTools();
  const tool = tools.find((t) => t.slug === params.slug);
  if (!tool) notFound();

  const paid = tool.access === "paid";
  const session = await getSession();

  const loggedIn = !session.configured || Boolean(session.user);
  const isPro = !session.configured || session.profile?.plan === "pro" || session.profile?.role === "admin";
  const gate = !loggedIn ? "signup" : paid && !isPro ? "pro" : null;

  const runner = runners[tool.slug];
  const here = `/tools/${tool.slug}`;

  const wide = Boolean(runner?.wide && !gate);

  return (
    <div className={wide ? "mx-auto w-full max-w-[1800px] px-3 py-6 sm:px-5" : "wrap py-10"}>
      <Link href="/tools" className="text-xs font-bold text-blue-600 hover:underline">
        ← All AI tools
      </Link>

      <header className="mt-5 flex flex-wrap items-center gap-5">
        <span className="icon-tile !h-16 !w-16 !text-4xl shadow-md shadow-blue-500/10">{tool.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-extrabold text-slate-900">{tool.name}</h1>
            <span
              className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white shadow-xs ${
                paid ? "bg-amber-600" : "bg-emerald-600"
              }`}
            >
              {paid ? "PRO" : "FREE"}
            </span>
          </div>
          <p className="mt-1 text-base text-slate-600">{tool.desc}</p>
        </div>
      </header>

      <section className="mt-10">
        {gate === "signup" && (
          <>
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200/90 bg-white p-10 text-center shadow-md">
              <ToolArt tool={tool} className="mx-auto h-36 w-60 overflow-hidden rounded-2xl ring-1 ring-slate-200 shadow-sm" />
              <h2 className="mt-6 font-display text-3xl font-extrabold text-slate-900">Sign up free to use {tool.name}</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
                Create your free account in under a minute. No credit card required. It unlocks every free tool on One Lab Studio.
              </p>
              <ul className="mx-auto mt-5 flex max-w-md flex-col gap-2 text-left text-sm font-semibold text-slate-700">
                {["All free tools, free forever", "Join the community and save your work", "Takes under a minute, just your name, email and password"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                      <Icon name="check" className="h-3 w-3" strokeWidth={3.2} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={`/signup?next=${encodeURIComponent(here)}`} className="btn-primary !px-8">
                  Create free account
                </Link>
                <Link href={`/login?next=${encodeURIComponent(here)}`} className="btn-outline">
                  I already have an account
                </Link>
              </div>
            </div>
            {runner && <HowItWorks steps={runner.steps} />}
          </>
        )}

        {gate === "pro" && (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200/90 bg-white p-10 text-center shadow-md">
            <ToolArt tool={tool} className="mx-auto h-36 w-60 overflow-hidden rounded-2xl ring-1 ring-slate-200 shadow-sm" />
            <h2 className="mt-6 font-display text-3xl font-extrabold text-slate-900">This is a Pro tool</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
              {tool.name} is part of the Pro plan. Pro is coming soon, and the free tools stay free. You are already signed up, so we will let you know the moment it launches.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/#pricing" className="btn-primary">See the Pro plan</Link>
              <Link href="/tools" className="btn-outline">Browse free tools</Link>
            </div>
          </div>
        )}

        {!gate && runner && (
          <>
            <runner.Component tool={tool} />
            <HowItWorks steps={runner.steps} />
          </>
        )}

        {!gate && !runner && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-10 text-center text-slate-600 shadow-xs">
            Tool interface is loading...
          </div>
        )}
      </section>
    </div>
  );
}
