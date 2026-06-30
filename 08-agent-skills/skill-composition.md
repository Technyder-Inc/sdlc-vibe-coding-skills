# Skill Composition

## Composition vs Monolith

A monolithic agent skill tries to do everything in one system prompt. It handles research, drafting, formatting, and delivery. It works for demos. It falls apart in production because:

- You can't test individual steps
- One failure invalidates the whole run
- Output quality degrades as the task gets longer
- You can't reuse any sub-step

Composition breaks a complex workflow into discrete skills that chain together. Each skill does one thing and does it well.

---

## Sequential Composition

The output of Skill A becomes the input of Skill B.

```
research-company → draft-proposal → review-proposal → deliver-proposal
```

Implementation:

```python
async def run_proposal_pipeline(company: str, project_brief: str) -> dict:
    # Step 1: Research
    research = await skill_runner.run("research-company", {
        "company_name": company,
        "depth": "standard"
    })

    # Step 2: Draft (uses research output)
    draft = await skill_runner.run("draft-proposal", {
        "company_summary": research["summary"],
        "icp_signals": research["icp_fit"],
        "project_brief": project_brief
    })

    # Step 3: Review
    review = await skill_runner.run("review-document", {
        "document": draft["proposal_text"],
        "criteria": ["brand_voice", "clarity", "length"]
    })

    # Step 4: Conditional delivery
    if review["pass"]:
        return await skill_runner.run("deliver-proposal", {
            "document": draft["proposal_text"],
            "recipient_email": research["primary_contact_email"]
        })
    else:
        return {"status": "needs_revision", "issues": review["issues"]}
```

Key rule: each skill receives only what it needs. Pass the research summary, not the full raw research. Pass the relevant proposal text, not the full previous skill output. Bloated inputs reduce quality.

---

## Parallel Composition

When steps are independent, run them concurrently and merge results.

```
              ┌── research-company ──┐
              │                      │
user_request ─┤                      ├── merge → draft-proposal
              │                      │
              └── research-contacts ─┘
```

```python
import asyncio

async def run_parallel_research(company: str) -> dict:
    company_research, contact_research = await asyncio.gather(
        skill_runner.run("research-company", {"company_name": company}),
        skill_runner.run("research-contacts", {"company_name": company, "role": "CTO"})
    )

    return await skill_runner.run("draft-outreach", {
        "company_summary": company_research["summary"],
        "primary_contact": contact_research["contacts"][0],
        "pain_signals": company_research["pain_signals"]
    })
```

Parallel composition cuts wall-clock time. Use it whenever steps don't depend on each other.

---

## Fan-Out / Fan-In

Run one skill over many items in parallel, then aggregate results.

```
lead_list → [research each lead] × N → merge → prioritize-leads
```

```python
async def enrich_lead_list(leads: list[dict]) -> list[dict]:
    enriched = await asyncio.gather(*[
        skill_runner.run("research-company", {"company_name": lead["company"]})
        for lead in leads
    ])
    enriched = [r for r in enriched if r is not None]  # drop failures

    return await skill_runner.run("prioritize-leads", {
        "leads": [
            {**lead, "research": research}
            for lead, research in zip(leads, enriched)
        ]
    })
```

Set concurrency limits for fan-outs that call external APIs. Unbounded parallel calls will hit rate limits.

```python
semaphore = asyncio.Semaphore(5)  # max 5 concurrent research calls

async def rate_limited_research(lead):
    async with semaphore:
        return await skill_runner.run("research-company", {"company_name": lead["company"]})
```

---

## Conditional Composition

Branch to different skills based on intermediate results.

```python
async def handle_inbound_lead(message: str) -> dict:
    # Classify first
    classification = await skill_runner.run("classify-message", {"text": message})

    if classification["type"] == "sales_inquiry":
        return await skill_runner.run("draft-sales-reply", {
            "inquiry": message,
            "icp_fit": classification["icp_score"]
        })

    elif classification["type"] == "support_request":
        return await skill_runner.run("draft-support-reply", {
            "request": message,
            "urgency": classification["urgency"]
        })

    elif classification["type"] == "spam":
        return {"action": "no_reply", "reason": "classified_spam"}

    return {"action": "escalate_to_human", "reason": "unknown_type"}
```

---

## Feedback Loops

Some workflows need iterative refinement. A skill produces output, it gets evaluated, and if it fails the evaluation it retries with feedback.

```python
async def draft_with_revision(task: dict, max_attempts: int = 3) -> dict:
    attempt = 0
    feedback = None

    while attempt < max_attempts:
        draft = await skill_runner.run("draft-email", {
            **task,
            "revision_feedback": feedback  # None on first attempt
        })

        review = await skill_runner.run("review-email", {
            "email": draft["body"],
            "criteria": ["brand_voice", "call_to_action", "length"]
        })

        if review["pass"]:
            return draft

        feedback = review["feedback"]
        attempt += 1

    # Max attempts reached — return best effort and flag for human review
    return {**draft, "needs_human_review": True, "review_issues": review["issues"]}
```

Cap iterations. An uncapped revision loop will run until the model gets tired and returns whatever it has. Three attempts is enough for most tasks — after that, escalate.

---

## Composition Anti-Patterns

**Context bleeding**: Passing the full output of every prior step to every subsequent step. Context windows are finite. Each step gets what it needs, not a dump of everything.

**Skill god objects**: A "skill" that internally runs 8 other skills. It's now a workflow masquerading as a skill. Name it a workflow and treat it like one.

**Synchronous fan-out**: Running N research tasks one at a time when they're all independent. Always use `asyncio.gather` or similar for parallel steps.

**Brittle output parsing**: Assuming Skill A always returns `result["key"]`. Add defensive checks. Models generate different key names across runs. Use `.get()` with defaults.

```python
# Brittle
icp_score = research["icp_fit"]["score"]

# Safe
icp_score = research.get("icp_fit", {}).get("score", 0)
```

**Missing error propagation**: When a step fails, the workflow continues with partial data and produces garbage downstream. Each step should check for failure and either handle it or abort gracefully.

```python
research = await skill_runner.run("research-company", {...})
if research.get("error"):
    return {"status": "failed", "stage": "research", "error": research["error"]}
```

---

## Composition Patterns by Use Case

| Use Case | Pattern |
|----------|---------|
| Sales outreach | Sequential: research → classify ICP → draft → review → send |
| Lead enrichment | Fan-out: enrich N leads in parallel → prioritize |
| Content pipeline | Sequential with gate: draft → review → revise if failed → publish |
| Multi-source research | Parallel: web + docs + CRM → merge → summarize |
| Triage workflow | Conditional: classify → route to specialist skill |
| Quality-sensitive output | Feedback loop: draft → evaluate → revise until pass |
