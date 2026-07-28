"use client";

import { EXPERIENCES, LogLevel } from "@/lib/config";
import { useState } from "react";

const levelColor: Record<LogLevel, string> = {
  info: "text-blue",
  ok: "text-green",
  warn: "text-accent",
};
const PAGE_SIZE = 12;

export default function LogStream() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleLogs = EXPERIENCES.slice(0, visibleCount);
  const hasMore = visibleCount < EXPERIENCES.length;

 return (
    <div className="bg-surface border border-hairline rounded-md overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-hairline font-mono text-[11px] text-text-dimmer">
        <span className="text-text-dim">career.log</span>
        <span>tail -f</span>
      </div>
      <div className="py-3.5">
        {visibleLogs.map((l, i) => (
          <div
            key={i}
            className="flex gap-3 px-4 py-1.5 font-mono text-[12.5px] opacity-0 animate-fade-in-up flex-wrap sm:flex-nowrap sm:whitespace-nowrap hover:bg-surface-2"
            style={{ animationDelay: `${(i % PAGE_SIZE) * 0.12}s` }}
          >
            <span className="text-text-dimmer shrink-0">{l.ts}</span>
            <span className={`shrink-0 w-[50px] font-semibold ${levelColor[l.level]}`}>
              {l.level.toUpperCase()}
            </span>
            <span className="text-text-dim shrink-0 w-[40px]">{l.service}</span>
            <span className="text-text overflow-hidden text-ellipsis whitespace-nowrap min-w-5 sm:flex-1 basis-full sm:pl-0 -mt-0.5 sm:mt-0">
              {l.msg}
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="border-t border-hairline px-4 py-3 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors uppercase tracking-wide"
          >
            load more ({EXPERIENCES.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
