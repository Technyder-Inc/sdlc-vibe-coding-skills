# Skill Testing

## Why Skill Testing Is Different

Traditional software testing checks that code produces the right output for a given input. Skill testing has a harder problem: model outputs are non-deterministic. The same input can produce different — but equally valid — outputs across runs.

You're not testing for exact match. You're testing for:
- **Behavioral compliance**: Does the output follow the skill's constraints?
- **Output schema validity**: Does the output match the expected structure?
- **Quality threshold**: Is the output good enough for its intended use?
- **Regression safety**: Did a skill update make things worse?

---

## Layer 1: Schema Tests

The cheapest test. Check that the output matches the expected JSON schema regardless of content.

```python
import jsonschema
import pytest

CLASSIFY_LEAD_OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["icp_fit", "primary_vertical", "urgency", "reasoning"],
    "properties": {
        "icp_fit": {"type": "string", "enum": ["high", "medium", "low"]},
        "primary_vertical": {"type": "string", "enum": ["restaurant", "real_estate", "healthcare", "saas", "other"]},
        "urgency": {"type": "string", "enum": ["hot", "warm", "cold"]},
        "reasoning": {"type": "string", "minLength": 10, "maxLength": 200}
    }
}

@pytest.mark.asyncio
async def test_classify_lead_schema():
    result = await run_skill("classify-lead", {
        "message": "We run 12 restaurants and need to automate our reservations.",
        "company_context": "Mid-size restaurant group, 200 employees"
    })
    jsonschema.validate(result, CLASSIFY_LEAD_OUTPUT_SCHEMA)
```

Run schema tests on every skill, every commit. These catch regressions fast and are cheap to write.

---

## Layer 2: Behavioral Constraint Tests

Test that the output follows behavioral rules from the skill spec. These are deterministic — the output either violates the constraint or it doesn't.

```python
@pytest.mark.asyncio
async def test_email_draft_no_emdash():
    result = await run_skill("draft-email", {
        "goal": "Schedule a discovery call",
        "recipient": "Sarah Chen, CTO, FoodCo",
        "context": "Cold outreach"
    })
    assert "—" not in result["body"], "Em-dash found in email body"
    assert "–" not in result["body"], "En-dash found in email body"


@pytest.mark.asyncio
async def test_email_draft_length():
    result = await run_skill("draft-email", {
        "goal": "Schedule a discovery call",
        "recipient": "Sarah Chen, CTO, FoodCo",
        "context": "Cold outreach"
    })
    word_count = len(result["body"].split())
    assert word_count <= 200, f"Email too long: {word_count} words"


@pytest.mark.asyncio
async def test_email_subject_length():
    result = await run_skill("draft-email", {...})
    assert len(result["subject"]) <= 60, "Subject line exceeds 60 characters"


@pytest.mark.asyncio
async def test_email_no_filler_opener():
    result = await run_skill("draft-email", {...})
    banned_openers = ["hope this finds you", "hope you're doing", "i hope this message"]
    body_lower = result["body"].lower()
    for opener in banned_openers:
        assert opener not in body_lower, f"Banned opener found: '{opener}'"
```

Write one constraint test per rule in the SKILL.md spec. If a constraint isn't tested, it will eventually be violated.

---

## Layer 3: Golden Set Tests

A golden set is a curated collection of inputs where you know what a good output looks like. You don't test for exact output match — you test for approximate equivalence using an LLM judge.

```python
GOLDEN_SET = [
    {
        "input": {
            "goal": "Book a 15-minute discovery call this week",
            "recipient": "John Park, CEO, RestaurantHub (300 locations)",
            "context": "Cold outreach, found them on LinkedIn"
        },
        "expected_qualities": [
            "Subject line mentions discovery call or meeting",
            "CTA asks for a specific time slot or a yes/no",
            "References restaurant operations or scale (300 locations)",
            "No generic opener",
            "Under 150 words"
        ]
    },
    # ... more golden examples
]


@pytest.mark.asyncio
async def test_email_draft_golden_set():
    for case in GOLDEN_SET:
        result = await run_skill("draft-email", case["input"])
        quality_check = await judge_output(
            output=result["body"],
            qualities=case["expected_qualities"]
        )
        assert quality_check["pass"], (
            f"Golden set failure:\n"
            f"Input: {case['input']['goal']}\n"
            f"Failed qualities: {quality_check['failed']}\n"
            f"Output: {result['body']}"
        )
```

