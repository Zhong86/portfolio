// src/lib/weekly.ts — week bookkeeping for the weekly sprint counters.
import { kv } from "@vercel/kv";
import { WEEKLY_GOALS } from "@/lib/config";

// Kept long enough that a skipped week still finds the previous week's record.
export const WEEK_TTL_SECONDS = 60 * 60 * 24 * 21;
const LOOKBACK_WEEKS = 3;

/** Monday 00:00 of the week containing `date`. */
export function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

export function weekKey(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

/** Whatever was logged past each goal's target — the amount that rolls into next week. */
export function overflowOf(values: Record<string, number>): Record<string, number> {
  const carried: Record<string, number> = {};
  for (const goal of WEEKLY_GOALS) {
    const leftover = (values[goal.id] ?? 0) - goal.target;
    if (leftover > 0) carried[goal.id] = leftover;
  }
  return carried;
}

/**
 * Overflow from a week that ended `weeksAgo` weeks back, folded through every
 * week in between. Those weeks were never opened, so they only ever held
 * carryover — an untouched week still burns its target off the surplus.
 */
export function carryForward(values: Record<string, number>, weeksAgo: number): Record<string, number> {
  let carried = overflowOf(values);
  for (let skipped = 1; skipped < weeksAgo; skipped++) carried = overflowOf(carried);
  return carried;
}

/**
 * Current week's values, seeding the week from the previous week's overflow the
 * first time it is touched. 8/7 last week means this week opens at 1/7.
 */
export async function resolveCurrentWeek(): Promise<{ key: string; values: Record<string, number> }> {
  const monday = mondayOf(new Date());
  const key = weekKey(monday);

  const existing = await kv.get<Record<string, number>>(`weekly:${key}`);
  if (existing) return { key, values: existing };

  let carried: Record<string, number> = {};
  for (let back = 1; back <= LOOKBACK_WEEKS; back++) {
    const past = new Date(monday);
    past.setDate(past.getDate() - 7 * back);

    const stored = await kv.get<Record<string, number>>(`weekly:${weekKey(past)}`);
    if (!stored) continue;

    carried = carryForward(stored, back);
    break;
  }

  // Persist immediately so next week has a record to carry forward from.
  await kv.set(`weekly:${key}`, carried, { ex: WEEK_TTL_SECONDS });
  return { key, values: carried };
}
