# The Six Loop Engineering Primitives

A loop needs all six to hold together. Missing one creates a specific, predictable failure mode.

---

## Primitive 1: Automations

**Role:** Discovery and triage on a schedule. The loop starts here. No human trigger.

An automation fires on a cron schedule, reads the current state, identifies what work is ready to run, and dispatches it. Without automations, a loop is just a manually-triggered script.

**What automations do:**
- Check external signals: new issues opened, PRs ready for review, failing tests, stale dependencies
- Filter and triage: which items match the criteria the loop handles
- Dispatch: create tasks for the agents that will do the work
- Update state: mark items as in-progress so parallel runs do not double-pick

**In Claude Code:** Scheduled tasks via cron, `/loop`, hooks on file changes or GitHub events, GitHub Actions triggers. See [07-agent-tools/](../07-agent-tools/) for MCP-based trigger patterns.

**Failure mode without it:** You run the loop manually. At that point it is not a loop, it is a script you run sometimes.

---

## Primitive 2: Worktrees

**Role:** Isolate parallel agents so they do not overwrite each other.

When two agents work on different tasks simultaneously, they both need a clean working directory. Without worktrees, they write to the same files and corrupt each other's output.

**How it works:**
- Each agent gets its own git worktree: a separate working directory checked out from the same repo
- The agent makes changes in its worktree without affecting any other agent's work
- When the checker approves the output, the branch gets merged and the worktree cleaned up

**In Claude Code:** `git worktree add`, `--worktree` flag on agent invocations, `isolation: worktree` on subagents in workflow scripts.

**In practice:**
```bash
# Automation creates a worktree per task
git worktree add ../agent-task-47 -b feature/task-47
# Agent runs inside ../agent-task-47
# Checker reviews the branch
# On approval: merge + git worktree remove
```

**Failure mode without it:** Parallel agents write to the same files. Output is corrupted or agents block each other. Loops must serialize, losing all parallelism benefit.

**Relates to:** [03-factory-model/agent-harness.md](../03-factory-model/agent-harness.md) — harness isolation principles apply directly.

---

## Primitive 3: Skills

**Role:** Codify project knowledge the agent would otherwise guess.

Each agent run starts cold. Without skills, the agent spends tokens rediscovering how the project works: what naming conventions apply, how tests are structured, what tools are available, what patterns to follow.

Skills encode that knowledge once. The agent loads the skill at the start of a run and operates from accurate context rather than guessing.

**What goes in a skill:**
- How this project structures its code (naming, file layout, module boundaries)
- What testing patterns are required (unit, integration, E2E, eval)
- What tools the agent has access to and how to use them
- What the agent must not do (touch auth code, modify migration files, etc.)
- Any non-obvious conventions that are not visible from the code itself

**Skill format:** SKILL.md — a markdown file the agent reads at the start of a run. See [08-agent-skills/](../08-agent-skills/) for full skill design guidance.

**In Claude Code:** SKILL.md files in `.claude/skills/`, loaded explicitly or via skill invocation patterns.

**Failure mode without it:** The agent rediscovers conventions on every run, makes inconsistent choices, and violates project patterns that are obvious to any human who has worked in the codebase.

---

## Primitive 4: Plugins and Connectors

**Role:** Connect the agent to the tools you already use.

A loop that cannot read or write to your real systems cannot do real work. Plugins and connectors give the loop access to:
- Issue trackers (Linear, GitHub Issues, Jira)
- CI/CD pipelines
- Code review tools
- Deployment systems
- Databases and APIs the codebase depends on

**In Claude Code:** MCP servers. Each tool gets an MCP server that exposes its operations as tools the agent can call.

**Design principle:** Give the loop minimum necessary access. An automation that triages issues needs read access to issues and write access to labels. It does not need deploy access. Scope connectors to what the specific loop requires.

**Relates to:** [07-agent-tools/](../07-agent-tools/) — MCP integration patterns, tool selection, and minimum-privilege tool design are covered in full there.

**Failure mode without it:** The loop produces output (code, comments, PRs) but cannot connect it to the systems where work actually gets tracked and shipped. Humans have to bridge the gap manually, which defeats the purpose.

---

## Primitive 5: Sub-agents (Maker-Checker)

**Role:** One agent generates. A different agent verifies. Never the same agent doing both.

A single agent checking its own output has a well-documented failure mode: it is biased toward its own generation. It sees what it intended to write, not what it actually wrote.

The maker-checker pattern uses two agents with different roles and different system prompts:

**Maker Agent:**
- Reads the spec and current state
- Generates the implementation
- Does not know in advance who will check it or what the criteria are

**Checker Agent:**
- Reads the spec, the success criteria, and the maker's output
- Scores the output against explicit criteria
- Does not regenerate: it evaluates and returns a verdict with specific failure reasons
- Has no access to the maker's reasoning or intermediate steps

**Verdict options:**
- `PASS` — merge, update state, close the task
- `FAIL: [specific reason]` — route back to maker with the failure reason as additional context
- `ESCALATE` — the task requires human judgment; exit the loop and notify

See [maker-checker-pattern.md](maker-checker-pattern.md) for full implementation.

**Failure mode without it:** The loop generates and ships output that passes no independent verification. Errors accumulate silently until they cause a visible failure in production.

---

## Primitive 6: Durable State

**Role:** Track what is done, what is in progress, and what is next. This tracking lives outside the conversation.

The agent forgets everything when the context window closes. The repo does not. Durable state is the mechanism that makes a loop coherent across multiple runs.

**What durable state must answer:**
- What tasks are available to run right now?
- What tasks are already in progress (claimed by a currently-running agent)?
- What has been completed, and when?
- What failed, why, and how many times?

**Minimum viable implementation:**

```markdown
# LOOP_STATE.md

## In Progress
- [ ] TASK-047: Add input validation to /api/users — agent-1 — started 2026-07-01T08:00Z

## Done
- [x] TASK-046: Update dependencies — completed 2026-06-30
- [x] TASK-045: Fix test flakiness in auth module — completed 2026-06-29

## Backlog
- [ ] TASK-048: Add rate limiting to /api/search
- [ ] TASK-049: Generate missing unit tests for payment module

## Failed
- [ ] TASK-044: Refactor session handling — failed 3 times — escalated to human
```

**Concurrency safety:** When multiple automations run in parallel, they must both read and write state without creating duplicate tasks. The simplest approach: write a claim token when picking up a task, and have each automation check for existing claim tokens before picking.

**Beyond markdown:** For larger loops, Linear (via MCP connector), GitHub Projects, or a simple SQLite file are all valid. The requirement is that it lives outside any single conversation and is readable and writable by any agent in the loop.

**Failure mode without it:** Parallel agents pick up the same tasks. Completed work gets re-run. The loop has no memory of what failed or why. Each run starts completely blind.

See [durable-state-design.md](durable-state-design.md) for full design guidance including concurrency patterns and escalation tracking.
