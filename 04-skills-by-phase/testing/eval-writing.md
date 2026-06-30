# Skill: Writing LLM Evals

## Why Evals Are Different From Tests

Tests verify deterministic behavior: given input X, the output must be exactly Y. If the function returns Z, the test fails. Binary.

Evals verify non-deterministic behavior: given input X, the output should have qualities A, B, and C. How much of each? The eval produces a score, not a pass/fail.

You need evals when:
- AI generates text that is evaluated for quality, not exact match
- AI makes decisions that need to be assessed for appropriateness
- AI agents take multi-step actions that need trajectory review
- The "correct" answer is a range or distribution, not a single value

Without evals, you have no systematic way to know whether changes to your prompts, models, or harness improved or degraded output quality.

---

## Types of Evals

### Output Evals
Evaluate the final output: does it meet quality criteria?

Used for: content generation, summarization, classification, recommendations, code review output.

**Example output eval:**
```python
def eval_summary_quality(input_text: str, summary: str) -> EvalResult:
    """Score a summary on accuracy, conciseness, and completeness."""
    judge_prompt = f"""
    Original text: {input_text}
    Summary: {summary}
    
    Score the summary on:
    1. Accuracy (1-5): Does it accurately represent the original?
    2. Conciseness (1-5): Is it appropriately brief without losing key points?
    3. Completeness (1-5): Does it cover the main points of the original?
    
    Output JSON: {{"accuracy": N, "conciseness": N, "completeness": N, "overall": N}}
    """
    result = llm_judge(judge_prompt)
    return EvalResult(
        scores=result,
        passed=result["overall"] >= 4
    )
```

### Trajectory Evals
Evaluate the path an agent took to reach its output: did it use the right tools, make correct decisions?

Used for: multi-step agent tasks, debugging sessions, research and retrieval tasks.

**Example trajectory eval:**
```python
def eval_research_trajectory(task: str, tool_calls: list[ToolCall]) -> EvalResult:
    """Verify agent used appropriate tools for a research task."""
    issues = []
    
    # Check that search was used before answering
    search_calls = [tc for tc in tool_calls if tc.name == "web_search"]
    if not search_calls:
        issues.append("No web_search calls — agent may have answered from training data only")
    
    # Check tool call order (search before synthesize)
    for i, tc in enumerate(tool_calls):
        if tc.name == "synthesize_results" and i < 2:
            issues.append(f"synthesize_results called before sufficient search (step {i})")
    
    # Check no hallucinated tools
    valid_tools = {"web_search", "web_fetch", "synthesize_results", "format_output"}
    for tc in tool_calls:
        if tc.name not in valid_tools:
            issues.append(f"Unknown tool called: {tc.name}")
    
    return EvalResult(
        issues=issues,
        passed=len(issues) == 0
    )
```

### Comparative Evals
Compare two outputs (A/B) to determine which is better. Used for model selection, prompt iteration, and harness changes.

**Example:**
```python
def eval_compare_responses(question: str, response_a: str, response_b: str) -> str:
    """Return 'A', 'B', or 'tie'."""
    judge_prompt = f"""
    Question: {question}
    
    Response A: {response_a}
    Response B: {response_b}
    
    Which response better answers the question? Consider: accuracy, clarity, completeness.
    
    Output only: "A", "B", or "tie"
    """
    return llm_judge(judge_prompt).strip()
```

---

## LLM-as-Judge Setup

Using an LLM to evaluate another LLM's output is scalable but requires calibration.

### Judge prompt structure
```
You are evaluating an AI response for quality.

CONTEXT
Task description: {task}
User input: {user_input}

OUTPUT BEING EVALUATED
{ai_output}

RUBRIC
Score the output on each dimension from 1-5:

1. Accuracy (1-5)
   1 = Major factual errors or completely off-topic
   3 = Mostly accurate with minor issues  
   5 = Fully accurate, no errors

2. Completeness (1-5)
   1 = Misses most key aspects of the task
   3 = Covers main points, misses some details
   5 = Comprehensive coverage of all relevant aspects

3. Clarity (1-5)
   1 = Confusing or poorly structured
   3 = Clear with minor issues
   5 = Exceptionally clear and well-organized

4. Safety (1-5)
   1 = Contains harmful, dangerous, or inappropriate content
   3 = Generally safe with minor concerns
   5 = Fully safe, no concerns

INSTRUCTIONS
- Score each dimension independently
- Provide brief justification for each score (1-2 sentences)
- Be calibrated: a score of 5 should be rare (excellent), a score of 3 is "good but not great"

OUTPUT FORMAT (JSON):
{
  "accuracy": {"score": N, "justification": "..."},
  "completeness": {"score": N, "justification": "..."},
  "clarity": {"score": N, "justification": "..."},
  "safety": {"score": N, "justification": "..."},
  "overall": N
}
```

### Calibration
LLM judges need calibration to be useful. Calibrate by:
1. Creating a set of 20-30 human-labeled examples (known good, known bad, in-between)
2. Running the judge on them
3. Measuring judge-human agreement
4. Adjusting the rubric where there are systematic disagreements

A well-calibrated judge should agree with human reviewers >80% of the time.

### Known biases to mitigate
- **Verbosity bias:** Longer responses score higher. Mitigate by adding a "conciseness" dimension with negative scoring for unnecessary length.
- **Position bias:** In A/B evals, the first option scores higher. Mitigate by running each comparison twice (swap order) and averaging.
- **Self-preference:** A judge model tends to prefer outputs from similar models. Use a different model family for the judge than the model being evaluated when possible.

---

## Eval Template

Use [06-templates/eval-template.md](../../06-templates/eval-template.md) for a complete eval spec template.

Key fields:
- **Eval name:** Clear, descriptive, includes the behavior being evaluated
- **Type:** Output, trajectory, comparative, or heuristic
- **Scenario:** The situation being evaluated
- **Input:** What is given to the system
- **Expected behavior:** What "good" looks like (rubric, not exact output)
- **Minimum passing score:** What score is acceptable
- **Scoring method:** LLM judge prompt, heuristic, or human

---

## Building an Eval Suite

An eval suite is a collection of evals that covers your system's behavioral requirements. Approach:

**Start with failure modes.** What are the most important ways the system can fail? Write evals that catch each.

**Cover distribution, not just edge cases.** Most of your eval inputs should be representative of real usage, not exotic edge cases. 80% typical, 20% edge cases.

**Automate and run continuously.** Evals should run on every significant change. Integrate them into CI/CD or run them on a schedule.

**Track trends, not just pass/fail.** A system that scores 4.2 on average is better than one that scores 3.8. Track score distributions over time to catch gradual degradation.

**Review failures personally.** When the eval suite catches a failure, read the actual output. The eval score tells you something is wrong; the output tells you what.
