# Phase 6: Maintenance and Legacy Modernization

## The Most Underrated Win

If there is one phase where AI assistance provides the highest return on investment, it is maintenance — and specifically, legacy code modernization.

Legacy code is code that is too risky to touch. The original author is gone. The tests are sparse or absent. The dependencies are outdated. No one understands what it actually does. Making changes means potentially breaking production in ways that cannot be predicted.

AI changes this equation. A model can read the entirety of a large undocumented module, reconstruct a map of its behavior, identify the assumptions baked into its logic, and document it comprehensively in the time it would take a developer to orient themselves enough to read it with understanding.

The psychological barrier to touching legacy code drops when you have a tool that can exhaustively describe what the code does before you change it.

---

## Generating Context From Undocumented Codebases

The first step in AI-assisted legacy work is generating context — turning implicit, tacit knowledge embedded in code into explicit documented knowledge the AI can work with.

**Generate module documentation:**
```
Read this module: [paste code or file path]

Generate:
1. Module purpose (2-3 sentences)
2. Public API (all exported functions/classes with parameters and return types)
3. Key behaviors (what does this module do, in plain English)
4. Dependencies (what external modules/services does this rely on)
5. Known quirks (anything that surprised you reading it — unusual patterns, implicit assumptions, potential bugs)
6. Suggested tests (what would you test to verify this module behaves correctly)
```

**Generate AGENTS.md for a legacy codebase:**
```
I have an undocumented legacy codebase. I'll share the key files with you.
After reading them, write an AGENTS.md that a new developer (or AI agent)
could use to understand this codebase well enough to make changes safely.

Include: overview, file structure, key patterns used, important conventions,
what not to touch without deep understanding, and the riskiest areas.
```

**Identify test coverage gaps:**
```
Here is [module name] and its existing tests.
Identify: what behaviors are tested, what behaviors are not tested,
what the highest-risk untested paths are.
Output as a prioritized list of missing test cases.
```

---

## Migration Patterns

AI assistance is particularly effective for systematic migrations: updating from one pattern to another across a large codebase, upgrading framework versions, or extracting monolith components into services.

**The migration workflow:**
1. Have AI document the current pattern exhaustively
2. Have AI document the target pattern
3. Write the migration rule as a transformation spec
4. Have AI generate a migration script or apply it file by file
5. Run existing tests after each batch of migrations
6. Have AI generate tests for any newly exposed behavior

**Example migration prompt:**
```
I need to migrate from Express 4 callback-style routes to Express 5 async/await style.

Current pattern (Express 4):
[example of current route]

Target pattern (Express 5):
[example of target route]

Here are the routes to migrate: [file or list of files]
For each route:
1. Apply the transformation
2. Flag any route where the transformation is not straightforward
3. List all routes that were migrated

Run the transformations. Do not change any logic, only the async pattern.
```

---

## Refactoring Legacy Code Safely

Safe refactoring has a clear order of operations:

1. **Document first.** Use AI to generate exhaustive documentation of the current behavior before touching anything.
2. **Test before refactoring.** Write tests that describe current behavior. If the code has no tests, generate them from the documentation.
3. **Refactor in small, reversible steps.** Each step should have a clear before and after, and the test suite should pass after each step.
4. **Validate behavior is preserved.** After each step, the tests must pass. If they do not, fix the issue before proceeding.

**The "golden file" pattern for legacy refactoring:**
Before refactoring a module:
1. Run the current code against a comprehensive set of inputs
2. Save all outputs as "golden files" — the known-correct reference outputs
3. Refactor the module
4. Re-run against the same inputs
5. Compare outputs to golden files

Any difference reveals a behavior change. Decide deliberately whether that change is intentional or a regression.

---

## Dependency Modernization

AI assists with updating deprecated dependencies, but this requires care.

**Safe dependency update workflow:**
```
I need to update [dependency] from version X to version Y.
Here is the changelog/migration guide: [paste]
Here is the current usage in this codebase: [paste relevant code]

Identify:
1. Breaking changes that affect our usage
2. Required code changes for each breaking change
3. Deprecated APIs we are using that need replacement
4. New APIs that replace patterns we are currently doing manually

Output as a migration checklist, ordered by risk (highest risk first).
```

**After getting the checklist:** Work through it in small commits, running the test suite after each change. AI-assisted dependency updates have a tendency to create large "update everything" commits that are difficult to review or roll back.

---

## Generating Tests for Legacy Code

One of the highest-leverage uses of AI in maintenance:

```
Here is [module name]: [code]

Generate a comprehensive test suite that:
1. Tests all exported functions
2. Tests edge cases (empty inputs, null values, boundary conditions)
3. Tests the unhappy path (error conditions)
4. Uses [pytest/Jest/your framework]
5. Follows the test file conventions in our codebase (see AGENTS.md)

For each test, add a comment explaining what behavior it is verifying.
These tests should function as living documentation of the module.
```

This gives you both tests and documentation in one pass — tests that describe what the code does, which can be reviewed for accuracy against the code and then maintained as the module evolves.
