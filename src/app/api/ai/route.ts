// src/app/api/ai/route.ts
import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { TalosAgent } from "@/lib/agent/agent";

const talos = new TalosAgent();

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const stream = await talos.streamReply(messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      `Error: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500, headers: { "Content-Type": "text/plain" } }
    );
  }
}
