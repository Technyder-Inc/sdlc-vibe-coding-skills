# Team Workflows for Vibe Coding

## The Shift That Vibe Coding Requires

In traditional software development, the team is: product manager, designer, frontend developer, backend developer, QA, devops. Everyone has a lane.

In vibe coding, those lanes blur. A single developer can build a full-featured product in a day. The bottleneck is no longer "who can write the code" — it's "what are we building, why, and how do we know it's working?"

Effective vibe coding teams reorganize around three new roles: the vibe director, the builder, and the validator.

---

## The Three Core Roles

### Vibe Director
Owns the vision and the prompt strategy. Translates client requirements into precise, testable AI instructions. Reviews output quality. Makes the call on when something is "good enough to ship."

Not necessarily technical. Requires judgment, taste, and clear thinking.

Responsibilities:
- Writes or reviews all system prompts before they go into production
- Defines acceptance criteria for every AI feature
- Reviews eval results and decides whether to ship or revise
- Owns the brief given to the builder

### Builder
Executes. Takes the vibe director's brief and uses AI tools to build the system. Fast, iterative, technically fluent.

Responsibilities:
- Translates briefs into working code
- Sets up the tech stack (models, tools, APIs, infra)
- Writes eval harnesses
- Maintains the production deployment

### Validator
Adversarial mindset. Tries to break what the builder built. Runs evals, stress-tests edge cases, catches quality failures before clients do.

In small teams, validator and builder are the same person — but they switch hats. Build on one day, audit the next day. The mental shift matters.

---

## Daily Workflow

### Morning (15 min)
- Review overnight run logs for anomalies
- Check error alerts from the previous 24 hours
- Confirm all cron-based automations fired correctly
- Write one-line status to the team channel: what's running, what failed, what needs attention

### Active work
- Each task starts with a brief: what's being built, what does success look like, what constraints apply
- No AI-generated code ships without a human reading it. Skim at minimum. Review at moderate risk. Full read at high risk.
- Commits are small and frequent. If a session produces 500 lines, commit in 3-5 logical chunks, not one massive commit.

### End of day (10 min)
- Commit all in-progress work, even if unfinished (use WIP commits)
- Run the fast eval suite (schema + constraint checks)
- Note any open questions or blockers in the task log

---

## Collaboration Patterns

### Async-first handoffs

When passing work between team members (or to/from an AI agent), the handoff is a written brief, not a verbal description.

Brief template:
```
TASK: [One sentence]
CONTEXT: [What was already done, what decisions were made]
INPUT: [What the receiver gets to work with]
OUTPUT: [What they should produce, in what format]
CONSTRAINTS: [What they cannot do or change]
DONE WHEN: [The acceptance criterion]
```

Example:
```
TASK: Add input validation to the lead classifier API endpoint.
CONTEXT: The endpoint is at POST /api/classify-lead. It currently accepts any JSON body. We need validation before Monday.
INPUT: /api/routes/classify-lead.py
OUTPUT: Updated route file with pydantic validation model. All required fields enforced. Error responses in standard JSON format.
CONSTRAINTS: Do not change the output schema. Do not change the model or prompt.
DONE WHEN: Invalid requests return 422 with a "field" and "error" in the response body. Valid requests behave identically to today.
```

### Prompt review

Every system prompt change is reviewed before merging, similar to a code review. The reviewer checks:
- Does the prompt constraint match the intent?
- Is there any ambiguity that could produce unexpected behavior?
- Have we run evals against this prompt change?

### Output review rotation

On client-facing work, rotate who reviews final outputs. The person who built the skill is the worst reviewer of its output — they see what they intended, not what's actually there. A fresh set of eyes catches tone issues, factual errors, and brand voice violations.

---

## Working with AI as a Team Member

In vibe coding teams, AI agents are effectively team members. They have responsibilities, they produce outputs, and those outputs need the same review as any human-produced output.

Treat AI agent outputs as "junior dev code": correct the obvious issues, review the logic, test before shipping. Not as "senior review needed before I can read this" and not as "looks right, ship it."

Key discipline:

**Brief precisely**: Vague instructions produce vague output. The more specific your brief, the less review you need.

**Iterate, don't redraft**: If the first output is 70% right, edit it. Don't throw it out and re-prompt. Editing an existing output is 3x faster than regenerating.

**Verify facts independently**: AI agents hallucinate. Any factual claim in a client deliverable — pricing, statistics, competitor details — is verified by a human before it ships.

---

## Commit and Branch Conventions

For vibe coding projects, keep git discipline even when working fast:

```
main        — production-ready only
develop     — integration branch
feature/*   — individual features or tasks
fix/*       — bug fixes
eval/*      — eval suite changes
```

Commit message format:
```
<type>(<scope>): <short description>

type: feat | fix | eval | prompt | chore | docs
scope: the skill or module affected

Examples:
feat(classify-lead): add icp_fit confidence score to output
fix(draft-email): enforce word count limit via max_tokens
eval(draft-email): add golden set for cold outreach scenarios
prompt(classify-lead): improve vertical detection accuracy
```

One rule: never commit a prompt change and a code change in the same commit. They're separate changes with separate reviewers and separate eval implications.

---

## Velocity Benchmarks

These are realistic vibe coding team benchmarks for planning:

| Task | Skilled vibe coder | Traditional dev |
|------|-------------------|----------------|
| New API endpoint with AI logic | 2-4 hours | 1-2 days |
| New skill (prompt + tools + basic tests) | 4-8 hours | 2-4 days |
| Eval suite for existing skill (10 cases) | 2-3 hours | 4-6 hours |
| Prototype to production hardening | 1-2 days | 1 week |
| Full agentic workflow (3-5 skills) | 2-3 days | 1-2 weeks |

These benchmarks hold on the build side. Reviews, revisions, and production hardening add time back. Don't plan as if the initial build is the full timeline.

---

## When to Slow Down

Speed is the default mode in vibe coding. But some signals mean you should slow down and review before continuing:

- The AI starts confidently rewriting large sections it wasn't asked to change
- The output is technically correct but you're not sure why it works
- A tool call touches data you haven't explicitly reviewed
- The current task involves auth, billing, or PII handling
- You're about to push to production after a session of 4+ hours without a break

The best vibe coding teams are fast AND disciplined. They know when to accelerate and when to pause.
