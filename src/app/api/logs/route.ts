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
  return slug.split("_").slice(1, 2).join("_");
}

function extractTitle(slug: string): string {
  return slug.split("_").slice(0, -1).join("_").replace(/-/g, " ");
}

// GET /api/logs — return all logs sorted newest first
export async function GET() {
  ensureDir();
  const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith(".md"));
  const logs = files
    .map((file) => {
      const slug = file.replace(".md", "");
      const content = fs.readFileSync(path.join(LOGS_DIR, file), "utf-8");
      return { title: extractTitle(slug), slug, date: slugToDate(slug), content };
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

  const { date, title, content } = await req.json();
  if (!date || !title || typeof content !== "string") {
    return new Response("Missing date or content", { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response("Invalid date format", { status: 400 });
  }

  const filePath = path.join(LOGS_DIR, `${title}_${date}.md`);
  fs.writeFileSync(filePath, content, "utf-8");

  return Response.json({ ok: true, filePath });
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
