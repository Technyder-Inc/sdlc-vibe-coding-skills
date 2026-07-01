# The Factory Model

## A Shift in What Developers Produce

In traditional software development, a developer's primary output is code. You measure productivity by how many features ship, how many bugs get fixed, how many lines of code are written (or deleted).

In the factory model, a developer's primary output is **the system that produces code.**

The developer's job becomes:
- Writing specs that define what to build with enough precision that an agent can implement them
- Configuring agents with the context, tools, and guardrails they need
- Building evals that verify output quality automatically
- Designing feedback loops that route failures back for correction
- Monitoring the factory's output quality and intervening when it degrades

The code that emerges from this factory is produced by agents. The developer is the factory manager.

---

## The Factory Architecture

A production AI development factory consists of five components:

**1. Specs**
Formal descriptions of what to build. The spec is the primary input to the factory. Its quality determines the quality of everything that follows. A bad spec produces a well-implemented wrong thing.

See [02-sdlc-phases/01-requirements-planning.md](../02-sdlc-phases/01-requirements-planning.md) for how to write good specs.

**2. Agents**
Implementations of the specs. Agents take specs as input, have access to a defined set of tools, operate within guardrails, and produce code, tests, documentation, or other artifacts as output.

An agent is a model plus a harness. See [agent-harness.md](agent-harness.md).

**3. Tests and Evals**
Verification systems that check the agents' output. Tests check deterministic behavior. Evals check non-deterministic behavior. Without both, you do not know whether the factory is producing quality output.

See [02-sdlc-phases/04-testing-qa.md](../02-sdlc-phases/04-testing-qa.md).

**4. Feedback Loops**
Mechanisms that route failure information back to the right place. A test failure routes back to the agent for correction. A recurring pattern of failures routes back to the spec for clarification. A systematic quality degradation routes back to the harness configuration.

Feedback loops are what distinguish a factory from a one-shot generator. The factory improves over time. The generator does not.

**5. Guardrails**
Constraints that keep the factory operating safely. Guardrails prevent agents from taking actions outside their scope, producing outputs that violate policy, or consuming resources beyond budget.

See [agent-harness.md](agent-harness.md) for guardrail design.

---

## The Factory Manager Analogy

A factory manager does not do the work on the production line. Their job is to:
- Understand what the factory is supposed to produce (specs)
- Configure the production system correctly (harness)
- Monitor output quality (tests and evals)
- Intervene when quality degrades (feedback loops)
- Make structural changes when the production system has systematic problems

A developer in the factory model does the same:
- Understand the requirements clearly enough to write an unambiguous spec
- Configure the agent harness correctly
- Monitor output quality through automated evals
- Intervene when quality degrades: update the spec, adjust the harness, retrain the loop
- Make structural changes (new tools, new guardrails, new context files) when systematic problems appear

---

## Give Agents Success Criteria, Not Step-By-Step Instructions

A key principle of the factory model: give agents **success criteria**, not step-by-step procedures.

**Step-by-step instruction (fragile):**
```
1. Read the user's query
2. Look up the product in the database
3. Check if the user has permission to view it
4. Return the product data if they do, an error if they don't
```

**Success criteria (robust):**
```
Given a user ID and product ID, return the product data if the user has
read permission, or an appropriate error code if they don't. The operation
should complete within 100ms. Never expose product data for which the user
lacks permission, under any circumstances.
```

Step-by-step instructions break when conditions differ from what was anticipated. Success criteria let the agent adapt its path while remaining constrained to the right outcome.

This is analogous to good management: tell the team what success looks like, give them the constraints they need to operate safely, and let them figure out how to get there.

---

## When the Factory Needs Human Intervention

The factory model does not eliminate human judgment. It concentrates human judgment at high-leverage decision points:

**Spec ambiguity:** When the spec does not specify what to do in a situation, the agent will make a choice. That choice may be wrong. Review agent decisions at branch points where the spec was silent.

**Quality degradation:** When eval scores trend down, investigate. The cause may be a spec gap, a context file that has gone stale, a model update, or a genuine increase in task complexity.

**Novel task types:** New types of tasks that the factory was not designed for. The first time a task type goes through the factory, increase review depth.

**High-stakes outputs:** Code changes to security-critical, payment, or compliance modules. Regardless of eval scores, apply higher human review scrutiny here.

**Systematic failures:** A pattern of similar failures across multiple tasks indicates a structural problem: a missing capability, a bad convention in the context files, or an eval that is not catching the right failure mode.

The developer who understands the factory model invests in making these interventions rare and systematic — building better specs, improving evals, tightening harness configuration — so the same failure does not require human intervention twice.

---

---

## The Runtime Layer: Loop Engineering

The factory model describes the architecture. A factory does not run itself.

Loop engineering is the layer that makes the factory run autonomously: automations that fire on a schedule, dispatch work, and route results back without requiring a human to start each turn.

The relationship is direct:

| Factory Component | Loop Engineering Equivalent |
|---|---|
| Specs | Task backlog in durable state |
| Agents | Maker agents dispatched by automation |
| Tests and evals | Checker agents running maker-checker per task |
| Feedback loops | Retry logic routing checker failures back to maker |
| Guardrails | Exit conditions, token budgets, escalation gates |

The factory model gets you reliable output with a human starting each run. Loop engineering removes the human from the routine work. The human remains for exceptions: escalated tasks, ambiguous specs, high-stakes changes.

**The right progression:**
1. Build the factory. Validate it works with humans in the loop.
2. Identify which task types the factory handles reliably and repeatably.
3. Apply loop engineering to those task types only.
4. Expand scope as confidence grows.

See [09-loop-engineering/](../09-loop-engineering/README.md) for the full loop engineering guide.

---

## Files in This Section

- [agent-harness.md](agent-harness.md) — Agent harness components, the harness effect, diagnostic order
- [developer-modes.md](developer-modes.md) — Conductor mode vs Orchestrator mode
