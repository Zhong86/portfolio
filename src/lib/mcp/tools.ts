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
import {
  LOG_CATEGORIES,
  deleteLog,
  isValidCategory,
  isValidDate,
  listLogs,
  saveLog,
  updateLog,
  type LogCategory,
} from "@/lib/logs";

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
  },

  // ---------------- learn logs ----------------
  {
    name: "list_learn_logs",
    description:
      "List learn-log entries newest first, returning slug, title, date, category and content for each.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    requiresSudo: false,
    handler: async () => {
      const logs = await listLogs();
      if (logs.length === 0) return "No learn logs yet.";
      return JSON.stringify(logs, null, 2);
    },
  },
  {
    name: "create_learn_log",
    description:
      "Create a learn-log entry. The slug is derived from title and date, so reusing both overwrites the existing entry.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Entry title." },
        date: { type: "string", description: "Entry date, YYYY-MM-DD." },
        content: { type: "string", description: "Markdown body." },
        category: { type: "string", enum: [...LOG_CATEGORIES], description: "Optional category." },
      },
      required: ["title", "date", "content"],
      additionalProperties: false,
    },
    requiresSudo: true,
    handler: async (args) => {
      if (typeof args.title !== "string" || !args.title.trim()) {
        throw new ToolError("title must be a non-empty string.");
      }
      if (!isValidDate(args.date)) throw new ToolError("date must be formatted YYYY-MM-DD.");
      if (typeof args.content !== "string") throw new ToolError("content must be a string.");
      if (!isValidCategory(args.category)) {
        throw new ToolError(`category must be one of: ${LOG_CATEGORIES.join(", ")}.`);
      }

      const slug = await saveLog(args.title, args.date, args.content, args.category ?? null);
      return `Created learn log "${slug}".`;
    },
  },
  {
    name: "update_learn_log",
    description:
      "Update an existing learn-log entry by slug. Only the fields you pass change. Changing title or date re-slugs the entry.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug of the entry to update (see list_learn_logs)." },
        title: { type: "string", description: "New title." },
        date: { type: "string", description: "New date, YYYY-MM-DD." },
        content: { type: "string", description: "New markdown body." },
        category: { type: "string", enum: [...LOG_CATEGORIES], description: "New category." },
      },
      required: ["slug"],
      additionalProperties: false,
    },
    requiresSudo: true,
    handler: async (args) => {
      if (typeof args.slug !== "string" || !args.slug) {
        throw new ToolError("slug must be a non-empty string.");
      }
      if (args.title !== undefined && (typeof args.title !== "string" || !args.title.trim())) {
        throw new ToolError("title must be a non-empty string when provided.");
      }
      if (args.date !== undefined && !isValidDate(args.date)) {
        throw new ToolError("date must be formatted YYYY-MM-DD.");
      }
      if (args.content !== undefined && typeof args.content !== "string") {
        throw new ToolError("content must be a string when provided.");
      }
      if (!isValidCategory(args.category)) {
        throw new ToolError(`category must be one of: ${LOG_CATEGORIES.join(", ")}.`);
      }

      const result = await updateLog(args.slug, {
        title: args.title,
        date: args.date,
        content: args.content,
        category: args.category as LogCategory | null | undefined,
      });

      if (!result.ok) {
        throw new ToolError(
          result.reason === "not_found"
            ? `No learn log with slug "${args.slug}".`
            : "An entry with that title and date already exists."
        );
      }
      return `Updated learn log, now stored as "${result.slug}".`;
    },
  },
  {
    name: "delete_learn_log",
    description: "Permanently delete a learn-log entry by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug of the entry to delete." },
      },
      required: ["slug"],
      additionalProperties: false,
    },
    requiresSudo: true,
    handler: async (args) => {
      if (typeof args.slug !== "string" || !args.slug) {
        throw new ToolError("slug must be a non-empty string.");
      }
      await deleteLog(args.slug);
      return `Deleted learn log "${args.slug}".`;
    },
  },
];

export const TOOLS_BY_NAME = new Map(MCP_TOOLS.map((t) => [t.name, t]));
