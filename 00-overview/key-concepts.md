# Key Concepts

## Context Engineering

Context engineering is the core skill of this era of software development.

The quality of AI-generated code depends far less on clever prompts and far more on the quality of context provided to the model. A mediocre prompt with rich, accurate context will consistently outperform a brilliant prompt with sparse or misleading context.

**What context engineering means in practice:**
- Deciding what information the model needs to do the task correctly
- Deciding how to structure and deliver that information
- Deciding what to include in static (always-loaded) vs dynamic (on-demand) context
- Maintaining context files as first-class artifacts in the codebase
- Versioning context files alongside code

**What it is NOT:**
- Prompt engineering (prompt engineering is a subset)
- Writing longer prompts
- Clever jailbreaks or instruction overrides
- A one-time setup task

Context engineering is ongoing. As the codebase evolves, context files become stale. Stale context produces worse output than no context, because the model confidently reasons from false premises.

**Practical starting point:**
Create a file at the root of your repo (AGENTS.md, CLAUDE.md, or GEMINI.md depending on your tooling) that describes:
- What the project does
- The tech stack
- Key architectural patterns
- What the agent should and should not do
- Conventions the codebase follows

This single file, kept accurate and concise, will improve AI output more than any prompt technique.

---

## The Factory Model

In traditional development, a developer's primary output is code.

In the factory model, a developer's primary output is **the system that produces code.**

That system consists of:
- **Specs** that define what to build, precisely enough that an agent can execute against them
- **Agents** that implement the specs
- **Tests and evals** that verify the output
- **Feedback loops** that route failures back for correction
- **Guardrails** that constrain behavior within safe boundaries

The developer becomes a factory manager. The job is to define success criteria, configure the production system, monitor output quality, and intervene when the system produces defects.

This is not a loss of control. It is a change in where control is exercised. The developer who understands the factory model has more leverage than one who codes everything manually, because the factory can run tasks in parallel, does not tire, and is limited only by the quality of the specs and configuration it is given.

**The practical implication:**
Stop asking "how do I prompt the model to write this function?" Start asking "how do I specify this requirement clearly enough that any competent model could implement it correctly?"

---

## Agent = Model + Harness

An agent is not just a model. An agent is a model plus a harness.

**The model** is the AI (GPT, Claude, Gemini, etc.). It processes context and generates tokens.

**The harness** is everything else:
- Instruction and rule files that shape behavior
- Tools and MCP servers that give the model capabilities
- Sandboxes that scope what the model can affect
- Orchestration logic that controls how tasks flow
- Guardrails and hooks that intercept unsafe actions
- Observability that tells you what the agent did and why

The harness is entirely under your control. The model is largely not.

Most agent failures are harness failures: a missing tool, a vague rule, an absent guardrail, a context window cluttered with irrelevant information. Blaming the model for a harness problem is like blaming the engine for a bad fuel filter.

**When an agent produces poor output, diagnose in this order:**
1. Is the instruction file missing something the agent needs to know?
2. Does the agent have access to the tools it needs?
3. Is the context window polluted with irrelevant information?
4. Is there a guardrail gap that allowed an unsafe action?
5. Only after ruling out 1-4: consider whether the model is the problem.

---

## Evals vs Tests

Tests and evals both verify behavior. They are not the same thing.

**Tests** verify deterministic behavior. Given input X, the output must be exactly Y. Tests pass or fail with binary certainty.

**Evals** verify non-deterministic behavior. Given input X, the output should have characteristics Y. Evals produce scores, not pass/fail results.

You need both.

If you are using AI to generate code that is then deterministically tested, tests are sufficient. If you are using AI to generate prose, summaries, plans, recommendations, or any output where "correctness" is a spectrum, you need evals.

**Types of evals:**

*Output evals:* Does the final output meet the criteria? Score the response against a rubric. Often uses LLM-as-judge for scalability.

*Trajectory evals:* Did the agent take the right path to get there? Check that the agent used the right tools, made the right decisions at branch points, did not take unnecessary steps.

