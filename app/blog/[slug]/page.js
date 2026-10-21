import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/lib/posts";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.date },
  };
}

export default function Post({ params }) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
  };

  return (
    <div className="wrap grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl">
        <Link href="/blog" className="text-xs font-bold text-blue-600 hover:underline">
          ← Back to journal
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{post.title}</h1>
        <p className="mt-2 text-xs font-semibold text-slate-500">Published on {post.date}</p>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-700">
          {post.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <div className="mt-12 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/60 p-8 text-center shadow-xs">
          <h2 className="font-display text-2xl font-bold text-slate-900">Try our free tools</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Put these ideas to work with fast, browser-based tools built for your creative projects.</p>
          <Link href="/tools" className="btn-primary mt-6 !px-8">
            Explore Free Tools →
          </Link>
        </div>
      </article>
      <aside className="space-y-4">
        <div className="card">
          <h2 className="font-display text-base font-bold text-slate-900">More Guides</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {posts.filter((p) => p.slug !== post.slug).map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="font-semibold text-slate-600 hover:text-blue-600 transition">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
