// Clean, highly readable layout for text pages (about, contact, policies) in Cyber Obsidian.
export default function LegalPage({ title, updated, children }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-slate-400">Last updated: {updated}</p>}
      <div className="mt-8 space-y-4 text-base leading-relaxed text-slate-300 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:text-slate-300 [&_a]:text-cyan-400 [&_a]:underline hover:[&_a]:text-cyan-300">
        {children}
      </div>
    </article>
  );
}
