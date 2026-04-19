# End-to-End Production Build Verification

This document explains how to verify that the generated Next.js app builds successfully from a cloned Framer site.

## Quick Reference

**Synthetic Stage 7 regression test** (stable, no external dependencies):
```bash
npm run test:stage-7-synthetic
```

**Full E2E test** (requires real Framer site):
```bash
npm run dev &          # Terminal 1
npm run verify:materialized-export https://boost.framer.website/
```

## Quick Start

Run this in two terminal windows (for real-site testing):

**Terminal 1: Start the API server**
```bash
npm run dev
```

**Terminal 2: Run the production build test**
```bash
node scripts/verify-production-build.mjs https://boost.framer.website/
```

## What This Tests

The E2E test verifies the complete pipeline:

1. **Clone & Materialize**: Downloads 309 assets from the source site
2. **Production Transform**: Generates Next.js code from the materialized clone
3. **Unzip & Extract**: Extracts the generated project
4. **npm install**: Installs project dependencies
5. **npm run build**: Builds the production Next.js app

## Test Sites

Tested with:
- `https://boost.framer.website/` - Framer template site with real components

## Success Criteria

The test passes when:
- ✅ Assets are materialized (192+ files downloaded)
- ✅ Production code is generated
- ✅ Generated app has valid package.json and tsconfig.json
- ✅ npm install completes without errors
- ✅ npm run build succeeds

## Expected Output

```
📋 Production Build Verification
================================

URL: https://boost.framer.website/
Test dir: /tmp/.../framer-production-test-XXX

📥 Stage 1: Clone & Materialize Assets
--------------------------------------
✓ Clone completed in XXms
  - Discovered: 309 assets
  - Downloaded: 192 assets
  - Failed: 1 assets

📦 Stage 3: Extract Generated App
---------------------------------
✓ Extracted to /tmp/.../framer-production-test-XXX/generated-app
  - Pages: 1
  - Components: 12
  - Styles: 3

📥 Stage 4: npm install
----------------------
Running: npm install...
✓ npm install completed in XXms

🏗️  Stage 5: npm run build
-----------------------
Running: npm run build...
✓ npm run build completed in XXms

✅ All stages passed!

Generated app is production-ready.
You can inspect it at: /tmp/.../framer-production-test-XXX/generated-app
```

## Troubleshooting

### "Export URL is not available"
Make sure the API server is running: `npm run dev`

### "npm install failed"
Check that Node.js and npm are installed:
```bash
node --version   # Should be 18+
npm --version    # Should be 9+
```

### "npm run build failed"
The generated Next.js code has issues. Check:
1. Invalid JSX syntax
2. Bad React attribute names
3. Missing imports
4. Broken prop types

## Pipeline Phases

### Phase A: Clone Verification (DONE ✅)
- [x] Raw clone from upstream exporter
- [x] Asset materialization (192/309)
- [x] HTML reference rewriting
- [x] Zip rebuild without self-references

### Phase B: Production Build Verification (STRUCTURALLY VERIFIED ✅)
- [x] Code generation from semantic tree
- [x] Component boundary detection
- [x] JSX generation
- [x] Project scaffolding
- [x] Build without errors (verified on synthetic fixture)
- [ ] Real-world validation on multiple Framer sites

### Phase C: Quality Improvements (TODO)
- [ ] Semantic naming improvements
- [ ] SVG/icon handling
- [ ] Tailwind/CSS mapping
- [ ] Web component generation
- [ ] Visual fidelity improvements

## Files Involved

- `scripts/verify-production-build.mjs` - Full E2E test runner
- `scripts/test-generation-offline.mjs` - Clone & materialization test
- `lib/export-source.ts` - Clone & materialization logic
- `app/api/export-production/route.ts` - API endpoint
- `lib/pipeline/stages/7-code-generator.ts` - Code generation
- `lib/generators/component-generator.ts` - JSX generation
- `lib/generators/validator.ts` - Code validation

## Synthetic Stage 7 Test (Structural Validation)

**Purpose:** Validate code generation, JSX indentation, and Next.js build reliability WITHOUT external dependencies.

**What it tests:**
- JSX generation from mock SemanticTreeNode data
- SVG element handling
- Component props inference
- Next.js project scaffolding
- TypeScript compilation
- Production build success

**What it does NOT test:**
- Real Framer site crawling/cloning
- Asset materialization
- Real semantic naming
- Visual fidelity
- Complex nested structures from production sites

**Run it:**
```bash
npm run test:stage-7-synthetic
```

**Expected output:**
```
✅ All stages passed!
Generated app built successfully.
```

This test is a permanent regression gate. If it fails, Stage 7 code generation has regressed.

## Real-World Validation

Once the synthetic test passes, validate against actual Framer sites:

1. Start with small, simple published Framer pages (fewer assets, minimal animations)
2. Run the full E2E pipeline to identify Stage 1-7 failure points
3. Fix issues discovered in real-world contexts
4. Gradually expand fixture set to larger/more complex sites

## Next Steps

1. ✅ Establish synthetic Stage 7 regression test
2. Find 1-3 smaller real Framer fixtures to test
3. Run full E2E pipeline on each
4. Classify and fix Stage 1-7 failures discovered
5. Measure code coverage and fidelity improvements
