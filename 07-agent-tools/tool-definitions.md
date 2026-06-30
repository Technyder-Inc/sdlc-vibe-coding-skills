# Agent Tool Definitions

## What a Tool Is

A tool is a typed, named function that an agent can call to interact with the world outside the LLM context window. The model cannot read files, call APIs, run code, or persist data on its own. Tools are how it does any of that.

The model sees the tool's name, description, and parameter schema. It decides whether to call the tool, constructs the call, and waits for the result. The host application executes the actual function and returns the result.

```
Model → tool_call(name, args) → Host executes → result → Model continues
```

---

## Tool Schema Anatomy

Every tool has three required components:

**1. Name**
Short, verb-noun format. No ambiguity.

```json
"name": "read_file"
"name": "search_codebase"
"name": "run_tests"
"name": "create_github_pr"
```

Bad names: `doThing`, `helper`, `process`, `execute`

**2. Description**
One to three sentences. The model uses this to decide *when* to call the tool. If the description is wrong, the model calls the tool at the wrong time.

```json
"description": "Read the full contents of a file at the given path. Use this when you need to understand the current state of a file before editing it. Do not call this if you already have the file contents in context."
```

Key principles:
- State what the tool does
- State when to use it
- State when NOT to use it (prevents misuse)
- Never use vague words like "useful for various tasks"

**3. Parameter Schema (JSON Schema)**
Precise types, required fields, and descriptions for every parameter.

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Absolute path to the file. Must start with /."
    },
    "start_line": {
      "type": "integer",
      "description": "Optional. First line to read (1-indexed). Omit to read from the start."
    },
    "end_line": {
      "type": "integer",
      "description": "Optional. Last line to read (inclusive). Omit to read to end of file."
    }
  },
  "required": ["path"]
}
```

---

## Tool Design Principles

### Minimum Necessary Scope
A tool should do exactly one thing. A tool named `manage_files` that can read, write, delete, and rename is dangerous — the model may call it with unintended operations.

Correct:
```
read_file(path)
write_file(path, content)
delete_file(path)    ← separate, requires explicit user confirmation
```

Incorrect:
```
file_manager(path, operation, content)  ← too broad
```

### Idempotency Where Possible
Read operations are always safe to retry. Write and delete operations should be idempotent or guarded.

### Explicit Side Effect Labels
If a tool has side effects (sends a message, writes to a database, charges a user), say so explicitly in the description.

```json
"description": "Send a WhatsApp message to the specified phone number. SIDE EFFECT: This action cannot be undone. Confirm with the user before calling if message content was not explicitly approved."
```

### Result Format Contract
Define what success and failure look like in the return value. The model uses the return value to decide what to do next. Inconsistent return shapes cause hallucination cascades.

```json
// Success
{"ok": true, "content": "...file content..."}

// Failure
{"ok": false, "error": "FILE_NOT_FOUND", "message": "No file at /path/to/file.txt"}
```

---

## Common Tool Categories

| Category | Examples | Risk Level |
|----------|----------|------------|
| **Read** | read_file, search_web, list_directory | Low |
| **Compute** | run_code, execute_query, calculate | Medium |
| **Write** | write_file, update_database, create_record | High |
| **Communicate** | send_email, post_message, notify_user | High |
| **Destroy** | delete_file, drop_table, cancel_subscription | Critical |

Risk level determines whether the tool should require human confirmation before execution.

---

## Tool Registration Pattern

When building a tool-enabled agent, register tools before the conversation starts. Different frameworks use different registration APIs but the schema shape is consistent.

**Claude / Anthropic:**
```python
tools = [
    {
        "name": "read_file",
        "description": "Read file contents at the given path.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute file path"}
            },
            "required": ["path"]
        }
    }
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,
    messages=[{"role": "user", "content": "Read /home/user/config.json"}]
)
```

**OpenAI / GPT:**
```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read file contents at the given path.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"}
                },
                "required": ["path"]
            }
        }
    }
]
```

The schema is nearly identical — the wrapper differs. This is intentional. See [tool-interoperability.md](tool-interoperability.md) for cross-model tool sharing.

---

## Validating Tool Calls

The host application must validate every tool call before executing it, regardless of how well-described the tool is. Models make schema errors. Malicious inputs can exploit loose validation.

```python
def execute_tool(tool_name: str, args: dict) -> dict:
    # 1. Check tool exists
    if tool_name not in REGISTERED_TOOLS:
        return {"ok": False, "error": "UNKNOWN_TOOL"}

    # 2. Validate args against schema
    try:
        jsonschema.validate(args, TOOL_SCHEMAS[tool_name])
    except jsonschema.ValidationError as e:
        return {"ok": False, "error": "INVALID_ARGS", "message": str(e)}

    # 3. Authorization check
    if not user_can_call(current_user, tool_name):
        return {"ok": False, "error": "FORBIDDEN"}

    # 4. Execute
    return REGISTERED_TOOLS[tool_name](**args)
```

Never skip step 3. Agents operating on behalf of users cannot have broader permissions than the user.

---

## Anti-Patterns

**Over-informative descriptions**
Descriptions that explain implementation details rather than usage intent confuse the model about when to call.

**Silent failures**
Returning an empty string or `null` on error instead of a structured error response causes the model to continue with incorrect assumptions.

**Unbounded tools**
A tool that can accept arbitrary shell commands (`run_command(cmd: str)`) is an RCE vulnerability. Never expose this in production.

**Tool sprawl**
Having 50 tools registered at once degrades decision quality. The model must evaluate all of them on every turn. Group tools by context and only register what the current task actually needs.
