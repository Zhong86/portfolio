"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";
import buildInfo from '@/lib/build-info.json';
import { useState, useEffect } from "react";

const UPTIME_START = new Date("2026-06-19T00:00:00Z").getTime(); 

function formatUptime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [uptime, setUptime] = useState("");

  useEffect(() => {
    const tick = () => setUptime(formatUptime(Date.now() - UPTIME_START));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

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
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded mb-0.5 transition-colors ${isActive
                  ? "text-accent bg-accent-dim"
                  : "text-text-dim hover:text-text hover:bg-surface"
                }`}
            >
              <span className="text-text-dimmer">{branch}</span> {item.fileLabel}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto font-mono text-[14px] text-text-dimmer leading-[1.7]">
        <div className="mb-3">
          <div>branch: main</div>
          <div>commit: a3f9c2e</div>
        </div>
        <div>uptime: {uptime}</div>
        <div>last deployed {buildInfo.date}</div>
      </div>
    </aside>
  );
}
