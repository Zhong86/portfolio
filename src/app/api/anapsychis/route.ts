import { kv } from "@vercel/kv";

interface StashEntry {
  slug: string;
  label: string;
  note: string;
  url: string;
  imageUrl?: string;
}

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

function slugifyLabel(label: string): string {
  return label
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

// GET /api/anapsychis — return all stash entries (sudo-only, unlike /api/tools)
export async function GET(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const stashMap = await kv.hgetall<Record<string, Omit<StashEntry, "slug">>>("anapsychis");

    if (!stashMap) {
      return Response.json([]);
    }

    const entries: StashEntry[] = Object.entries(stashMap)
      .map(([slug, data]) => ({
        slug,
        label: data.label,
        note: data.note,
        url: data.url,
        imageUrl: data.imageUrl ?? "",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return Response.json(entries);
  } catch (error) {
    return Response.json({ error: "Failed to fetch stash" }, { status: 500 });
  }
}

// POST /api/anapsychis — create a new entry
export async function POST(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { label, note, url, imageUrl } = await req.json();

  if (!label || typeof label !== "string" || !url || typeof url !== "string") {
    return new Response("Missing label or url", { status: 400 });
  }
  if (!isValidUrl(url)) {
    return new Response("Invalid url", { status: 400 });
  }
  if (imageUrl && (typeof imageUrl !== "string" || !isValidUrl(imageUrl))) {
    return new Response("Invalid image url", { status: 400 });
  }

  const slug = `${slugifyLabel(label)}_${randomSuffix()}`;

  try {
    await kv.hset("anapsychis", {
      [slug]: { label, note: note ?? "", url, imageUrl: imageUrl ?? "" },
    });
    return Response.json({ ok: true, slug });
  } catch (error) {
    return Response.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

// PUT /api/anapsychis — update an existing entry
export async function PUT(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug, label, note, url, imageUrl } = await req.json();

  if (!slug || !label || typeof label !== "string" || !url || typeof url !== "string") {
    return new Response("Missing slug, label, or url", { status: 400 });
  }
  if (!isValidUrl(url)) {
    return new Response("Invalid url", { status: 400 });
  }
  if (imageUrl && (typeof imageUrl !== "string" || !isValidUrl(imageUrl))) {
    return new Response("Invalid image url", { status: 400 });
  }

  try {
    const existing = await kv.hget("anapsychis", slug);
    if (!existing) {
      return new Response("Entry not found", { status: 404 });
    }

    await kv.hset("anapsychis", {
      [slug]: { label, note: note ?? "", url, imageUrl: imageUrl ?? "" },
    });
    return Response.json({ ok: true, slug });
  } catch (error) {
    return Response.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

// DELETE /api/anapsychis — delete an entry
export async function DELETE(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) return new Response("Missing slug", { status: 400 });

  try {
    await kv.hdel("anapsychis", slug);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
