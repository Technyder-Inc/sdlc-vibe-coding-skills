# Evaluation Framework for Vibe-Coded AI Features

## Why Evaluation Matters in Vibe Coding

In vibe coding, features ship fast. The danger isn't that the code doesn't run — it's that it runs and produces outputs that are wrong in ways you don't catch until a client does. Evaluation is how you know that your AI features actually work, not just that they execute without errors.

An evaluation framework is a systematic approach to answering: "Is the AI doing the right thing?"

---

## The Three Evaluation Questions

Before building an eval, decide which question you're answering:

1. **Does it work?** — Functional correctness. Does the output meet the output contract?
2. **Is it good?** — Quality. Does the output meet the quality bar for its use case?
3. **Is it still good?** — Regression. Did a change make it worse?

Each question needs a different evaluation approach.

---

## Evaluation Types

### 1. Deterministic Evals

Test properties that are binary: the output either has the property or it doesn't.

```python
# Does the email contain an em-dash?
assert "—" not in output["body"]

# Does the JSON have all required fields?
jsonschema.validate(output, EXPECTED_SCHEMA)

# Is the word count under the limit?
assert len(output["body"].split()) <= 200

# Does the URL in the output resolve?
response = requests.head(output["url"])
assert response.status_code == 200
```

Run these on every test suite execution. They're cheap, fast, and catch the most obvious failures.

### 2. Model-Graded Evals (LLM-as-Judge)

Use a second model to evaluate outputs that require judgment.

```python
JUDGE_SYSTEM = """
You are a quality evaluator. Given an AI output and evaluation criteria,
assess each criterion independently and return structured results.
Be strict: only pass a criterion if it is clearly met.
"""

async def evaluate(output: str, criteria: list[dict]) -> dict:
    """
    criteria: list of {"name": str, "question": str, "passing_score": int}
    Returns: {"pass": bool, "scores": dict, "feedback": dict}
    """
    criteria_text = "\n".join(
        f"- {c['name']}: {c['question']} (pass if >= {c['passing_score']}/5)"
        for c in criteria
    )
    prompt = f"Output to evaluate:\n{output}\n\nCriteria:\n{criteria_text}"

    response = await call_model(
        system=JUDGE_SYSTEM,
        user=prompt,
        model="claude-haiku-4-5",
        response_format="json"
    )
    return json.loads(response)
```

Example criteria for email quality:
```python
EMAIL_CRITERIA = [
    {
        "name": "brand_voice",
        "question": "Does the email sound like a confident, warm professional? (5=excellent, 1=robotic/generic)",
        "passing_score": 3
    },
    {
        "name": "clarity",
        "question": "Is the email's purpose immediately clear in the first two sentences? (5=yes, 1=buried/unclear)",
        "passing_score": 4
    },
    {
        "name": "call_to_action",
        "question": "Is there exactly one clear call to action? (5=yes, clear and single, 1=none or multiple)",
        "passing_score": 4
    }
]
```

### 3. Human Evals

For high-stakes decisions (client proposals, outbound campaigns), human review is part of the evaluation process, not a fallback for when automated evals fail.

Structure human eval as a rubric, not freeform feedback:

```markdown
## Proposal Review Rubric (Score each 1-5)

**Relevance** — Does the proposal address the client's stated problem?
**Specificity** — Are the proposed solutions specific to this client (not generic)?
**Credibility** — Does it demonstrate Technyder's relevant expertise?
**Clarity** — Is the ask (scope, timeline, price) unambiguous?
**CTA** — Is the next step clear?

Pass threshold: average >= 4, no individual score below 3.
```

---

## Building an Eval Suite

An eval suite is a collection of test cases with known inputs and expected quality properties.

```
evals/
├── draft-email/
│   ├── suite.json        # List of test cases
│   ├── run.py            # Eval runner
│   └── results/          # Historical results
│       ├── 2026-06-01.json
│       └── 2026-06-15.json
└── classify-lead/
    ├── suite.json
    └── run.py
```

