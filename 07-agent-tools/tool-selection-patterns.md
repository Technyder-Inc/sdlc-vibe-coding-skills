# Tool Selection Patterns

## The Core Problem

When a model has 20 tools available, it must evaluate all 20 on every turn. This degrades accuracy, increases latency, and inflates token cost. Tool selection is about giving the model only what it needs for the current task.

Three patterns handle this at different scales:

1. **Static filtering** — pick a fixed subset at task creation time
2. **Semantic routing** — embed the task and retrieve the relevant tools dynamically
3. **Hierarchical tools** — expose meta-tools that return sub-tool lists

---

## Pattern 1: Static Filtering

The simplest and most reliable. Before the agent loop starts, choose which tools to enable based on the task type.

```python
TOOL_PROFILES = {
    "code_review": ["read_file", "search_codebase", "run_tests", "get_git_diff"],
    "data_analysis": ["read_csv", "run_sql", "plot_chart", "write_file"],
    "research": ["search_web", "fetch_url", "summarize_document", "write_file"],
    "communication": ["send_email", "create_calendar_event", "draft_message"],
}

def get_tools_for_task(task_type: str) -> list[dict]:
    tool_names = TOOL_PROFILES.get(task_type, list(ALL_TOOLS.keys()))
    return for_anthropic(tool_names)


# Agent loop
task_type = classify_task(user_request)  # simple keyword or LLM classifier
tools = get_tools_for_task(task_type)

response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,
    messages=messages
)
```

When to use: task types are known upfront, distinct, and map cleanly to tool sets. Works for 80% of production cases.

Limitation: inflexible when tasks span multiple profiles. A request like "review this code and email me the summary" needs tools from both `code_review` and `communication`.

---

## Pattern 2: Semantic Tool Retrieval

Embed the task description and retrieve the most relevant tools by cosine similarity. Same concept as RAG, applied to tool schemas.

```python
import numpy as np

# Pre-embed all tool descriptions at startup
TOOL_EMBEDDINGS = {}
for name, tool in ALL_TOOLS.items():
    embedding = embed_text(tool["description"])
    TOOL_EMBEDDINGS[name] = embedding


def retrieve_tools(task: str, top_k: int = 8) -> list[dict]:
    task_embedding = embed_text(task)
    scores = {
        name: cosine_similarity(task_embedding, emb)
        for name, emb in TOOL_EMBEDDINGS.items()
    }
    ranked = sorted(scores, key=scores.get, reverse=True)
    selected = ranked[:top_k]
    return for_anthropic(selected)


def embed_text(text: str) -> np.ndarray:
    # Use any embedding model — OpenAI, Cohere, local
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return np.array(response.data[0].embedding)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

When to use: large tool catalogs (30+), task descriptions are rich and varied, no clean upfront classification possible.

Limitation: embedding retrieval adds latency and can miss tools whose description doesn't closely match the task phrasing. Always include a safety floor — retrieve top_k plus any tools that are always needed (e.g., a `report_completion` tool).

---

## Pattern 3: Hierarchical / Meta-Tools

Instead of exposing 50 tools directly, expose a `get_available_tools` meta-tool. The model calls it first, gets back a context-appropriate subset, and then proceeds.

```python
TOOL_CATALOG = {
    "code": {
        "description": "Tools for reading, writing, and running code",
        "tools": ["read_file", "write_file", "run_tests", "search_codebase"]
    },
    "web": {
        "description": "Tools for searching and fetching web content",
        "tools": ["search_web", "fetch_url", "extract_links"]
    },
    "data": {
        "description": "Tools for querying and transforming data",
        "tools": ["run_sql", "read_csv", "write_csv", "run_python"]
    }
}

def list_tool_categories():
    """Meta-tool: returns available tool categories and their descriptions."""
    return {
        name: cat["description"]
        for name, cat in TOOL_CATALOG.items()
    }

def activate_tool_category(category: str):
    """Meta-tool: activates a category and returns its tools."""
    if category not in TOOL_CATALOG:
        return {"error": f"Unknown category: {category}"}
    tools = TOOL_CATALOG[category]["tools"]
    # Inject these into the next agent turn
    session_state["active_tools"] = tools
    return {"activated": category, "tools": tools}
```

When to use: tool sets that cannot be predicted upfront, very large catalogs, or multi-stage workflows where different phases need different tools.

Limitation: adds a full extra model turn before useful work begins. Increases latency and token cost.

---

## Pattern 4: Tool Use Policies

Beyond which tools are available, control how aggressively the model uses them.

```python
# Anthropic API: control tool use behavior
response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,

    # Options:
    # "auto"          — model decides whether to use tools (default)
    # "any"           — model MUST use at least one tool
    # "none"          — model CANNOT use tools
    # {"type": "tool", "name": "X"} — model MUST call this specific tool
    tool_choice={"type": "auto"}
)
```

Use cases:
- `tool_choice="any"` — force structured output via a dedicated output tool instead of free text
- `tool_choice={"type": "tool", "name": "submit_answer"}` — require a final answer in schema format
- `tool_choice="none"` — reasoning or reflection turn where you need text only

Forcing a tool call is the most reliable way to get structured output. Define a `StructuredOutput` tool with your desired schema and pass `tool_choice={"type": "tool", "name": "StructuredOutput"}`. The model will always call it.

---

## Parallel vs Sequential Tool Calls

Claude 3+ and GPT-4+ can call multiple tools in a single turn (parallel tool use). The model emits multiple tool_use blocks in one response. The host executes them concurrently and returns all results in one tool_result turn.

```python
# Model emits:
[
  {"type": "tool_use", "id": "call_1", "name": "read_file", "input": {"path": "/a.txt"}},
  {"type": "tool_use", "id": "call_2", "name": "read_file", "input": {"path": "/b.txt"}},
  {"type": "tool_use", "id": "call_3", "name": "search_web", "input": {"query": "..."}}
]

# Host executes all 3 concurrently, then returns:
[
  {"type": "tool_result", "tool_use_id": "call_1", "content": "..."},
  {"type": "tool_result", "tool_use_id": "call_2", "content": "..."},
  {"type": "tool_result", "tool_use_id": "call_3", "content": "..."}
]
```

Execution:
```python
import asyncio

async def execute_parallel_tools(tool_calls: list[dict]) -> list[dict]:
    tasks = [execute_tool(tc["name"], tc["args"]) for tc in tool_calls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [
        {
            "type": "tool_result",
            "tool_use_id": tc["id"],
            "content": json.dumps(r) if not isinstance(r, Exception) else json.dumps({"error": str(r)})
        }
        for tc, r in zip(tool_calls, results)
    ]
```

Always support parallel execution. Sequential blocking on each tool call is a significant latency multiplier in agentic workflows.

---

## Deciding Which Pattern to Use

| Situation | Pattern |
|-----------|---------|
| < 15 tools total | Static profile, use all |
| 15-40 tools, task types are known | Static filtering by profile |
| 40+ tools, varied tasks | Semantic retrieval |
| Multi-stage workflow with phase transitions | Hierarchical / meta-tools |
| Need structured output | Force specific tool via tool_choice |
| High parallelism need | Parallel tool execution |

Start simple. Static filtering handles most production workflows. Add semantic retrieval only when tool count or task variety genuinely demands it.
