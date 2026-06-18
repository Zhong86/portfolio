"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";

export default function MobileNav() {
  const pathname = usePathname();
  const linkTargets = navItems.filter((item) => item.href !== "/");

  return (
    <nav className="md:hidden sticky top-0 z-10 border-b border-hairline bg-bg/90 backdrop-blur-sm">
      <div className="flex justify-between items-center h-14 px-6">
        <Link href="/" className="font-mono text-xs text-text-dim">
          ~/<span className="text-accent">Zhong86</span>/portfolio
        </Link>
        <div className="flex gap-4 font-mono text-xs text-text-dim">
          {linkTargets.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "text-text font-semibold" : "hover:text-text"}
            >
              {item.navLabel}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-green">
          <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_var(--color-green)]" />
        </div>
      </div>
    </nav>
  );
}
