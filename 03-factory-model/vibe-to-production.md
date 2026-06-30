# Vibe to Production

## The Gap Nobody Talks About

Vibe coding gets you to a working prototype in hours. The prototype looks right, behaves right in demos, and impresses clients. Then you try to move it to production and discover the gap.

The gap is everything you didn't need to care about to build the prototype but everything you absolutely need before real users depend on it.

This document closes that gap systematically.

---

## Stage 1: Prototype (Vibe Phase)

**Goal**: Prove the concept works.
**Mode**: Fast, exploratory, tolerance for mess.
**Done when**: The core interaction works end-to-end.

What you skip (intentionally):
- Error handling for edge cases
- Auth and access control
- Rate limiting
- Logging
- Tests
- Secret management (env vars in code is acceptable)

What you should not skip even here:
- Basic input validation at system boundaries
- Not hardcoding credentials that could leak to version control

---

## Stage 2: Hardening Checklist

Before promoting to production, audit every item:

### Security
- [ ] No secrets in source code. Move to `.env` file. Add `.env` to `.gitignore`.
- [ ] Input validation on all user-facing endpoints. Validate types, lengths, and formats.
- [ ] No raw user input passed into LLM system prompts. All user content is in the `user` role, never the `system` role.
- [ ] Tool access is scoped to minimum necessary permissions. No admin-level DB access when read-only is sufficient.
- [ ] Authentication in place. No endpoints accessible without a valid session or API key.
- [ ] Rate limiting on all AI endpoints. A single user cannot exhaust your API budget.

### Reliability
- [ ] All LLM calls have timeout handling. A hanging model call should fail gracefully, not freeze the app.
- [ ] Retry logic with exponential backoff on transient API failures.
- [ ] Fallback behavior when AI is unavailable. Degrade gracefully — show a message, not a crash.
- [ ] Output validation. If the model returns malformed JSON, the app handles it.

### Observability
- [ ] Structured logging on every AI call: timestamp, model, prompt tokens, completion tokens, latency, error if any.
- [ ] Error alerting. Failures should notify you, not just log silently.
- [ ] Cost tracking. You need to know what each feature costs per user per day.

### Data
- [ ] User data is not logged in plain text. PII is masked or excluded from logs.
- [ ] Conversation history that persists across sessions is stored securely.
- [ ] Data retention policy exists. Old conversations/logs are pruned.

---

## Stage 3: Productionizing AI Calls

This is the most common source of silent failures. Model calls that work perfectly in development break unpredictably in production.

### Structured Output Enforcement

Never rely on free text parsing. In production, all model calls that return data must use structured output.

```python
# Fragile (prototype)
response = call_model(user="Classify this lead: ...")
icp_fit = "high" if "strong fit" in response else "low"  # breaks constantly

# Production
response = call_model(
    user="Classify this lead: ...",
    tools=[CLASSIFY_LEAD_TOOL],
    tool_choice={"type": "tool", "name": "classify_lead"}
)
result = response.tool_calls[0].input  # always structured
```

### Retry with Backoff

```python
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def call_model_with_retry(messages: list, **kwargs) -> dict:
    return await anthropic_client.messages.create(**kwargs, messages=messages)
```

### Timeout

```python
async def call_model_with_timeout(messages: list, timeout_seconds: int = 30, **kwargs):
    try:
        return await asyncio.wait_for(
            call_model(messages, **kwargs),
            timeout=timeout_seconds
        )
    except asyncio.TimeoutError:
        raise ModelTimeoutError(f"Model call timed out after {timeout_seconds}s")
```

### Cost Guard

```python
MAX_TOKENS_PER_REQUEST = 4000
MAX_DAILY_SPEND_USD = 10.00

async def guarded_model_call(messages: list, **kwargs):
    # Check daily spend
    today_spend = get_today_spend()  # from your logging DB
    if today_spend >= MAX_DAILY_SPEND_USD:
        raise CostLimitExceeded(f"Daily spend limit of ${MAX_DAILY_SPEND_USD} reached")

    # Cap output tokens
    kwargs["max_tokens"] = min(kwargs.get("max_tokens", MAX_TOKENS_PER_REQUEST), MAX_TOKENS_PER_REQUEST)

    response = await call_model(messages, **kwargs)

    # Log cost
    log_usage(
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
        model=kwargs.get("model")
    )
    return response
```

---

## Stage 4: Deployment Checklist

### Environment
- [ ] Production environment variables set (not dev keys)
- [ ] Separate API keys for dev and prod
- [ ] Production database separate from dev (never share)
- [ ] Environment variable validation at startup — app should fail fast if required vars are missing

```python
# config.py — validate at startup
import os
from typing import Optional

def require_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise EnvironmentError(f"Required environment variable '{key}' is not set")
    return value

ANTHROPIC_API_KEY = require_env("ANTHROPIC_API_KEY")
DATABASE_URL = require_env("DATABASE_URL")
```

### Process
- [ ] Health check endpoint (`/health` or `/status`)
- [ ] Graceful shutdown — in-flight requests complete before process exits
- [ ] Process restart on crash (systemd, PM2, or container restart policy)
- [ ] Deployment is reversible — you can roll back to previous version in < 5 minutes

### Monitoring
- [ ] Uptime monitoring (external ping every 60 seconds)
- [ ] Error rate alerting (Slack/email when error rate exceeds threshold)
- [ ] Latency monitoring (alert if p95 exceeds target)

---

## Stage 5: Ongoing Production Health

Once live, production quality requires active maintenance:

**Weekly**: Review error logs for new failure modes. Any new error pattern gets a fix or a known-issue note.

**Monthly**: Review cost trends. Model pricing changes. Usage grows. Costs should scale linearly with usage — if they're scaling super-linearly, you have an efficiency problem.

**Per model release**: Run your eval suite against the new model version before switching. Never update model versions in production without running evals first.

**Per prompt change**: Any change to a system prompt is a production change. Run your eval suite. Review golden set results. Treat it like a code deploy.

---

## The Production Readiness Scorecard

Before declaring a vibe-coded app production-ready, score it:

| Category | Item | Points |
|----------|------|--------|
| Security | Secrets in env, not code | 10 |
| Security | Input validation | 10 |
| Security | Auth in place | 10 |
| Security | Rate limiting | 5 |
| Reliability | Timeout handling | 10 |
| Reliability | Retry with backoff | 10 |
| Reliability | Graceful degradation | 5 |
| Observability | Structured logging | 10 |
| Observability | Error alerting | 10 |
| Observability | Cost tracking | 5 |
| Data | No PII in logs | 10 |
| Deployment | Health check endpoint | 5 |

**Minimum to ship**: 85/100. Below that, identify which items you're skipping and explicitly accept the risk.
