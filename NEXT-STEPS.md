# Next Steps: Real-World Validation Strategy

## Current Status
- ✅ **Build gate green** (`npm run test:gate` passes)
- ✅ **Artifact preservation working** (--keep-temp, --output-dir flags added)
- ✅ **Offline testing infrastructure ready** (test-production-offline.mjs created)
- ❌ **No real Framer site validated yet** (blocker to unblock next)

## Recommended Path Forward (in order)

### Phase 1: Find One Small Real Test Site (THIS WEEK)
**Action:** Identify a published Framer template or demo with < 30 assets
- **NOT** boost.framer.website (309 assets, 71+ min crawl)
- Look for: Framer marketing templates, educational examples, or simple product sites
- Candidates to research:
  - Framer's own documentation/demo pages
  - Public Framer community templates under 50KB
  - Simple SaaS landing page built with Framer
  - Open-source Framer projects with <20 assets

**Success criteria:** Site crawls and materializes in < 2 minutes

### Phase 2: Test Full Pipeline on One Site (NEXT 2-3 DAYS)
**Workflow:**
```bash
# Step 1: Materialize clone with artifact preservation
node scripts/verify-materialized-export.mjs <SITE_URL> --output-dir=./fixtures/site-a

# Step 2: Inspect what we got
du -sh fixtures/site-a
ls -la fixtures/site-a/
cat fixtures/site-a/materialized-export.json  # Check asset stats

# Step 3: Test offline transform (no exporter needed)
npm run dev &
npm run test:offline ./fixtures/site-a/materialized-export.zip

# Step 4: If offline succeeds, test full E2E
npm run verify:production-build <SITE_URL>
```

**Expected outcomes:**
- ✅ Materialize succeeds → Move to offline test
- ✅ Offline test succeeds → Code generation works on real HTML
- ✅ Full E2E succeeds → Pipeline is solid
- ❌ Something fails → Classify error, fix, iterate

### Phase 3: Capture Reusable Fixtures (IF crawler is slow)
**Decision point:** If materializing takes > 2 min per site, do this:
```bash
# Save successful materialized clone as reusable fixture
cp -r fixtures/site-a /project/fixtures/archived/site-a
git commit -m "fixture: add reusable materialized clone for site-a"
```

**Benefit:** Future offline testing doesn't need the exporter/crawler
- Reduces 71min problem to 0min (pre-materialized)
- Enables parallel code generation testing
- Creates regression test data

### Phase 4: Classify & Fix Real-World Failures (AFTER success on one site)
Once one site succeeds, expect failures on the second/third site. Classify them:

| Failure Type | Example | Fix Location | Priority |
|---|---|---|---|
| Asset download | 404 on CDN URL | lib/export-source.ts | P1 |
| HTML malformation | Unclosed tags, invalid nesting | app/api/export-production | P1 |
| JSX generation | Invalid prop names, bad attributes | lib/generators/component-generator.ts | P1 |
| SVG handling | Unrecognized SVG elements | lib/generators/component-generator.ts | P2 |
| CSS mapping | Lost styles, selector issues | lib/generators/style-generator.ts | P2 |
| Type inference | Prop types wrong, missing types | lib/generators/component-generator.ts | P2 |

## Decision: Crawler Strategy

### Current: exporter (framer-exporter-core) from GitHub
- **Pros:** Official, comprehensive, handles real Framer internals
- **Cons:** Slow (71 min on large sites), external dependency, hard to debug
- **Status:** Keep for now, but with offline fallback

### Recommended: Dual-track approach
1. **Keep exporter** for real-world validation
2. **Use offline mode + reusable fixtures** for rapid iteration
3. **Document failure classes** from real sites
4. **Optimize only after** identifying bottlenecks with evidence

## Success Metrics for Next Milestone

**DONE when:**
- [ ] One small real Framer site materializes successfully (< 2 min)
- [ ] Offline transform on that site succeeds (generates valid Next.js code)
- [ ] Full E2E (clone → materialize → transform → build) succeeds
- [ ] Generated app builds without errors
- [ ] Synthetic test still passes (build gate green)
- [ ] Failure modes from real site are documented

## Timeline

| Phase | Duration | By When |
|---|---|---|
| Find small test site | 1 day | 2026-04-20 |
| Test on one site | 2-3 days | 2026-04-22 |
| Fix failures discovered | 2-5 days | 2026-04-25 |
| **Real-world validation complete** | **5-9 days** | **2026-04-25** |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Can't find a small site | Create synthetic Framer HTML using Framer design specs |
| Materialization times out | Use --keep-temp to save partial clone, debug offline |
| Code generation fails | Use test-production-offline.mjs to test without exporter |
| Build fails with unknown error | Check generated app dir (preserved in test-offline output) |

## Long-term Roadmap (After real-world validation)

1. ✅ Phase 1-4: Real-world validation (THIS SESSION)
2. Add 3-5 more test fixtures (different Framer site types)
3. Measure code coverage & semantic fidelity
4. Optimize crawler performance (71 min → 5 min)
5. Improve semantic naming (generic div → semantic component names)
6. Add SVG/icon optimization
7. Add Tailwind/CSS modernization
8. Generate web components as alternate output
9. Visual fidelity improvements (color accuracy, layout precision)
10. Batch export (multiple sites in one run)