**Without evals, you are vibe coding regardless of how sophisticated your prompts are.** You have no systematic way to know whether changes to your prompts or models improved or degraded output quality.

---

## The Harness Effect

The Terminal Bench 2.0 benchmark provided one of the clearest demonstrations of the harness effect.

A leading model, evaluated out of the box, ranked outside the top 30 on the benchmark. The same model, with only the harness reconfigured (no model change, no fine-tuning), jumped to the top 5.

The model did not change. The harness changed.

**What changed in the harness:**
- Instruction files were rewritten with more precise, unambiguous rules
- Unnecessary tools were removed to reduce decision noise
- Guardrails were tightened to prevent the model from taking low-confidence actions
- Context files were restructured so the most relevant information was retrieved first
- Feedback loops were added so the model could self-correct on well-defined error types

**What this means for practitioners:**

1. Benchmark numbers for bare models are largely irrelevant to your use case. Your results depend on your harness.
2. Before upgrading your model, upgrade your harness. The return on harness investment is usually higher.
3. Investing in harness quality is investing in output quality across every model you use now and in the future.
4. When comparing models, compare them in the same harness. Raw model comparisons tell you almost nothing about production performance.

The harness effect generalizes: most agent performance problems are configuration problems. Context quality, tool selection, instruction precision, and guardrail design determine results more than raw model capability in the vast majority of practical applications.

---

## The Journey: Where to Start Based on Your Stage

Not everyone enters this repo at the same point. Use this guide to find your starting position.

### Stage 0: You are new to AI-assisted coding
You write code manually. You occasionally paste things into ChatGPT for help. You haven't built anything with an LLM API yet.

**Start here:**
1. [00-overview/the-spectrum.md](the-spectrum.md) — understand the three tiers
2. [01-context-engineering/context-types.md](../01-context-engineering/context-types.md) — understand why context is everything
3. [02-sdlc-phases/](../02-sdlc-phases/) — see where AI fits into the work you already do
4. **First milestone:** Ship one feature using a structured AI prompt with a rule file. No agents yet.

### Stage 1: You vibe code but ship blind
You use Cursor, Copilot, or Claude to build features fast. The code works in dev, breaks in weird ways in production. You don't have a systematic way to verify AI output quality.

**Start here:**
1. [05-checklists/vibe-coding-security-checklist.md](../05-checklists/vibe-coding-security-checklist.md) — secure what you already ship
2. [04-skills-by-phase/testing/eval-writing.md](../04-skills-by-phase/testing/eval-writing.md) — add the first eval
3. [03-factory-model/vibe-to-production.md](../03-factory-model/vibe-to-production.md) — harden the gap
4. **First milestone:** Every AI feature you ship has at least schema tests and one constraint test.

### Stage 2: You use agents but they're fragile
You've built an agent or two. They work most of the time. When they fail, you don't know why and can't reproduce it reliably. You're not sure what to tune.

**Start here:**
1. [03-factory-model/](../03-factory-model/) — understand the factory model and developer modes
2. [07-agent-tools/tool-definitions.md](../07-agent-tools/tool-definitions.md) — review your tool definitions
3. [08-agent-skills/skill-architecture.md](../08-agent-skills/skill-architecture.md) — structure your skills properly
4. [05-checklists/evaluation-framework.md](../05-checklists/evaluation-framework.md) — build an eval suite
5. **First milestone:** Your agents have a full eval suite and you can reproduce past failures from logs.

### Stage 3: You run production agentic systems
You have agents in production handling real work. You want systematic quality improvement, multi-agent coordination, and self-evolution.

**Start here:**
1. [08-agent-skills/skill-composition.md](../08-agent-skills/skill-composition.md) — orchestration patterns
2. [07-agent-tools/mcp-integration.md](../07-agent-tools/mcp-integration.md) — standardize your tool layer
3. [03-factory-model/team-workflows.md](../03-factory-model/team-workflows.md) — scale team practices
4. **First milestone:** At least one production skill is self-evolving: it logs its own performance, proposes updates, and tracks regression.
