# Developer Modes: Conductor and Orchestrator

## Two Modes of Working With AI

Developers using AI assistance typically operate in one of two modes — sometimes within the same work session:

**Conductor mode** — Real-time, interactive, in-the-IDE collaboration. The developer watches code appear, steers with prompts, makes inline decisions, and maintains keystroke-level control.

**Orchestrator mode** — High-level objective setting and monitoring. The developer configures a harness, sets an objective, launches one or more agents, monitors progress, and intervenes at decision points.

Neither is better. They serve different tasks. The skilled developer recognizes which mode fits the current work and transitions fluidly between them.

---

## Conductor Mode

### What it looks like

The developer is in the editor. They prompt for a function, watch it appear, accept or reject it, prompt for a change, watch it update. The interaction is tight: seconds or minutes per cycle. The developer is continuously present.

Common tools: GitHub Copilot, Cursor, Claude Code with small focused prompts, inline chat.

### When to use Conductor mode

- Implementing a specific function or module where you want fine-grained control
- Working on code you know well where you want to make judgment calls at each step
- Debugging: reading through execution logic line by line with AI assistance
- Code review: walking through a diff with AI explanations for unclear sections
- Exploratory work where you are figuring out the approach as you go
- Any task where the scope is small enough to hold in one context window

### Conductor mode skills

**Tight iteration loops:** Conductor mode is fast when the feedback loop is tight. Keep prompts focused on one thing at a time. Accept, reject, or redirect immediately.

**Steering without restarting:** When output is almost right, steer incrementally ("the function logic is right but use async/await instead of callbacks") rather than starting over. Restarting is expensive.

**Context management:** The more precise context you give in each prompt (what file you are in, what the surrounding code does, what convention to follow), the better the output. Point to existing patterns explicitly.

**Knowing when to take over:** When the AI is producing output that requires more correction than it would take to write directly, take over. Conductor mode should accelerate, not slow down.

---

## Orchestrator Mode

### What it looks like

The developer writes a spec or objective. They configure the agent harness: rule files, tools, context. They launch the agent and step back. The agent runs — potentially for minutes, potentially touching dozens of files. The developer returns to monitor progress, reviews output at completion, and intervenes where the agent got stuck or made wrong decisions.

Common tools: Claude Code in agentic mode, multi-agent frameworks, CI/CD-integrated agents.

### When to use Orchestrator mode

- Large, well-specified tasks where the spec is clear and the scope is known
- Repetitive systematic work (migrating a pattern across many files, generating tests for a module, updating documentation)
- Tasks that require parallel execution (multiple independent features, multiple code reviews)
- Background tasks that the developer wants to run while working on something else
- Tasks that are well-suited to an agent's strengths: comprehensive, systematic, follows instructions precisely

### Orchestrator mode skills

**Spec writing:** The quality of an orchestration run is bounded by the quality of the spec. Vague objectives produce vague results. Invest in writing precise success criteria. See [02-sdlc-phases/01-requirements-planning.md](../02-sdlc-phases/01-requirements-planning.md).

**Harness configuration:** Before launching an agent on a significant task, verify: does the harness have all the tools the agent will need? Are the instruction files current? Are guardrails in place for the risk profile of this task?

**Intervention timing:** Orchestrator mode works best when the developer intervenes at natural checkpoints (after spec completion, after design phase, after implementation, before tests run) rather than either micromanaging every step or waiting until the entire run is complete.

**Output review:** Agent output from an orchestration run should be reviewed like a PR from a capable but junior developer: check for correctness, check for adherence to conventions, check for security issues, look at the diff holistically before merging.

**Recovery from bad runs:** When an orchestration run produces poor output, investigate why before re-running. Was the spec ambiguous? Was the harness missing a tool? Was the agent given too large a scope for a single run? Fix the root cause, then re-run.

---

## Moving Between Modes

Most developers move between modes multiple times in a single work session. A typical pattern:

1. **Orchestrator:** Launch an agent to read and understand a legacy module, generate documentation
2. **Conductor:** Review the documentation interactively, ask follow-up questions, clarify ambiguities
3. **Orchestrator:** Launch an agent to generate tests based on the documentation
4. **Conductor:** Review the generated tests, steer corrections for tests that do not match actual behavior
5. **Orchestrator:** Launch an agent to implement a refactor using the now-documented behavior as a reference
6. **Conductor:** Review the refactor, make inline adjustments to edge cases the agent missed

The mode appropriate to each step depends on the task's ambiguity (lower ambiguity = better for orchestrator), the importance of precise control (higher importance = better for conductor), and the volume of work (higher volume = better for orchestrator).

---

## The Mode Selection Heuristic

Use this checklist to decide which mode to use:

| Question | Conductor | Orchestrator |
|----------|-----------|--------------|
| Is the spec fully written and unambiguous? | No | Yes |
| Will the output require frequent judgment calls? | Yes | No |
| Is the scope contained to one function/file? | Yes | No |
| Is this repetitive or systematic work? | No | Yes |
| Do you want to watch it happen in real time? | Yes | No |
| Is the task well-suited to running in the background? | No | Yes |

If answers are split, err toward Conductor for unfamiliar territory or high-stakes code, Orchestrator for well-understood, well-specified work.
