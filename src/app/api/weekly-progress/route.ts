// src/app/api/weekly-progress/route.ts
import { kv } from "@vercel/kv";
import { carryForward, mondayOf, weekKey } from "@/lib/weekly";

// Kept long enough that a skipped week still finds the previous week's record.
const WEEK_TTL_SECONDS = 60 * 60 * 24 * 21;
const LOOKBACK_WEEKS = 3;

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

/**
 * Current week's values, seeding the week from the previous week's overflow the
 * first time it is touched. 8/7 last week means this week opens at 1/7.
 */
async function resolveCurrentWeek(): Promise<{ key: string; values: Record<string, number> }> {
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

// GET — returns { weekKey, values: { weekly_leetcode, weekly_dsa, weekly_project_phases } }
export async function GET() {
  const { key, values } = await resolveCurrentWeek();
  return Response.json({ weekKey: key, values });
}

// POST — { id: string, value: number } — requires sudo
export async function POST(req: Request) {
  if (!isSudo(req)) return new Response("Unauthorized", { status: 401 });

  const { id, value } = await req.json();
  if (!id || typeof value !== "number") {
    return new Response("Missing id or value", { status: 400 });
  }

  const { key, values } = await resolveCurrentWeek();
  values[id] = Math.max(0, Math.floor(value));
  await kv.set(`weekly:${key}`, values, { ex: WEEK_TTL_SECONDS });

  return Response.json({ ok: true });
}
