import { kv } from "@vercel/kv";

type Category = "dsa" | "concepts";

const CATEGORIES: Category[] = ["dsa", "concepts"];

interface LogEntry {
  title: string;
  slug: string;
  date: string;
  content: string;
  category?: Category;
}

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

// Helper to format title from the slug
function extractTitle(slug: string): string {
  return slug.split("_").slice(0, -1).join("_").replace(/-/g, " ");
}

// GET /api/logs — return all logs sorted newest first
export async function GET() {
  try {
    // Fetch all logs stored under the 'logs' hash map
    const logsMap = await kv.hgetall<Record<string, Omit<LogEntry, "slug" | "title">>>("logs");
    
    if (!logsMap) {
      return Response.json([]);
    }

    const logs: LogEntry[] = Object.entries(logsMap).map(([slug, data]) => ({
      slug,
      title: extractTitle(slug),
      date: data.date,
      content: data.content,
      category: data.category,
    })).sort((a, b) => b.date.localeCompare(a.date));

    return Response.json(logs);
  } catch (error) {
    return Response.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

// POST /api/logs — create or overwrite a log entry
export async function POST(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { date, title, content, category } = await req.json();
  if (!date || !title || typeof content !== "string") {
    return new Response("Missing date or content", { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response("Invalid date format", { status: 400 });
  }

  if (category !== undefined && category !== null && !CATEGORIES.includes(category)) {
    return new Response("Invalid category", { status: 400 });
  }

  // Create a clean slug matching your original structure
  const cleanTitle = title.replace(/\s+/g, "-");
  const slug = `${cleanTitle}_${date}`;

  try {
    // Save to the 'logs' hash map using the slug as the unique field
    await kv.hset("logs", {
      [slug]: { date, content, category: category ?? null }
    });

    return Response.json({ ok: true, slug });
  } catch (error) {
    return Response.json({ error: "Failed to save log" }, { status: 500 });
  }
}

// DELETE /api/logs — delete a log entry
export async function DELETE(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) return new Response("Missing slug", { status: 400 });

  try {
    // Remove the specific slug field from our 'logs' hash map
    await kv.hdel("logs", slug);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete log" }, { status: 500 });
  }
}
