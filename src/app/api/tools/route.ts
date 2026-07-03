import { kv } from "@vercel/kv";

interface ToolEntry {
  slug: string;
  title: string;
  description: string;
  url: string;
}

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/tools — return all tool links
export async function GET() {
  try {
    const toolsMap = await kv.hgetall<Record<string, Omit<ToolEntry, "slug">>>("tools");

    if (!toolsMap) {
      return Response.json([]);
    }

    const tools: ToolEntry[] = Object.entries(toolsMap)
      .map(([slug, data]) => ({
        slug,
        title: data.title,
        description: data.description,
        url: data.url,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return Response.json(tools);
  } catch (error) {
    return Response.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}

// POST /api/tools — create a new tool link
export async function POST(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { title, description, url } = await req.json();

  if (!title || typeof title !== "string" || !url || typeof url !== "string") {
    return new Response("Missing title or url", { status: 400 });
  }
  if (!isValidUrl(url)) {
    return new Response("Invalid url", { status: 400 });
  }

  const slug = `${slugifyTitle(title)}_${randomSuffix()}`;

  try {
    await kv.hset("tools", {
      [slug]: { title, description: description ?? "", url },
    });
    return Response.json({ ok: true, slug });
  } catch (error) {
    return Response.json({ error: "Failed to save tool" }, { status: 500 });
  }
}

// PUT /api/tools — update an existing tool link
export async function PUT(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug, title, description, url } = await req.json();

  if (!slug || !title || typeof title !== "string" || !url || typeof url !== "string") {
    return new Response("Missing slug, title, or url", { status: 400 });
  }
  if (!isValidUrl(url)) {
    return new Response("Invalid url", { status: 400 });
  }

  try {
    const existing = await kv.hget("tools", slug);
    if (!existing) {
      return new Response("Tool not found", { status: 404 });
    }

    await kv.hset("tools", {
      [slug]: { title, description: description ?? "", url },
    });
    return Response.json({ ok: true, slug });
  } catch (error) {
    return Response.json({ error: "Failed to update tool" }, { status: 500 });
  }
}

// DELETE /api/tools — delete a tool link
export async function DELETE(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) return new Response("Missing slug", { status: 400 });

  try {
    await kv.hdel("tools", slug);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete tool" }, { status: 500 });
  }
}
