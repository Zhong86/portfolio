// src/lib/knowledge.ts
import Groq from "groq-sdk";
import { INFO_TOPICS, loadInformation } from "@/lib/information";
import { sendTelegramMessage } from "@/lib/telegram";

export const knowledgeTools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "load_information",
      description:
        "Load reference information on a specific topic before answering. Available topics:\n" +
        Object.entries(INFO_TOPICS)
          .map(([key, desc]) => `- ${key}: ${desc}`)
          .join("\n"),
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", enum: Object.keys(INFO_TOPICS) },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "contact_zhong86",
      description:
        "Send a message directly to Billy Zhong (Zhong86) when a website visitor has given you ACTUAL CONTENT to relay — a real message, question, or inquiry they want passed along. " +
        "Do NOT call this if the user is only asking whether you can send a message, asking how to contact Billy, or hasn't yet told you what they want to say. " +
        "In that case, ask them what they'd like to say first, then call this tool only once they give you real content to send.",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "The visitor's actual message content to relay. Must be real content the user provided — never a placeholder, never empty, never just 'they want to be contacted'.",
          },
          fromName: {
            type: "string",
            description: "Name of the visitor, if they provided one. Omit if unknown.",
          },
        },
        required: ["message"],
      },
    },
  },
];

export async function executeKnowledgeTool(name: string, argsJson: string): Promise<string> {
  const args = JSON.parse(argsJson);

  if (name === "load_information") {
    return loadInformation(args.topic);
  }

  if (name === "contact_zhong86") {
    const text = `Portfolio${args.fromName ? ` - ${args.fromName}` : ""}:\n\n${args.message}`;
    return sendTelegramMessage(text);
  }

  return `Unknown tool: ${name}`;
}
