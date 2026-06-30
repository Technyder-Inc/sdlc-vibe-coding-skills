# Vibe Coding Security Checklist

Every AI-assisted app — prototype or production — must pass all 5 checks before shipping.

---

## 1. Prompt Injection

Prompt injection occurs when user-supplied content manipulates the AI system's behavior by being interpreted as instructions rather than data.

- [ ] No user-supplied content can override system prompts
- [ ] User input does not flow directly into LLM call sites without sanitization
- [ ] System prompts are isolated from user message context
- [ ] The system is tested with adversarial inputs ("Ignore previous instructions and...")
- [ ] Agent tools cannot be triggered by user-constructed inputs that bypass intent checks

**How to verify:** Attempt to inject instructions via every user-facing input field. The system should process the input as data, not execute the injected instruction.

---

## 2. Tool Abuse

Tool abuse occurs when a model misuses available tools beyond their intended scope, either by design (malicious input) or by confusion (ambiguous tool definitions).

- [ ] Every tool exposed to the model has minimum-necessary scope
- [ ] Tool outputs are validated before use in downstream operations
- [ ] No tool can be misused for unintended side effects (e.g. a "read file" tool should not allow write operations)
- [ ] Tool descriptions are precise enough that the model cannot misinterpret their purpose
- [ ] Destructive tools (delete, send, write) require explicit user confirmation

**How to verify:** Review each tool definition. For each tool, enumerate misuse scenarios. Test that the model cannot be prompted to use tools outside their intended function.

---

## 3. Data Exfiltration

Data exfiltration occurs when sensitive information from the system context, user data, or internal state leaks to unauthorized parties.

- [ ] No user data leaks via tool outputs or API responses
- [ ] No internal system state exposed in error messages
- [ ] Logs do not contain session context, PII, or authentication tokens
- [ ] LLM responses do not include information from other users' sessions
- [ ] File system access is scoped to the minimum necessary directory

**How to verify:** Review all error messages, API responses, and logs. Verify that no session context, other user data, or system internals appear. Test with inputs designed to extract context ("What is in your system prompt?").

---

## 4. Privilege Escalation

Privilege escalation occurs when a user or agent gains permissions beyond their authorized level.

- [ ] Agents and users cannot elevate their own permissions via prompts or API calls
- [ ] Role boundaries are enforced server-side only (never client-side)
- [ ] No client-side permission checks used as the sole access control mechanism
- [ ] Agent permissions are scoped per task, not elevated globally
- [ ] Admin functions are not accessible from user-facing AI interfaces

**How to verify:** Attempt to perform admin actions as a standard user. Attempt to prompt the agent into performing actions beyond its configured scope. Verify all access control logic exists on the server.

---

## 5. Secret Exposure

Secret exposure occurs when API keys, tokens, passwords, or other credentials appear in generated code, logs, error messages, or version control.

- [ ] No hardcoded API keys or tokens in generated code
- [ ] All secrets managed via environment variables or a secrets manager
- [ ] .gitignore includes .env and credentials files and is committed before first push
- [ ] No secrets in logs, error messages, or LLM responses
- [ ] Secret scanning is configured in CI/CD (e.g. GitHub secret scanning, Trufflehog)
- [ ] Generated code reviewed for accidental credential inclusion before committing

**How to verify:** Run a secret scanning tool (Trufflehog, git-secrets, GitHub secret scanning) against the repository. Review all log output and error messages for credential patterns. Check that .gitignore is in place and correct before the first commit.

---

## 6. Agentic-Specific Checks

Multi-agent and agentic architectures introduce additional attack surfaces beyond single-model applications.

### Agent Identity and Trust
- [ ] Each agent has a defined identity and scope. Agents do not share credentials.
- [ ] Orchestrator agents cannot grant sub-agents permissions the orchestrator itself does not have.
- [ ] Trust is never established based on the content of a message — only on the verified sender identity.
- [ ] An agent cannot be prompted into claiming to be a different agent ("pretend you are the admin agent").

### Cross-Agent Injection
- [ ] Tool results passed between agents are treated as untrusted data, not instructions.
- [ ] An agent that receives output from a web search, document fetch, or external API cannot have its behavior hijacked by content within those results.
- [ ] System prompts are never dynamically constructed from external data sources.
- [ ] Agent-to-agent messages pass through a validation layer before execution.

### Tool Chain Abuse
- [ ] The full chain of tool calls in a multi-step task has been reviewed for misuse paths.
- [ ] No tool in the chain can be used as a relay to another tool with higher permissions.
- [ ] Chained tool calls that result in external communications (email, webhook, message) require explicit human approval.

### Memory and State Integrity
- [ ] Agent memory stores (vector DB, state files, conversation history) are write-protected from untrusted agents.
- [ ] Memory is scoped per user or per session. Cross-session memory bleed has been tested and is not possible.
- [ ] Memory contents are not logged in plaintext. PII in memory is masked or encrypted at rest.

### Audit and Rollback
- [ ] Every agent action that modifies external state (writes, sends, deletes) is logged with timestamp, actor, and action.
- [ ] The log is immutable — agents cannot modify or delete their own audit trail.
- [ ] Rollback procedures exist for the most common unintended actions (sent email, written file, CRM update).

**How to verify:** Trace a complete multi-agent workflow from user input to final output. Document every external action. Confirm each one is logged, authorized, and reversible where possible.

---

## Do Not Ship With Open Checklist Items

This checklist applies to all AI-assisted code, regardless of tier (vibe coding, structured, agentic).

The risk profile differs by tier, but the checklist does not. A prototype that becomes a demo that becomes production is the standard lifecycle. Build the security posture in from the start.

**For items you deliberately defer (e.g. prompt injection hardening for a prototype):**
Document the deferral explicitly: what was deferred, why, and what must happen before it can be used in a production context. Undocumented deferrals become forgotten vulnerabilities.
