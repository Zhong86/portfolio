// src/lib/agent/agent.ts
import Groq from "groq-sdk";
import { TALOS_SYSTEM_PROMPT } from "./prompt";
import { agentTools, executeAgentTool } from "./tools";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const MAX_TOOL_ITERATIONS = 2;

export type AgentMessage = Groq.Chat.Completions.ChatCompletionMessageParam;

/**
 * Talos — Billy Zhong's portfolio AI assistant.
 * Owns the system prompt, tool registry, tool-resolution loop, and
 * final-answer streaming. Routes should only call streamReply().
 */
export class TalosAgent {
  private groq: Groq;
  private model: string;

  constructor(apiKey: string | undefined = process.env.GROQ_API_KEY, model: string = DEFAULT_MODEL) {
    this.groq = new Groq({ apiKey });
    this.model = model;
  }

  /** Runs the tool-calling loop until the model stops requesting tools or hits the iteration cap. */
  private async resolveTools(messages: AgentMessage[]): Promise<AgentMessage[]> {
    const working = [...messages];
    let resolving = true;
    let iterations = 0;

    while (resolving && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      let completion;
      try {
        completion = await this.groq.chat.completions.create({
          model: this.model,
          messages: working,
          tools: agentTools,
        });
      } catch (err: any) {
        if (err?.status === 400 && err?.error?.error?.code === "tool_use_failed") {
          // Model produced malformed tool call syntax — nudge it and retry.
          working.push({
            role: "user",
            content:
              "Your previous response wasn't formatted correctly for a tool call. Please try again using the proper tool calling format.",
          });
          continue;
        }
        throw err;
      }

      const choice = completion.choices[0];
      const toolCalls = choice.message.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        working.push(choice.message);
        for (const call of toolCalls) {
          try {
            const result = await executeAgentTool(call.function.name, call.function.arguments);
            working.push({ role: "tool", tool_call_id: call.id, content: result });
          } catch {
            working.push({
              role: "tool",
              tool_call_id: call.id,
              content: "Error executing this tool call.",
            });
          }
        }
      } else {
        resolving = false;
      }
    }

    return working;
  }

  /**
   * Takes raw conversation history (no system prompt), resolves any tool
   * calls, and returns an SSE-ready ReadableStream of the final answer.
   */
  async streamReply(history: AgentMessage[]): Promise<ReadableStream<Uint8Array>> {
    const seeded: AgentMessage[] = [
      { role: "system", content: TALOS_SYSTEM_PROMPT },
      ...history,
    ];

    const resolved = await this.resolveTools(seeded);

    const completionStream = await this.groq.chat.completions.create({
      model: this.model,
      messages: resolved,
      stream: true,
    });

    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completionStream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
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
  }
}
