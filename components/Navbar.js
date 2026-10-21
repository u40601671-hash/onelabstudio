import Link from "next/link";
import Icon from "@/components/Icon";
import UserMenu from "@/components/UserMenu";

const links = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tools" },
  { href: "/videos", label: "Videos" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <nav className="wrap flex items-center justify-between gap-6 py-3.5" aria-label="Main">
        <Link href="/" className="flex shrink-0 items-center gap-3 font-display text-xl font-bold text-slate-900 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 font-display text-sm font-extrabold tracking-wide text-white ring-2 ring-blue-500/20 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
            OL
          </span>
          <span className="tracking-tight text-slate-900">
            One Lab <span className="text-blue-600 font-extrabold">Studio</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-blue-600">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <form
            action="/tools"
            method="get"
            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 lg:flex transition shadow-xs"
          >
            <span className="text-slate-400">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              name="q"
              aria-label="Search tools"
              placeholder="Search tools &amp; utilities..."
              className="w-36 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </form>
          <UserMenu />
        </div>
      </nav>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-slate-100 py-2 text-sm font-semibold text-slate-600 md:hidden bg-white/95">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-blue-600">
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
