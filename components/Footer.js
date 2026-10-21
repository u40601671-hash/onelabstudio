import Link from "next/link";
import { site } from "@/lib/site";

const explore = [
  { href: "/tools", label: "Tools & Utilities" },
  { href: "/videos", label: "Videos" },
  { href: "/about", label: "About & FAQs" },
];
const company = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

function Col({ title, items }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-slate-600 transition-colors hover:text-blue-600">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50/90">
      <div className="h-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-3 font-display text-2xl font-bold text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 font-display text-sm font-extrabold text-white shadow-md shadow-blue-500/20">
              OL
            </span>
            {site.name}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
            A versatile suite of creative tools, media utilities, audio assets, and a collaborative community for creators, developers, designers, and digital builders.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>All systems operational • 100% Client-Side WebAssembly</span>
          </div>
        </div>
        <Col title="Explore" items={explore} />
        <Col title="Company" items={company} />
      </div>
      <div className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {site.name}. All rights reserved. Built for creators and builders worldwide.
      </div>
    </footer>
  );
}
