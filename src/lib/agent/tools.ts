// src/lib/agent/tools.ts
// Composes every tool module the agent has access to into one registry + dispatcher.
// Adding a new capability (e.g. GitHub, calendar) means: import its tools/executor
// here, add its tool names to a Set, and register it in executeAgentTool.

import Groq from "groq-sdk";
import { knowledgeTools, executeKnowledgeTool } from "./tools/knowledge";

const KNOWLEDGE_TOOL_NAMES = new Set(["load_information", "contact_zhong86"]);

export const agentTools: Groq.Chat.Completions.ChatCompletionTool[] = [
  ...knowledgeTools,
];

export async function executeAgentTool(name: string, argsJson: string): Promise<string> {
  if (KNOWLEDGE_TOOL_NAMES.has(name)) return executeKnowledgeTool(name, argsJson);
  return `Unknown tool: ${name}`;
}
