# Loop Risks: Loopmaxxing and Safe Loop Design

Loop engineering is powerful. A poorly designed loop is worse than no loop. This document covers the failure modes, how to detect them, and how to prevent them.

---

## The Core Risk: Loopmaxxing

Loopmaxxing is a loop that runs further and deeper than it should. The agent keeps iterating because it has no clear exit condition, or because it keeps finding new work to do, or because the retry logic does not have a hard cap.

Addy Osmani flagged this explicitly: token costs from loopmaxxing can vary wildly. A loop that runs 3 more iterations than intended does not cost 3x more. If each retry spawns sub-agents, each sub-agent loads skills and context, and each runs tools, the cost compounds at every level.

**The failure signature:** You check your API usage and see a spike. You investigate and find a loop that ran 47 iterations on a task that should have taken 3.

---

## Exit Conditions Are Mandatory

Every loop must have at least two exit conditions:

**1. Task completion exit:** The task is done. The checker returned PASS. Update state and stop.

**2. Retry limit exit:** After N failed attempts, stop and escalate to human. Do not keep retrying.

**3. Time-based exit (recommended):** If a loop run exceeds a wall-clock timeout, stop and update state. An agent that is running for 45 minutes on a 5-minute task has likely entered a degenerate state.

**4. Token budget exit (recommended):** Set a per-task token budget. If the task has consumed more than X tokens across all agents, escalate rather than retry.

```markdown
# Task exit conditions (document in your loop design)

Retry limit:       3 attempts
Time limit:        20 minutes per task
Token budget:      50,000 tokens per task across all agents
Escalation:        Any exit other than PASS → update state → notify human
```

---

## Token Cost Patterns to Watch

| Pattern | Risk | Mitigation |
|---|---|---|
| Skills loaded on every sub-agent | Multiplies skill cost by agent count | Load skills once at loop start, pass as context |
| Checker re-reads full codebase | Context window fills with irrelevant code | Scope the checker's context to the specific files changed |
| Retry without new information | Each retry costs the same, produces the same result | Ensure failure reason is specific; if reason is the same 2x, escalate |
| Parallel agents all claim tasks simultaneously | N agents all start, all use tokens, even if only 1 task remains | Read state and count available tasks before spawning agents |
| Long DONE history in state file | State file grows, loads into context on every run | Archive completions older than 7 days |

---

## Loop Runaway Detection

A loop in runaway state is typically identifiable by one of these signals:

**Signal 1: Retry count at maximum on every task**
If most tasks are hitting the retry limit, the loop is not the problem. The specs, skills, or context are the problem. Fix them before rerunning.

**Signal 2: Checker always returns the same failure reason**
The maker is not using the failure context from previous retries. Check that the failure reason is actually being passed as input on retry.

**Signal 3: Token usage per task climbing across runs**
A well-designed loop should have relatively stable per-task token costs. If costs climb over successive runs, something is growing: the state file, the skills, the context being passed.

**Signal 4: Stale claims accumulating**
If the state file shows many IN_PROGRESS tasks with old claim tokens, agents are crashing or timing out before completing. The task complexity exceeds the loop's design assumptions. Escalate these and investigate.

---

## Human Escalation Gates

Not everything should run autonomously. Design explicit escalation gates for categories of work that require human judgment.

**Always escalate (do not attempt in a loop):**
- Changes to authentication, authorization, or session handling
- Database migrations
- Payment processing code
- Security configuration changes
- Changes to CI/CD pipeline configuration

**Escalate after first failure (do not retry):**
- Tasks where the checker returns `ESCALATE` rather than `FAIL`
- Tasks touching more than N files (configurable threshold)
- Tasks where the maker's output is outside the expected scope

**Document your escalation thresholds in your loop design.** This prevents scope creep where the loop gradually takes on work it was not designed for.

---

## Safe Loop Design Checklist

Before running a new loop in production, verify:

- [ ] Exit conditions defined: retry limit, time limit, token budget
- [ ] Escalation path defined: where human-review tasks go and how the human is notified
- [ ] Checker criteria are explicit and measurable, not subjective
- [ ] Skills scoped to what the loop actually needs, not the full project
- [ ] State file has archival pattern to prevent unbounded growth
- [ ] Worktrees in use for any parallel agent execution
- [ ] Claim tokens prevent duplicate task pickup
- [ ] High-stakes task categories are excluded from loop scope
- [ ] Token usage monitored on first N runs before running unattended

---

## Blast Radius Containment

A loop that produces bad output should not be able to affect anything beyond its defined scope.

**Branch isolation:** Loop agents write to feature branches. Nothing merges to main without a merge step that can be gated by a human or a CI check.

**Worktree isolation:** Each agent operates in its own worktree. A corrupted or failed agent does not affect any other agent's working directory.

**Tool scope restriction:** Loop agents should have access only to the tools they need. An agent doing documentation updates does not need deploy access. Scope MCP connectors to the task.

**Notification on escalation:** Every escalation must notify a human through a channel they actually monitor (not just a state file update). A task sitting in ESCALATED state with no notification is not escalated; it is lost.

---

## Relates to

- [README.md](README.md) — when loop engineering is and is not the right tool
- [maker-checker-pattern.md](maker-checker-pattern.md) — retry logic and escalation flow
- [durable-state-design.md](durable-state-design.md) — state corruption and stale claim handling
- [05-checklists/vibe-coding-security-checklist.md](../05-checklists/vibe-coding-security-checklist.md) — security checks before any loop output reaches production
- [05-checklists/agentic-engineering-checklist.md](../05-checklists/agentic-engineering-checklist.md) — broader agentic safety checks that apply to loop outputs
