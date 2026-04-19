# PRODUCTION DEPLOYMENT: NEXT SESSION PROMPT

## STATUS
- **Phase B**: Production Build Verification (80% complete)
- **Build Gate**: `npm run test:gate` ✅ PASSING
- **Real-World Validation**: In progress on cv.framer.website
- **Critical Blocker**: Stage 5 (npm build) success on real Framer sites

## WHAT'S BEEN DONE

1. **Synthetic regression test** — permanent CI gate, always green
2. **Real-world fixture** — cv.framer.website (fast, 3-5s crawl)
3. **Framer metadata filter** — removes invalid HTML attributes (commit 30b6bf9)
4. **Artifact preservation** — `--keep-temp` and `--output-dir` flags
5. **Offline testing** — rapid iteration without 71-min crawl

## WHAT NEEDS TO HAPPEN NEXT

### STEP 1: Verify the metadata filter fix (CRITICAL)
```bash
npm run dev &
node scripts/verify-production-build.mjs https://cv.framer.website/
```

**Expected:** ✅ All stages passed
**If fails:** Identify new Stage 7 error, fix it, re-test

### STEP 2: Expand real-world validation (IF STEP 1 PASSES)
Test on 2-3 more small Framer sites to confirm reliability:
- portfolio.framer.website (medium)
- landing.framer.website (simple)
- Other simple published Framer sites

### STEP 3: Document & deploy (IF STEPS 1-2 PASS)
1. Create PRODUCTION-READY.md with:
   - Supported Framer sites (by complexity/size)
   - Known limitations (Phase C features not included)
   - Deployment instructions
2. Add CI/CD (optional but recommended):
   - GitHub Actions to run `npm run test:gate` on every commit
   - Run real-world validation tests weekly
3. Create deployment docs for hosting the API

## PRODUCTION READINESS CRITERIA

✅ = DONE, ⏳ = PENDING

- [x] Synthetic regression gate (npm run test:gate)
- [x] Real-world test fixture identified (cv.framer.website)
- [x] Stage 7 code generation fixes (metadata filtering)
- [x] Artifact preservation for debugging
- [x] Offline testing infrastructure
- ⏳ Stage 5 build succeeds on real sites (critical blocker)
- ⏳ 2-3 real sites validated end-to-end
- ⏳ Production deployment documentation
- ⏳ CI/CD pipeline (optional)

## WHAT "PRODUCTION READY" MEANS

✅ The API can reliably:
1. Clone a Framer site (Stage 1)
2. Materialize assets locally (Stage 2)
3. Generate Next.js code from the clone (Stage 3)
4. Build a production Next.js app (Stage 5)

❌ Does NOT include (Phase C work):
- Visual/semantic accuracy
- Animation preservation
- Custom component handling
- 100% asset fidelity

## COMMANDS FOR NEXT SESSION

```bash
# Test synthetic gate (must pass)
npm run test:gate

# Test real-world build
npm run dev &
node scripts/verify-production-build.mjs https://cv.framer.website/

# If online test fails, debug offline
npm run dev &
npm run test:offline ./path/to/materialized-export.zip

# Preserve artifacts for debugging
node scripts/verify-materialized-export.mjs https://cv.framer.website/ --keep-temp
```

## KEY FILES

- `lib/generators/component-generator.ts` — Stage 7 code generation (metadata filter added)
- `scripts/test-stage-7-synthetic.mjs` — Regression gate
- `scripts/test-production-offline.mjs` — Offline validation
- `scripts/verify-production-build.mjs` — Full E2E pipeline
- `package.json` — Scripts: test:gate, test:offline, verify:production-build

## TIMELINE TO PRODUCTION

- **Today**: Confirm metadata filter fix (Step 1)
- **2-3 days**: Test on 2-3 real sites (Step 2)
- **3-5 days**: Deploy + document (Step 3)

---

**Next prompt should start with:**
"Check if cv.framer.website builds successfully now with the Framer metadata filter fix. If yes, expand to other test sites and prepare deployment. If no, identify the Stage 7 error and fix it."
