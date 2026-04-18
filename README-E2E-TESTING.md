# End-to-End Production Build Verification

This document explains how to verify that the generated Next.js app builds successfully from a cloned Framer site.

## Quick Start

Run this in two terminal windows:

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

### Phase B: Production Build Verification (IN PROGRESS)
- [ ] Code generation from semantic tree
- [ ] Component boundary detection
- [ ] JSX generation
- [ ] Project scaffolding
- [ ] Build without errors

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

## Next Steps

1. Run the E2E test to identify generation failures
2. Fix Stage 7 generation bugs
3. Add regression tests for each failure class
4. Measure code coverage and fidelity
