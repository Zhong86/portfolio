// src/app/api/mcp/route.ts
// Stateless MCP endpoint (Streamable HTTP transport, JSON-response mode).
// Every POST is a self-contained JSON-RPC message; no session state is kept,
// which is what lets this run on serverless without a session store.
import { MCP_TOOLS, TOOLS_BY_NAME, ToolError, type ToolContext } from "@/lib/mcp/tools";

const SERVER_INFO = { name: "zhong86-portfolio", version: "1.0.0" };

const LATEST_PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, any>;
};

const ERROR_CODES = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
} as const;

function result(id: JsonRpcId, value: unknown) {
  return { jsonrpc: "2.0" as const, id, result: value };
}

function error(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

/** MCP convention: tool failures are successful JSON-RPC results flagged isError. */
function toolFailure(id: JsonRpcId, message: string) {
  return result(id, { content: [{ type: "text", text: message }], isError: true });
}

function isSudo(req: Request): boolean {
  const token = req.headers.get("x-sudo-token") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(process.env.SUDO_PASSWORD) && token === process.env.SUDO_PASSWORD;
}

async function handleMessage(
  msg: JsonRpcRequest,
  ctx: ToolContext
): Promise<ReturnType<typeof result> | ReturnType<typeof error> | null> {
  const id = msg.id ?? null;
  const isNotification = msg.id === undefined;

  switch (msg.method) {
    case "initialize": {
      const requested = msg.params?.protocolVersion;
      const protocolVersion =
        typeof requested === "string" && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : LATEST_PROTOCOL_VERSION;
      return result(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });
    }

    // Notifications carry no id and get no response body.
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;

    case "ping":
      return result(id, {});

    case "tools/list":
      return result(id, {
        tools: MCP_TOOLS.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });

    case "tools/call": {
      const name = msg.params?.name;
      const args = (msg.params?.arguments ?? {}) as Record<string, any>;

      const tool = typeof name === "string" ? TOOLS_BY_NAME.get(name) : undefined;
      if (!tool) {
        return error(id, ERROR_CODES.invalidParams, `Unknown tool: ${String(name)}`);
      }

      if (tool.requiresSudo && !ctx.sudo) {
        return toolFailure(
          id,
          `Tool "${tool.name}" requires admin access. Send the admin password in an "x-sudo-token" header on the MCP request.`
        );
      }

      try {
        const text = await tool.handler(args, ctx);
        return result(id, { content: [{ type: "text", text }] });
      } catch (err) {
        if (err instanceof ToolError) return toolFailure(id, err.message);
        console.error(`MCP tool "${tool.name}" failed:`, err);
        return toolFailure(id, `Tool "${tool.name}" failed unexpectedly.`);
      }
    }

    default:
      if (isNotification) return null;
      return error(id, ERROR_CODES.methodNotFound, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(error(null, ERROR_CODES.parse, "Invalid JSON"), { status: 400 });
  }

  const ctx: ToolContext = { sudo: isSudo(req) };
  const messages = Array.isArray(body) ? body : [body];

  if (messages.length === 0) {
    return Response.json(error(null, ERROR_CODES.invalidRequest, "Empty batch"), { status: 400 });
  }

  const responses = [];
  for (const raw of messages) {
    const msg = raw as JsonRpcRequest;
    if (!msg || typeof msg !== "object" || typeof msg.method !== "string") {
      responses.push(error(null, ERROR_CODES.invalidRequest, "Invalid JSON-RPC message"));
      continue;
    }
    try {
      const response = await handleMessage(msg, ctx);
      if (response) responses.push(response);
    } catch (err) {
      console.error("MCP handler error:", err);
      responses.push(error(msg.id ?? null, ERROR_CODES.internal, "Internal server error"));
    }
  }

  // All-notification payloads get an empty 202, per the transport spec.
  if (responses.length === 0) {
    return new Response(null, { status: 202 });
  }

  return Response.json(Array.isArray(body) ? responses : responses[0]);
}

// This server is stateless, so there is no long-lived stream to open or session to end.
export async function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function DELETE() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
