import { kv } from "@vercel/kv";
import { Migration, DEFAULT_PROJECTS } from "@/lib/config";

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function nextNum(projects: Migration[]): string {
  const max = projects.reduce((acc, p) => {
    const n = parseInt(p.num, 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return String(max + 1).padStart(4, "0");
}

function isValidStatus(value: unknown): value is Migration["status"] {
  return value === "PROD" || value === "PERSONAL";
}

function sanitizeStack(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
}

function sanitizeLinks(value: unknown): { label: string; href: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is { label: string; href: string } =>
        !!v &&
        typeof v === "object" &&
        typeof (v as { label?: unknown }).label === "string" &&
        typeof (v as { href?: unknown }).href === "string" &&
        (v as { label: string }).label.trim().length > 0 &&
        (v as { href: string }).href.trim().length > 0
    )
    .map((v) => ({ label: v.label.trim(), href: v.href.trim() }));
}

async function getProjects(): Promise<Migration[]> {
  const stored = await kv.get<Migration[]>("projects");
  return stored && stored.length > 0 ? stored : DEFAULT_PROJECTS;
}

// GET /api/projects — return all projects, in display order (newest first)
export async function GET() {
  try {
    const projects = await getProjects();
    return Response.json(projects);
  } catch (error) {
    return Response.json(DEFAULT_PROJECTS);
  }
}

// POST /api/projects — create a new project, prepended to the top
export async function POST(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { title, status, description, stack, links } = await req.json();

  if (!title || typeof title !== "string" || !isValidStatus(status) || typeof description !== "string" || !description.trim()) {
    return new Response("Missing or invalid title, status, or description", { status: 400 });
  }

  try {
    const projects = await getProjects();
    const entry: Migration = {
      id: randomId(),
      num: nextNum(projects),
      title: title.trim(),
      status,
      description: description.trim(),
      stack: sanitizeStack(stack),
      links: sanitizeLinks(links),
    };
    await kv.set("projects", [entry, ...projects]);
    return Response.json({ ok: true, id: entry.id });
  } catch (error) {
    return Response.json({ error: "Failed to save project" }, { status: 500 });
  }
}

// PUT /api/projects — update an existing project by id
export async function PUT(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, title, status, description, stack, links } = await req.json();

  if (
    !id || typeof id !== "string" ||
    !title || typeof title !== "string" ||
    !isValidStatus(status) ||
    typeof description !== "string" || !description.trim()
  ) {
    return new Response("Missing or invalid id, title, status, or description", { status: 400 });
  }

  try {
    const projects = await getProjects();
    if (!projects.some((p) => p.id === id)) {
      return new Response("Project not found", { status: 404 });
    }
    const next = projects.map((p) =>
      p.id === id
        ? {
            ...p,
            title: title.trim(),
            status,
            description: description.trim(),
            stack: sanitizeStack(stack),
            links: sanitizeLinks(links),
          }
        : p
    );
    await kv.set("projects", next);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects — remove a project by id
export async function DELETE(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return new Response("Missing id", { status: 400 });

  try {
    const projects = await getProjects();
    const next = projects.filter((p) => p.id !== id);
    await kv.set("projects", next);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
