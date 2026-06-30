# Phase 1: Requirements and Planning

## How This Phase Has Changed

In traditional development, requirements were a handoff document. A product manager wrote them, a developer received them, and the gap between "what was specified" and "what was built" was a known source of project failure.

AI-assisted development collapses this boundary. Requirements stop being a handoff document and become a conversation that produces a spec and a prototype simultaneously. The output of the planning phase is no longer just a requirements document; it is a working draft, an architecture sketch, and a spec the AI can execute against.

**The new bottleneck is specification quality.**

A developer who could previously paper over a vague requirement by making a reasonable judgment call now needs to be explicit. The AI will implement exactly what you specify. Ambiguous specs produce code that is coherent but wrong in subtle ways that may not surface until production.

---

## Specification Quality is the New Bottleneck

The single most important investment you can make in AI-assisted development is writing better specs.

A good spec for AI-assisted development is not longer than a traditional requirements doc. It is more precise in specific ways:

**It defines success criteria, not just features.**
Bad: "Add search functionality"
Good: "Users can search products by name, category, and price range. Results return in under 200ms. Empty results display a helpful message with suggestions."

**It calls out constraints and non-obvious requirements.**
Bad: "The search should be fast"
Good: "Search results must be paginated (20 per page). The search index must be updated within 60 seconds of a product change."

**It explicitly scopes what is NOT included.**
Bad: [nothing on scope]
Good: "Out of scope for this ticket: fuzzy matching, typo tolerance, search analytics."

**It lists edge cases.**
Bad: [nothing on edge cases]
Good: "Edge cases: empty search query returns all products (default catalog view). Searches with no results display a 'no results' state, not an error."

---

## Writing AI-Ready Specs

Use the spec template at [06-templates/spec-template.md](../06-templates/spec-template.md).

The key sections an AI needs to implement correctly:

1. **Goal:** One sentence. What user problem does this solve?
2. **Success Criteria:** Checkboxes. What does "done" mean?
3. **Technical Constraints:** Stack, performance, integration requirements.
4. **Out of Scope:** Explicitly listed. Without this, the AI will guess at scope.
5. **Edge Cases:** List them. The AI will handle them if you name them. It will handle them inconsistently if you do not.
6. **Testing Requirements:** What tests should exist when this is complete?

---

## AI in the Requirements Phase

**Useful AI tasks in planning:**
- Draft spec from rough notes ("I want to add Stripe checkout, here are my notes — write a spec")
- Generate edge case lists ("what edge cases should I consider for a payment flow?")
- Identify missing requirements ("what am I likely forgetting in this spec?")
- Prototype UI flows to validate requirements before writing them
- Check spec for ambiguities ("where is this spec ambiguous? what would you need clarified?")

**Where humans must stay in control:**
- Business logic decisions (what should happen in this edge case?)
- Prioritization and tradeoffs (fast vs consistent, simple vs flexible)
- Stakeholder alignment (the spec reflects what was actually decided, not what seems reasonable)
- Compliance and regulatory requirements

---

## Prompt Patterns for Requirements

**Draft a spec from notes:**
```
Here are rough notes for a feature: [notes]

Write a formal spec using this structure:
- Goal (one sentence)
- Success Criteria (checkboxes)
- Technical Constraints
- Out of Scope
- Edge Cases (at least 5)
- Testing Requirements

Be explicit and specific. Flag any area where you need more information to be precise.
```

**Identify missing requirements:**
```
Here is a spec for [feature name]: [spec]

You are a senior engineer who will implement this. Identify:
1. Anything ambiguous that would require you to make a judgment call
2. Edge cases not covered
3. Unstated assumptions that may not hold
4. Missing technical constraints

Do not suggest solutions. Only surface gaps.
```

**Generate edge cases:**
```
I am building [feature description].

Generate a comprehensive list of edge cases, grouped by:
- Input validation edge cases
- State/concurrency edge cases
- Integration/dependency edge cases
- Performance edge cases
- Security edge cases
```

---

## The Prototype-First Pattern

A powerful pattern for requirements: build the prototype before finalizing the spec.

1. Write a rough spec (2-3 paragraphs, not a formal document)
2. Ask an AI to build a working prototype
3. Use the prototype to validate requirements with stakeholders
4. Document decisions made during prototyping back into the spec
5. Now write the production implementation from the refined spec

This inverts the traditional order and catches requirement gaps before they become implementation bugs. The prototype is throwaway code; the spec it generates is not.
