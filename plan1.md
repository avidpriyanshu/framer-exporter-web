Current Findings

  These are already verified and should be preserved as context for the next
  LLM:

  - The repo originally had two disconnected flows:
      - app/api/export/route.ts used the upstream framer-exporter CLI
      - app/api/export-production/route.ts fetched live HTML directly and
        skipped the clone artifact
  - I changed app/api/export-production/route.ts to use a shared clone-first
    helper:
      - app/api/export-production/route.ts:1
      - lib/export-source.ts:1
  - I added:
      - lib/export-source.test.ts:1
      - scripts/verify-live-export.mjs:1
      - scripts/verify-materialized-export.mjs:1
  - Live baseline against https://boost.framer.website/ showed the upstream e
    xporter is incomplete:
      - it reports 309 assets found
      - but the raw zip only contains MANIFEST.json, index.html, and the zip
        itself
      - no local images/, css/, or js/
  - Root cause found in upstream package:
      - node_modules/framer-exporter/src/extractor/asset-finder.js only
        discovers assets
      - node_modules/framer-exporter/src/extractor/url-rewriter.js only
        rewrites URLs if local files already exist
      - node_modules/framer-exporter/src/cli.js never downloads those assets

  That means the first blocker is raw clone completeness, not Tailwind/web
  components/React polish.

  ———

  Full Test Plan

  Phase 0: Repo Health Check

  Purpose: avoid confusing pre-existing repo failures with pipeline failures.

  Run:

  - npm test
  - npx jest lib/export-source.test.ts app/api/export/route.test.ts lib/
    pipeline/__tests__/stage-7-integration.test.ts --runInBand
  - npx tsc --noEmit

  Expected:

  - targeted clone-first tests should pass
  - note any unrelated existing failures separately

  Known existing unrelated failures already seen:

  - lib/generators/__tests__/validation.test.ts
  - lib/generators/__tests__/component-generation.test.ts type issues

  Rule:

  - do not mix these with export-pipeline bugs

  ———

  Phase 1: Raw Clone Baseline

  Purpose: determine whether the upstream clone is actually self-contained
  before transformation.

  Use representative real sites:

  - https://boost.framer.website/
  - add 2 more published Framer sites with different structure:
      - one simple landing page
      - one multi-section/template-heavy page

  Run for each:

  - npm run verify:live-export -- <url>

  Validate:

  - zip exists
  - zip contains:
      - index.html
      - local images/
      - local css/
      - local js/
  - manifest is truthful
  - asset count in zip roughly matches discovered asset count
  - index.html references local asset paths, not remote CDN URLs
  - zip should not contain itself recursively

  Current expected result:

  - this phase currently fails on asset completeness for upstream raw export

  Pass criteria:

  - raw export zip is self-contained enough to open offline with major assets
    present

  Fail criteria:

  - zip contains only html and manifest
  - assets are still remote
  - zip includes itself
  - manifest claims local assets that do not exist

  ———

  Phase 2: Materialized Clone Verification

  Purpose: validate the new post-clone asset materialization logic.

  Run:

  - npm run verify:materialized-export -- <url>

  Validate:

  - resulting zip contains actual entries under:
      - images/
      - css/
      - js/
  - report shows:
      - materializedAssets.discovered
      - materializedAssets.downloaded
      - materializedAssets.failed
  - downloaded should be significantly greater than 0
  - index.html should reference local asset files
  - rebuilt zip must not contain nested .zip files

  Pass criteria:

  - local assets are present in zip
  - assetEntries > 0
  - HTML is rewritten to local paths
  - zip is structurally sane

  Important:

  - if this still fails, inspect:
      - asset URL normalization
      - fetch failures
      - stylesheet/font nested URL rewriting
      - filename collision handling

  ———

  Phase 3: Raw Clone Runtime Verification

  Purpose: prove the cloned site actually loads, not just that files exist.

  For each site:

  1. unzip the raw or materialized clone
  2. serve it locally with a static server
  3. open in a browser
  4. inspect runtime behavior

  Validate:

  - page loads without fatal console errors
  - stylesheets load
  - scripts load
  - images render
  - no obvious blank sections due to missing assets
  - broken link count is recorded, but not confused with missing assets

  Metrics to record:

  - first visible render works: yes/no
  - console errors count
  - network 404 count
  - missing image count
  - missing css/js count

  Pass criteria:

  - homepage is visibly correct enough to confirm clone viability
  - no catastrophic missing-asset failure

  ———

  Phase 4: Production Transform Verification

  Purpose: verify the Next.js export generated from the clone-first path.

  Use the canonical production route or the equivalent helper path.

  For each representative site:

  1. generate production export
  2. unzip the generated app
  3. run:
      - npm install
      - npm run build
      - npm run dev
  4. inspect errors

  Validate:

  - install completes
  - next build passes
  - no TypeScript generation errors
  - no syntax errors in generated components
  - pages and components are emitted as expected
  - tokens file exists
  - global styles and config files exist

  Pass criteria:

  - generated project builds cleanly on all representative fixtures

  Fail classes to categorize:

  - invalid JSX
  - invalid React attribute names
  - invalid HTML tag mapping
  - bad string escaping in JSX
  - malformed props/interfaces
  - broken import paths
  - invalid Next.js scaffold output

  ———

  Phase 5: Component and Code Quality Verification

  Purpose: ensure generated code is understandable and reusable, not just
  buildable.

  Validate:

  - component names are semantic, not junk names like Div627
  - repeated patterns become shared components
  - props are inferred cleanly
  - no giant monolithic component when reuse is obvious
  - no impossible or meaningless web component wrappers

  Checks:

  - inspect top 20 generated components by importance
  - compare repeated sections to verify deduplication
  - inspect prop signatures
  - inspect directory structure

  Pass criteria:

  - major reusable elements are named meaningfully
  - generated component boundaries make sense to a developer

  ———

  Phase 6: Style System Verification

  Purpose: validate Tailwind/CSS/token behavior.

  Validate:

  - Tailwind-mapped classes are valid
  - unsupported styles fall back to CSS modules or equivalent
  - styles/tokens.json exists and is coherent
  - CSS variables are generated
  - editing tokens can change output theme predictably
  - no obviously duplicated or conflicting style systems

  Checks:

  - inspect globals.css
  - inspect generated component styles
  - inspect Tailwind config/theme wiring
  - test one token change and rebuild

  Pass criteria:

  - style system is coherent and customizable
  - no broken visual output caused by class mapping mistakes

  ———

  Phase 7: SVG/Icon/Asset Fidelity Verification

  Purpose: verify non-text assets are handled properly.

  Validate:

  - inline SVGs survive export
  - image assets render
  - icons are not dropped or rewritten incorrectly
  - background images in inline styles and stylesheets are localized and
    rendered
  - fonts load if downloaded locally

  Pass criteria:

  - major iconography and imagery are preserved
  - no widespread broken visual placeholders

  ———

  Phase 8: Visual Fidelity Verification

  Purpose: compare generated app against original live site.

  For each representative site:

  1. capture screenshots of original live page
  2. capture screenshots of:
      - raw clone
      - generated Next.js app
  3. compare section by section

  Validate:

  - layout hierarchy
  - spacing
  - typography
  - colors
  - imagery
  - alignment
  - major CTA/button treatment

  Metrics:

  - qualitative section score
  - overall fidelity target:
      - raw clone should be high enough to confirm source capture
      - generated app should target 95%+
  - record unsupported areas explicitly:
      - Framer animations
      - proprietary interactions
      - embedded widgets
      - advanced effects

  Pass criteria:

  - generated output is close enough to original to be useful for handoff/
    prototyping

  ———

  Phase 9: Regression Fixture Suite

  Purpose: prevent future breakage.

  Create a fixture set with:

  - raw clone zip
  - materialized clone zip
  - generated Next.js app output
  - screenshot baselines
  - structured JSON verification report

  For each fixture, automate:

  - zip structure check
  - asset count check
  - index.html local-reference check
  - npm build check on generated app
  - optional screenshot diff

  This should become the permanent release gate.

  ———

  Phase 10: Release Gate

  No “production-ready” claim unless all of this is true:

  - raw clone is self-contained for representative sites
  - materialized clone contains local assets
  - generated Next.js app builds cleanly
  - TypeScript generation errors are zero on the tested fixtures
  - semantic naming is acceptable on major components
  - visual fidelity is measured, not guessed
  - known unsupported cases are documented precisely

  ———

  Concrete Commands

  Baseline raw exporter:

  npm run verify:live-export -- https://boost.framer.website/

  Materialized clone verification:

  npm run verify:materialized-export -- https://boost.framer.website/

  Targeted regression tests:
  pipeline/__tests__/stage-7-integration.test.ts --runInBand

  Full suite:

  npm test
  npx tsc --noEmit

  ———

  Recommended Immediate Next Work

  The next LLM should do this in order:

  1. Finish and validate the post-clone asset materialization flow.
  2. Prove verify:materialized-export yields real local assets in the zip.
  3. Make /api/export and /api/export-production converge on the same clone-
     first artifact path.
  4. Only then start fixing Stage 7 generation failures on top of that stable
     source.

  If you want, I can also write this as a compact machine-oriented handoff
  prompt for the next LLM.