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
