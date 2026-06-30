# The Six Context Types

Every piece of information in an AI model's context window serves one of six functions. Understanding these types lets you diagnose weak output, design better context files, and allocate limited context window budget effectively.

---

## 1. Instructions

**Definition:** Behavioral rules and directives that tell the model how to act.

**Examples:**
- System prompts defining the model's role and persona
- AGENTS.md / CLAUDE.md files listing project conventions
- Output format requirements ("always respond in JSON", "use markdown headers")
- Scope constraints ("only modify files in src/", "never write to the database directly")
- Escalation rules ("if you are unsure, ask before proceeding")

**What good Instructions look like:**
- Specific and unambiguous. "Write clean code" is not an instruction. "Use camelCase for variable names, PascalCase for class names, and snake_case for database column names" is an instruction.
- Prioritized. Put the most critical rules first. Rules that conflict with each other create unpredictable model behavior.
- Scoped. Separate project-wide rules from task-specific rules. Task-specific rules belong in the prompt, not the rule file.

**Common mistakes:**
- Writing instructions as aspirations ("be helpful, harmless, and accurate") rather than behavioral constraints
- Including so many rules that the model cannot determine which apply to the current task
- Contradicting instructions with examples (if your instructions say X but your examples show Y, the model learns Y)

---

## 2. Knowledge

**Definition:** Facts about the domain, project, or environment that the model needs to reason correctly.

**Examples:**
- Architecture documentation ("the API gateway sits in front of all services")
- Data schema definitions ("the users table has columns: id, email, created_at, role")
- Business logic rules ("free tier accounts are limited to 5 projects")
- API references and endpoint documentation
- Third-party service behaviors and limitations
- Codebase structure ("authentication lives in src/auth/, use the existing JWT helpers")

**What good Knowledge looks like:**
- Accurate and current. Outdated knowledge produces confidently wrong output.
- Relevant to the task space. Not everything about the project needs to be in context. Include what the model is likely to need.
- Dense. A schema definition is more useful than a prose description of a schema.

**Common mistakes:**
- Including outdated documentation without removing old versions
- Assuming the model knows things it could not know (internal APIs, proprietary systems, recent changes)
- Providing knowledge about the wrong level of abstraction (too high-level for implementation tasks, too low-level for design tasks)

---

## 3. Memory

**Definition:** State and history from prior interactions, decisions, or events.

**Examples:**
- Conversation history (what has been discussed in this session)
- Prior decisions ("we decided last week to use Postgres, not MySQL")
- Task history ("the auth module refactor was completed in commit abc123")
- User preferences established over time ("Ahsan prefers bullet lists over prose")
- In-progress state ("the migration is 60% complete; tables X and Y are done")

**What good Memory looks like:**
- Summarized, not raw. Full conversation history consumes enormous tokens. Summaries of key decisions and facts are more efficient.
- Time-stamped. Memory without dates creates ambiguity about whether it is still current.
- Scoped to relevance. Inject only the memory relevant to the current task.

**Common mistakes:**
- Injecting full raw conversation history instead of summaries
- Trusting memory without verifying whether it is still accurate
- Conflating memory (what happened before) with knowledge (facts about the domain)
- No mechanism for memory to expire or be invalidated

---

## 4. Examples

**Definition:** Demonstrations of desired input-output behavior.

**Examples:**
- Few-shot examples in a prompt ("given input A, output B. Given input C, output D. Now given input E...")
- Code samples showing the pattern you want followed
- Test cases that define expected behavior
- Reference implementations ("the existing users.ts module is the pattern to follow")
- Negative examples ("do NOT format output like this: ...")

**What good Examples look like:**
- Representative of the actual task distribution. Edge case examples do not help with the common case.
- Consistent with instructions. If examples contradict instructions, examples win. Use this intentionally.
- Economical. Two or three well-chosen examples outperform ten mediocre ones.

**Common mistakes:**
- Using examples that are unrepresentative of the actual task
- Providing too many examples and consuming context budget that should go to instructions or knowledge
- Not including negative examples for tasks with common failure modes
- Using examples from outdated code patterns

---

## 5. Tools

**Definition:** Capabilities the model can invoke to act on or retrieve information from the world.

**Examples:**
- File system access (read, write, list)
- Code execution environments
- Web search and fetch
- Database query tools
- API call tools (external services, internal microservices)
- Memory search and write
- Browser automation

**What good Tool context looks like:**
- Minimum necessary scope. Do not give a model file write access if it only needs file read access.
- Well-documented. Each tool should have a clear description of what it does, what parameters it takes, and what side effects it has.
- Scoped to the task. An agent doing code review does not need database write access.

**Common mistakes:**
- Providing tools with excessive scope (e.g. arbitrary shell execution when the task only needs file reads)
- Tools with vague descriptions that lead the model to use them incorrectly
- Not validating tool outputs before passing them back to the model
- No error handling for tool failures

---

## 6. Guardrails

**Definition:** Constraints that prevent the model from taking unsafe or unintended actions.

**Examples:**
- Output validators that check format before returning to the user
- Forbidden action lists ("never run DELETE without a WHERE clause")
- Scope limiters ("only operate on files in the /workspace directory")
- Confirmation requirements ("prompt for user confirmation before any destructive operation")
- Rate limits and budget guards
- Hook-based interceptors that inspect tool calls before execution

**What good Guardrails look like:**
- Layered. No single guardrail is assumed to be perfect. Defense in depth.
- Fail-closed. When a guardrail is uncertain whether an action is safe, it should block rather than permit.
- Testable. Guardrails should have explicit test cases for the scenarios they are designed to handle.
- Non-bypassable by the model. If a guardrail can be disabled via a prompt, it is not a guardrail.

**Common mistakes:**
- Relying solely on instruction-level guardrails ("don't do X") which models can ignore under adversarial conditions
- No guardrails at the harness level (code that intercepts tool calls before execution)
- Guardrails that are too broad and block legitimate actions, training users to disable them
- Not testing guardrails against adversarial inputs

---

## Balancing the Six Types

Context window space is finite. Every token spent on one type is not available for others.

A rough practical allocation for a production agent context window:

| Type | Typical allocation | Notes |
|------|-------------------|-------|
| Instructions | 10-20% | Keep rule files lean |
| Knowledge | 30-50% | Largest variable cost; use dynamic retrieval for large domains |
| Memory | 5-15% | Summarize aggressively |
| Examples | 5-15% | 2-3 well-chosen examples |
| Tools | 5-10% | Tool schemas are often underestimated |
| Guardrails | 5-10% | Often partly in harness code, not prompt |

These are starting points. Tune based on your task profile. A retrieval-heavy agent will allocate more to knowledge. An agent with complex behavioral requirements will allocate more to instructions.
