# E2E Testing Quick Start

## Structural Build Gate (Always Keep Green)
```bash
npm run test:gate
```
Validates code generation, Next.js scaffold, build reliability. **This is the minimum production requirement.**

---

## Real-World Validation Pipeline

Run these in order for a real Framer site. Artifacts preserved automatically when using `--keep-temp` or `--output-dir=`.

### 1. Clone & Extract
```bash
node scripts/verify-live-export.mjs <https-url> --keep-temp
```
Output: JSON report + preserved clone artifacts

### 2. Materialize Assets
```bash
node scripts/verify-materialized-export.mjs <https-url> --keep-temp
```
Output: JSON report + localized assets

### 3. Full End-to-End Build
```bash
# Requires: npm run dev (starts API server on port 3000)
node scripts/verify-production-build.mjs <https-url> --keep-temp
```
Output: Clone → generate → npm install → npm build verification

---

## Quick Example (using --output-dir for reuse)
```bash
TMPDIR=/tmp/test-site
mkdir -p $TMPDIR

# Stage 1: Clone
node scripts/verify-live-export.mjs https://example.framer.website --output-dir=$TMPDIR/stage1

# Stage 2: Materialize (reuse clone artifacts)
node scripts/verify-materialized-export.mjs https://example.framer.website --output-dir=$TMPDIR/stage2

# Stage 3: Build (if running dev server)
npm run dev &
node scripts/verify-production-build.mjs https://example.framer.website --output-dir=$TMPDIR/stage3
```

---

## Inspection
```bash
# List preserved artifacts
ls -la /tmp/framer-verify-* /tmp/framer-production-*

# View reports
cat /tmp/framer-verify-live-*/report.json | jq .
```

---

## Success Criteria
- **Phase 1**: `npm run test:gate` ✅ passes consistently
- **Phase 2**: Real site can complete stage 1 (clone) without timeout
- **Phase 3**: Real site can complete stage 2 (materialize)
- **Phase 4**: Generated app builds (`npm run build` succeeds)

Once all 4 pass, the pipeline is production-ready for that fixture.
