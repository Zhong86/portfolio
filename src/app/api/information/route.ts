import {
  INFO_TOPICS,
  isEditableTopic,
  loadInformation,
  saveInformation,
  resetInformation,
} from "@/lib/information";

function isSudo(req: Request): boolean {
  return req.headers.get("x-sudo-token") === process.env.SUDO_PASSWORD;
}

// GET /api/information            — list every topic with its description
// GET /api/information?topic=foo  — resolved plain-text content for one topic
export async function GET(req: Request) {
  const topic = new URL(req.url).searchParams.get("topic");

  if (!topic) {
    const topics = Object.entries(INFO_TOPICS).map(([key, description]) => ({
      topic: key,
      description,
      editable: isEditableTopic(key),
    }));
    return Response.json(topics);
  }

  if (!(topic in INFO_TOPICS)) {
    return new Response("Unknown topic", { status: 404 });
  }

  try {
    const content = await loadInformation(topic);
    return Response.json({ topic, content, editable: isEditableTopic(topic) });
  } catch (error) {
    return Response.json({ error: "Failed to load topic" }, { status: 500 });
  }
}

// PUT /api/information — overwrite a markdown topic's content
export async function PUT(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic, content } = await req.json();

  if (!topic || typeof topic !== "string" || !isEditableTopic(topic)) {
    return new Response("Missing or non-editable topic", { status: 400 });
  }
  if (typeof content !== "string" || !content.trim()) {
    return new Response("Missing content", { status: 400 });
  }

  try {
    await saveInformation(topic, content);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to save topic" }, { status: 500 });
  }
}

// DELETE /api/information — reset a markdown topic back to its seed default
export async function DELETE(req: Request) {
  if (!isSudo(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic } = await req.json();
  if (!topic || typeof topic !== "string" || !isEditableTopic(topic)) {
    return new Response("Missing or non-editable topic", { status: 400 });
  }

  try {
    await resetInformation(topic);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to reset topic" }, { status: 500 });
  }
}
