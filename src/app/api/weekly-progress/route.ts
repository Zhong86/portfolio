// src/app/api/weekly-progress/route.ts
import { kv } from "@vercel/kv";
import { WEEK_TTL_SECONDS, resolveCurrentWeek } from "@/lib/weekly";

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
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
