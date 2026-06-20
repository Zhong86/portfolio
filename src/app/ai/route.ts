import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

const TOPICS = {
  coding: "Programming languages, frameworks, technical skills, and projects Billy has built.",
  profession: "Billy's work experience, job history, internships, and career background.",
  hobbies: "Billy's interests and activities outside of coding/work.",
  contact: "Billy's contacts to connect with him."
} as const;

const PROMPT = `
You are Talos, Billy Zhong (Zhong86)'s AI helper to answer questions for a portfolio website.
You have a tool, load_information, to load reference material on specific topics. Use it whenever the user's question could relate to any of the available topics — even if their wording doesn't exactly match the topic name (e.g. "experience" relates to the "profession" topic, "tech stack" relates to "coding").
You may call the tool multiple times in a row if the question touches multiple topics.
If a question is something you can answer directly without needing specific info (like "What are you?"), answer directly.
Respond only based on the given information for anything specific to Billy. If you don't have the information, say so honestly rather than guessing.
Ignore questions about topics other than Zhong86.
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
        "Load reference information on a specific topic before answering. Available topics:\n" +
        Object.entries(TOPICS)
          .map(([key, desc]) => `- ${key}: ${desc}`)
          .join("\n"),
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", enum: Object.keys(TOPICS) },
        },
        required: ["topic"],
      },
    },
  },
];

function errorResponse(message: string) {
  return new Response(message, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json(); 

    let working: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: PROMPT },
      ...messages,
    ];

    let resolving = true;
    let iterations = 0;
    const MAX_ITERATIONS = 3;

    while (resolving && iterations < MAX_ITERATIONS) {
      iterations++;

      let completion;
      try {
        completion = await groq.chat.completions.create({
          model: MODEL,
          messages: working,
          tools,
        });
      } catch (err: any) {
        if (err?.status === 400 && err?.error?.error?.code === "tool_use_failed") {
          // Model produced malformed tool call syntax — nudge it and retry
          working.push({
            role: "user",
            content:
              "Your previous response wasn't formatted correctly for a tool call. Please try again using the proper tool calling format.",
          });
          continue;
        }
        // Unrecoverable error — bail out entirely
        return errorResponse("");
      }

      const choice = completion.choices[0];
      const toolCalls = choice.message.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        working.push(choice.message);
        for (const call of toolCalls) {
          try {
            const args = JSON.parse(call.function.arguments);
            const fileContents = loadInformation(args.topic);
            working.push({
              role: "tool",
              tool_call_id: call.id,
              content: fileContents,
            });
          } catch {
            working.push({
              role: "tool",
              tool_call_id: call.id,
              content: "Error loading information for this topic.",
            });
          }
        }
      } else {
        resolving = false;
      }
    }

    let stream;
    try {
      stream = await groq.chat.completions.create({
        model: MODEL,
        messages: working,
        stream: true,
      });
    } catch {
      return errorResponse("");
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "" })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return errorResponse("");
  }
}
