# The Maker-Checker Pattern

The most reliable loop structure for code generation. One agent generates. A different agent verifies. Never the same agent doing both.

---

## Why Two Agents

A single agent evaluating its own output has a structural bias problem: it knows what it intended to write and tends to see that intention rather than what it actually produced. Errors that would be obvious to a fresh reader pass unnoticed.

The checker agent has no access to the maker's reasoning, intermediate steps, or original intent. It reads the spec, the success criteria, and the output. That is all. This structural separation is what makes the pattern work.

---

## The Full Flow

```
1. Automation fires
        ↓
2. Read LOOP_STATE.md — claim a BACKLOG task
        ↓
3. Maker Agent
   Input:  spec + task context + project skills
   Output: implementation (code, tests, docs)
        ↓
4. Checker Agent
   Input:  spec + success criteria + maker's output
   Output: PASS | FAIL: [reason] | ESCALATE: [reason]
        ↓
5a. PASS    → merge branch, update state to DONE, clean up worktree
5b. FAIL    → route failure reason back to Maker (max 3 retries)
5c. ESCALATE → update state to HUMAN_REVIEW, send notification, stop
        ↓
6. Update LOOP_STATE.md
        ↓
7. Loop sleeps until next automation fires
```

---

## Agent System Prompts

**Maker Agent system prompt (pattern):**

```
You are a software engineer working on [project name].

Your task: [task description from spec]

Success criteria:
[explicit, measurable criteria from spec]

Project conventions:
[load from SKILL.md]

Constraints:
- Do not modify files outside the scope of this task
- Do not change existing test expectations without explicit instruction
- If you encounter an ambiguity the spec does not resolve, add a comment
  and flag it in your output rather than making an assumption

Output:
- The implementation
- A brief summary of what you changed and why
- Any ambiguities or assumptions you made
```

**Checker Agent system prompt (pattern):**

```
You are a code reviewer. You do not generate code. You evaluate it.

You will receive:
1. A spec with success criteria
2. An implementation produced by another agent

Your job: evaluate the implementation against the success criteria only.
Do not consider intent. Do not consider effort. Evaluate what is actually there.

Return one of:
- PASS — the implementation meets all success criteria
- FAIL: [specific criterion] [specific location] [specific reason]
- ESCALATE: [reason this requires human judgment]

If you return FAIL, be specific. "The input validation on line 47 does not
reject empty strings, but criterion 3 requires rejection of empty strings."
Not "the validation is incomplete."

Do not suggest fixes. The maker agent will see your failure reason and retry.
```

---

## Retry Logic

The maker agent retries up to 3 times. On each retry, it receives the checker's specific failure reason as additional context.

```
Retry 1: original task context + "Checker returned: FAIL: [reason 1]"
Retry 2: original task context + all prior failure reasons
Retry 3: original task context + all prior failure reasons + "Final attempt"
```

After 3 FAIL verdicts, the task escalates automatically regardless of the nature of the failure. Update LOOP_STATE.md with:

```markdown
- [ ] TASK-047 — ESCALATED — failed 3 times — last failure: [reason] — human review needed
```

---

## What the Checker Evaluates

The checker evaluates against explicit success criteria from the spec. These must be written in advance, not invented by the checker.

**Checkable criteria (write these in your spec):**

- Does the implementation handle the specified edge cases?
- Do all existing tests still pass?
- Does the new code follow the naming conventions in SKILL.md?
- Is there no hardcoded configuration that should be in environment variables?
- Does the implementation stay within the scope defined in the task?

**Not checkable by a checker agent (escalate these):**

- Is this the right architectural approach?
- Does this change affect a system the checker has no visibility into?
- Does this meet an implicit requirement not in the spec?
- Should this task be broken into smaller pieces?

If the spec does not contain explicit, measurable criteria, the checker cannot produce a reliable verdict. Fix the spec before running the loop.

---

## Integration with the Factory Model

The maker-checker pattern is the loop-time equivalent of the evals in [05-checklists/evaluation-framework.md](../05-checklists/evaluation-framework.md). The difference is when and how often it runs:

| | Evals (factory model) | Maker-Checker (loop) |
|---|---|---|
| Runs | In CI, on each PR | On every loop iteration, before merge |
| Triggered by | Code push | Automation fire |
| Reviews | Completed output | Output in progress |
| Response to failure | Block the PR | Route back to maker for retry |

They are complementary. The maker-checker loop catches failures before they become PRs. Evals in CI catch failures that slipped through the loop or were introduced by human changes.

---

## Relates to

- [06-templates/spec-template.md](../06-templates/) — success criteria must be in the spec before the loop runs
- [05-checklists/evaluation-framework.md](../05-checklists/evaluation-framework.md) — checker logic mirrors eval design
- [durable-state-design.md](durable-state-design.md) — how to track retry counts and escalations in state
- [loop-risks.md](loop-risks.md) — what happens when retries compound token costs
