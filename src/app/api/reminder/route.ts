// src/app/api/reminder/route.ts
import { kv } from "@vercel/kv";
import type { Reminder } from "@/lib/config";

const KEY = "reminder:current";

const MAX_TEXT = 200;

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

// GET — returns { reminder: Reminder | null }
export async function GET() {
  const reminder = (await kv.get<Reminder>(KEY)) ?? null;
  return Response.json({ reminder });
}

// POST — { text: string } — requires sudo
export async function POST(req: Request) {
  if (!isSudo(req)) return new Response("Unauthorized", { status: 401 });

  const { text } = await req.json();
  if (typeof text !== "string" || !text.trim()) {
    return new Response("Missing text", { status: 400 });
  }

  const reminder: Reminder = {
    text: text.trim().slice(0, MAX_TEXT),
    updatedAt: new Date().toISOString(),
  };

  await kv.set(KEY, reminder);
  return Response.json({ ok: true, reminder });
}

// DELETE — clears the reminder — requires sudo
export async function DELETE(req: Request) {
  if (!isSudo(req)) return new Response("Unauthorized", { status: 401 });
  await kv.del(KEY);
  return Response.json({ ok: true });
}
