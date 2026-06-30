# Phase 4: Testing and Quality Assurance

## Two Types of Verification

AI-assisted development requires two distinct types of verification that traditional development conflates:

**Output evaluation:** Did the final output meet the requirements? Is the code correct, the response appropriate, the result accurate?

**Trajectory evaluation:** Did the agent take the right path to get there? Did it use the right tools? Make the right decisions at branch points? Avoid unnecessary steps? Produce the correct intermediate artifacts?

Both matter. A system that produces correct outputs via unreliable trajectories is brittle. A system that follows correct trajectories consistently is predictable and maintainable.

---

## Tests vs Evals

**Tests** are for deterministic behavior. The function `add(2, 3)` must return `5`. Always. Tests pass or fail with binary certainty. Standard testing frameworks (pytest, Jest, Vitest) handle this.

**Evals** are for non-deterministic behavior. Does this LLM-generated summary capture the main points? Did the agent make reasonable decisions during this debugging session? Evals produce scores, not pass/fail. There is no industry-standard eval framework — you build what your task requires.

**The boundary in practice:**
- AI-generated code that is then executed deterministically: tests are sufficient.
- AI-generated text, plans, summaries, recommendations: evals are required.
- AI agent behavior (tool choices, decision paths, multi-step reasoning): trajectory evals are required.

**The most important implication:** If you are using AI agents in production and you have only tests, you are flying blind on the non-deterministic parts of your system. You need both.

---

## Writing Evals

See [04-skills-by-phase/testing/eval-writing.md](../04-skills-by-phase/testing/eval-writing.md) for the full guide.

**The core eval structure:**
1. **Scenario:** The situation being evaluated
2. **Input:** What is given to the system
3. **Expected behavior:** What "good" looks like (often a rubric, not exact output)
4. **Scoring method:** How to measure quality (LLM judge, human judge, heuristic)
5. **Minimum passing score:** What score is acceptable

**Types of evals:**

*LLM-as-judge:* Another LLM evaluates the output against a rubric. Scalable but introduces its own error rates. Best for subjective quality dimensions (clarity, helpfulness, tone).

*Human-in-the-loop eval:* A human evaluates a sample. Expensive but most accurate. Use for calibrating automated evals and for high-stakes quality checks.

*Heuristic eval:* Code-based checks (does the output contain required fields? Is it under the length limit? Does it cite sources?). Fast and reliable for structural requirements.

*Reference-based eval:* Compare output to a known-good reference answer. Works when a ground truth exists.

---

## LLM-as-Judge Patterns

The LLM-as-judge pattern uses a model to score outputs against a rubric. The judge model should be different from (and typically more capable than) the model being evaluated.

**Judge prompt structure:**
```
You are evaluating an AI response for quality.

Scenario: [scenario description]
User input: [what the user sent]
AI response: [the response being evaluated]

Score the response on each dimension (1-5):
1. Accuracy: Does it correctly address the question?
2. Completeness: Does it cover all relevant aspects?
3. Clarity: Is it easy to understand?
4. Safety: Does it avoid harmful content?

For each dimension, provide:
- Score (1-5)
- Brief justification (1-2 sentences)

Output as JSON:
{
  "accuracy": {"score": N, "justification": "..."},
  "completeness": {"score": N, "justification": "..."},
  "clarity": {"score": N, "justification": "..."},
  "safety": {"score": N, "justification": "..."},
  "overall": N
}
```

**Known limitations of LLM-as-judge:**
- Verbosity bias: longer responses tend to score higher regardless of quality
- Self-preference: a model will sometimes score outputs from similar models higher
- Position bias: in comparisons, the first option tends to score higher
- Calibration drift: judge scores may shift as the judge model updates

Mitigate with: multiple judges, disagreement analysis, periodic human calibration.

---

## Trajectory Evaluation

Trajectory evals verify that an agent's decision-making process is sound, not just that the final output is correct.

**What to check in a trajectory:**
- Tool selection: Did the agent use the right tools for the task?
- Tool order: Did the agent use tools in a sensible order?
- Unnecessary steps: Did the agent take detours or retries that suggest confusion?
- Decision quality at branch points: When the agent had choices, did it choose correctly?
- Resource efficiency: Did the agent stay within reasonable token/time budgets?

**Implementing trajectory evals:**
Log every tool call, prompt, and response in a structured format. Write evals that process these logs. Example:

```python
def eval_used_correct_tool(trajectory):
    """Check that the agent used the database query tool for data lookups."""
    data_lookup_steps = [s for s in trajectory if "look up" in s.prompt.lower()]
    for step in data_lookup_steps:
        if "database_query" not in [t.name for t in step.tools_used]:
            return False, f"Step {step.id} did a data lookup without using database_query tool"
    return True, "All data lookups used database_query tool"
```

---

## Testing AI-Generated Code

AI-generated code should be tested like any other code. The testing discipline does not change just because the code was AI-generated.

**Additional practices for AI-generated code:**
- Review test coverage. AI sometimes generates tests that test the happy path but not edge cases.
- Check that tests are testing the right thing. AI can generate tests that pass trivially without actually verifying behavior.
- Run mutation testing on critical modules. If your tests do not catch a mutation, they are not testing effectively.
- Test the integration, not just the unit. AI-generated units sometimes work in isolation but fail when composed with the rest of the system.

**The test-first advantage:**
Writing tests before prompting for implementation (red-green-refactor) has compounding benefits with AI assistance. The model has explicit success criteria to implement against, the tests catch output quality issues immediately, and the tests document behavior for future maintainers.
