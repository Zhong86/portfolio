import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "learn_logs");

function ensureDir() {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

function slugToDate(slug: string): string {
  // slug is YYYY-MM-DD
  return slug;
}

// GET /api/logs — return all logs sorted newest first
export async function GET() {
  ensureDir();
  const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith(".md"));
  const logs = files
    .map((file) => {
      const slug = file.replace(".md", "");
      const content = fs.readFileSync(path.join(LOGS_DIR, file), "utf-8");
      return { slug, date: slugToDate(slug), content };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return Response.json(logs);
}

// POST /api/logs — create or overwrite a log entry
export async function POST(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  ensureDir();

  const { slug, content } = await req.json();
  if (!slug || typeof content !== "string") {
    return new Response("Missing slug or content", { status: 400 });
  }

  // Validate slug is a date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slug)) {
    return new Response("Invalid slug format", { status: 400 });
  }

  const filePath = path.join(LOGS_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, content, "utf-8");

  return Response.json({ ok: true, slug });
}

// DELETE /api/logs — delete a log entry
export async function DELETE(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) return new Response("Missing slug", { status: 400 });

  const filePath = path.join(LOGS_DIR, `${slug}.md`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  return Response.json({ ok: true });
}