Golden sets require the LLM-as-judge pattern (see `eval-writing.md`). Start with 3-5 examples. Grow the set each time you catch a real quality failure.

---

## Layer 4: Regression Tests

When a skill update changes behavior, regression tests catch it. Keep a snapshot of outputs from the current production version. After an update, compare against the snapshot.

```python
import json
from pathlib import Path


def save_snapshot(skill_name: str, version: str, test_input: dict, output: dict):
    snapshot_dir = Path(f"tests/snapshots/{skill_name}")
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    path = snapshot_dir / f"{version}.json"
    path.write_text(json.dumps({
        "version": version,
        "input": test_input,
        "output": output,
        "captured_at": datetime.utcnow().isoformat()
    }, indent=2))


@pytest.mark.asyncio
async def test_no_regression_vs_snapshot():
    snapshot_path = Path("tests/snapshots/classify-lead/v1.json")
    if not snapshot_path.exists():
        pytest.skip("No snapshot to compare against")

    snapshot = json.loads(snapshot_path.read_text())
    current_output = await run_skill("classify-lead", snapshot["input"])

    # Check key fields match
    assert current_output["icp_fit"] == snapshot["output"]["icp_fit"], \
        "icp_fit changed from snapshot"
    assert current_output["primary_vertical"] == snapshot["output"]["primary_vertical"], \
        "primary_vertical changed from snapshot"
```

Run regression tests when updating skill prompts or model versions. A regression doesn't always mean the new version is wrong — sometimes the new version is better. But you should know what changed before shipping.

---

## LLM-as-Judge

For quality properties that aren't binary (tone, clarity, persuasiveness), use a secondary LLM to evaluate the primary model's output.

```python
JUDGE_PROMPT = """
You are a quality evaluator for business email drafts.
Given an email draft and a list of quality criteria, evaluate whether the email meets each criterion.

Email draft:
{email}

Quality criteria:
{criteria}

For each criterion, return:
- criterion: the criterion text
- pass: true if met, false if not
- reason: one sentence explaining why

Return a JSON object with a "results" array and a "pass" field (true only if ALL criteria pass).
"""


async def judge_output(output: str, qualities: list[str]) -> dict:
    criteria_text = "\n".join(f"- {q}" for q in qualities)

    response = await call_model(
        system="You are a precise evaluator. Return only valid JSON.",
        user=JUDGE_PROMPT.format(email=output, criteria=criteria_text),
        model="claude-haiku-4-5",  # Cheap enough for test runs
        response_format="json"
    )

    result = json.loads(response)
    result["failed"] = [
        r["criterion"] for r in result["results"] if not r["pass"]
    ]
    return result
```

Judge selection: use a different model than the one being evaluated when possible. Evaluating Claude Sonnet output with Claude Haiku is acceptable. Evaluating Claude Sonnet output with Claude Sonnet risks the judge agreeing with itself.

---

## Test Matrix by Skill Tier

| Skill Tier | Schema Tests | Constraint Tests | Golden Set | Regression |
|------------|-------------|-----------------|------------|------------|
| L1 (quick, low stakes) | Yes | Critical rules only | 3+ examples | Optional |
| L2 (standard) | Yes | All rules | 5-10 examples | Yes |
| L3 (complex, high stakes) | Yes | All rules | 10+ examples | Yes |
| Production (client-facing) | Yes | All rules | 15+ examples | Yes + human review |

---

## Running Tests in CI

Skills that run in production should have automated tests in your CI pipeline.

```yaml
# .github/workflows/skill-tests.yml
name: Skill Tests

on:
  push:
    paths:
      - 'skills/**'
      - 'tests/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements-test.txt
      - run: pytest tests/skills/ -v --timeout=60
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Keep skill tests fast. Each test should complete in under 10 seconds. Expensive LLM calls belong in golden set tests, not in every unit test run. Use mocking for schema and constraint tests:

```python
from unittest.mock import patch

@patch("skills.draft_email.call_model")
async def test_email_constraint_no_network(mock_model):
    mock_model.return_value = '{"subject": "15-min call this week?", "body": "Sarah — quick question..."}'
    result = await run_skill("draft-email", {...})
    assert "—" not in result["body"]
```
