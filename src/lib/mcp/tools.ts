// src/lib/mcp/tools.ts
// Tool registry exposed over MCP. Handlers call the lib layer directly
// (never back through HTTP), so they share validation with the REST routes.
import type { MarkdownTopic } from "@/lib/config";
import {
  INFO_TOPICS,
  isEditableTopic,
  loadInformation,
  saveInformation,
  resetInformation,
} from "@/lib/information";

export type ToolContext = { sudo: boolean };

type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type McpTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  /** Write tools require a valid x-sudo-token on the MCP request. */
  requiresSudo: boolean;
  handler: (args: Record<string, any>, ctx: ToolContext) => Promise<string>;
};

/** Thrown for expected, user-facing failures; surfaced as an MCP tool error. */
export class ToolError extends Error {}

const EDITABLE_TOPICS = Object.keys(INFO_TOPICS).filter(isEditableTopic);

function requireEditableTopic(topic: unknown): MarkdownTopic {
  if (typeof topic !== "string" || !isEditableTopic(topic)) {
    throw new ToolError(
      `"${String(topic)}" is not an editable topic. Editable topics: ${EDITABLE_TOPICS.join(", ")}.`
    );
  }
  return topic;
}

export const MCP_TOOLS: McpTool[] = [
  // ---------------- information ----------------
  {
    name: "list_information_topics",
    description:
      "List every knowledge-base topic Billy's portfolio exposes, with a description of each and whether its full text can be edited.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    requiresSudo: false,
    handler: async () => {
      const rows = Object.entries(INFO_TOPICS).map(
        ([topic, description]) =>
          `- ${topic} (${isEditableTopic(topic) ? "editable" : "read-only"}): ${description}`
      );
      return rows.join("\n");
    },
  },
  {
    name: "load_information",
    description:
      "Read the full plain-text content of one knowledge-base topic. Works for every topic, including the read-only derived ones (about, projects, goals).",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", enum: Object.keys(INFO_TOPICS), description: "Topic to read." },
      },
      required: ["topic"],
      additionalProperties: false,
    },
    requiresSudo: false,
    handler: async (args) => {
      if (typeof args.topic !== "string" || !(args.topic in INFO_TOPICS)) {
        throw new ToolError(
          `Unknown topic. Available topics: ${Object.keys(INFO_TOPICS).join(", ")}.`
        );
      }
      return loadInformation(args.topic);
    },
  },
  {
    name: "save_information",
    description:
      "Overwrite an editable topic's markdown content. This replaces the whole document, so read it with load_information first and send back the full revised text.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", enum: EDITABLE_TOPICS, description: "Editable topic to rewrite." },
        content: { type: "string", description: "Full replacement markdown content." },
      },
      required: ["topic", "content"],
      additionalProperties: false,
    },
    requiresSudo: true,
    handler: async (args) => {
      const topic = requireEditableTopic(args.topic);
      if (typeof args.content !== "string" || !args.content.trim()) {
        throw new ToolError("content must be a non-empty string.");
      }
      await saveInformation(topic, args.content);
      return `Saved "${topic}" (${args.content.length} characters).`;
    },
  },
  {
    name: "reset_information",
    description:
      "Discard edits to an editable topic and restore its built-in default content.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", enum: EDITABLE_TOPICS, description: "Editable topic to reset." },
      },
      required: ["topic"],
      additionalProperties: false,
    },
    requiresSudo: true,
    handler: async (args) => {
      const topic = requireEditableTopic(args.topic);
      await resetInformation(topic);
      return `Reset "${topic}" to its default content.`;
    },
  }
];

export const TOOLS_BY_NAME = new Map(MCP_TOOLS.map((t) => [t.name, t]));
