// src/app/api/goals-progress/route.ts
import { kv } from "@vercel/kv";

const KEY = "goals:progress";

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

// GET — returns { values: Record<categoryId, number> }
export async function GET() {
  const values = (await kv.get<Record<string, number>>(KEY)) ?? {};
  return Response.json({ values });
}

// POST — { id: string, value: number } — requires sudo
export async function POST(req: Request) {
  if (!isSudo(req)) return new Response("Unauthorized", { status: 401 });

  const { id, value } = await req.json();
  if (!id || typeof value !== "number") {
    return new Response("Missing id or value", { status: 400 });
  }

  const current = (await kv.get<Record<string, number>>(KEY)) ?? {};
  current[id] = value;
  await kv.set(KEY, current);

  return Response.json({ ok: true });
}
