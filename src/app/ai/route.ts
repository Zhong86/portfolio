import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile"; 
const TOPICS = ["coding", "profession", "hobbies"] as const;

const PROMPT = `
You are Talos, Billy Zhong (Zhong86)'s AI helper to answer questions for a portfolio website. 
You are given a tool to get the corresponding topic and the information to respond with based on user's request. 
If question is something you can answer like "What are you?" then proceed to answer even if no information is given.
Respond only based on the given information, if you don't know then tell the user.
Be concise and friendly.
`;

function loadInformation(topic: string): string {
  const safeTopic = path.basename(topic);
  const filePath = path.join(process.cwd(), "information", `${safeTopic}.md`);
  if (!fs.existsSync(filePath)) {
    return `No information file found for topic "${topic}".`;
  }
  return fs.readFileSync(filePath, "utf-8");
}

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "load_information",
      description:
        "Load reference information on a specific topic before answering. Call this whenever the user's question relates to one of the available topics.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", enum: TOPICS as unknown as string[] },
        },
        required: ["topic"],
      },
    },
  },
];

export async function POST(req: Request) {
  const { messages } = await req.json(); // OpenAI-style: [{ role, content }]

  // --- Step 1: non-streaming call to resolve any tool use first ---
  let working: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: PROMPT },
    ...messages,
  ];
  let resolving = true;

  while (resolving) {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: working,
      tools,
    });

    const choice = completion.choices[0];
    const toolCalls = choice.message.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      working.push(choice.message);
      for (const call of toolCalls) {
        const args = JSON.parse(call.function.arguments);
        const fileContents = loadInformation(args.topic);
        working.push({
          role: "tool",
          tool_call_id: call.id,
          content: fileContents,
        });
      }
    } else {
      resolving = false;
    }
  }

  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages: working,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
