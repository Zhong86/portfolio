import { kv } from "@vercel/kv";
import { DEFAULT_HOME, HomeContent } from "@/lib/config";

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

// GET /api/home — return homepage content (falls back to defaults)
export async function GET() {
  try {
    const content = await kv.get<HomeContent>("home");
    return Response.json(content ?? DEFAULT_HOME);
  } catch (error) {
    return Response.json(DEFAULT_HOME);
  }
}

// PUT /api/home — update homepage content
export async function PUT(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { tagline, headlinePrefix, accentWord, startDate, description } = await req.json();

  if (
    typeof tagline !== "string" ||
    typeof headlinePrefix !== "string" ||
    typeof accentWord !== "string" ||
    typeof startDate !== "string" ||
    typeof description !== "string" ||
    !tagline.trim() ||
    !headlinePrefix.trim() ||
    !accentWord.trim() ||
    !description.trim()
  ) {
    return new Response("Missing or invalid content", { status: 400 });
  }

  if (Number.isNaN(Date.parse(startDate))) {
    return new Response("Invalid start date", { status: 400 });
  }

  const content: HomeContent = {
    tagline: tagline.trim(),
    headlinePrefix: headlinePrefix.trim(),
    accentWord: accentWord.trim(),
    startDate,
    description: description.trim(),
  };

  try {
    await kv.set("home", content);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to save home content" }, { status: 500 });
  }
}
