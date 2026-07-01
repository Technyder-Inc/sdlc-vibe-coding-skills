# Loop Engineering Checklist

Run this before deploying any new loop to production. A loop that fails these checks will produce unreliable output, runaway token costs, or silent failures.

---

## Pre-Loop: Foundation Checks

These verify the factory model is solid before you automate it. A broken factory does not become a working loop.

- [ ] The task type has run successfully through the factory model at least 5 times with humans reviewing output
- [ ] Success criteria for this task type are written explicitly in a spec or SKILL.md (not implicit or verbal)
- [ ] Evals exist for this task type and pass reliably ([05-checklists/evaluation-framework.md](evaluation-framework.md))
- [ ] The agent harness is configured and tested ([03-factory-model/agent-harness.md](../03-factory-model/agent-harness.md))

---

## Loop Design Checks

- [ ] Exit conditions defined and documented:
  - [ ] Retry limit per task (recommended: 3)
  - [ ] Time limit per task
  - [ ] Token budget per task
- [ ] Escalation path defined: where escalated tasks go and who gets notified
- [ ] Durable state file exists and is readable by agents
- [ ] Claim token pattern implemented to prevent duplicate task pickup
- [ ] Stale claim detection implemented (threshold documented)
- [ ] State file has archival pattern to prevent unbounded growth

---

## Six Primitives Checks

- [ ] **Automations:** Schedule defined, trigger condition documented, triage logic tested
- [ ] **Worktrees:** Parallel agents each get isolated worktrees; merge step tested
- [ ] **Skills:** SKILL.md files scoped to what the loop needs; verified accurate and current
- [ ] **Connectors:** MCP servers scoped to minimum necessary permissions for this loop
- [ ] **Sub-agents:** Maker and checker use separate system prompts; checker has no access to maker's reasoning
- [ ] **Durable state:** State file tested with concurrent reads; claim tokens prevent double-pick

---

## Checker Agent Checks

- [ ] Checker criteria are explicit and measurable (not "looks correct")
- [ ] Checker system prompt does not allow it to generate fixes, only verdicts
- [ ] Checker returns one of exactly three verdicts: PASS, FAIL: [reason], ESCALATE: [reason]
- [ ] FAIL verdict includes specific file/line/criterion reference
- [ ] ESCALATE verdict is used for ambiguity, scope issues, and high-stakes changes
- [ ] Retry logic passes full failure history to maker on each retry

---

## Scope and Blast Radius Checks

- [ ] Loop agents write to feature branches only; nothing merges to main without a defined merge gate
- [ ] High-stakes task categories excluded from loop scope:
  - [ ] Auth, authorization, session handling
  - [ ] Database migrations
  - [ ] Payment processing code
  - [ ] Security configuration
  - [ ] CI/CD pipeline changes
- [ ] MCP connectors scoped to this loop's required tools only; no deploy access unless deploy is the loop's purpose
- [ ] Notification channel tested: escalations generate a real alert to a human

---

## Token and Cost Checks

- [ ] Per-task token budget defined and enforced
- [ ] Skills are not reloaded on every sub-agent call (loaded once at loop start)
- [ ] Checker context scoped to changed files, not the full codebase
- [ ] Parallel agent spawn count bounded by available tasks (no over-spawning)
- [ ] First 3-5 runs monitored manually for token cost before running unattended

---

## Security Checks

These apply in addition to the [vibe-coding-security-checklist.md](vibe-coding-security-checklist.md) for all output produced by the loop.

- [ ] Loop agents cannot read or write outside the defined task scope
- [ ] State file does not contain secrets, API keys, or credentials
- [ ] Maker agent system prompt is not user-controlled (no prompt injection surface)
- [ ] Checker agent cannot be overridden by content in the maker's output
- [ ] Loop output goes through the same security checklist as manually-written code before shipping

---

## Go / No-Go

**Go criteria:** All items in Pre-Loop and Loop Design sections checked. At least 80% of remaining items checked.

**No-go criteria:** Any unchecked item in:
- Exit conditions
- Escalation path
- Durable state
- Blast radius (high-stakes exclusions)
- Security

A loop without exit conditions or escalation paths is not a loop. It is a runaway process.