`suite.json` structure:
```json
[
  {
    "id": "email-001",
    "description": "Cold outreach to restaurant CTO",
    "input": {
      "goal": "Book a discovery call",
      "recipient": "Maria Santos, CTO, ChainEats (50 locations)",
      "context": "Cold outreach via LinkedIn"
    },
    "deterministic_checks": [
      {"type": "not_contains", "value": "—"},
      {"type": "word_count_max", "value": 200},
      {"type": "subject_length_max", "value": 60}
    ],
    "quality_criteria": [
      {"name": "brand_voice", "question": "...", "passing_score": 3},
      {"name": "specificity", "question": "Does it reference the restaurant industry or company scale?", "passing_score": 4}
    ]
  }
]
```

---

## Eval Execution Pipeline

```python
# evals/run.py

async def run_eval_suite(skill_name: str, suite_path: str) -> dict:
    suite = json.loads(Path(suite_path).read_text())
    results = []

    for case in suite:
        output = await run_skill(skill_name, case["input"])

        # Deterministic checks
        det_results = run_deterministic_checks(output, case["deterministic_checks"])

        # Model-graded checks
        quality_result = await evaluate(
            output=json.dumps(output),
            criteria=case["quality_criteria"]
        )

        passed = all(r["pass"] for r in det_results) and quality_result["pass"]
        results.append({
            "case_id": case["id"],
            "passed": passed,
            "deterministic": det_results,
            "quality": quality_result
        })

    total = len(results)
    passed = sum(1 for r in results if r["passed"])

    summary = {
        "skill": skill_name,
        "total_cases": total,
        "passed": passed,
        "pass_rate": passed / total,
        "timestamp": datetime.utcnow().isoformat(),
        "results": results
    }

    # Save to results history
    results_path = Path(f"evals/{skill_name}/results/{datetime.utcnow().date()}.json")
    results_path.parent.mkdir(parents=True, exist_ok=True)
    results_path.write_text(json.dumps(summary, indent=2))

    return summary
```

---

## Regression Detection

After running an eval suite, compare against the previous run to detect regressions.

```python
def detect_regression(current: dict, previous: dict, threshold: float = 0.05) -> dict:
    """
    Flags a regression if pass rate dropped by more than threshold.
    threshold=0.05 means a 5% drop triggers a regression warning.
    """
    current_rate = current["pass_rate"]
    previous_rate = previous["pass_rate"]
    delta = current_rate - previous_rate

    return {
        "regression_detected": delta < -threshold,
        "current_pass_rate": current_rate,
        "previous_pass_rate": previous_rate,
        "delta": delta,
        "new_failures": [
            r["case_id"] for r in current["results"]
            if not r["passed"] and r["case_id"] in {
                p["case_id"] for p in previous["results"] if p["passed"]
            }
        ]
    }
```

---

## Eval Cadence

| Trigger | Eval Type | Scope |
|---------|-----------|-------|
| Every commit | Deterministic + schema | All skills |
| Before skill version bump | Full suite | Changed skill only |
| Weekly (automated) | Full suite | All production skills |
| Model version upgrade | Full suite + regression | All skills |
| Client complaint | Full suite + human review | Affected skill |

---

## Common Eval Pitfalls

**Testing only happy path inputs**: Real production inputs are noisy, incomplete, and sometimes adversarial. Your eval suite needs edge cases: empty inputs, very long inputs, off-topic inputs, inputs in different languages.

**Treating eval pass as deployment approval**: A 95% pass rate means 1 in 20 outputs is wrong. For skills that send emails or generate proposals, that's too high. Know your acceptable failure rate before setting your pass threshold.

**Over-indexing on the judge model's opinion**: LLM judges have biases. They tend to favor longer, more detailed outputs. They may consistently prefer one writing style. Calibrate your judge criteria against human ratings before relying on them.

**Ignoring latency in evals**: A skill that produces great output in 45 seconds is unusable in real-time workflows. Track p50, p90, and p99 latency in your eval runs alongside quality scores.
