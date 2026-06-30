# Phase 2: Design and Architecture

## The Most Human-Centric Phase

Design and architecture is the phase where AI assistance provides the least leverage and where human judgment matters most.

AI excels at implementing a decided architecture. It does not excel at making the fundamental trade-off decisions that define an architecture. Structural decisions — which database, which communication pattern, how to split services, where to put the business logic, how to handle eventual consistency — require understanding constraints that are often not in the codebase: team skill levels, operational maturity, budget, regulatory requirements, and long-term maintenance capacity.

**The practical implication:** Use AI for exploration and implementation, not for making structural decisions. Make those decisions explicitly, document them in ADRs, and then give the AI clear direction.

---

## The Developer Role Shifts

In traditional development, architecture was often implicit — embedded in the code itself, understood by whoever wrote it, invisible to everyone else.

AI-assisted development makes documentation more important, not less. When an AI is implementing against your architecture, undocumented conventions will be violated. The model cannot read your mind. If the convention for error handling is not written down, it will be inconsistently applied.

**The developer's role shifts to:**
- Making structural decisions explicitly and deliberately
- Documenting those decisions in ADRs before implementation begins
- Writing context files that encode architectural conventions
- Reviewing AI output for architectural conformance, not just functional correctness
- Maintaining the decision record as the codebase evolves

---

## Architecture Decision Records (ADRs)

ADRs are more important in AI-assisted development than in traditional development.

An ADR captures: what was decided, why it was decided, what alternatives were considered, and what the consequences are. When an AI is implementing against your architecture, the ADR gives it the context to understand not just what to do but why, which helps it make better decisions in adjacent situations the ADR does not explicitly cover.

**Write an ADR when:**
- Choosing between two or more technically valid approaches
- Accepting a known tradeoff (performance vs. consistency, simplicity vs. flexibility)
- Establishing a pattern that all future code should follow
- Changing a previous architectural decision

**An ADR is NOT needed for:**
- Minor implementation choices that do not affect the overall architecture
- Local decisions that do not establish patterns
- Obvious choices with no real alternatives

Use the template at [06-templates/architecture-decision-record.md](../06-templates/architecture-decision-record.md).

---

## Using AI for Architecture Exploration

While AI should not make architecture decisions, it is highly effective at:

**Generating options:**
```
I need to add real-time notifications to a web app. Current stack: Node.js, PostgreSQL, React.
Requirements: notifications must be delivered within 2 seconds, we have ~10k concurrent users.

Generate 3-4 distinct architectural approaches. For each, describe:
- How it works
- Implementation complexity (low/medium/high)
- Operational complexity (low/medium/high)
- Key tradeoffs
- Scenarios where this approach is the best choice
```

**Stress-testing a decision:**
```
I've decided to implement notifications using Server-Sent Events (SSE). We have ~10k concurrent users.

Play devil's advocate. What are the weakest points of this decision? What scenarios could break it? What would need to be true for this to fail at scale?
```

**Reviewing a proposed architecture:**
```
Here is our proposed architecture for [component]: [description]

Review this from three perspectives:
1. Correctness: Is there anything technically incorrect?
2. Resilience: Where are the failure points?
3. Maintainability: What will be painful to change six months from now?
```

**Writing the ADR once a decision is made:**
```
I've decided to use [technology/pattern] for [purpose].
Decision rationale: [your reasoning]
Alternatives I considered: [list]

Write an ADR for this decision using the standard template.
```

---

## Encoding Architecture in Context Files

After making architectural decisions, encode them in your AGENTS.md or CLAUDE.md so every AI interaction respects them.

**Instead of this (undocumented convention):**
The team always validates inputs at the service layer, not the controller.

**Do this (in AGENTS.md):**
```
## Architecture Rules
- Input validation: Always validate in the service layer (src/services/). 
  Never in controllers. Controllers only call services and format responses.
- Database access: Only through repositories (src/repositories/). 
  Services never import database clients directly.
```

The more your architectural conventions are written down in the rule files the AI loads, the more consistently the AI will follow them.

---

## AI and Technical Debt in Design

AI can surface technical debt and refactoring opportunities more easily than ever. A common pattern:

```
Here is the [module name] module: [code]

Identify:
1. Violations of the SOLID principles
2. Code that would be difficult to test
3. Patterns that do not match the rest of the codebase (see AGENTS.md for our conventions)
4. Any security concerns

Do not suggest refactors yet. Only surface the issues.
```

This gives you a prioritized debt register. The AI can then implement the refactors after you decide which to take on.
