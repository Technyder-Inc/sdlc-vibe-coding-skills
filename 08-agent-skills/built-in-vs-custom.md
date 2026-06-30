# Built-in vs Custom Skills

## The Decision Framework

Before building a custom skill, ask: does a built-in or community skill already do this? Building is slower than installing, and every custom skill you own is a skill you maintain.

The decision tree:

```
Does a built-in skill cover the core behavior?
├── Yes → Use it. Customize via configuration, not code.
│
└── No → Is there a community skill with the right license and quality?
    ├── Yes → Evaluate it. If it passes your security and quality bar, use it.
    │
    └── No → Build custom.
               ├── Is the behavior domain-specific to your company/client?
               │   └── Yes → Build and own it fully.
               └── Is it a general capability that others would need?
                   └── Yes → Build and open-source it.
```

---

## Built-in Skills (Claude Code / OpenClaw)

These are available without any installation in compatible environments.

| Skill | What It Does |
|-------|-------------|
| `Read` | Read file contents |
| `Edit` | Make precise string replacements in files |
| `Write` | Write or overwrite a file |
| `Bash` | Execute shell commands |
| `Agent` | Spawn a sub-agent with a custom prompt |
| `WebSearch` | Search the web |
| `WebFetch` | Fetch and extract content from a URL |

In OpenClaw, the equivalent tools are MCP-exposed (e.g., `file_fetch`, `web_search`, `sessions_spawn`).

When to use built-ins: the task is generic (read, write, search, execute). No custom logic needed.

When NOT to use built-ins alone: the task requires domain knowledge, brand constraints, output formatting, or multi-step coordination. Add a skill wrapper that configures behavior.

---

## Wrapping Built-ins with Skill Behavior

A skill wrapper takes a built-in capability and adds behavioral constraints for your domain.

**Example: `draft-email` wraps the model's native text generation**

Without skill:
```
User: Draft an email to our client asking for a meeting.
Model: Hi John, Hope this finds you well! I wanted to reach out about...
```

With skill (brand voice enforced):
```python
DRAFT_EMAIL_SYSTEM_PROMPT = """
You are a professional business email writer for Technyder Inc.

Rules:
- No opening filler (no "I hope this finds you well", "Hope you're doing great")
- No em-dashes
- No AI jargon
- Maximum 200 words
- Subject line under 60 characters
- End with a clear, single call to action
- Tone: warm and confident, not formal or stiff
"""
```

The built-in generation capability hasn't changed. The skill wrapper shapes how it's used.

---

## Community Skills

Community skills are pre-built skill packages shared via registries (npm, PyPI, skill workshop catalogs). They come in three quality tiers:

**Tier 1: Vendor-published**
Skills published by the tool/API vendor themselves. Example: Notion's official MCP server, GitHub's official tools. These are maintained, documented, and security-reviewed.

**Tier 2: Community-maintained**
Popular open-source skills with active maintainers and real usage (100+ GitHub stars, recent commits). These are generally reliable but require your own security review before production use.

**Tier 3: Solo / abandoned**
Skills with one contributor, no tests, last updated 18 months ago. Treat these as reference implementations — read the code, don't run it directly.

Security checklist before using any community skill:
- [ ] Does it handle credentials securely? (No hardcoded secrets, no logging of sensitive values)
- [ ] Does it validate inputs before passing to external APIs?
- [ ] Is the output schema documented and stable?
- [ ] What happens when the external API errors? Does it handle failures gracefully?
- [ ] Does it expose more permissions than needed?

---

## When to Build Custom

Build custom skills when:

1. **Domain specificity**: The skill embodies knowledge unique to your company or client — their brand voice, their data schema, their workflow logic. No community version will capture this.

2. **Integration specificity**: You need to connect two internal systems that no public skill covers. Example: sync your CRM to your internal project tracker.

3. **Quality control**: Community skill output doesn't meet your standards and modifying it would be more work than building from scratch.

4. **Security boundary**: You can't trust a third-party skill with access to client data. Build and own the boundary.

---

## Custom Skill Structure

A production-grade custom skill has five components:

```
skills/
└── draft-proposal/
    ├── SKILL.md          # Spec: purpose, inputs, outputs, constraints, version
    ├── system_prompt.txt # The behavioral instruction layer
    ├── tools.py          # Tool subset this skill uses
    ├── runner.py         # The execution logic (model calls, tool execution)
    └── tests/
        ├── test_runner.py
        └── fixtures/
            ├── input_standard.json
            ├── input_edge_case.json
            └── expected_output_schema.json
```

Minimal viable custom skill (no separate files):

```python
# skills/classify_lead.py

SYSTEM_PROMPT = """
You are a B2B lead classifier for Technyder Inc.
Classify the inbound lead and return a JSON object with:
- icp_fit: high | medium | low
- primary_vertical: restaurant | real_estate | healthcare | saas | other
- urgency: hot | warm | cold
- reasoning: one sentence explaining the classification

Base your classification on: company size signals, tech stack mentions, pain points described, and whether they mention budget or timeline.

Return ONLY valid JSON. No preamble.
"""

async def run(inputs: dict) -> dict:
    message = inputs["message"]
    company_context = inputs.get("company_context", "")

    prompt = f"Lead message:\n{message}\n\nCompany context:\n{company_context}"

    response = await call_model(
        system=SYSTEM_PROMPT,
        user=prompt,
        model="claude-haiku-4-5",  # L1 task — cheap and fast
        response_format="json"
    )

    return response
```

---

## Skill Versioning in Practice

When a custom skill's output contract changes, existing callers break. Protect against this with versioned skill registration.

```python
SKILL_REGISTRY = {
    "classify-lead": {
        "v1": classify_lead_v1.run,
        "v2": classify_lead_v2.run,
        "latest": "v2"
    }
}

async def run_skill(name: str, inputs: dict, version: str = "latest") -> dict:
    skill_versions = SKILL_REGISTRY.get(name)
    if not skill_versions:
        raise SkillNotFoundError(name)

    resolved_version = skill_versions["latest"] if version == "latest" else version
    runner = skill_versions.get(resolved_version)
    if not runner:
        raise SkillVersionNotFoundError(name, version)

    return await runner(inputs)
```

When to cut a new version vs patch in place:
- Output schema changed: new version
- New required input added: new version
- Prompt wording improved, same output: patch in place
- Bug fix that doesn't change behavior: patch in place

---

## The Skill Lifecycle

```
Idea → Draft → Internal test → Staging validation → Production → Monitored → Evolved → Deprecated
```

No skill ships to production without tests. No skill stays in production without monitoring. Deprecated skills have a migration path documented before removal.

In OpenClaw, the self-evolve framework handles the monitoring and evolution phases. For custom skills outside OpenClaw, build lightweight run logging from day one — even a JSON append-log of inputs, outputs, and latency gives you the data you need to improve skills over time.
