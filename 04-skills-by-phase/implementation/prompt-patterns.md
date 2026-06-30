# Skill: Prompt Patterns for Implementation

Ten practical prompt patterns for AI-assisted implementation. Each includes: when to use it, example prompt, and what to watch for in the output.

---

## Pattern 1: Constrained Implementation

**When to use:** Any implementation task where you have existing patterns and conventions to follow.

**The pattern:** Specify requirements, explicit constraints, and what NOT to do. Give the model less room to make choices, not more.

**Example:**
```
Implement a password reset endpoint for the users API.

Requirements:
- POST /api/auth/password-reset
- Accepts: { email: string }
- Generates a reset token (uuid v4), stores with 1-hour expiry in Redis
- Sends an email via the existing EmailService (src/services/email.service.ts)
- Returns 200 with { message: "If that email exists, a reset link has been sent" } (never confirm or deny email existence)

Constraints:
- Use the existing rate limiting middleware (src/middleware/rate-limit.ts)
- Token storage: use the existing RedisService, not a new connection
- Error handling: use the AppError class (src/utils/errors.ts)

Do not:
- Return different responses for found vs not-found email addresses (security)
- Implement the reset confirmation endpoint (separate ticket)
- Add new dependencies
```

**Watch for:** The model adding features not requested, skipping the rate limiting constraint, or revealing email existence via different response times or messages.

---

## Pattern 2: Red-Green-Refactor

**When to use:** Any new function or module where correctness matters more than speed of implementation.

**The pattern:** Write failing tests first. Ask for implementation to make them pass. Do not allow the model to modify the tests.

**Example:**
```
Here are failing tests for a calculateShipping function:

[paste tests]

Implement calculateShipping in src/utils/shipping.ts to make all tests pass.

Rules:
- Do not modify the tests
- Do not add more tests
- Implement only what is needed to pass the existing tests
- Use TypeScript strict mode
```

**Watch for:** Tests being modified to pass (explicitly forbidden), extra functionality added beyond what tests require, the model writing tests that trivially pass by hardcoding expected values.

---

## Pattern 3: Pattern Matching

**When to use:** When you want new code to match an existing module's patterns exactly.

**The pattern:** Point to a reference implementation and ask for a parallel implementation.

**Example:**
```
The existing UserService (src/services/user.service.ts) handles user CRUD operations.
[paste UserService]

Implement a ProductService in src/services/product.service.ts that follows the exact same patterns.
The product schema is: [paste schema]
Required operations: getById, list (with pagination), create, update, softDelete

Match the error handling, logging, validation approach, and method signatures of UserService.
Deviations from the UserService pattern are only acceptable where the product domain genuinely requires different behavior.
```

**Watch for:** The model "improving" the pattern instead of matching it, creating inconsistency between services.

---

## Pattern 4: Review Before Implement

**When to use:** Complex or risky implementations where you want to surface problems before code is written.

**The pattern:** Ask the model to review and identify issues before writing any code. This prevents having to undo a large implementation.

**Example:**
```
I want to implement [feature description].
The spec is: [spec]
The relevant existing code is: [code]

Before implementing, identify:
1. Anything in the spec that is ambiguous or would require you to make assumptions
2. Edge cases in the spec that are not handled
3. Potential security issues in the approach
4. Integration points with existing code that could break

Do not write any code. Only surface issues.
```

**Watch for:** The model writing code anyway, superficial review that misses real issues, false confidence that the spec is complete when it is not.

---

## Pattern 5: Stepwise with Checkpoints

**When to use:** Large implementations that span multiple files or require sequential decisions.

**The pattern:** Break the implementation into explicit checkpoints. Approve each checkpoint before proceeding.

**Example:**
```
Implement user notifications in three steps. Stop and wait for approval after each step.

Step 1: Create the database schema (migration + model)
Step 2: Implement the NotificationService
Step 3: Wire the service into the existing event system

Start with Step 1 only. Show me the migration and model. Wait for approval before proceeding.
```

**Watch for:** The model proceeding past checkpoints without waiting, the approval requirement being ignored in later steps.

---

## Pattern 6: Negative Space Specification

**When to use:** When you know what you do NOT want more clearly than what you do.

**The pattern:** Specify by exclusion. Describe the behaviors you want to prohibit explicitly.

**Example:**
```
Implement a file upload handler.

Do not:
- Allow uploads larger than 5MB
- Allow file types other than: jpg, png, pdf, docx
- Store files with user-provided filenames (generate a uuid-based name)
- Expose the storage path in the API response
- Process files synchronously (use background job)
- Store files in the database (use object storage)

Within those constraints, implement the minimum viable upload handler.
```

**Watch for:** The model "helpfully" adding features that were not asked for, or treating "do not" lists as optional.

---

## Pattern 7: Diff-Only Output

**When to use:** When you want to modify existing code and need to be precise about what changes.

**The pattern:** Ask for a diff rather than full file output. This forces the model to be precise about what changes, and makes review faster.

**Example:**
```
Here is the current UserController (src/controllers/user.controller.ts):
[paste code]

I need to add rate limiting to the login endpoint only.
The rate limiter is already set up in src/middleware/rate-limit.ts.

Show me only the changes as a diff. Do not output the entire file.
```

**Watch for:** The model outputting the full file anyway, making unrelated "improvements" alongside the requested change.

---

## Pattern 8: Security-First Implementation

**When to use:** Any code that handles authentication, authorization, user input, or external data.

**The pattern:** Explicitly invoke security considerations before implementation.

**Example:**
```
Implement a file download endpoint. Users can download files they own.

Before writing code, enumerate:
1. All inputs that could be malicious
2. What access control checks are needed
3. What path traversal risks exist
4. What information should never appear in error messages

Then implement the endpoint with those security considerations addressed explicitly.
Flag any security decision in your code with a comment explaining why.
```

**Watch for:** Security checks missing from the implementation, insecure defaults (trusting client-provided file paths), error messages revealing internal state.

---

## Pattern 9: Explain Then Implement

**When to use:** When you want to verify the model understands the task before it writes code.

**The pattern:** Ask for an explanation of the approach before implementation. If the explanation is wrong, the implementation will be too.

**Example:**
```
I need to implement optimistic locking for concurrent updates to the orders table.

First, explain in 2-3 sentences how you plan to implement this using PostgreSQL and our existing ORM setup.
Do not write code yet.
```

Review the explanation. If it is correct, prompt:

```
That approach looks correct. Now implement it.
```

If it is wrong:
```
That approach has a problem: [explain]. Try again with [correction].
```

**Watch for:** The explanation skipping over the hard parts, descriptions that sound right but have subtle flaws that would become bugs in implementation.

---

## Pattern 10: Migration with Rollback

**When to use:** Any database schema change or data migration in production.

**The pattern:** Always implement migrations as up/down pairs. Never write a migration without a rollback.

**Example:**
```
I need to add a `stripe_customer_id` column to the users table.

Write a database migration that:
- Adds the column (nullable, varchar(255))
- Has a rollback (down migration) that removes the column
- Is safe to run on a live database with concurrent reads and writes
- Does not lock the table for more than a few milliseconds

Also identify any application code that needs to be updated to handle this column.
```

**Watch for:** Missing down migration, table-locking operations (adding NOT NULL without a default on large tables), application code changes not identified.
