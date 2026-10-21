import Link from "next/link";
import { posts } from "@/lib/posts";

export const metadata = {
  title: "Blog & Guides",
  description: "Guides on digital creation, media workflows, design, and automation for creators and developers.",
  alternates: { canonical: "/blog" },
};

export default function Blog() {
  return (
    <section className="wrap py-12">
      <span className="eyebrow">GUIDES &amp; ARTICLES</span>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">Journal &amp; Knowledge</h1>
      <p className="mt-2 text-base text-slate-600">Practical guides on digital creation, media workflows, design, and automation.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="card group flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">{p.date}</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.excerpt}</p>
            </div>
            <p className="mt-4 text-xs font-bold text-blue-600 group-hover:underline">Read Guide →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
