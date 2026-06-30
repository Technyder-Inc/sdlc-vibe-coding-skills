# The Agent Harness

## Agent = Model + Harness

An agent is not the model. An agent is the model combined with a harness — everything that surrounds the model and shapes how it operates.

```
Agent = Model + Harness

Harness components:
  ├── Instruction / rule files
  ├── Tools and MCP servers
  ├── Sandboxes and execution environments
  ├── Orchestration logic
  ├── Guardrails and hooks
  └── Observability
```

The model (Claude, GPT, Gemini, etc.) processes tokens and generates tokens. Everything else is the harness. And everything in the harness is under your control.

This is the most important architectural insight in AI engineering: **most of what determines your agent's behavior is not the model — it is the harness you build around it.**

---

## Harness Components

### Instruction / Rule Files

The text the model receives that tells it how to behave: AGENTS.md, CLAUDE.md, system prompts, skill instruction files.

**Quality indicators:**
- Specific and unambiguous (not "be helpful" but "when the user asks about pricing, always include the enterprise tier")
- Prioritized (critical constraints at the top)
- Scoped (project-wide rules separate from task-specific rules)
- Current (updated when the project changes)

**Common failures:**
- Rules that contradict each other
- Rules so general they provide no actual constraint
- Rules that have gone stale and now describe a codebase that no longer exists

### Tools and MCP Servers

The capabilities the model can invoke: file system, databases, web search, code execution, external APIs.

**Quality indicators:**
- Minimum necessary scope (only the tools the agent needs for its task)
- Well-documented tool descriptions (the model uses descriptions to decide when to use tools)
- Validated outputs (tool results are checked before being passed back)

**Common failures:**
- Tools with excessive scope (file system read/write when read-only is sufficient)
- Tools with vague descriptions leading to incorrect usage
- No handling for tool failure cases

### Sandboxes and Execution Environments

The environment in which the agent operates: directory scope, network access, process permissions, resource limits.

**Quality indicators:**
- Scoped to the minimum environment needed
- Hard limits on resource consumption (token budgets, time limits, file system quotas)
- Isolated from production systems during development

**Common failures:**
- Agents running in production environments during development
- No resource limits, allowing runaway agent loops
- Agent with file system access outside the intended scope

### Orchestration Logic

The code that coordinates how tasks flow through the agent system: how tasks are broken down, how sub-agents are spawned, how results are aggregated, how failures are routed.

**Quality indicators:**
- Clear task decomposition that matches the agent's capabilities
- Explicit handling for agent failures and retries
- Budget and loop guards that prevent infinite loops

**Common failures:**
- No retry limit, allowing agents to loop on failures indefinitely
- Tasks too large for a single agent context window, leading to silent truncation
- No handling for partial failure in multi-agent workflows

### Guardrails and Hooks

Code-level interceptors that validate inputs and outputs: pre-execution hooks that check tool calls before they run, output validators that verify format and content, confirmation requirements for destructive actions.

**Quality indicators:**
- Fail-closed (uncertain = block)
- Non-bypassable via prompt (harness-level, not instruction-level)
- Tested against adversarial inputs

**Common failures:**
- Guardrails implemented only as instructions ("don't do X") rather than code
- No confirmation requirement for destructive operations
- Guardrails that are easily circumvented by reframing the request

### Observability

Logging and monitoring that tells you what the agent did, why, and what the results were: tool call logs, decision point logging, eval score tracking, anomaly alerts.

**Quality indicators:**
- Every tool call logged with input, output, and timestamp
- Agent decision points logged at branch points
- Eval scores tracked over time to detect degradation
- Alerts for anomalous behavior (unusual tool call volume, failed guardrail triggers)

**Common failures:**
- No logging of what context the agent actually received
- Logging too verbose to be actionable
- No eval score history, making degradation invisible

---

## The Harness Effect

The Terminal Bench 2.0 benchmark demonstrated the harness effect with unusual clarity.

A top-tier model was evaluated on its default configuration. It ranked outside the top 30.

The same model was then evaluated with an optimized harness: rewritten instruction files, pruned tool set, tightened guardrails, restructured context. No model changes. No fine-tuning.

It ranked in the top 5.

The performance improvement came entirely from harness changes. The model's capabilities did not change. What changed was how those capabilities were directed and constrained.

**Why this matters:**
1. Raw model benchmarks are largely irrelevant to your use case. Your results depend on your harness.
2. Upgrading your model is not always the highest-leverage improvement available. Upgrading your harness often is.
3. Investment in harness quality compounds: better instructions + better tools + better guardrails produces multiplicative improvement, not additive.
4. When comparing models, compare them in the same harness. Raw model comparisons tell you almost nothing about production performance.

---

## Diagnosing Agent Failures

When an agent produces poor output, diagnose in this order before blaming the model:

**Step 1: Instruction check**
Is the instruction file missing something the agent needs to know? Is there a rule that contradicts the desired behavior? Is there a gap in the documented conventions that the agent had to guess at?

**Step 2: Tool check**
Does the agent have access to the tools it needs? Are tool descriptions accurate? Did a tool fail or return unexpected output?

**Step 3: Context check**
Is the context window polluted with irrelevant information? Is there missing knowledge the agent needed? Is there stale context that led the agent to reason from outdated premises?

**Step 4: Guardrail check**
Did a guardrail fire incorrectly and block a legitimate action? Is there a guardrail gap that allowed an unsafe or incorrect action?

**Step 5: Model assessment**
Only after ruling out steps 1-4: is the model genuinely unable to handle this task? Does it require capabilities the model does not have? Would a different model perform better in the same harness?

In practice, most agent failures are caught at steps 1-3. Step 5 is relatively rare when the harness is well-designed.

---

## Harness Design Principles

**Minimum viable harness first.** Start with the simplest harness that makes the agent functional. Add components as you discover what is needed. Over-engineered harnesses are harder to debug.

**Test the harness, not just the model.** Write tests that exercise the harness components: does the guardrail fire correctly? Does the feedback loop route the right information to the right place? Does the orchestration logic handle failures correctly?

**Version control everything.** Instruction files, tool definitions, harness configuration — all in source control, all reviewed in PRs. Harness changes are code changes.

**Separate harness from model.** Design your harness to be model-agnostic where possible. When you want to change models, the harness should need minimal modification.

**Build observability from day one.** It is far harder to add logging to a running production system than to build it in from the start. Design for visibility.
