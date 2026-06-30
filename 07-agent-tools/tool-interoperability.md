# Tool Interoperability

## The Problem

Every major AI provider has a slightly different format for tool/function definitions. OpenAI uses `functions` then `tools`. Anthropic uses `tools` with `input_schema`. Google uses `function_declarations`. The underlying concept is identical; the JSON wrappers differ.

If you define a tool once per provider format, you have three copies of the same schema to maintain. One bad edit and one model gets a different tool than another.

Interoperability means defining tools once and converting to the format each provider expects.

---

## Schema Comparison

**Shared concept (abstract):**
```
name: "get_weather"
description: "Get weather for a city. Returns temperature and conditions."
parameters:
  city: string (required)
  units: string (optional, default "celsius")
```

**Anthropic format:**
```json
{
  "name": "get_weather",
  "description": "Get weather for a city. Returns temperature and conditions.",
  "input_schema": {
    "type": "object",
    "properties": {
      "city": {"type": "string", "description": "City name"},
      "units": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "Temperature unit"}
    },
    "required": ["city"]
  }
}
```

**OpenAI format:**
```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get weather for a city. Returns temperature and conditions.",
    "parameters": {
      "type": "object",
      "properties": {
        "city": {"type": "string", "description": "City name"},
        "units": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "Temperature unit"}
      },
      "required": ["city"]
    }
  }
}
```

**Google Gemini format:**
```json
{
  "name": "get_weather",
  "description": "Get weather for a city. Returns temperature and conditions.",
  "parameters": {
    "type": "object",
    "properties": {
      "city": {"type": "string", "description": "City name"},
      "units": {"type": "string", "enum": ["CELSIUS", "FAHRENHEIT"], "description": "Temperature unit"}
    },
    "required": ["city"]
  }
}
```

The parameter schema (JSON Schema) is the same in all three. The outer wrapper is different.

---

## Universal Tool Registry Pattern

Define tools in a provider-neutral format, then convert at call time.

```python
# tools/registry.py

TOOLS = {
    "get_weather": {
        "name": "get_weather",
        "description": "Get current weather for a city. Returns temperature and conditions.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "City name, e.g. 'London' or 'Lahore'"
                },
                "units": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit. Default: celsius"
                }
            },
            "required": ["city"]
        }
    },
    "search_web": {
        "name": "search_web",
        "description": "Search the web and return relevant results. Use for current events and factual lookups.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "num_results": {"type": "integer", "description": "Number of results. Default: 5", "default": 5}
            },
            "required": ["query"]
        }
    }
}


def for_anthropic(tool_names: list[str] = None) -> list[dict]:
    tools = [TOOLS[n] for n in tool_names] if tool_names else list(TOOLS.values())
    return [
        {
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["parameters"]
        }
        for t in tools
    ]


def for_openai(tool_names: list[str] = None) -> list[dict]:
    tools = [TOOLS[n] for n in tool_names] if tool_names else list(TOOLS.values())
    return [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["parameters"]
            }
        }
        for t in tools
    ]


def for_gemini(tool_names: list[str] = None) -> list[dict]:
    tools = [TOOLS[n] for n in tool_names] if tool_names else list(TOOLS.values())
    return [
        {
            "name": t["name"],
            "description": t["description"],
            "parameters": t["parameters"]
        }
        for t in tools
    ]
```

Usage:
```python
from tools.registry import for_anthropic, for_openai

# Claude
response = anthropic_client.messages.create(
    model="claude-sonnet-4-6",
    tools=for_anthropic(["get_weather", "search_web"]),
    ...
)

# GPT
response = openai_client.chat.completions.create(
    model="gpt-5.4",
    tools=for_openai(["get_weather", "search_web"]),
    ...
)
```

---

## Normalizing Tool Call Responses

The response format also differs per provider. Normalize it so your execution logic is provider-agnostic.

```python
# tools/executor.py

def extract_tool_calls(response, provider: str) -> list[dict]:
    """Extract tool calls from a model response, regardless of provider."""

    if provider == "anthropic":
        return [
            {"id": block.id, "name": block.name, "args": block.input}
            for block in response.content
            if block.type == "tool_use"
        ]

    elif provider == "openai":
        calls = []
        for choice in response.choices:
            if choice.message.tool_calls:
                for tc in choice.message.tool_calls:
                    calls.append({
                        "id": tc.id,
                        "name": tc.function.name,
                        "args": json.loads(tc.function.arguments)
                    })
        return calls

    elif provider == "gemini":
        calls = []
        for part in response.candidates[0].content.parts:
            if hasattr(part, "function_call"):
                calls.append({
                    "id": None,  # Gemini doesn't return call IDs
                    "name": part.function_call.name,
                    "args": dict(part.function_call.args)
                })
        return calls

    raise ValueError(f"Unknown provider: {provider}")


def format_tool_result(tool_call_id: str, result: dict, provider: str) -> dict:
    """Format a tool result for inclusion in the next model turn."""

    if provider == "anthropic":
        return {
            "type": "tool_result",
            "tool_use_id": tool_call_id,
            "content": json.dumps(result)
        }

    elif provider == "openai":
        return {
            "role": "tool",
            "tool_call_id": tool_call_id,
            "content": json.dumps(result)
        }

    raise ValueError(f"Unknown provider: {provider}")
```

---

## MCP as the Universal Bridge

MCP removes most of the above translation overhead. When your tools are exposed as an MCP server, any MCP-compatible host can call them without per-provider adapters.

```
Your MCP Server → Claude Code
Your MCP Server → Cursor
Your MCP Server → Windsurf
Your MCP Server → Custom OpenAI agent
```

All speak the same MCP protocol. You write the tool once. The host handles the translation from MCP to whatever the underlying model expects.

For teams building tools that multiple AI products will use, MCP is the right abstraction. For single-model apps where you control both sides, the registry pattern above is simpler.

---

## Cross-Model Testing Strategy

When the same tool set runs across providers, test each combination:

| Test | What to Verify |
|------|----------------|
| Tool discovery | Every provider sees all registered tools |
| Schema parsing | No provider rejects any tool schema |
| Call accuracy | Model calls correct tool for a given input |
| Argument generation | Args match schema types and required fields |
| Result handling | Model continues correctly after tool result |

Run this test matrix when you add a new tool or change a schema. Providers can behave differently on edge cases — especially around `oneOf`, `anyOf`, and nested objects.

---

## Versioning Cross-Provider Tools

When you change a tool's interface (rename a param, change a type, add a required field), all consumers break simultaneously if they use the shared registry. Protect against this with versioning:

```python
TOOLS_V1 = {...}   # original schema
TOOLS_V2 = {...}   # updated schema

def for_anthropic(tool_names=None, version="v2") -> list[dict]:
    source = TOOLS_V2 if version == "v2" else TOOLS_V1
    ...
```

Pin agents to a version until they're tested against the new schema. Migrate one agent at a time.
