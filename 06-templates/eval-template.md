# Eval: [Eval Name]

**Date:** YYYY-MM-DD
**Author:**
**Type:** Output | Trajectory | Comparative | Heuristic
**Status:** Draft | Active | Deprecated

---

## Purpose

What behavior does this eval measure? Why does this behavior matter?

One or two sentences. Example: "Measures whether the summarization agent produces accurate summaries that preserve the key points of the source document. Accuracy is critical because summaries are used for decision-making without reading the full document."

---

## Scenario

Describe the situation being evaluated. What is the system doing when this eval runs?

---

## Input

What is given to the system?

```
[Example input or input template]
```

**Input variables:**
- `{variable_1}`: [description and value range]
- `{variable_2}`: [description and value range]

---

## Expected Behavior

What does "good" output look like? This is a rubric, not an exact expected output.

| Dimension | Score 1 (Poor) | Score 3 (Acceptable) | Score 5 (Excellent) |
|-----------|---------------|---------------------|---------------------|
| [Dimension 1] | [description] | [description] | [description] |
| [Dimension 2] | [description] | [description] | [description] |
| [Dimension 3] | [description] | [description] | [description] |

---

## Minimum Passing Score

- Overall minimum: [N] / 5
- [Dimension 1] minimum: [N] / 5 (if there is a hard floor on a specific dimension)
- [Dimension 2] minimum: [N] / 5

A result below the minimum on any hard-floor dimension fails regardless of overall score.

---

## Scoring Method

### LLM Judge Prompt

```
You are evaluating an AI response for quality.

TASK
{task_description}

INPUT
{input}

OUTPUT BEING EVALUATED
{output}

RUBRIC
Score the output on each dimension from 1 to 5.

[Dimension 1]: {dimension_1_rubric}
  1 = [description of score 1]
  3 = [description of score 3]
  5 = [description of score 5]

[Dimension 2]: {dimension_2_rubric}
  1 = [description of score 1]
  3 = [description of score 3]
  5 = [description of score 5]

OUTPUT FORMAT (JSON only, no explanation outside JSON):
{
  "dimension_1": {"score": N, "justification": "one sentence"},
  "dimension_2": {"score": N, "justification": "one sentence"},
  "overall": N,
  "summary": "one sentence overall assessment"
}
```

**Judge model:** [e.g. claude-opus-4-8 — use a different/more capable model than the one being evaluated]

### Heuristic Checks (if applicable)

Pre-filters that run before the LLM judge. Fail immediately if any heuristic fails:

```python
def heuristic_checks(output: str) -> list[str]:
    """Returns list of failure reasons. Empty list = pass."""
    failures = []
    
    if len(output) < 50:
        failures.append("Output too short (< 50 chars)")
    
    if len(output) > 2000:
        failures.append("Output too long (> 2000 chars)")
    
    # Add domain-specific checks
    # e.g. if "sorry" in output.lower():
    #     failures.append("Contains apology — may indicate refusal")
    
    return failures
```

---

## Test Cases

| ID | Input summary | Expected score (approx) | Notes |
|----|--------------|------------------------|-------|
| TC-01 | [normal case] | 4-5 | Baseline quality |
| TC-02 | [edge case] | 3-4 | [what makes this harder] |
| TC-03 | [failure case] | 1-2 | Should fail this eval |
| TC-04 | [adversarial] | Heuristic fail | [injection attempt or malformed input] |

---

## Known Limitations

- [Limitation 1]: [description and impact]
- [Limitation 2]: [description and impact]

Example: "Verbosity bias: longer responses tend to score higher on completeness regardless of actual information density."

---

## Calibration Notes

How was this eval calibrated? What human-labeled data was used? What is the judge-human agreement rate?

- Human-labeled examples: [N]
- Judge-human agreement: [X]%
- Last calibration date: YYYY-MM-DD
- Known divergence cases: [description of where judge and human disagree]
