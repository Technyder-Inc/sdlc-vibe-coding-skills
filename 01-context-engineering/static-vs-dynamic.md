# Static vs Dynamic Context

## The Core Distinction

**Static context** is loaded into every model call, unconditionally. The model sees it regardless of what is being asked.

**Dynamic context** is retrieved and injected at runtime based on what the current task requires.

Neither is universally better. The right choice depends on the frequency of use, the cost of absence, and the size of the context window budget.

---

## Static Context

### What it is
- Rule files (AGENTS.md, CLAUDE.md, GEMINI.md)
- System instructions
- Global memory (project conventions, permanent constraints)
- Critical guardrails

### Properties
- Always available: the model never operates without it
- Reliable: no retrieval failure, no staleness from a bad cache
- Expensive: consumes context window tokens on every call, whether relevant or not
- Versioned: changes propagate immediately to all agent invocations

### When to use static context
- Information that applies to virtually every task in the project
- Constraints that must never be violated (security rules, output format requirements)
- Project identity and conventions the model needs to stay coherent
- Anything where absence would consistently produce wrong or unsafe output

### Static context design principles

**Keep it dense, not verbose.** Every token in a static context file is paid on every call. Write for information density. Remove anything that is obvious, redundant, or low-frequency.

**Use clear section headers.** Models parse structured text better than prose. Use headers, bullet lists, and tables. Avoid long paragraphs in rule files.

**Order by importance.** Put the most critical rules first. Models have recency and primacy biases. Critical constraints belong at the top.

**Date your rule files.** Include a last-updated timestamp. Stale context is worse than no context. A date tells both the model and the human reviewer when the file last reflected reality.

**Test your rule files.** After writing or updating a rule file, test it against tasks that should be affected. If the model ignores the rules, the file has a problem.

---

## Dynamic Context

### What it is
- Skill instruction files loaded per skill invocation
- Tool outputs (retrieved docs, search results, API responses)
- Retrieved memory (relevant past interactions, stored facts)
- Conversation history (partial or summarized)
- Code retrieved from the repository for a specific task

### Properties
- On-demand: only loaded when relevant
- Efficient: does not consume tokens unless the task needs it
- Fragile: depends on correct retrieval — wrong retrieval produces wrong context
- Powerful: allows context windows to scale beyond their physical limit

### When to use dynamic context
- Information relevant to specific tasks or skill types, not all tasks
- Large knowledge bases (documentation, codebases) that cannot fit in one window
- Task history and memory in long-running sessions
- Tool results that change on every call

### Dynamic context design principles

**The Agent Skills progressive disclosure pattern.** Instead of loading all skill instructions for every call, load only the instructions for the active skill. This is the primary pattern for large multi-skill agents. Each skill carries its own instruction set, loaded at invocation time.

**Trust retrieval but verify results.** Dynamic context depends on retrieval quality. Build observability that lets you inspect what context was actually injected. When an agent produces unexpected output, the first diagnostic question is: what context did it actually receive?

**Cache aggressively.** Dynamic context that does not change between calls (static documentation, stable schemas) should be cached at the retrieval layer. Redundant re-retrieval is waste.

**Handle retrieval failure gracefully.** When dynamic context cannot be retrieved, the agent should degrade gracefully rather than proceeding with a false assumption. Write explicit handling for retrieval failure in your harness.

---

## The Boundary as a Design Decision

The line between static and dynamic context is a versioned design decision, not a technical default.

When you put something in a static context file, you are saying: "This is important enough to always be present." When you put something behind dynamic retrieval, you are saying: "This matters only in specific situations."

**Questions to ask when making this decision:**

1. How often does this information affect output? If >80% of tasks benefit from it, make it static. If <20%, make it dynamic.

2. What is the cost of absence? If the model operating without this information produces unsafe or fundamentally wrong output, make it static. If it only produces slightly less optimal output, dynamic is fine.

3. How large is it? Information that would meaningfully consume the context window is a candidate for dynamic retrieval even if it is frequently relevant.

4. How often does it change? Frequently changing information is a poor candidate for static context because it requires frequent file updates. Dynamic retrieval can always pull the current version.

**Document your decision.** Treat the static/dynamic boundary the same way you treat any architectural decision. Write an ADR (see [06-templates/architecture-decision-record.md](../06-templates/architecture-decision-record.md)) when making non-obvious choices. Future maintainers will need to understand why things are where they are.

---

## Common Mistakes

**Over-loading static context.** Padding a rule file with everything that might ever be relevant. This dilutes the signal of what is actually important and consumes tokens on every call. Static context should be lean.

**Under-specifying dynamic retrieval.** Assuming retrieval will "figure it out." Build and test your retrieval queries. Check what actually gets returned. Poor retrieval is the most common cause of mysteriously bad agent output.

**Forgetting to update static context.** Rule files become stale as the codebase evolves. A rule file that contradicts the current codebase is worse than no rule file. Treat rule file maintenance as part of code maintenance.

**Not versioning rule files.** Rule files should be in source control, reviewed in PRs, and changed with intention. They are code. Treat them as such.
