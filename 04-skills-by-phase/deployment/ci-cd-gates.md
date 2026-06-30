# Skill: LLM-Based CI/CD Gates

## What LLM Gates Are

LLM-based CI/CD gates are automated quality checks that use a language model to evaluate code changes as part of the pull request pipeline. They run on every PR and can block merges when quality criteria are not met.

They supplement — they do not replace — traditional CI/CD checks (tests, linting, type checking, security scanning). They add value in areas where deterministic rules cannot capture quality: convention adherence, architecture consistency, narrative-level change review.

---

## What LLM Gates Are Good For

**Convention adherence:** Does the new code follow project conventions documented in AGENTS.md? This catches violations that a linter cannot express — architectural conventions, naming patterns for domain concepts, which utilities to use for common operations.

**New code has tests:** Does every new public function have a corresponding test? Does the test file exist?

**Migration safety review:** Does the new database migration follow safety conventions (additive changes, nullable new columns, no table locks)?

**Security-critical file monitoring:** Does the PR modify authentication, authorization, or payment code? Flag for elevated human review.

**Spec-to-code alignment:** Does the implementation match the spec linked in the PR description?

**Documentation currency:** Do docstrings and comments for modified functions reflect the new behavior?

---

## What LLM Gates Are NOT Good For

- **Correctness:** Tests are better. LLMs hallucinate in code review.
- **Performance:** Benchmarks and load tests are better.
- **Final security sign-off:** Dedicated tools (Semgrep, Snyk, CodeQL) are better.
- **Anything requiring deep runtime understanding:** The model sees the diff, not the executing system.

---

## Gate Design

### The check script pattern

Each gate is a Python (or language of your choice) script that:
1. Receives the PR diff as input
2. Constructs a review prompt
3. Calls the LLM API
4. Parses the structured response
5. Exits 0 (pass) or 1 (fail), with human-readable output

**Example gate script:**
```python
#!/usr/bin/env python3
"""CI gate: check new code follows project conventions."""

import sys
import json
import anthropic

def load_diff(path: str) -> str:
    with open(path) as f:
        return f.read()

def load_conventions() -> str:
    with open("AGENTS.md") as f:
        return f.read()

def check_conventions(diff: str, conventions: str) -> dict:
    client = anthropic.Anthropic()
    
    prompt = f"""
    You are reviewing a code change for adherence to project conventions.
    
    PROJECT CONVENTIONS:
    {conventions}
    
    CODE CHANGE (diff):
    {diff}
    
    Identify any violations of the project conventions in this diff.
    
    For each violation, provide:
    - file: the file path
    - line_range: approximate line range  
    - convention: which convention is violated (quote the relevant rule)
    - description: what the code does instead
    - severity: "high" (blocks merge) or "medium" (warning only)
    
    If no violations found, return an empty violations array.
    
    Output as JSON: {{"violations": [...]}}
    """
    
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return json.loads(response.content[0].text)

def main():
    if len(sys.argv) < 2:
        print("Usage: convention-check.py <diff-file>")
        sys.exit(1)
    
    diff = load_diff(sys.argv[1])
    conventions = load_conventions()
    result = check_conventions(diff, conventions)
    
    violations = result.get("violations", [])
    high_severity = [v for v in violations if v.get("severity") == "high"]
    medium_severity = [v for v in violations if v.get("severity") == "medium"]
    
    if violations:
        print(f"\nConvention Check Results:")
        print(f"  High severity (blocks merge): {len(high_severity)}")
        print(f"  Medium severity (warnings): {len(medium_severity)}")
        
        for v in violations:
            severity_label = "[BLOCK]" if v["severity"] == "high" else "[WARN]"
            print(f"\n{severity_label} {v['file']}")
            print(f"  Convention: {v['convention']}")
            print(f"  Issue: {v['description']}")
    else:
        print("Convention check passed: no violations found.")
    
    # Exit 1 if any high-severity violations
    sys.exit(1 if high_severity else 0)

if __name__ == "__main__":
    main()
```

### GitHub Actions integration

```yaml
name: LLM Quality Gates

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  convention-check:
    name: Convention Adherence Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install anthropic
      
      - name: Generate diff
        run: |
          git diff origin/${{ github.base_ref }}...HEAD > /tmp/pr.diff
          echo "Diff size: $(wc -l < /tmp/pr.diff) lines"
      
      - name: Convention check
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: python scripts/ci/convention-check.py /tmp/pr.diff

  migration-safety:
    name: Migration Safety Check
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.changed_files, 'migrations/')
    steps:
      - uses: actions/checkout@v4
      
      - name: Check for new migration files
        id: check-migrations
        run: |
          NEW_MIGRATIONS=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep 'migrations/' || true)
          echo "migrations=$NEW_MIGRATIONS" >> $GITHUB_OUTPUT
      
      - name: Migration safety review
        if: steps.check-migrations.outputs.migrations != ''
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          python scripts/ci/migration-safety-check.py \
            ${{ steps.check-migrations.outputs.migrations }}
```

---

## Gate Calibration

LLM gates need calibration before becoming blocking. Recommended rollout:

**Week 1-2: Advisory mode.** Run the gates, log results, do not block PRs. Review every gate result manually.

**Week 3-4: Warning mode.** Post gate results as PR comments. Do not block. Track false positive rate.

**Target:** <10% false positive rate before making gates blocking.

**Month 2+: Blocking mode.** High-severity violations block merge. Medium-severity are warnings.

**Maintain a false positive log.** Every time a gate blocks a valid PR, record it. Use the log to refine gate prompts.

---

## Cost Management

LLM API calls have cost. Manage it:

- **Skip gates for small diffs:** If the diff is <20 lines, skip the LLM gate (deterministic checks are sufficient for small changes).
- **Cache results for unchanged files:** If the gate already ran on a given diff hash, use the cached result.
- **Gate only modified file types:** A migration safety gate only needs to run when migration files changed.
- **Set token limits:** Cap the diff size sent to the LLM. For very large PRs, review the first N lines or route to a different review process.

Typical cost for a convention check on a mid-sized PR (500-line diff): $0.002-0.01. For a team making 20 PRs/day, this is well under $100/month.
