"use client";

import { useEffect, useState } from "react";

type LeetStats = {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number;
  streak: number;
  totalActiveDays: number;
  submissionCalendar: Record<string, number>;
};

type LangStat = { languageName: string; problemsSolved: number };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function calendarToWeeks(cal: Record<string, number>) {
  const dateMap: Record<string, number> = {};
  for (const [ts, count] of Object.entries(cal)) {
    const d = new Date(parseInt(ts) * 1000);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    dateMap[key] = (dateMap[key] ?? 0) + count;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - startDay.getDay() - 52 * 7);

  const maxCount = Math.max(1, ...Object.values(dateMap));
  const weeks: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[][] = [];
  let week: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];

  const cursor = new Date(startDay);
  while (cursor <= today) {
    const key = `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}-${pad2(cursor.getDate())}`;
    const count = dateMap[key] ?? 0;
    const ratio = count / maxCount;
    const level: 0 | 1 | 2 | 3 | 4 =
      count === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
    week.push({ date: key, count, level });
    if (week.length === 7) { weeks.push(week); week = []; }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
}

const LEVEL_COLORS = [
  "bg-surface-2 border-hairline",
  "bg-accent/20 border-accent/20",
  "bg-accent/40 border-accent/40",
  "bg-accent/65 border-accent/65",
  "bg-accent border-accent/80",
];

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function SubmissionHeatmap({ weeks }: { weeks: { date: string; count: number; level: 0|1|2|3|4 }[][] }) {
  const months: string[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const day = week[0];
    if (!day?.date) return;
    const m = new Date(day.date).getMonth();
    if (m !== lastMonth) { months[wi] = MONTH_ABBR[m]; lastMonth = m; }
    else months[wi] = "";
  });

  return (
    <div className="border border-hairline rounded-md bg-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-hairline font-mono text-[11px] text-text-dimmer flex justify-between">
        <span className="text-text-dim">submissions.log</span>
        <span>last 52 weeks</span>
      </div>
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-[3px] mb-1 ml-[18px]">
          {weeks.map((_, wi) => (
            <div key={wi} className="w-[11px] font-mono text-[8px] text-text-dimmer shrink-0">
              {months[wi] ?? ""}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] mr-1">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="h-[11px] w-[10px] font-mono text-[8px] text-text-dimmer leading-[11px]">
                {i % 2 === 1 ? d : ""}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const day = week[di];
                if (!day) return <div key={di} className="w-[11px] h-[11px]" />;
                return (
                  <div
                    key={di}
                    title={day.date ? `${day.date}: ${day.count} submissions` : ""}
                    className={`w-[11px] h-[11px] rounded-[2px] border ${LEVEL_COLORS[day.level]} shrink-0`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="font-mono text-[9px] text-text-dimmer">less</span>
          {LEVEL_COLORS.map((c, i) => (
            <div key={i} className={`w-[10px] h-[10px] rounded-[2px] border ${c}`} />
          ))}
          <span className="font-mono text-[9px] text-text-dimmer">more</span>
        </div>
      </div>
    </div>
  );
}

function DifficultyBar({ username, stats }: { username: string, stats: LeetStats }) {
  const segments = [
    { label: "Easy",   count: stats.easySolved,   color: "#22c55e" },
    { label: "Medium", count: stats.mediumSolved,  color: "#f59e0b" },
    { label: "Hard",   count: stats.hardSolved,    color: "#f87171" },
  ];
  const total = stats.easySolved + stats.mediumSolved + stats.hardSolved;

  const cx = 80, cy = 80, R = 68, r = 46, GAP = 0.03;
  let angle = -Math.PI / 2;

  const paths = segments.map((seg) => {
    const sweep = (seg.count / total) * (2 * Math.PI) - GAP;
    const end = angle + sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(angle),  y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(end),    y2 = cy + R * Math.sin(end);
    const ix1 = cx + r * Math.cos(end),   iy1 = cy + r * Math.sin(end);
    const ix2 = cx + r * Math.cos(angle), iy2 = cy + r * Math.sin(angle);
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z`;
    angle = end + GAP;
    return { ...seg, d };
  });

  return (
    <div className="border border-hairline rounded-md bg-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-hairline font-mono text-[11px] text-text-dimmer flex justify-between">
        <span className="text-text-dim">LeetCode.md</span>
        <div className="font-mono text-[11px] text-text-dimmer">
          <a href={`https://leetcode.com/${username}`} target="_blank" rel="noopener noreferrer"
            className="hover:text-accent transition-colors">
            leetcode.com/{username} →
          </a>
        </div>
      </div>
      <div className="px-4 py-4 flex items-center gap-6">
        {/* Donut */}
        <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0"
          role="img" aria-label="Donut chart of problems solved by difficulty">
          {paths.map((seg) => (
            <path key={seg.label} d={seg.d} fill={seg.color} opacity={0.9} />
          ))}
          <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle"
            fontSize="22" fontWeight="500" fill="currentColor" fontFamily="var(--font-mono)">
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="currentColor" opacity={0.5} fontFamily="var(--font-mono)">
            solved
          </text>
        </svg>
        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          {paths.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-text-dim flex-1">{seg.label}</span>
              <span className="text-text-dim">{seg.count}</span>
              <span className="text-text-dimmer w-8 text-right">
                {Math.round((seg.count / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LangBar({ langs }: { langs: LangStat[] }) {
  if (!langs.length) return null;
  const top = langs.slice(0, 6);
  const total = top.reduce((a, b) => a + b.problemsSolved, 0);
  const COLORS = ["bg-accent","bg-blue","bg-green","bg-accent/50","bg-blue/50","bg-text-dim"];
  return (
    <div className="border border-hairline rounded-md bg-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-hairline font-mono text-[11px] text-text-dimmer flex justify-between">
        <span className="text-text-dim">languages.json</span>
        <span>problems solved by language</span>
      </div>
      <div className="px-4 py-4">
        <div className="flex h-2 rounded-full overflow-hidden gap-[2px] mb-4">
          {top.map(({ languageName, problemsSolved }, i) => (
            <div key={languageName} className={`${COLORS[i]} rounded-full`}
              style={{ width: `${(problemsSolved / total) * 100}%` }} title={languageName} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4">
          {top.map(({ languageName, problemsSolved }, i) => (
            <div key={languageName} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLORS[i]}`} />
              <span className="font-mono text-[12px] text-text-dim">{languageName}</span>
              <span className="font-mono text-[11px] text-text-dimmer ml-auto">
                {Math.round((problemsSolved / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeetCodeStats({ username }: { username: string }) {
  const [stats, setStats] = useState<LeetStats | null>(null);
  const [langs, setLangs] = useState<LangStat[]>([]);
  const [heatmapWeeks, setHeatmapWeeks] = useState<{ date: string; count: number; level: 0|1|2|3|4 }[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leetcode");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setStats(data.stats);
        setLangs(data.langs ?? []);
        if (data.stats.submissionCalendar) {
          setHeatmapWeeks(calendarToWeeks(data.stats.submissionCalendar));
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load LeetCode data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 border border-hairline rounded-md bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="border border-hairline rounded-md p-6 bg-surface font-mono text-sm text-accent text-center">
        {error ?? "Could not load LeetCode stats."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <DifficultyBar username={username} stats={stats} />
      {langs.length > 0 && <LangBar langs={langs} />}
    </div>
  );
}
