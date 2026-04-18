---
name: Framer Exporter Implementation Learnings
description: Key insights, patterns, and failure analysis from building framer-exporter-web
type: project
---

# Framer Exporter Web - Learnings & Patterns

## Core Insight: Validation Delegation Over Whitelisting

**Rule:** When you can't enumerate all possibilities of external data, validate what you CAN (format/protocol) and delegate domain-specific validation to the specialized service.

**Why:** Framer supports arbitrary custom domains. Domain whitelist approach (framer.com, *.framer.app, etc.) fails immediately for custom domains. By accepting all HTTPS URLs and letting framer-exporter CLI validate, we gained infinite domain support with zero maintenance.

**How to apply:** Before writing a whitelist validator, ask: "What if someone uses a variant I haven't considered?" For validation, prefer structural checks (format, protocol) over semantic checks (domain ownership) unless you own the domain.

## Failure Pattern: Assuming Package Structure Without Verification

**Rule:** Before using a dependency's API (spawn, import, file structure), verify the actual structure matches your assumptions—read the source if needed.

**Why:** framer-exporter package didn't follow standard npm bin entry patterns. Initial approach assumed binary would be at `node_modules/.bin/framer-exporter`. When that failed, second assumption was that we'd create zip at `outputDir/export.zip`. Both wrong.

**How to apply:** For critical external dependencies, write a quick verification script before integrating. Check: entry points exist, exported functions match docs, return values are what you expect.

## Failure Pattern: Predicting Output vs. Using Return Values

**Rule:** If a function returns something, use the return value. Don't predict the output location.

**Why:** exportSite() returns the zipPath instead of creating at predictable location. Initial code tried `fs.readFileSync(path.join(outputDir, 'export.zip'))` → file not found. Should've read the function carefully: "Returns: zipPath of created file".

**How to apply:** When integrating external APIs, trace through the function signature and return type. If it returns the value you need, don't guess the side effect.

## Pattern: Promise.race() for Timeout Enforcement

**Rule:** Use Promise.race() for timeout enforcement, not setTimeout + rejection. Stops execution naturally without resource leaks.

**Why:** Long-running exports can't be stopped mid-execution, but Promise.race() ensures we stop waiting and return gracefully. setTimeout approach would leave Puppeteer processes running.

**Implementation:**
```typescript
const timeoutPromise = new Promise(resolve => {
  setTimeout(() => resolve({ success: false, error: 'Timeout' }), 60000);
});
return Promise.race([exportPromise, timeoutPromise]);
```

## Pattern: Frontend State Must Mirror Backend Constraints

**Rule:** If backend has a constraint (rate limiting), reflect it in frontend state, not just error messages.

**Why:** Initial implementation showed error message "Please wait 5 seconds" but button remained enabled. Users could keep clicking. Fixed by adding `isRateLimited` state that disables button + input.

**How to apply:** For any backend constraint (rate limit, quota, timeout), add corresponding frontend state that prevents users from triggering the constraint again.

## Pattern: Explicit State Over Implicit Behavior

**Rule:** For time-based clearing (rate limit windows, error dismissal), explicitly set and clear state in setTimeout, don't rely on render logic to infer timing.

**Why:** Auto-clear error after 5 seconds matching rate limit window needs explicit setTimeout. If you only show error based on state, you might clear it prematurely or leave it stuck if state logic is fragile.

## Test Maintenance Pattern: Keep Tests Fast, Move Integration to Separate Suite

**Rule:** Unit tests should run in <500ms. If a test spawns external processes, it belongs in integration tests, not unit tests.

**Why:** lib/cli.test.ts actually ran framer-exporter exports, taking 5-30s per test. These failed/timed out during development. Removed them from jest suite. Real validation happens via API route tests + manual testing.

**How to apply:** If test is slow, mock the slow part. If you can't mock it, move to integration test suite. Keep jest suite fast so developers run it frequently.

## Test Update Pattern: Changing Behavior Requires Test Updates

**Rule:** When you change validator behavior (domain whitelist → accept all HTTPS), update corresponding tests. Test suite is the spec.

**Why:** Validator tests expected https://example.com to return false (not a Framer domain). After we accepted all HTTPS URLs, this test became incorrect and failed.

**How to apply:** Tests document your assumptions. When assumptions change, update tests. If you're hesitant to update a test, it might mean the behavior change is wrong.

## Architecture Pattern: Stateless + In-Memory Rate Limiting Works for Vercel

**Rule:** For ephemeral serverless deployments (Vercel), in-memory per-instance state (rate limiting, caching) is fine. State is lost on redeploy, which is acceptable.

**Why:** Each Vercel function invocation is isolated. In-memory Map<URL, timestamp> never spans requests. Rate limit resets on redeploy, no persistence needed. For persistent state, you'd need Redis, but that's overkill here.

**How to apply:** Before adding Redis/database for state management, consider: "Do I need this to survive server restart?" For Vercel, almost always "no."

## Edge Case: Clean Up in Finally, Even on Error

**Rule:** Put resource cleanup (temp directories, file handles) in finally block, not after success path. Always clean up.

**Why:** If exportSite() fails partway through, temp directory still exists with partially-written files. Using finally ensures cleanup happens whether export succeeds or fails.

## Error Message Pattern: Be Specific About What Failed

**Rule:** Use CLI error message directly when it's useful, swallow it when it's noise.

**Why:** framer-exporter returns detailed errors ("Cannot navigate to invalid URL", "Protocol error"), which are more helpful than generic "Something went wrong". Pass these to users.

## File Structure Decision: Keep Validator Separate from CLI

**Rule:** Separate validation logic (lib/validator.ts) from integration logic (lib/cli.ts). They have different concerns and testing requirements.

**Why:** Validator can be unit tested quickly (HTTPS check, format check). CLI wrapper requires framer-exporter installed and takes time. Separate = easier to maintain, test independently.

## Deployment Config: Set Explicit Timeouts, Don't Rely on Defaults

**Rule:** In vercel.json, explicitly set maxDuration: 60 and memory: 1024MB. Don't assume defaults.

**Why:** Vercel's default function timeout might be shorter than your actual need. 60 seconds is reasonable for export (typical: 5-10s, complex: 30-40s). If you don't set it, a slow export fails silently.

## Debugging Pattern: Test Headlessly When UI is Confusing

**Rule:** When frontend behavior seems wrong, test the API directly (curl, Postman) before debugging React state.

**Why:** During rate limit debugging, wasn't sure if API was returning 429 correctly. Testing directly: `curl -X POST http://localhost:3000/api/export` showed API was working fine. Issue was frontend state, not backend.

## Lesson: User Feedback on Edge Cases Changes Architecture

**Rule:** Real users testing edge cases (custom domains, rate limiting) expose assumptions in design. Listen carefully.

**Why:** User testing artone.studio (custom Framer domain) revealed the domain whitelist approach was fundamentally flawed. This feedback led to the better solution: accept all HTTPS URLs.
