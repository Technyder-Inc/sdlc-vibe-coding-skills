# Skill Architecture

## What a Skill Is

A skill is a composable, reusable unit of agent behavior. Where a tool is a function the model calls, a skill is a higher-level abstraction — a named capability that bundles a system prompt, a tool set, a workflow, and optionally an evaluation rubric into a single deployable package.

If a tool is a wrench, a skill is a trained plumber who knows when to use the wrench, which wrench to use, and when the problem is actually a pipe issue and not a fitting issue.

Skills are to agents what modules are to software: the unit of composition, reuse, and encapsulation.

---

## The Four Layers of a Skill

```
┌─────────────────────────────────────────────────────┐
│                    SKILL                             │
│                                                      │
│  Layer 1: INSTRUCTION                               │
│  System prompt, behavioral constraints, output       │
│  format contract, error handling rules               │
│                                                      │
│  Layer 2: TOOLS                                     │
│  The specific tool set exposed in this skill context │
│  (filtered from the global tool registry)            │
│                                                      │
│  Layer 3: MEMORY                                    │
│  What the skill can read and write between calls     │
│  (conversation history, vector store, state file)    │
│                                                      │
│  Layer 4: EVALUATION                                │
│  How correctness is measured for this skill's output │
│  (unit tests, LLM-as-judge criteria, human review)   │
└─────────────────────────────────────────────────────┘
```

A minimal skill needs Layer 1 and Layer 2. Layer 3 and Layer 4 are added as the skill matures.

---

## Skill Spec Structure

Every skill in a well-run agent platform has a spec file (in OpenClaw format, `SKILL.md`):

```markdown
---
name: draft-email
version: 1.2.0
description: Drafts professional outbound emails given a goal, recipient, and context
format: conversational
relevance: frequent
expiration: never
sensitivity: internal
hierarchy: 2
mcp_compatible: false
workflow_compatible: true
tested: true
tested_date: 2026-06-15
framework: fresh
---

## Purpose
Generate professional email drafts that match brand voice (Lexend, no em-dashes, no AI jargon).

## Inputs
- goal: What the email should accomplish
- recipient: Name, title, company of the recipient
- context: Any prior interaction or relevant background
- tone: formal | warm | direct (default: warm)

## Output Contract
Returns a single email with subject line, body, and a one-line summary of the send rationale.
No signoffs. No PS. No filler openers like "I hope this message finds you well."

## Tools Used
- None (pure generation task)

## Constraints
- Max email body: 200 words
- Never use em-dashes
- Subject line must be under 60 characters
- If context is unclear, ask one clarifying question before drafting

## Evaluation Criteria
- Brand voice match (no jargon, no em-dashes)
- Subject line specificity (not generic)
- Call to action clarity
- Word count under limit
```

This spec is the contract. Everything else — the implementation, the model, the calling convention — can change. The contract stays stable.

---

## Skill Granularity

**Too fine-grained:**
A skill called `format-date-as-ISO8601`. One line of logic. No behavioral complexity. This is a utility function, not a skill.

**Too coarse-grained:**
A skill called `handle-client-work`. Covers research, writing, analysis, scheduling. Impossible to test, impossible to reason about failure modes.

**Right size:**
A skill has a single, nameable output type. `research-company`, `draft-proposal`, `summarize-document`, `classify-lead` — these are skill-sized. The output of each is clear and testable.

Rule of thumb: if you can't describe the skill's output in one noun phrase, split it.

---

## Skill Discovery

Agents need to know which skills exist and which to use. Three approaches:

**1. Hard-coded routing**
The orchestrator has explicit `if/elif` logic that maps task types to skill names. Simple, debuggable, but requires code changes to add new skills.

```python
def route_task(task: Task) -> str:
    if task.type == "email_draft":
        return "draft-email"
    elif task.type == "lead_research":
        return "research-company"
    elif task.type == "proposal":
        return "draft-proposal"
    raise ValueError(f"No skill for task type: {task.type}")
```

**2. LLM-based routing**
The orchestrator model reads the task and selects a skill from a list.

```python
SKILL_INDEX = {
    "draft-email": "Drafts professional outbound emails",
    "research-company": "Researches a company for sales prospecting",
    "draft-proposal": "Writes a project proposal from a brief",
}

def route_task_llm(task: Task) -> str:
    skills_list = "\n".join(f"- {k}: {v}" for k, v in SKILL_INDEX.items())
    prompt = f"""Task: {task.description}

Available skills:
{skills_list}

Which skill handles this task? Reply with the exact skill name only."""
    response = call_model(prompt)
    return response.strip()
```

**3. Semantic search**
Embed task description, retrieve closest skill by embedding similarity. Scales to hundreds of skills.

LLM-based routing is the practical default for teams with 5-50 skills. It's more flexible than hard-coding and more debuggable than pure vector search.

---

## Skill Versioning

Skills change over time. Versioning protects callers from unexpected behavior changes.

Semver rules:
- **Patch** (1.0.x): Prompt wording improved, same output contract
- **Minor** (1.x.0): New optional input added, output extended but backwards-compatible
- **Major** (x.0.0): Output contract changed, required inputs added, behavior significantly different

When upgrading a skill, pin callers to the previous version until they've been tested against the new one:

```python
skill_registry.call("draft-email", args, version="1.2.0")  # pinned
skill_registry.call("draft-email", args)  # uses latest
```

---

## Skill State

Skills that run once with no memory are stateless. Skills that track behavior across runs, adapt to feedback, or build context over time are stateful.

State storage options by scale:

| Scale | Storage |
|-------|---------|
| Single machine | JSON state file at known path |
| Multi-instance | Redis or Postgres key-value |
| Long-term memory | Vector store (ChromaDB, Pinecone) |
| Full audit log | Append-only event log |

In OpenClaw's self-evolve framework, skills persist state in JSON files at `agents/evolve/state.json`. State tracks run counts, performance metrics, and last-observed issues — used by the skill's own evolution logic.

---

## Skill Dependencies

A skill can depend on other skills. The orchestrator resolves these like a dependency graph.

```
draft-proposal
├── research-company     (must complete first)
├── generate-pricing     (must complete first)
└── [proposal draft runs with both outputs]
```

```python
class SkillGraph:
    def run(self, skill_name: str, inputs: dict) -> dict:
        skill = self.registry[skill_name]
        resolved_inputs = dict(inputs)

        for dep_name, dep_output_key in skill.dependencies.items():
            dep_result = self.run(dep_name, inputs)
            resolved_inputs[dep_output_key] = dep_result

        return skill.execute(resolved_inputs)
```

Keep dependency depth shallow — one or two levels. Deep skill chains are hard to debug and slow to run. When a skill chain gets long, consider collapsing it into a workflow instead.
