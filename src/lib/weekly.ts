// src/lib/weekly.ts — week bookkeeping for the weekly sprint counters.
import { WEEKLY_GOALS } from "@/lib/config";

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
