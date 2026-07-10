// src/app/api/weekly-progress/route.ts
import { kv } from "@vercel/kv";

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

function currentWeekKey(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); // Monday
  return d.toISOString().slice(0, 10);
}

// GET — returns { weekKey, values: { weekly_leetcode, weekly_dsa, weekly_project_phases } }
export async function GET() {
  const weekKey = currentWeekKey();
  const values = (await kv.get<Record<string, number>>(`weekly:${weekKey}`)) ?? {};
  return Response.json({ weekKey, values });
}

// POST — { id: string, value: number } — requires sudo
export async function POST(req: Request) {
  if (!isSudo(req)) return new Response("Unauthorized", { status: 401 });

  const { id, value } = await req.json();
  if (!id || typeof value !== "number") {
    return new Response("Missing id or value", { status: 400 });
  }

  const weekKey = currentWeekKey();
  const key = `weekly:${weekKey}`;
  const current = (await kv.get<Record<string, number>>(key)) ?? {};
  current[id] = value;
  await kv.set(key, current, { ex: 60 * 60 * 24 * 10 }); // expire after 10 days, past week rollover

  return Response.json({ ok: true });
}
