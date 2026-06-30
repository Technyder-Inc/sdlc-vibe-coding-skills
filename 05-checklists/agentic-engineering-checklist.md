# Agentic Engineering Pre-Production Checklist

Use this checklist before deploying an AI agent system to production. Each section covers a distinct risk area. Open items in sections marked [REQUIRED] block deployment.

---

## Harness Configuration [REQUIRED]

- [ ] Instruction/rule files are written, reviewed, and version-controlled
- [ ] Instruction files have been tested against representative task types
- [ ] No contradictory rules in instruction files
- [ ] Tool list is minimum-necessary scope (no tools the agent does not need)
- [ ] Each tool has an accurate description the model can use to decide when to use it
- [ ] Tool outputs are validated before being used in subsequent steps
- [ ] Execution environment is scoped (file system access limited to workspace directory)
- [ ] Context window budget is set and enforced (agent cannot consume unbounded tokens)

## Guardrails [REQUIRED]

- [ ] Destructive operations (delete, send, write to external systems) require explicit confirmation
- [ ] Agent cannot escalate its own permissions via prompt
- [ ] User input is sanitized before flowing into LLM call sites (prompt injection prevention)
- [ ] Output validators check format and content before returning to user
- [ ] Guardrails are implemented at harness level (code), not instruction level only
- [ ] Guardrails have been tested against adversarial inputs
- [ ] Clear behavior defined for when guardrails fire (block + explain, not silent failure)

## Evals [REQUIRED]

- [ ] Output evals written for all non-deterministic outputs
- [ ] Evals cover at least 80% representative task distribution (not just edge cases)
- [ ] Eval suite runs automatically (CI/CD or scheduled)
- [ ] Minimum acceptable eval scores defined for each dimension
- [ ] Baseline eval scores established before deployment
- [ ] Process defined for what happens when eval scores drop below minimum

## Observability [REQUIRED]

- [ ] Every tool call is logged with: input, output, timestamp, agent ID
- [ ] Agent decisions at branch points are logged
- [ ] Error rates are monitored and alerted
- [ ] Eval scores tracked over time in a queryable store
- [ ] Alert configured for anomalous tool call volume
- [ ] Alert configured for guardrail fires above threshold
- [ ] Log retention policy defined and compliant with data requirements

## Security [REQUIRED]

Passes all items in [vibe-coding-security-checklist.md](vibe-coding-security-checklist.md).

Additionally:
- [ ] Agent runs with minimum-privilege system account
- [ ] API keys for model providers are rotated and scoped
- [ ] No secrets in instruction files or context files
- [ ] Agent outputs are not returned to users without review for sensitive content
- [ ] Multi-agent communication is authenticated (agents cannot be impersonated)

## Reliability

- [ ] Agent loop has a maximum iteration limit (no infinite loops)
- [ ] Each agent task has a timeout
- [ ] Failure handling is defined: what happens when the agent errors?
- [ ] Retry logic is bounded (max retries with backoff, not infinite)
- [ ] Degraded mode defined: what does the system do when the model API is unavailable?
- [ ] State persistence is reliable: agent can resume interrupted tasks if applicable

## Testing

- [ ] Unit tests for all harness components (orchestration logic, guardrails, validators)
- [ ] Integration tests for the full agent pipeline on representative task types
- [ ] Adversarial tests: tested against inputs designed to break the agent
- [ ] Load tested at expected production volume if applicable
- [ ] Regression test suite covering previously fixed failures

## Documentation

- [ ] System architecture documented: what the agent does, how it is structured
- [ ] Runbook exists: how to diagnose and recover from common failure modes
- [ ] Escalation path documented: who is on-call for agent failures?
- [ ] Context files (AGENTS.md / system prompts) reviewed by a human other than the author
- [ ] Change process documented: how are instruction files and harness changes deployed?

## Cost Management

- [ ] Token budget per task is defined and enforced
- [ ] Monthly token cost estimate exists and is acceptable
- [ ] Alerts configured for cost anomalies (>2x expected daily spend)
- [ ] Cost attribution is possible: can you tell which tasks/users are driving cost?

---

## Severity Classification

**Required (blocks production deployment):**
Harness Configuration, Guardrails, Evals, Observability, Security

**Strongly recommended (resolve within first sprint):**
Reliability, Testing

**Recommended (resolve within first month):**
Documentation, Cost Management

---

## Post-Deployment Review (First 2 Weeks)

Schedule a review 2 weeks after deployment:

- [ ] Eval scores reviewed: are they stable, improving, or degrading?
- [ ] Guardrail fire log reviewed: are any guardrails firing excessively (over-blocking)?
- [ ] Error log reviewed: are there systematic failure patterns?
- [ ] Cost actuals vs estimate: is cost tracking to projection?
- [ ] User feedback reviewed: are there task types the agent handles poorly?
- [ ] Any instruction file updates needed based on production behavior?
