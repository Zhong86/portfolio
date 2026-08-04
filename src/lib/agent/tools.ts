// src/lib/agent/tools.ts
// Composes every tool module the agent has access to into one registry + dispatcher.
// Adding a new capability (e.g. GitHub, calendar) means: import its tools/executor
// here, add its tool names to a Set, and register it in executeAgentTool.

import Groq from "groq-sdk";
import { knowledgeTools, executeKnowledgeTool } from "@/lib/knowledge";
import { steamTools, executeSteamTool } from "@/lib/steam";

const KNOWLEDGE_TOOL_NAMES = new Set(["load_information", "contact_zhong86"]);
const STEAM_TOOL_NAMES = new Set(["get_steam_library"]);

export const agentTools: Groq.Chat.Completions.ChatCompletionTool[] = [
  ...knowledgeTools,
  ...steamTools,
];

export async function executeAgentTool(name: string, argsJson: string): Promise<string> {
  if (KNOWLEDGE_TOOL_NAMES.has(name)) return executeKnowledgeTool(name, argsJson);
  if (STEAM_TOOL_NAMES.has(name)) return executeSteamTool(name, argsJson);
  return `Unknown tool: ${name}`;
}
