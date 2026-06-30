# MCP Integration

## What Is MCP

Model Context Protocol (MCP) is an open standard that defines how AI models connect to external tools, data sources, and services through a standardized client-server interface. Before MCP, every AI application needed custom integration code for every tool. MCP makes that integration reusable.

The spec was open-sourced by Anthropic in November 2024 and has since been adopted across the ecosystem — Claude, Cursor, Windsurf, Zed, and dozens of SaaS tools now expose MCP servers.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              MCP Host (Client)               │
│  ┌───────────────────────────────────────┐  │
│  │        AI Model / Agent Loop          │  │
│  └───────────────────────────────────────┘  │
│         ↑ tool results  ↓ tool calls         │
│  ┌───────────────────────────────────────┐  │
│  │          MCP Client Layer             │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
              ↑↓ JSON-RPC 2.0
┌─────────────────────────────────────────────┐
│              MCP Server                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────┐  │
│  │    Tools    │  │Resources │  │Prompts │  │
│  └─────────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────┘
              ↕
    External Service / Data Source
```

The **MCP Host** is your application (Claude Code, your agent loop, etc.).
The **MCP Server** exposes capabilities — tools, resources, or prompt templates.
Communication is JSON-RPC 2.0 over stdio or HTTP with SSE.

---

## Three Capability Types

### 1. Tools
Functions the model can call. Same concept as regular agent tools, but standardized and discoverable via the MCP protocol. The host calls `tools/list` to discover what's available; the model calls `tools/call` to invoke one.

```json
// Server advertises
{
  "name": "read_file",
  "description": "Read file contents",
  "inputSchema": {"type": "object", "properties": {"path": {"type": "string"}}}
}

// Client calls
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "read_file", "arguments": {"path": "/etc/hosts"}}}
```

### 2. Resources
Data the model can read, without calling a function. Think of it as context injection — the server exposes URIs that the host can fetch and include in the model's context.

```
mcp://filesystem/home/user/notes.md
mcp://database/customers/table-schema
mcp://github/Technyder-Inc/sdlc-vibe-coding-skills/README.md
```

Resources are pulled by the host. The model doesn't call them — they're pre-loaded into context.

### 3. Prompts
Parameterized prompt templates the server provides. A Notion MCP server might expose a `summarize_page` prompt. The host retrieves it, fills in parameters, and sends it to the model.

---

## Transport Modes

| Transport | Use Case | Notes |
|-----------|----------|-------|
| **stdio** | Local processes, CLI tools | Most common for local dev |
| **HTTP + SSE** | Remote servers, cloud services | Required for multi-user deployments |
| **WebSocket** | Real-time bidirectional | Less common, for streaming scenarios |

stdio mode: the host spawns the MCP server as a subprocess and communicates via stdin/stdout. Zero network overhead. Best for developer tooling and CLI agents.

HTTP+SSE mode: the host connects to a remote URL. Server pushes events via SSE, client sends requests via POST. Required for SaaS integrations.

---

## Building an MCP Server (Python)

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import mcp.types as types

server = Server("my-tool-server")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_weather",
            description="Get current weather for a city. Returns temperature, conditions, and humidity.",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"}
                },
                "required": ["city"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "get_weather":
        city = arguments["city"]
        # ... fetch weather data
        return [TextContent(type="text", text=f"Weather in {city}: 24°C, Partly cloudy")]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

Install: `pip install mcp`

---

## Building an MCP Server (Node.js / TypeScript)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({ name: "my-tool-server", version: "1.0.0" }, {
  capabilities: { tools: {} }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "search_docs",
    description: "Search internal documentation.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"]
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "search_docs") {
    const results = await searchDocs(args.query);
    return { content: [{ type: "text", text: JSON.stringify(results) }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Connecting to an MCP Server from Claude Code

In `claude_desktop_config.json` (or the equivalent OpenClaw config):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_API_KEY": "secret_xxx"
      }
    },
    "custom-tools": {
      "command": "python3",
      "args": ["/home/user/my_mcp_server.py"]
    }
  }
}
```

Each key is an MCP server name. The host starts these processes on startup and keeps them running.

---

## Security Considerations

MCP expands the attack surface. Every MCP server is a new trust boundary.

**Prompt injection via resources**: A malicious document exposed as an MCP resource can contain instructions for the model. Treat all MCP resource content as untrusted input. Sanitize before injecting into system prompts.

**Tool scope creep**: An MCP server that exposes `run_sql` is equivalent to giving the model direct database access. Enforce read-only connections unless write access is explicitly needed.

**Server authentication**: stdio servers inherit the host process's permissions. HTTP MCP servers must authenticate callers. Never expose an MCP server publicly without authentication.

**Capability auditing**: Review every tool a connected MCP server exposes before deploying. The model can call any tool it can discover. Unexpected tools = unexpected actions.

---

## Common MCP Servers Worth Knowing

| Server | What It Exposes |
|--------|----------------|
| `@modelcontextprotocol/server-filesystem` | Read/write local files |
| `@modelcontextprotocol/server-github` | GitHub repos, issues, PRs |
| `@modelcontextprotocol/server-postgres` | PostgreSQL read/write |
| `@notionhq/notion-mcp-server` | Notion pages and databases |
| `@supabase/mcp-server-supabase` | Supabase DB and edge functions |
| `mcp-server-brave-search` | Brave web search |
| `mcp-server-puppeteer` | Browser automation |

These are available via npm and installable in any MCP-compatible host.

---

## MCP in the Vibe Coding Context

In vibe coding workflows, MCP is primarily used in two ways:

1. **Developer tooling**: Claude Code uses MCP servers (filesystem, GitHub, databases) to operate on your actual project. You configure these once per workspace.

2. **Application integration**: Your vibe-coded app exposes an MCP server so other AI agents can call it. Your CRM tool, your knowledge base, your workflow engine — each becomes a node in a larger agent graph.

When building agentic features into a vibe-coded app, consider exposing your app's core actions as an MCP server from day one. It costs minimal extra effort and makes your app composable with any MCP-compatible orchestrator.
