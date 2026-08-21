"use client";

import { Category, WEEKLY_TO_OVERALL_MAP, CATEGORIES, TARGET_DATE, WEEKLY_GOALS, DOCS_LINK, TOP_GOALS } from "@/lib/config";
import { useEffect, useMemo, useState } from "react";


function formatCountdown(ms: number) {
  const clamped = Math.max(ms, 0);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

/** Monday 00:00 (local time) of the week containing `date`. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function sudoToken(): string {
  return localStorage.getItem("sudoToken") ?? "";
}

async function fetchGoalsProgress(): Promise<Record<string, number>> {
  const res = await fetch("/api/goals-progress");
  if (!res.ok) return {};
  const data = await res.json();
  return data.values ?? {};
}

async function saveGoalsValue(id: string, value: number): Promise<boolean> {
  try {
    const res = await fetch("/api/goals-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sudo-token": sudoToken(),
      },
      body: JSON.stringify({ id, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchWeeklyProgress(): Promise<{ weekKey: string; values: Record<string, number> }> {
  const res = await fetch("/api/weekly-progress");
  if (!res.ok) return { weekKey: "", values: {} };
  return res.json();
}

async function saveWeeklyValue(id: string, value: number): Promise<boolean> {
  try {
    const res = await fetch("/api/weekly-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sudo-token": sudoToken(),
      },
      body: JSON.stringify({ id, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function CounterCard({
  category,
  value,
  isSudo,
  allowOverflow = false,
  onChange,
}: {
  category: Category;
  value: number;
  isSudo: boolean;
  /** Let the stored count run past the target — the surplus rolls into next week. */
  allowOverflow?: boolean;
  onChange: (id: string, next: number) => void;
}) {
  const pct = Math.min(100, Math.round((value / category.target) * 100));

  function clampSet(next: number) {
    const safe = Number.isFinite(next) ? next : 0;
    const clamped = Math.max(0, allowOverflow ? safe : Math.min(category.target, safe));
    onChange(category.id, clamped);
  }

  return (
    <div className="border border-hairline rounded-md bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] text-text">{category.label}</span>
        <span className="font-mono text-[11px] text-text-dimmer">{pct}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[11px] text-text-dimmer">
        <span>{category.unit}</span>

        {isSudo ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => clampSet(value - 1)}
              className="w-5 h-5 flex items-center justify-center rounded border border-hairline text-text-dimmer hover:text-accent hover:border-accent transition-colors"
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                clampSet(digitsOnly === "" ? 0 : Number(digitsOnly));
              }}
              className="w-12 bg-surface-2 border border-hairline rounded px-1 py-0.5 text-center text-text outline-none focus:border-accent/60"
            />
            <span>/ {category.target}</span>
            <button
              onClick={() => clampSet(value + 1)}
              className="w-5 h-5 flex items-center justify-center rounded border border-hairline text-text-dimmer hover:text-accent hover:border-accent transition-colors"
            >
              +
            </button>
          </div>
        ) : (
          <span className="text-text-dim">
            {value} / {category.target}
          </span>
        )}
      </div>
    </div>
  );
}

