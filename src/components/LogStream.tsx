"use client";

import { useState } from "react";

type LogLevel = "info" | "ok" | "warn";

type LogEntry = {
  ts: string;
  level: LogLevel;
  service: string;
  msg: string;
};

const logs: LogEntry[] = [
  { ts: "05-2026", level: "ok", service: "build", msg: "AI Agents for DBKlik" },
  { ts: "04-2026", level: "ok", service: "career", msg: "Fullstack internship at DBKlik" },
  { ts: "03-2026", level: "ok", service: "build", msg: "Book manager with Laravel" },
  { ts: "02-2026", level: "info", service: "study", msg: "Java Springboot" },
  { ts: "01-2026", level: "ok", service: "build", msg: "First portfolio website" },
  { ts: "12-2025", level: "info", service: "study", msg: "API, authentication, database, cache" },
  { ts: "10-2025", level: "info", service: "study", msg: "React stack" },
  { ts: "08-2025", level: "info", service: "study", msg: "HTML, CSS, JS stack" },
  { ts: "07-2025", level: "warn", service: "linux", msg: "Download wifi drivers & learned terminal" },
  { ts: "07-2025", level: "info", service: "linux", msg: "Learn and configured Arch linux" },
];

const levelColor: Record<LogLevel, string> = {
  info: "text-blue",
  ok: "text-green",
  warn: "text-accent",
};
const PAGE_SIZE = 12;

export default function LogStream() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleLogs = logs.slice(0, visibleCount);
  const hasMore = visibleCount < logs.length;

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
            load more ({logs.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
