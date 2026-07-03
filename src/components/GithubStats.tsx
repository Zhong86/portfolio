"use client";

import { useEffect, useState } from "react";

const API = "https://api.github.com";
const LAST_PROJ = 10; 

type Repo = {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  pushed_at: string;
  fork: boolean;
};

type UserData = {
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  avatar_url: string;
  bio: string | null;
};

type ContribDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};


const LEVEL_COLORS = [
  "bg-surface-2 border-hairline",
  "bg-accent/20 border-accent/20",
  "bg-accent/40 border-accent/40",
  "bg-accent/65 border-accent/65",
  "bg-accent border-accent/80",
];

function ContribHeatmap({ weeks }: { weeks: { contributionDays: ContribDay[] }[] }) {
  const months: string[] = [];
  const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const day = week.contributionDays[0];
    if (!day) return;
    const m = new Date(day.date).getMonth();
    if (m !== lastMonth) {
      months[wi] = MONTH_ABBR[m];
      lastMonth = m;
    } else {
      months[wi] = "";
    }
  });

  return (
    <div className="border border-hairline rounded-md bg-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-hairline font-mono text-[11px] text-text-dimmer flex justify-between">
        <span className="text-text-dim">contributions.log</span>
        <span>last 52 weeks</span>
      </div>
      <div className="px-4 py-4 overflow-x-auto">
        {/* Month labels */}
        <div className="flex gap-[3px] mb-1 ml-[18px]">
          {weeks.map((_, wi) => (
            <div key={wi} className="w-[11px] font-mono text-[8px] text-text-dimmer shrink-0">
              {months[wi] ?? ""}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="h-[11px] w-[10px] font-mono text-[8px] text-text-dimmer leading-[11px]">
                {i % 2 === 1 ? d : ""}
              </div>
            ))}
          </div>
          {/* Grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const day = week.contributionDays[di];
                if (!day) return <div key={di} className="w-[11px] h-[11px]" />;
                return (
                  <div
                    key={di}
                    title={`${day.date}: ${day.count} contributions`}
                    className={`w-[11px] h-[11px] rounded-[2px] border ${LEVEL_COLORS[day.level]} shrink-0`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
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

function LangBar({ langs }: { langs: Record<string, number> }) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const sorted = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, LAST_PROJ);

  const COLORS = [
    "bg-accent",
    "bg-blue",
    "bg-green",
    "bg-accent/50",
    "bg-blue/50",
    "bg-text-dim",
  ];

  return (
    <div className="border border-hairline rounded-md bg-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-hairline font-mono text-[11px] text-text-dimmer flex justify-between">
        <span className="text-text-dim">languages.json</span>
        <span>by last ${LAST_PROJ} updated repos</span>
      </div>
      <div className="px-4 py-4">
        {/* Bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-[2px] mb-4">
          {sorted.map(([lang, count], i) => (
            <div
              key={lang}
              className={`${COLORS[i]} rounded-full`}
              style={{ width: `${(count / total) * 100}%` }}
              title={lang}
            />
          ))}
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4">
          {sorted.map(([lang, count], i) => (
            <div key={lang} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLORS[i]}`} />
              <span className="font-mono text-[12px] text-text-dim">{lang}</span>
              <span className="font-mono text-[11px] text-text-dimmer ml-auto">
                {Math.round((count / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GithubStats({ username }: { username: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [langs, setLangs] = useState<Record<string, number>>({});
  const [contribWeeks, setContribWeeks] = useState<{ contributionDays: ContribDay[] }[]>([]);
  const [totalContribs, setTotalContribs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, reposRes] = await Promise.all([
          fetch(`${API}/users/${username}`),
          fetch('/api/github')
       ]);

        if (!userRes.ok || !reposRes.ok) throw new Error("GitHub API error");

        const userData: UserData = await userRes.json();
        const reposData: Repo[] = await reposRes.json();

        setUser(userData);

        const ownRepos = reposData.filter((r) => !r.fork);

        // Language aggregation
        const langCount: Record<string, number> = {};
        ownRepos.forEach((r) => {
          if (r.language) {
            langCount[r.language] = (langCount[r.language] ?? 0) + 1;
          }
        });
        setLangs(langCount);

        // We'll use the public contribution stats endpoint pattern
        try {
          const contribRes = await fetch(
            `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
          );
          if (contribRes.ok) {
            const contribData = await contribRes.json();
            // This API returns { total: {year: count}, contributions: [{date, count, level}] }
            const contributions: { date: string; count: number; level: number }[] =
              contribData.contributions ?? [];

            // Group into weeks
            const weeks: { contributionDays: ContribDay[] }[] = [];
            let week: ContribDay[] = [];

            contributions.forEach((c) => {
              const dayOfWeek = new Date(c.date).getDay(); // 0 = Sunday
              if (week.length === 0 && dayOfWeek !== 0) {
                // Pad front of first week
                for (let i = 0; i < dayOfWeek; i++) {
                  week.push({ date: "", count: 0, level: 0 });
                }
              }
              week.push({ date: c.date, count: c.count, level: c.level as 0 | 1 | 2 | 3 | 4 });
              if (week.length === 7) {
                weeks.push({ contributionDays: week });
                week = [];
              }
            });
            if (week.length > 0) weeks.push({ contributionDays: week });

            setContribWeeks(weeks);

            const yearKey = Object.keys(contribData.total ?? {}).find((k) => k !== "lastYear");
            const total = yearKey ? contribData.total[yearKey] : contribData.total?.lastYear ?? 0;
            setTotalContribs(typeof total === "number" ? total : 0);
          }
        } catch {
          // Contrib heatmap is optional — silently skip
        }
      } catch (e) {
        setError("Failed to load GitHub data.");
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

  if (error || !user) {
    return (
      <div className="border border-hairline rounded-md p-6 bg-surface font-mono text-sm text-accent text-center">
        {error ?? "Could not load GitHub stats."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {totalContribs > 0 && (
        <div className="flex justify-between border border-hairline rounded-md px-4 py-3 bg-surface font-mono text-[12px] text-text-dim ">
          <div className="flex items-center gap-2">
            <span className="text-accent font-semibold text-[15px]">{totalContribs}</span>
            <span>contributions in the last year</span>
          </div>

          <div className="font-mono text-[11px] text-text-dimmer text-right">
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              github.com/{username} →
            </a>
          </div>
        </div>
      )}

      {/* Heatmap */}
      {contribWeeks.length > 0 && <ContribHeatmap weeks={contribWeeks} />}

      {/* Language breakdown */}
      {Object.keys(langs).length > 0 && <LangBar langs={langs} />}
    </div>
  );
}