function CountdownRow({
  countdown,
  size = "lg",
}: {
  countdown: { days: number; hours: number; minutes: number; seconds: number } | null;
  size?: "lg" | "sm";
}) {
  const isLg = size === "lg";
  const units = [
    { label: "days", value: countdown?.days ?? null },
    { label: "hrs", value: countdown?.hours ?? null },
    { label: "min", value: countdown?.minutes ?? null },
    { label: "sec", value: countdown?.seconds ?? null },
  ];

  return (
    <div className={`flex ${isLg ? "gap-3 sm:gap-4" : "gap-2.5 sm:gap-3"} shrink-0`}>
      {units.map((unit) => (
        <div
          key={unit.label}
          className={`flex flex-col items-center justify-center border border-hairline rounded-md bg-surface-2 ${isLg ? "w-14 sm:w-16 py-2.5" : "w-12 sm:w-14 py-2"
            }`}
        >
          <span
            className={`font-mono text-accent font-semibold ${isLg ? "text-[18px] sm:text-[20px]" : "text-[15px] sm:text-[17px]"
              }`}
          >
            {unit.value === null ? "--" : String(unit.value).padStart(2, "0")}
          </span>
          <span
            className={`font-mono text-text-dimmer uppercase tracking-wide ${isLg ? "text-[9px]" : "text-[8.5px]"
              }`}
          >
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GoalsTracker() {
  // `now` stays null until mounted so server and first client render match (avoids hydration mismatch).
  const [now, setNow] = useState<number | null>(null);
  const [isSudo, setIsSudo] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [progressLoading, setProgressLoading] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState<Record<string, number>>({});
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  useEffect(() => {
    setIsSudo(localStorage.getItem("sudoUnlocked") === "true");

    fetchGoalsProgress()
      .then((values) => setProgress(values))
      .finally(() => setProgressLoading(false));

    fetchWeeklyProgress()
      .then(({ values }) => setWeeklyProgress(values))
      .finally(() => setWeeklyLoading(false));

    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);

    const handler = () => setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    window.addEventListener("sudo-unlocked", handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener("sudo-unlocked", handler);
    }
  }, []);

  function updateCategory(id: string, next: number) {
    // Optimistic update, then persist to KV.
    setProgress((prev) => ({ ...prev, [id]: next }));
    saveGoalsValue(id, next).then((ok) => {
      if (!ok) {
        fetchGoalsProgress().then((values) => setProgress(values));
      }
    });
  }

  function updateWeeklyCategory(id: string, next: number) {
    const prev = weeklyProgress[id] ?? 0;
    const delta = next - prev;

    // Optimistic weekly update, then persist to KV.
    setWeeklyProgress((prevState) => ({ ...prevState, [id]: next }));
    saveWeeklyValue(id, next).then((ok) => {
      if (!ok) {
        fetchWeeklyProgress().then(({ values }) => setWeeklyProgress(values));
      }
    });

    // Mirror the delta into the linked overall category, if one exists.
    const overallId = WEEKLY_TO_OVERALL_MAP[id];
    if (overallId && delta !== 0) {
      const overallCat = CATEGORIES.find((c) => c.id === overallId);
      if (overallCat) {
        setProgress((prevState) => {
          const current = prevState[overallId] ?? 0;
          const nextOverall = Math.max(0, Math.min(overallCat.target, current + delta));
          saveGoalsValue(overallId, nextOverall).then((ok) => {
            if (!ok) {
              fetchGoalsProgress().then((values) => setProgress(values));
            }
          });
          return { ...prevState, [overallId]: nextOverall };
        });
      }
    }
  }

  const countdown = now === null ? null : formatCountdown(TARGET_DATE - now);

  const weekEnd = useMemo(() => {
    if (now === null) return null;
    const start = getWeekStart(new Date(now));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return end.getTime();
  }, [now]);

  const weeklyCountdown = now === null || weekEnd === null ? null : formatCountdown(weekEnd - now);

  const overallPct = useMemo(() => {
    const totals = CATEGORIES.reduce(
      (acc, cat) => {
        const current = Math.min(progress[cat.id] ?? 0, cat.target);
        acc.current += current;
        acc.target += cat.target;
        return acc;
      },
      { current: 0, target: 0 }
    );
    if (totals.target === 0) return 0;
    return Math.round((totals.current / totals.target) * 100);
  }, [progress]);

  const weeklyOverallPct = useMemo(() => {
    const totals = WEEKLY_GOALS.reduce(
      (acc, cat) => {
        const current = Math.min(weeklyProgress[cat.id] ?? 0, cat.target);
        acc.current += current;
        acc.target += cat.target;
        return acc;
      },
      { current: 0, target: 0 }
    );
    if (totals.target === 0) return 0;
    return Math.round((totals.current / totals.target) * 100);
  }, [weeklyProgress]);

  return (
    <div className="flex flex-col gap-8">
      {/* Final goal + countdown */}
      <div className="border border-hairline 
      rounded-md bg-surface overflow-hidden
      transition-all duration-200
      hover:border-accent/70
    hover:shadow-[0_0_0_1px_var(--color-accent),0_0_20px_2px_rgba(var(--color-accent-rgb,255,153,0),0.2)]
      ">
        <a href={DOCS_LINK} target="_blank" rel="noopener noreferrer">
          <div className="px-4 py-2.5 border-b border-hairline font-mono text-[11px] text-text-dimmer flex justify-between">
            <span className="text-text-dim">final_goal.env</span>
            <span>target: 01-2028</span>
          </div>
          <div className="px-5 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide mb-1">
                mission
              </div>
              <div className="font-mono text-[20px] sm:text-[24px] text-text font-medium">
                Land an <span className="text-accent">AWS Backend Internship</span>
              </div>
              <div className="font-mono text-[12px] text-text-dim mt-1">
                Java 21 · Spring Boot 4 · PostgreSQL · AWS — Semester 6 roadmap
              </div>
            </div>

            <CountdownRow countdown={countdown} size="lg" />
          </div>

          {/* Overall progress */}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between font-mono text-[11px] text-text-dimmer mb-1.5">
              <span>overall progress</span>
              <span className="text-accent">{overallPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </a>
      </div>

      {/* Top priorities */}
      <div>
        <div className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide mb-3">
          top priorities
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOP_GOALS.map((goal) => (
            <div
              key={goal.num}
              className="border border-hairline rounded-md bg-surface p-4 flex flex-col gap-2"
            >
              <span className="font-mono text-[11px] text-accent">{goal.num}</span>
              <span className="font-mono text-[13.5px] text-text font-medium">
                {goal.title}
              </span>
              <span className="font-sans text-[12.5px] text-text-dim leading-relaxed">
                {goal.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly sprint */}
      <div className="border border-hairline rounded-md bg-surface overflow-hidden">
        <div className="px-4 py-2.5 border-b border-hairline font-mono text-[11px] text-text-dimmer flex justify-between">
          <span className="text-text-dim">weekly_sprint.log</span>
          <span>resets monday 00:00</span>
        </div>

        <div className="px-5 pt-5 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide mb-1">
              this week's sprint
            </div>
            <div className="font-mono text-[13px] text-text-dim">
              {WEEKLY_GOALS.map((goal) => `${goal.target} ${goal.label}`).join(" · ")}
            </div>
          </div>

          <CountdownRow countdown={weeklyCountdown} size="sm" />
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center justify-between font-mono text-[11px] text-text-dimmer mb-1.5">
            <span>sprint progress</span>
            <span className="text-accent">{weeklyOverallPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${weeklyOverallPct}%` }}
            />
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {weeklyLoading
            ? WEEKLY_GOALS.map((goal) => (
              <div key={goal.id} className="h-[104px] border border-hairline rounded-md bg-surface-2 animate-pulse" />
            ))
            : WEEKLY_GOALS.map((goal) => (
              <CounterCard
                key={goal.id}
                category={goal}
                value={weeklyProgress[goal.id] ?? 0}
                isSudo={isSudo}
                allowOverflow
                onChange={updateWeeklyCategory}
              />
            ))}
        </div>
      </div>

      {/* Category trackers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">
            progress by category
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {progressLoading
            ? CATEGORIES.map((cat) => (
              <div key={cat.id} className="h-[104px] border border-hairline rounded-md bg-surface-2 animate-pulse" />
            ))
            : CATEGORIES.map((cat) => (
              <CounterCard
                key={cat.id}
                category={cat}
                value={progress[cat.id] ?? 0}
                isSudo={isSudo}
                onChange={updateCategory}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
