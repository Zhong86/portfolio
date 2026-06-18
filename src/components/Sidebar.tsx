"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[250px] shrink-0 sticky top-0 h-[calc(100vh-52px)] border-r border-hairline px-[22px] py-7 flex-col">
      <div className="font-mono text-[13px] text-text-dim mb-1">
        ~/<span className="text-accent">Zhong86</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-green mb-9">
        <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_var(--color-green)]" />
        available for work
      </div>

      <nav className="font-mono text-[13px]">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          const branch = i === navItems.length - 1 ? "└─" : "├─";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded mb-0.5 transition-colors ${
                isActive
                  ? "text-accent bg-accent-dim"
                  : "text-text-dim hover:text-text hover:bg-surface"
              }`}
            >
              <span className="text-text-dimmer">{branch}</span> {item.fileLabel}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto font-mono text-[11px] text-text-dimmer leading-[1.7]">
        last deployed 2026-06-18
      </div>
    </aside>
  );
}
