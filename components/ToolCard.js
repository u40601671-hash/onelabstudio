import Link from "next/link";
import ToolArt from "@/components/ToolArt";

export default function ToolCard({ tool }) {
  const paid = tool.access === "paid";
  const href = `/tools/${tool.slug}`;
  return (
    <div className="card group flex h-full flex-col overflow-hidden !p-0 border border-slate-200/90 bg-white shadow-sm hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
      <Link href={href} className="relative block w-full aspect-video overflow-hidden bg-slate-100 border-b border-slate-100" aria-label={`Open ${tool.name}`}>
        <ToolArt tool={tool} className="w-full h-full" />
        <span
          className={`absolute left-3 top-3 rounded-md px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-md backdrop-blur-md ${
            paid ? "bg-amber-600/90" : "bg-emerald-600/90"
          }`}
        >
          {paid ? "PRO" : "FREE"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">{tool.category}</p>
        <h3 className="mt-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
          <Link href={href}>{tool.name}</Link>
        </h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{tool.desc}</p>
        <Link
          href={href}
          className={`btn mt-5 w-full !py-2.5 text-xs font-bold ${
            paid
              ? "btn-outline"
              : "btn-primary"
          }`}
        >
          {paid ? "Unlock with Pro" : "Open Tool →"}
        </Link>
      </div>
    </div>
  );
}
