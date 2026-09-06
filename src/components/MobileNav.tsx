"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";

export default function MobileNav() {
  const pathname = usePathname();
  const linkTargets = navItems.filter((item) => item.href !== "/");

  return (
    <nav className="md:hidden sticky top-0 z-10 border-b border-hairline bg-bg/90 backdrop-blur-sm">
      <div className="flex items-center justify-between h-14 px-6">
        <Link href="/" className="font-mono text-xs text-text-dim shrink-0">
          ~/<span className="text-accent">Zhong86</span>/portfolio
        </Link>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-[11px] text-accent border border-accent rounded-md px-2 py-1"
          >
            resume.pdf
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </a>
          <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_var(--color-green)]" />
        </div>
      </div>

      {/* Scrollable page links row */}
      <div className="flex overflow-x-auto scrollbar-none border-t border-hairline px-4 gap-1">
        {linkTargets.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-sfx="move"
            className={`
              shrink-0 px-4 py-2 font-mono text-xs whitespace-nowrap
              border-b-2 transition-colors
              ${
                pathname === item.href
                  ? "border-accent text-text font-semibold"
                  : "border-transparent text-text-dim hover:text-text"
              }
            `}
          >
            {item.navLabel}
          </Link>
        ))}
      </div>
    </nav>
  );
}
