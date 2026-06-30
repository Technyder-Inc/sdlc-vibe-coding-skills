# Skill: Authoring Context Files

## What a Context File Is

A context file (AGENTS.md, CLAUDE.md, GEMINI.md, or similar) is a rule file placed in a repository that is automatically loaded into the AI's context window. It gives the AI durable knowledge about the project: what it is, how it is structured, what conventions to follow, what to do and not do.

A well-written context file is one of the highest-leverage investments in AI-assisted development. A single file, kept accurate and concise, will improve AI output quality across every interaction in the project more than any prompt technique.

---

## What to Include

### Project Identity
- What the project does (one paragraph max)
- Who uses it (users, other systems, internal tools)
- Tech stack (languages, frameworks, databases, key services)

**Include:** what is genuinely non-obvious. The AI knows how Python works. It does not know that your Python project uses a custom DI container or that the authentication layer is a legacy system you cannot change.

**Exclude:** things the AI can infer from reading the code.

### File Structure
A map of the key directories and what they contain. Not every directory — the important ones that an agent needs to navigate to find things.

```
src/
  api/       Route handlers — thin, delegate to services
  services/  Business logic — all rules live here
  models/    SQLAlchemy models — schema definitions
  utils/     Shared helpers — check here before writing new ones
```

### Conventions
Project-specific patterns the AI would not know without being told:
- Naming conventions (if they differ from language defaults)
- File organization patterns
- Code style specifics that are not caught by the linter
- Testing patterns (where tests go, what framework, what mocking approach)
- Error handling patterns (custom error types, logging approach)

**Write conventions as rules, not descriptions.** "Use camelCase for variables" not "we tend to use camelCase for variables."

### Do and Don't Lists
Explicit rules for the AI:

**Do:**
- Check existing utilities before implementing new ones
- Add type hints to all Python functions
- Run `make test` after making changes

**Do not:**
- Modify migration files that have already been applied
- Add new dependencies without noting them in the response
- Hard-code credentials or environment-specific values

### Out of Scope
What the AI should not do in this repository, even if asked:
- Infrastructure changes
- Production database writes
- Changes to authentication/authorization without explicit instruction

---

## What to Exclude

**Things the AI can infer from code:** How a standard library works, what a REST endpoint is, how SQL queries work. Do not explain things the AI knows.

**Low-frequency edge cases:** Rules that apply to <5% of tasks add noise to the 95% of tasks where they do not apply. Put rare edge cases in task-specific prompts, not the rule file.

**Aspirational rules:** "Write clean, maintainable code." The AI cannot operationalize this. Write specific, behavioral rules.

**Outdated information:** A rule file that describes how the codebase used to be structured is worse than no rule file. Stale context produces confident but wrong output.

---

## How to Structure the File

**Use clear headers.** The AI parses structured text better than prose. Use H2 and H3 headers for sections.

**Lead with the most critical rules.** Models exhibit primacy bias — early content is weighted more heavily. Put critical constraints first.

**Use bullet lists, not paragraphs.** Instructions in list format are easier for the model to parse and apply. Prose descriptions bury the rule.

**Include a last-updated date.** This helps both the AI and human maintainers identify staleness.

**Keep it dense.** Every token in a rule file is paid on every call. Write for information density, not readability. A concise rule file that covers what matters is better than a comprehensive one that includes everything.

---

## Versioning Context Files

Context files are code. Treat them the same way:
- Version control them in the repository
- Review changes in pull requests
- Tag versions when making significant changes
- Test after updating: run a sample set of tasks and verify the AI still behaves correctly

**When to update a context file:**
- Any architectural decision changes
- New conventions are established
- The file structure changes significantly
- A recurring AI mistake that a rule addition would prevent
- After reviewing 20+ AI-generated changes and noticing a pattern (pro or con)

---

## Authoring Workflow

**Starting from scratch:**
1. Open the repository and read the major modules
2. List what you wish the AI knew before you started (the things you had to explain)
3. List the mistakes an AI would likely make without guidance
4. Write the rule file from those two lists
5. Test: give the AI a task, check whether the output follows the rules

**Generating a draft from existing code:**
```
I need to write a context file for this repository. Read the following key files:
[paste file contents or file paths]

Write an AGENTS.md that covers:
1. What this project does (2-3 sentences)
2. The tech stack
3. File structure (key directories and their purpose)
4. Key architectural patterns (what you noticed in the code)
5. Conventions (naming, error handling, testing patterns)

Write it as a template I can review and fill in the gaps. Flag anything you are uncertain about.
```

**Reviewing an existing file for staleness:**
```
Here is our AGENTS.md: [contents]
Here is the current directory structure: [listing]
Here is a recent change that was made: [summary of change]

Identify any sections of AGENTS.md that may now be inaccurate, outdated, or missing important new information.
```

---

## Multi-File Context Strategy

For large projects, a single context file at the root may not be sufficient. Consider:

**Layered context files:**
- Root AGENTS.md: project-wide conventions
- `src/api/AGENTS.md`: API-specific rules
- `src/services/AGENTS.md`: Service layer conventions

Most AI tooling supports directory-scoped context files loaded when the agent accesses files in that directory.

**Skill-specific context files:**
For agentic systems with discrete skills, each skill carries its own instruction set. The root context file defines project-wide rules; skill files define task-specific behavior. This is the Agent Skills progressive disclosure pattern.
