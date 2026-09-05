import {
  deleteLog,
  isValidCategory,
  isValidDate,
  listLogs,
  saveLog,
  updateLog,
  type LogCategory,
} from "@/lib/logs";

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

// GET /api/logs — return all logs sorted newest first
export async function GET() {
  try {
    return Response.json(await listLogs());
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
  if (!isValidDate(date)) {
    return new Response("Invalid date format", { status: 400 });
  }
  if (!isValidCategory(category)) {
    return new Response("Invalid category", { status: 400 });
  }

  try {
    const slug = await saveLog(title, date, content, category ?? null);
    return Response.json({ ok: true, slug });
  } catch (error) {
    return Response.json({ error: "Failed to save log" }, { status: 500 });
  }
}

// PUT /api/logs — update an existing entry by slug.
// Changing title or date re-slugs the entry; the old key is removed.
export async function PUT(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug, title, date, content, category } = await req.json();

  if (!slug || typeof slug !== "string") {
    return new Response("Missing slug", { status: 400 });
  }
  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return new Response("Invalid title", { status: 400 });
  }
  if (date !== undefined && !isValidDate(date)) {
    return new Response("Invalid date format", { status: 400 });
  }
  if (content !== undefined && typeof content !== "string") {
    return new Response("Invalid content", { status: 400 });
  }
  if (!isValidCategory(category)) {
    return new Response("Invalid category", { status: 400 });
  }

  try {
    const result = await updateLog(slug, {
      title,
      date,
      content,
      category: category as LogCategory | null | undefined,
    });

    if (!result.ok) {
      return result.reason === "not_found"
        ? new Response("Log not found", { status: 404 })
        : new Response("An entry with that title and date already exists", { status: 409 });
    }

    return Response.json({ ok: true, slug: result.slug });
  } catch (error) {
    return Response.json({ error: "Failed to update log" }, { status: 500 });
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
    await deleteLog(slug);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete log" }, { status: 500 });
  }
}
