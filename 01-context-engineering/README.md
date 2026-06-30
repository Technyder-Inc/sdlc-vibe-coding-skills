# Context Engineering

Context engineering is the practice of designing, structuring, and maintaining the information environment in which an AI model operates.

Output quality is determined more by context quality than by prompt technique. A model given complete, accurate, well-structured context will consistently outperform a model given clever prompts with sparse context.

## The Six Context Types

Every piece of information you provide to an AI model falls into one of six categories:

| Type | Definition | Examples |
|------|------------|---------|
| **Instructions** | Behavioral rules and directives | AGENTS.md, system prompts, rule files |
| **Knowledge** | Facts about the domain, project, or environment | Architecture docs, API references, data schemas |
| **Memory** | State and history from prior interactions | Conversation history, prior decisions, task logs |
| **Examples** | Demonstrations of desired behavior | Few-shot examples, test cases, code samples |
| **Tools** | Capabilities the model can invoke | File system, web search, code execution |
| **Guardrails** | Constraints on what the model may do | Output validators, forbidden action lists, scope limits |

Every context engineering decision is a decision about which types to provide, how much of each, and when.

## Static vs Dynamic Context

Not all context needs to be loaded all the time.

**Static context** is always present regardless of the task. It is reliable but expensive.
**Dynamic context** is loaded on demand based on what the task requires. It is efficient but requires a retrieval mechanism.

See [static-vs-dynamic.md](static-vs-dynamic.md) for design guidance.

## Files in This Section

- [static-vs-dynamic.md](static-vs-dynamic.md) — When to make context static vs dynamic, the boundary as a design decision
- [six-context-types.md](six-context-types.md) — Deep dive on each type with examples and common mistakes
- [templates/AGENTS.md.template](templates/AGENTS.md.template) — Ready-to-use AGENTS.md template
- [templates/CLAUDE.md.template](templates/CLAUDE.md.template) — CLAUDE.md template
- [templates/GEMINI.md.template](templates/GEMINI.md.template) — GEMINI.md template variant

## Getting Started

If you are new to context engineering, the single highest-leverage action is to create one good rule file at the root of your repository. Use one of the templates in [templates/](templates/) as your starting point.

A good rule file answers three questions for the model:
1. What is this project and what constraints apply?
2. What should you do when you are unsure?
3. What should you never do?
