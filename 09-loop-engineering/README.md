# Loop Engineering

## What It Is

Loop engineering is replacing yourself as the person who prompts the agent. You design the system that does it instead.

A loop is a recursive goal: you define a purpose and the AI iterates — with sub-agents, verification, and external state — until the goal is complete or the loop decides to hand off to you.

> "I don't prompt Claude anymore. I have loops running that prompt Claude and figuring out what to do. My job is to write loops."
> — Boris Cherny, Head of Claude Code at Anthropic

Named and codified by Addy Osmani (Google Chrome DevRel), June 2026.

---

## Where It Fits in the Evolution Chain

Each paradigm shift added a layer of abstraction above the previous one:

```
Prompt Engineering      You write good prompts. One turn at a time.
       ↓
Context Engineering     You manage what the model knows before it responds.
       ↓
Harness Engineering     You design the environment a single agent runs inside.
       ↓
Factory Model           You build the system that produces software.
       ↓
Loop Engineering        You build the system that runs the factory without you.
```

Loop engineering sits one floor above the harness and factory model. The factory model defines the architecture. Loop engineering is what makes it run autonomously on a schedule, with parallel agents and durable memory, without requiring a human to start each turn.

The factory model is covered in [03-factory-model/](../03-factory-model/README.md). Loop engineering is its runtime layer.

---

## The Six Primitives

A functioning loop requires six components. The sixth (state) is the one most often skipped and most often why loops fail.

| # | Primitive | Role in the Loop | Claude Code | Codex App |
|---|-----------|-----------------|-------------|-----------|
| 1 | **Automations** | Discovery and triage on a schedule, no human trigger | Scheduled tasks, cron, `/loop`, hooks, GitHub Actions | Automations tab: project, prompt, cadence; results in Triage inbox |
| 2 | **Worktrees** | Isolate parallel agents so they do not overwrite each other | `git worktree`, `--worktree`, `isolation: worktree` on subagents | Built-in worktree per thread |
| 3 | **Skills** | Codify project knowledge the agent would otherwise guess | SKILL.md files, invoked explicitly or implicitly | Agent Skills (SKILL.md), invoked with `$name` |
| 4 | **Plugins / Connectors** | Connect the agent to the tools you already use | MCP servers | Connectors (MCP) plus plugins |
| 5 | **Sub-agents** | One agent generates, a different one verifies (maker-checker) | Task subagents in `.claude/agents/`, agent teams | Subagents defined as TOML in `.codex/agents/` |
| 6 | **Durable State** | Track what is done and what is next, outside the conversation | Markdown files (AGENTS.md, progress files), Linear via MCP | Markdown or Linear via a connector |

The names differ slightly between tools but the capability is the same. A loop designed against these six primitives works regardless of which coding agent you are running inside.

---

## The Sixth Primitive: Why State Is the Load-Bearing Piece

Every agent forgets everything between runs. The context window closes. The next run starts cold.

Durable state is the mechanism that keeps the loop coherent across runs. Without it, each automation fires blind: it does not know what the previous run completed, what failed, what is in progress, or what should be skipped.

The minimum viable state file tracks:

```markdown
## In Progress
- [ ] Task A — started 2026-07-01, assigned to agent-1

## Done
- [x] Task B — completed 2026-06-30
- [x] Task C — completed 2026-06-29

## Backlog
- [ ] Task D
- [ ] Task E
```

This file lives in the repo, not in the conversation. The agent reads it at the start of each run and writes to it at the end. The loop is coherent because the repo is coherent, not because the model remembers.

See [durable-state-design.md](durable-state-design.md) for full design guidance.

---

## The Maker-Checker Pattern

The most reliable loop structure for code generation is maker-checker: one sub-agent generates, a second sub-agent verifies.

```
Automation fires
       ↓
  Maker Agent        reads spec, generates implementation
       ↓
  Checker Agent      reads spec + implementation, scores against criteria
       ↓
  If pass:           merge to branch, update state
  If fail:           route failure + context back to Maker Agent
       ↓
  State updated      loop sleeps until next automation fires
```

The checker agent does not improvise. It scores against explicit criteria from the spec. This is the same pattern as automated evals in the factory model (see [03-factory-model/README.md](../03-factory-model/README.md)), but running inside a loop rather than in CI.

See [maker-checker-pattern.md](maker-checker-pattern.md) for implementation detail.

---

## When Loop Engineering Is the Right Tool

Loop engineering is not always the right choice. Addy Osmani is explicit about this: it is early, it requires careful attention to token costs, and a poorly designed loop is worse than no loop.

**Use loop engineering when:**
- The work is well-defined and recurring (code review, dependency updates, test generation, documentation sync)
- You can write clear success criteria that a checker agent can evaluate without human review
- The task has low blast radius if the loop produces a wrong output before it is caught
- You have durable state infrastructure to track what has run

**Do not use loop engineering when:**
- The task requires novel judgment you cannot codify in a spec
- Success criteria are ambiguous or context-dependent
- The blast radius of a wrong output is high (production deployments, payment code, auth changes)
- You have not yet built and validated the factory model for this task area

The right progression: build the factory first, validate it works with humans in the loop, then automate the human out with loop engineering.

---

## How This Connects to the Rest of This Repo

Loop engineering does not replace the earlier modules. It depends on them.

| This module needs... | Covered in... |
|---|---|
| Specs the loop can execute against | [02-sdlc-phases/](../02-sdlc-phases/) |
| A working factory model | [03-factory-model/](../03-factory-model/) |
| Skills so agents do not guess project conventions | [08-agent-skills/](../08-agent-skills/) |
| Evals the checker agent can run | [05-checklists/evaluation-framework.md](../05-checklists/evaluation-framework.md) |
| Tool access via MCP | [07-agent-tools/](../07-agent-tools/) |
| Security checks before shipping loop output | [05-checklists/vibe-coding-security-checklist.md](../05-checklists/vibe-coding-security-checklist.md) |

A loop built without good specs will generate bad code reliably. A loop built without skills will rediscover project conventions on every run. A loop built without evals will ship unverified output automatically.

The factory model gets you reliable output with humans in the loop. Loop engineering removes the humans from the routine work and focuses them on the exceptions.

---

## Files in This Section

- [six-primitives.md](six-primitives.md) — Deep implementation guide for each of the six primitives
- [maker-checker-pattern.md](maker-checker-pattern.md) — Step-by-step maker-checker loop design
- [durable-state-design.md](durable-state-design.md) — State file design, what to track, and how agents read and write it
- [loop-risks.md](loop-risks.md) — Loopmaxxing, token runaway, exit conditions, and safe loop design
