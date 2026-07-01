# Durable State Design

The agent forgets everything when the context window closes. The repo does not. Durable state is the mechanism that keeps a loop coherent across runs, agents, and restarts.

---

## The Core Principle

A loop's state must live outside any single conversation. This is not optional. It is what makes the difference between a loop and a script you run once.

The model has no memory between runs. The next automation fires with zero knowledge of what the previous run completed, what failed, what is in progress, or what the loop was working toward. All of that context must be in a file the model reads at the start of each run.

---

## What to Track

A minimal state file must answer four questions:

1. **What is available to run?** Tasks in BACKLOG with no claim token.
2. **What is already running?** Tasks in IN_PROGRESS with a claim token and timestamp.
3. **What is done?** Tasks in DONE, with completion time.
4. **What failed and why?** Tasks that exceeded retry limits or were escalated.

### Minimum State File Structure

```markdown
# LOOP_STATE.md
Last updated: 2026-07-01T09:00Z

## In Progress
- [ ] TASK-047 [CLAIM:agent-1:2026-07-01T08:45Z] Add input validation to /api/users

## Backlog
- [ ] TASK-048 Add rate limiting to /api/search
- [ ] TASK-049 Generate missing unit tests for payment module
- [ ] TASK-050 Update OpenAPI spec to match current endpoints

## Done
- [x] TASK-046 Update dependencies — 2026-06-30T14:22Z
- [x] TASK-045 Fix test flakiness in auth module — 2026-06-29T11:05Z

## Escalated (Human Review Needed)
- [ ] TASK-044 Refactor session handling — failed 3x — last: "ambiguous scope" — 2026-06-28
```

---

## Concurrency Safety

When multiple automations fire simultaneously, they will both read the state file and both try to claim the same tasks. This creates duplicate work.

**The claim token pattern:**

1. Before starting work, the agent writes a claim token: `[CLAIM:agent-id:timestamp]`
2. Before claiming a task, the agent reads the full state file and checks for existing claim tokens
3. If a task already has a claim token less than N minutes old, skip it
4. If a claim token is older than your timeout threshold, treat it as stale and reclaim

**Stale claim handling:**

An agent may crash, timeout, or lose connectivity after claiming a task but before completing it. The next automation run should detect stale claims and reclaim them.

```markdown
Claim age > 30 minutes with no progress update = stale
Action: remove the claim token, move task back to Backlog
```

**Atomic write pattern:**

For small loops with low concurrency, writing to a file in the repo is sufficient. For higher concurrency, use a Linear board, GitHub Projects, or a database via MCP connector, where item state transitions are atomic.

---

## What to Include Per Task

A task entry in the state file should be self-contained enough that an agent starting cold can pick it up without reading anything else.

**Minimum task record:**

```markdown
- [ ] TASK-047 [CLAIM:agent-1:2026-07-01T08:45Z]
  Title: Add input validation to /api/users endpoint
  Spec: specs/task-047-input-validation.md
  Skill: skills/api-development.md
  Branch: feature/task-047
  Retries: 1
  Last failure: "does not reject null values on the email field (criterion 4)"
```

The `Retries` and `Last failure` fields are critical. They give the maker agent on the next retry the specific context it needs to avoid repeating the same mistake.

---

## State File vs External Tracker

| | Markdown file in repo | Linear / GitHub Projects via MCP |
|---|---|---|
| Setup | None | Requires MCP connector |
| Concurrency | Manual claim tokens | Atomic transitions |
| Query capability | Manual parsing | API queries by status, assignee, label |
| History | Git history | Built-in audit log |
| Best for | Small loops, single-agent | Multi-agent, high task volume |

Start with a markdown file. Migrate to an external tracker when concurrency issues become real, not in anticipation of them.

---

## What the Automation Reads at Start

Every automation should read state in this order before doing any work:

1. **Read LOOP_STATE.md** — get full picture of current state
2. **Check for stale claims** — reclaim tasks whose claim tokens are expired
3. **Check for escalated tasks** — surface any tasks waiting on human review (notify if not already notified)
4. **Identify available tasks** — BACKLOG tasks with no claim token
5. **Apply any filters** — task type, priority, dependencies not yet resolved
6. **Claim the next task** — write claim token before starting work

---

## Long-Running Loop Hygiene

State files accumulate. Done tasks from six months ago add noise and context window cost.

**Archival pattern:**

```markdown
# LOOP_STATE.md

## In Progress
[current]

## Backlog
[current]

## Done (last 7 days)
[recent completions only]

## Archive
See LOOP_STATE_ARCHIVE.md for completions older than 7 days
```

Move older completions to an archive file. This keeps the active state file small and the agent context cost low.

---

## Relates to

- [README.md](README.md) — loop engineering overview and why state is the load-bearing primitive
- [maker-checker-pattern.md](maker-checker-pattern.md) — retry counts and escalation tracking
- [loop-risks.md](loop-risks.md) — stale states and what happens when state gets corrupted
- [06-templates/](../06-templates/) — state file templates to copy-paste into new projects
