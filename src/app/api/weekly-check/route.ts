// src/app/api/cron/weekly-check/route.ts
import { sendTelegramMessage } from "@/lib/telegram";
import { kv } from "@vercel/kv";

const WEEKLY_TARGETS: Record<string, { label: string; target: number }> = {
  weekly_leetcode: { label: "LeetCode questions", target: 12 },
  weekly_dsa: { label: "DSA concepts", target: 5 },
  weekly_project_phases: { label: "Project phases", target: 5 },
};

function currentWeekInfo() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
  const weekKey = start.toISOString().slice(0, 10);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { weekKey, daysLeft };
}

export async function GET(req: Request) {
  // Vercel Cron sends this header automatically — verify it's really Vercel calling.
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { weekKey, daysLeft } = currentWeekInfo();
  const values = (await kv.get<Record<string, number>>(`weekly:${weekKey}`)) ?? {};

  const behind = Object.entries(WEEKLY_TARGETS)
    .map(([id, { label, target }]) => {
      const done = values[id] ?? 0;
      return { label, done, target, remaining: Math.max(0, target - done) };
    })
    .filter((item) => item.remaining > 0);

  // Only nag when time is getting tight — tune this threshold however you like.
  if (daysLeft <= 3 && behind.length > 0) {
    const lines = behind
      .map((b) => `• ${b.label}: ${b.done}/${b.target} (${b.remaining} left)`)
      .join("\n");

    await sendTelegramMessage(
      `⏳ ${daysLeft} day${daysLeft === 1 ? "" : "s"} left this week — you're behind on:\n${lines}\n\nGo grind 💪`
    );
  }

  return Response.json({ checked: true, daysLeft, behind });
}
