import { kv } from "@vercel/kv";
import { AboutField, DEFAULT_ABOUT_INFO } from "@/lib/config";

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function getFields(): Promise<AboutField[]> {
  const stored = await kv.get<AboutField[]>("about");
  return stored && stored.length > 0 ? stored : DEFAULT_ABOUT_INFO;
}

// GET /api/about — return all about fields, in display order
export async function GET() {
  try {
    const fields = await getFields();
    return Response.json(fields);
  } catch (error) {
    return Response.json(DEFAULT_ABOUT_INFO);
  }
}

// POST /api/about — append a new field row
export async function POST(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { field, type, value } = await req.json();

  if (
    !field || typeof field !== "string" ||
    !type || typeof type !== "string" ||
    typeof value !== "string" || !value.trim()
  ) {
    return new Response("Missing field, type, or value", { status: 400 });
  }

  try {
    const fields = await getFields();
    const next = [...fields, { id: randomId(), field: field.trim(), type: type.trim(), value: value.trim() }];
    await kv.set("about", next);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to save field" }, { status: 500 });
  }
}

// PUT /api/about — update an existing field row by id
export async function PUT(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, field, type, value } = await req.json();

  if (
    !id || typeof id !== "string" ||
    !field || typeof field !== "string" ||
    !type || typeof type !== "string" ||
    typeof value !== "string" || !value.trim()
  ) {
    return new Response("Missing id, field, type, or value", { status: 400 });
  }

  try {
    const fields = await getFields();
    if (!fields.some((f) => f.id === id)) {
      return new Response("Field not found", { status: 404 });
    }
    const next = fields.map((f) =>
      f.id === id ? { id, field: field.trim(), type: type.trim(), value: value.trim() } : f
    );
    await kv.set("about", next);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to update field" }, { status: 500 });
  }
}

// DELETE /api/about — remove a field row by id
export async function DELETE(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return new Response("Missing id", { status: 400 });

  try {
    const fields = await getFields();
    const next = fields.filter((f) => f.id !== id);
    await kv.set("about", next);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete field" }, { status: 500 });
  }
}
