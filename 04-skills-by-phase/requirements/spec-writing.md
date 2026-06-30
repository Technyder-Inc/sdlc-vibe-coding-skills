# Skill: Writing AI-Ready Specifications

## Why Spec Quality Matters More Now

In traditional development, a developer could paper over a vague requirement with a reasonable judgment call. If the spec said "add search functionality," an experienced developer knew what that meant and built accordingly.

An AI agent will implement exactly what the spec says. If the spec says "add search functionality," the agent will add some form of search. Whether it is the right form, handles the right edge cases, and integrates correctly with the existing architecture depends entirely on what else is in the spec.

**Spec writing is now the highest-leverage upstream investment in the development process.**

---

## The Structure of a Good AI-Ready Spec

Use the template at [06-templates/spec-template.md](../../06-templates/spec-template.md). The five sections that matter most:

### 1. Goal (one sentence)
What user problem does this solve? Not what feature is being built — what problem it solves.

Bad: "Implement search functionality with filters"
Good: "Allow users to find products by name, category, and price range without browsing the full catalog"

The goal sets context for every decision the agent makes when the spec is silent.

### 2. Success Criteria (checkboxes)
Binary, testable conditions. If you cannot write a test for it, it is not a success criterion, it is a hope.

Bad:
- Search should be fast
- Results should be relevant

Good:
- [ ] Search returns results within 200ms for queries against a catalog of 100k products
- [ ] Results are ordered by relevance score (exact match > partial match > category match)
- [ ] Empty results display a "no results found" message with 3 suggested alternatives

### 3. Technical Constraints
What the implementation must or must not use. Not implementation details — constraints.

- "Must use the existing PostgreSQL full-text search (no new services)"
- "Must work with the existing pagination system (PageableCursor from src/lib/pagination.ts)"
- "Response format must conform to the existing API response schema"

### 4. Out of Scope
Explicit. Without this section, the agent will implement things you did not ask for.

- "Typo tolerance is out of scope for this ticket"
- "Search analytics and logging are out of scope"
- "Multi-language support is out of scope"

### 5. Edge Cases
List them explicitly. An agent will handle named edge cases. It will handle unnamed edge cases inconsistently.

- "Empty search query: return all products (default catalog view), not an error"
- "Search query with special characters (<, >, &): sanitize before querying, never return SQL errors"
- "No results: display 'no results' state with suggested categories, not a blank page"

---

## Common Spec Anti-Patterns

**The aspirational spec:**
Lists desired qualities instead of behaviors. "The search should be intuitive and performant." No agent can implement "intuitive." Write what you mean.

**The implicit scope spec:**
Does not specify what is NOT included. The agent will guess. Its guesses may be reasonable but may not match stakeholder expectations.

**The step-by-step spec:**
Describes the implementation steps rather than the success criteria. "First, add a search input to the header. Then query the products table. Then render the results." This works but eliminates the agent's ability to use a better path to the same outcome.

**The untestable spec:**
Success criteria that cannot be verified programmatically. "Users should find it easy to use." Write criteria an automated test can check.

**The missing error states spec:**
Happy path only. No edge cases, no error states, no empty states. The agent implements the happy path perfectly and leaves holes everywhere else.

---

## The Spec Review Process

Before handing a spec to an agent, run this review:

**Ambiguity check:**
Read the spec as if you are implementing it for the first time, with no prior knowledge. Where would you need to make a judgment call? That is an ambiguity. Resolve it.

**Edge case coverage:**
For each input the system receives, enumerate what can go wrong. Is each case handled in the spec?

**Scope check:**
What is the minimum implementation that satisfies all success criteria? Is that what you want? If not, the spec is under-specified.

**Integration check:**
What existing system components does this touch? Are the integration points described in the constraints? Have you pointed the agent to the existing patterns to follow?

**Ask the agent to review the spec:**
Before implementation, prompt: "Review this spec. Where is it ambiguous? What would you need to know to implement it correctly? What edge cases are not covered?" Fix the gaps before implementation begins.

---

## Prompts for Spec-First Development

**Generate a spec from rough notes:**
```
I want to add [rough description]. Here are my notes: [notes]

Write a formal spec with these sections:
- Goal (one sentence)
- Success Criteria (checkboxes, each testable)
- Technical Constraints
- Out of Scope (at least 3 items)
- Edge Cases (at least 5 items, include error states and empty states)
- Testing Requirements

Flag any section where you need more information to be specific.
```

**Stress-test a spec:**
```
Here is a spec: [spec]

Imagine you are a senior engineer implementing this from scratch.
1. Where would you need to make judgment calls because the spec is silent?
2. What edge cases are missing?
3. What integration points are assumed but not specified?
4. Is anything in the spec contradictory?

Do not suggest implementation. Only surface specification gaps.
```

**Generate test cases from a spec:**
```
Here is a spec: [spec]

Generate a comprehensive test plan with:
- Unit test cases for each success criterion
- Integration test cases for each external integration point
- Edge case test cases for each edge case listed
- One test case for each "out of scope" item (verifying it is NOT implemented)

Format as a checklist.
```
