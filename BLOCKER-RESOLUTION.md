# Blocker Resolution: Real-World Framer Export Validation

## Current State (as of 2026-04-19)

### ✅ What's Working
- **Build Gate**: Synthetic Stage 7 test passes (npm run test:gate)
  - Code generation, JSX, SVG handling, Next.js scaffolding, production build all verified
  - Structural validation proves code generation pipeline is solid
  - This is the **official regression gate** and must stay green
  
- **Clone & Materialization**: Code exists and works on controlled inputs
  - `lib/export-source.ts` has full pipeline
  - Asset discovery and downloading implemented
  - HTML rewriting for local assets implemented

- **Production Transform**: API endpoint exists and generates code from HTML
  - `app/api/export-production/route.ts` handles the transformation
  - Tested indirectly through synthetic test

### ❌ What's Blocked
1. **Real-world validation hasn't happened yet**
   - No actual Framer site has been successfully processed through the full pipeline
   - boost.framer.website takes 71+ minutes to crawl (too slow for iteration)
   - No small test fixture selected yet

2. **Artifact preservation was missing**
   - verify-live-export.mjs deleted temp dirs on error
   - verify-materialized-export.mjs deleted temp dirs on error
   - Made debugging impossible when something failed
   - ✅ **FIXED** - added `--keep-temp` and `--output-dir` flags

3. **Offline testing was impossible**
   - Production build script required the exporter + API server every time
   - No way to test code generation without 10+ minute crawl
   - ✅ **FIXED** - added `test-production-offline.mjs` for offline transform testing

## The Next Milestone

**Goal:** At least one real small Framer site goes through the full pipeline (clone → materialize → generate → build) with the synthetic test remaining green.

### Step 2a: Identify a Small Real Test Site (NEXT)
**Options:**
- Find a public Framer template/demo page with minimal assets
- Use a published Framer project that's intentionally simple
- Create a lightweight synthetic site using Framer's API

**Why:** boost.framer.website has 309 assets and takes 71 minutes. We need something < 30 assets and < 2 minutes to iterate quickly.

### Step 2b: Test Pipeline (After identifying site)
```bash
# 1. Materialize the clone (downloads assets locally)
node scripts/verify-materialized-export.mjs <URL> --keep-temp --output-dir=./fixtures/test-site

# 2. Inspect the materialized output
ls fixtures/test-site/

# 3. Test offline transform
node scripts/test-production-offline.mjs ./fixtures/test-site/materialized-export.zip

# 4. If API is running, test full E2E
npm run dev &
node scripts/verify-production-build.mjs <URL>
```

### Step 2c: Identify Failure Classes (When real site fails)
When a real site hits a failure, classify it:
- **Stage 1 (Clone)**: Exporter error, missing HTML, bad manifest
- **Stage 2 (Materialize)**: Asset download failures, URL rewriting issues, zip rebuild errors
- **Stage 3 (Transform)**: API error, semantic tree generation failure
- **Stage 4 (Code Gen)**: Invalid JSX, bad props, nesting issues, SVG problems
- **Stage 5 (Build)**: npm install error, TypeScript compilation error, Next.js config error

Document the failure, fix the smallest root cause, test again.

## Files Changed in This Session

1. **scripts/verify-live-export.mjs**
   - Added `--keep-temp` flag
   - Added `--output-dir=<path>` flag
   - Ensures temp dir is preserved on error

2. **scripts/verify-materialized-export.mjs**
   - Added `--keep-temp` flag
   - Added `--output-dir=<path>` flag
   - Ensures temp dir is preserved on error

3. **scripts/test-production-offline.mjs** (NEW)
   - Takes a pre-materialized ZIP and tests transform → code gen → build
   - Does NOT require the exporter to be running
   - Useful for iterating on code generation without crawl overhead

4. **scripts/verify-production-build.mjs**
   - Updated to use `--output-dir` for materials (preserves them)

5. **package.json**
   - Added `test:gate` shorthand for `test:stage-7-synthetic`
   - Added `test:offline` for offline testing
   - Added `verify:production-build` explicit script

## Verification Commands

**Official Build Gate (MUST STAY GREEN):**
```bash
npm run test:gate
```

**Artifact Preservation (Step 1 - COMPLETE):**
```bash
# Keep materialized assets for inspection
node scripts/verify-materialized-export.mjs <URL> --keep-temp

# Or specify output directory
node scripts/verify-materialized-export.mjs <URL> --output-dir=/tmp/my-test-site
```

**Offline Transform Testing (Step 2b):**
```bash
npm run dev &  # Terminal 1
node scripts/test-production-offline.mjs <path-to-zip>  # Terminal 2
```

## What Remains

### Immediate (this session)
1. ✅ Step 1: Make debugging practical (artifact preservation)
2. TODO: Step 2: Find/create a small real Framer test site
3. TODO: Step 3: Run the full pipeline on one real site
4. TODO: Classify and fix failures discovered

### After Real-World Validation
1. Fix discovered failure classes (JSX, nesting, assets, etc.)
2. Expand to 3-5 real test sites
3. Optimize crawler performance (71 min → 5 min goal)
4. Add quality metrics (code coverage, fidelity)
5. Document semantic naming improvements

## Critical Constraints (Don't violate)
- Do NOT start visual fidelity work yet
- Do NOT claim production readiness
- Do NOT keep rerunning a 71-minute crawl without artifact preservation
- Use evidence over guesses
- Build gate must stay green
