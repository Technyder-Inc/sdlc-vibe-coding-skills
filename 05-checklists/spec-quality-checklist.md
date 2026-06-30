# Spec Quality Checklist

Run this checklist before handing a spec to an AI agent for implementation. A spec that passes all checks is ready for implementation. A spec with open items will produce incomplete or incorrect output.

---

## Completeness

- [ ] **Goal stated:** One sentence describing the user problem being solved (not the feature being built)
- [ ] **Success criteria defined:** Binary, testable checkboxes — each one can be verified with a test
- [ ] **Out of scope explicit:** At least 3 items listed that this spec does NOT include
- [ ] **Edge cases listed:** At least 5 named edge cases with expected behavior for each
- [ ] **Error states covered:** Each input has a named error state with expected behavior
- [ ] **Empty states covered:** Each view/response has a named empty state
- [ ] **Testing requirements specified:** What tests should exist when the ticket is complete

## Precision

- [ ] **No aspirational language:** No "should be fast," "should be user-friendly," "clean" without measurable criteria
- [ ] **Numbers specified:** Performance requirements, limits, and counts are explicit numbers, not relative terms
- [ ] **Behavior defined, not implementation:** Spec says WHAT to achieve, not HOW (unless constraint)
- [ ] **Domain terms defined:** Any term that could be misunderstood is defined inline

## Integration

- [ ] **Existing patterns referenced:** Points to existing code the implementation should follow
- [ ] **Integration points named:** Names every existing module/service this change touches
- [ ] **Data schema specified:** Input and output shapes are explicit (field names, types, required/optional)
- [ ] **API contract defined (if applicable):** Method, path, request/response format, error codes

## Constraints

- [ ] **Technical constraints listed:** Stack, performance, integration requirements
- [ ] **Security requirements explicit:** Auth requirements, data sensitivity, access control rules
- [ ] **Environment constraints noted:** Dev/staging/prod differences, feature flags

## Reviewability

- [ ] **Author named:** Who wrote this and owns it
- [ ] **Status set:** Draft, Review, or Approved
- [ ] **Date stamped:** When was this written (to assess staleness)
- [ ] **No ambiguities that require judgment calls:** Read the spec as a new developer; where would you guess? Each guess is an ambiguity to resolve.

---

## Quick Severity Assessment

If your spec has open items, assess severity:

**Blocks implementation (resolve before starting):**
- Missing success criteria
- Ambiguous scope (no out-of-scope section)
- Missing error state behavior for any user-facing operation
- Missing security requirements for auth-related features

**Should be resolved but may proceed:**
- Missing testing requirements (write them during implementation)
- Minor precision gaps that have an obvious correct answer

**Can defer:**
- Documentation of edge cases with known, standard behavior
- Performance requirements for non-critical paths

---

## Self-Review Prompt

Before submitting a spec for implementation, ask:

```
Here is a spec: [paste spec]

You are a senior engineer who will implement this from scratch.
1. Where would you need to make a judgment call because the spec is silent?
2. What edge cases are missing?
3. What would you implement differently than what the spec says?
4. What tests would you write, and which would be impossible to write given the spec?

Flag each item with severity: blocks-implementation, should-resolve, or can-defer.
```

Any "blocks-implementation" item must be resolved before handing to an agent.
