# Phase 3: Implementation

## The Gains Are Real, But Nuanced

AI assistance in implementation is where the most dramatic productivity claims originate — and where the reality is most nuanced.

The gains are real. Tasks that previously took hours can take minutes. Boilerplate is eliminated. Context switches are smoother. Developers can hold more complexity in their heads when the AI fills in routine implementation.

But the METR longitudinal study on experienced developers identified a counterintuitive finding: some experienced developers were slower on familiar tasks when using AI assistance. The reason: time shifted from writing code to verifying, debugging, and correcting AI output. For tasks the developer knew well, their own implementation time was lower than the AI-plus-verification time.

**The practical implication:** AI assistance in implementation is most valuable for:
- Tasks at the edges of your knowledge (languages, frameworks, APIs you know less well)
- High-volume routine tasks (tests, boilerplate, migrations, documentation)
- Tasks where the specification is clear and complete
- Exploration and prototyping where correctness is less critical

It is least valuable for:
- Core business logic you know deeply and own
- Tasks where the spec is vague and judgment is needed at every step
- Tasks where verification is as time-consuming as implementation

The developer's role in implementation shifts from writing to **reviewing and guiding.**

---

## The Implementation Workflow

A disciplined implementation workflow for AI-assisted coding:

**1. Write the spec first.**
Before prompting for implementation, write a clear spec. See [requirements-planning.md](01-requirements-planning.md). A vague prompt produces output you spend more time correcting than if you had written it yourself.

**2. Set up the context.**
Ensure your AGENTS.md/CLAUDE.md is current. Load any relevant existing code into the conversation. Give the model the patterns it should follow.

**3. Prompt with constraints, not just requirements.**
Specify not just what to build but what constraints apply. See the Constrained Implementation prompt pattern below.

**4. Review before accepting.**
Every AI-generated change should be reviewed as carefully as a pull request from a junior developer. Check for: correctness, edge cases, security implications, and adherence to project conventions.

**5. Run tests.**
Do not commit AI-generated code without running the test suite. If the test suite does not cover the change, write the tests first.

**6. Iterate.**
Accept the output, request changes, or restart with a more specific prompt. Be explicit about what is wrong.

---

## 10 Practical Prompt Patterns

See [04-skills-by-phase/implementation/prompt-patterns.md](../04-skills-by-phase/implementation/prompt-patterns.md) for the full guide. Key patterns summarized:

**Constrained Implementation:** Specify requirements, constraints, and what NOT to do.
```
Implement [requirement].
Constraints: [list of constraints]
Use: [existing patterns/utilities to follow]
Do not: [things to avoid]
```

**Red-Green-Refactor:** Write failing tests first, then ask for implementation.
```
Here are the failing tests: [tests]
Implement the minimum code to make these tests pass.
Do not add functionality beyond what the tests require.
```

**Pattern Matching:** Point to existing code as the reference.
```
The existing [X] module does [A]. Implement [Y] using the same patterns.
Reference: [paste existing code or file path]
```

**Review Before Implement:** Ask the model to identify issues before writing code.
```
Before implementing, review these requirements and identify:
1. Ambiguities that would require guesses
2. Missing edge cases
3. Potential security issues
Do not write code yet.
```

---

## Security in AI-Generated Code

AI models are trained on code that includes insecure patterns. They will reproduce those patterns unless explicitly constrained.

Run every AI-generated implementation through the security checklist at [05-checklists/vibe-coding-security-checklist.md](../05-checklists/vibe-coding-security-checklist.md).

The most common security issues in AI-generated code:

**SQL injection:** AI will sometimes construct queries by string concatenation.
```
# AI might generate this
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")

# It should generate this
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
```

**Missing input validation:** AI often skips validation for "internal" endpoints.

**Hardcoded credentials:** AI will sometimes put credentials directly in code, especially in example-like contexts.

**Over-permissioned error messages:** AI often includes internal state in error responses.

**Mitigating these:** Include explicit security constraints in your AGENTS.md and in implementation prompts. "Never use string interpolation in SQL queries. Always use parameterized queries." The explicit instruction dramatically reduces incidence.

---

## When to Not Use AI for Implementation

Not every implementation task benefits from AI assistance. Recognize the patterns where manual implementation is faster and more reliable:

- **Deeply familiar code:** Implementing in an area you know deeply, where the cognitive overhead of prompting and reviewing exceeds direct implementation.
- **Security-critical logic:** Auth flows, cryptographic operations, payment processing. AI is useful for review here, less useful for primary implementation.
- **Highly ambiguous requirements:** When you are figuring out what to build while building it, direct implementation keeps you in control of the exploration.
- **Legacy code with undocumented behavior:** AI without context will add bugs. Generate context files first (see [02-sdlc-phases/06-maintenance.md](06-maintenance.md)), then use AI.

The meta-skill is recognizing which tasks benefit from AI assistance and which do not, and applying the right approach to each.
