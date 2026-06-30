# Phase 5: Code Review and Deployment

## AI as First-Pass Reviewer

AI can function as an effective first-pass reviewer: flagging obvious bugs, identifying code that does not match project conventions, catching common security antipatterns, and surfacing style issues before they consume human review time.

This reduces review load without replacing human judgment on design. A human reviewer's most valuable contribution is evaluating whether the implementation reflects the right design decision. That requires understanding the full context of the system, the team's constraints, and the implicit knowledge that does not appear in the code. AI does not have this. AI catches what is mechanically wrong; humans catch what is architecturally wrong.

**A practical two-pass review workflow:**
1. AI first pass: automated review for bugs, security, style, convention violations
2. Human second pass: design review, architectural conformance, judgment calls

The AI pass reduces noise so the human pass can focus on what matters.

---

## AI Code Review Patterns

**Convention review:**
```
Review this diff for violations of our project conventions (see AGENTS.md).
List each violation with: file, line, convention violated, suggested fix.
Do not comment on style issues not covered by our conventions.
```

**Security review:**
```
Review this code for security issues.
Check for: injection vulnerabilities, authentication/authorization bypasses,
secrets in code, insecure error messages, input validation gaps.
For each issue: severity (high/medium/low), location, description, recommendation.
```

**Logic review:**
```
Review this implementation of [feature name].
The spec is: [spec]
Does the implementation match the spec? Are there edge cases in the spec
that are not handled? Are there edge cases handled that are not in the spec?
```

**Test coverage review:**
```
Review these tests for [module name].
Are there scenarios in the implementation that are not tested?
Are there tests that do not actually verify behavior (trivial pass conditions)?
List gaps with suggested test cases.
```

---

## CI/CD Gates with LLM Checks

LLM-based quality checks can be integrated into CI/CD pipelines as gates. They run automatically on every PR and block merges that fail.

**What LLM gates are useful for:**
- Checking that AI-generated code matches documented conventions
- Scanning for hardcoded secrets and credentials
- Verifying that new code includes required tests
- Checking that migration files follow safety conventions
- Flagging unusual changes to security-critical files for human review

**What LLM gates are NOT reliable for:**
- Correctness checking (tests are better)
- Performance benchmarking (load tests are better)
- Final security sign-off (use dedicated security tooling)

**Example GitHub Actions LLM gate:**
```yaml
name: LLM Code Review Gate

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  llm-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Get diff
        run: git diff origin/main...HEAD > /tmp/pr.diff
      
      - name: LLM Security Scan
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          python scripts/llm-security-scan.py /tmp/pr.diff
          # Script exits 1 if high-severity issues found, blocking the merge
```

**Gate design principles:**
- Gates should be fast (<60 seconds) or run in parallel with other checks
- Gates should have clear, actionable failure messages
- Treat gates as advisory for the first month; make them blocking after calibration
- Keep a log of gate decisions for calibration and false-positive analysis

---

## Security Considerations for AI-Generated Code

AI-generated code has a distinct risk profile that differs from hand-written code:

**Higher surface area from unfamiliar code:** Developers review AI-generated code they may not fully understand. Review depth tends to be shallower for unfamiliar code. Apply the five-point security checklist ([05-checklists/vibe-coding-security-checklist.md](../05-checklists/vibe-coding-security-checklist.md)) rigorously.

**Training data contamination:** Models are trained on public code that includes known vulnerabilities. They can reproduce vulnerable patterns from training data. Prompt injection awareness, SQL injection, and XSS patterns appear in AI output at higher rates than in carefully reviewed hand-written code from experienced developers.

**Confident-sounding incorrect output:** AI generates plausible-looking code that may have subtle logical errors. The code looks right, passes linting, and may even pass basic tests, while having a logic bug that only surfaces in edge cases.

**Mitigation:**
- Security-specific review pass on all AI-generated code touching auth, payments, or user data
- Automated scanning (Semgrep, Snyk, or similar) in CI/CD for all AI-generated additions
- Red team review of AI-generated security-relevant components before production

---

## Deployment Patterns

**Progressive deployment for AI-generated features:**
Deploy AI-generated features with the same (or higher) caution as handwritten code. Consider:
- Feature flags to enable/disable without deployment
- Canary deployment to 5% of traffic before full rollout
- Rollback plans documented before deployment begins
- Error rate monitoring for the first 24 hours post-deploy

**Documenting AI provenance:**
Some teams tag AI-generated code in commits for auditing purposes:
```
feat: add product search endpoint

Co-authored-by: Claude Sonnet 4.6 <noreply@anthropic.com>
```

This creates an audit trail and helps with future maintenance (knowing which modules were AI-generated helps prioritize human review when those modules are modified).
