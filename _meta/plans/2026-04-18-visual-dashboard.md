# Visual Export Dashboard — Implementation Plan

## Context
The framer-exporter CLI already captures rich data at every step (crawl timing, asset counts, broken links, validation results, hidden content). Users want a visual HTML dashboard `dashboard.html` bundled inside the ZIP that shows what was exported, what issues were found, what libraries and components the site uses — all in one shareable, offline report.

## Architecture
1. **New `src/analyzer/framer-analyzer.js`** — Extracts Framer-specific metadata from crawled HTML (components, fonts, external services, publish date, generator version). Runs after crawl, before rewriting.
2. **New `src/dashboard/dashboard-generator.js`** — Accepts a single flat `report` object and renders a self-contained HTML string (no CDN deps — all CSS/JS inline).
3. **Modify `src/cli.js`** — Collect all data across all steps into one `report` object, pass to dashboard generator, write `dashboard.html`.
4. **Modify `src/packager/zip-builder.js`** — Update manifest notes to mention dashboard.

## Critical Files
- Create: `src/analyzer/framer-analyzer.js`
- Create: `src/dashboard/dashboard-generator.js`
- Create: `tests/dashboard.test.js`
- Modify: `src/cli.js`
- Modify: `src/packager/zip-builder.js`

## Data Available

### From existing modules
| Field | Source |
|-------|--------|
| `timing` (crawl/extract/rewrite/validate/total) | cli.js timers |
| `assets` (images/scripts/fonts/stylesheets/backgrounds) | AssetFinder |
| `brokenLinks[]`, `warnings[]` | ExportValidator |
| `hiddenElements[]`, `accordions[]`, `tabs[]`, `modals[]` | HiddenContentDetector |
| `totalSize`, `fileCount` | ExportValidator |

### From new framer-analyzer.js
| Field | How |
|-------|-----|
| `publishDate` | HTML comment `<!-- Published ... -->` |
| `generatorVersion` | `<meta name="generator" content="Framer {hash}">` |
| `siteTitle` | `<title>` tag |
| `components[]` | `data-framer-components` on `<body>`, split by space |
| `namedLayers[]` | All `data-framer-name` attribute values |
| `fonts[]` | `font-family` values from `@font-face` blocks in `<style>` |
| `externalServices[]` | Hostnames from all external `<script src>` and `<link href>` |
| `hasAnalytics` + `analyticsId` | Detect `googletagmanager.com` in scripts |
| `mediaTypes` | Count `.webp/.png/.svg/.mp4` references |
| `animationCount` | Count `data-framer-appear-id` attributes |

## framerInfo Shape
```js
{
  siteTitle: string,
  publishDate: string,
  generatorVersion: string,
  components: string[],
  namedLayers: string[],
  fonts: string[],
  externalServices: string[],
  hasAnalytics: boolean,
  analyticsId: string | null,
  mediaTypes: { webp: number, png: number, svg: number, mp4: number },
  animationCount: number,
}
```

## Dashboard Layout
```
┌─────────────────────────────────────────────────┐
│  EXPORT DASHBOARD                               │
│  daveos.fun · Exported Apr 18, 2026             │
│  ✅ Export Ready                                │
├─────────┬──────────┬────────────┬───────────────┤
│ 106     │ 241 KB   │ 3 Broken   │ 6.1s          │
│ Assets  │ Size     │ Links      │ Total Time    │
├─────────┴──────────┴────────────┴───────────────┤
│  ASSET BREAKDOWN                                │
│  Images (52) ████████░░  Scripts (8) ██░░       │
│  Fonts (12)  ████░░░░░░  Styles (4)  █░░░       │
├─────────────────────────────────────────────────┤
│  COMPONENTS (32 found)                          │
│  header-wrapper · loading-modal · overlay ...   │
├─────────────────────────────────────────────────┤
│  LIBRARIES & DEPENDENCIES                       │
│  Framer Runtime (f36d8c8) · Published Apr 5     │
│  Fonts: DM Sans · DM Mono · Inter               │
│  Analytics: G-52BG7CNKJ7 (Google Analytics)     │
├─────────────────────────────────────────────────┤
│  ISSUES (3)                                     │
│  ❌ images/hero.png — not found locally         │
│  ⚠️  3 broken links found                       │
├─────────────────────────────────────────────────┤
│  HIDDEN CONTENT                                 │
│  Loading Modal · Overlay (2 detected)           │
├─────────────────────────────────────────────────┤
│  PERFORMANCE                                    │
│  Crawl 6.1s · Extract 0.04s · ZIP 0.02s        │
└─────────────────────────────────────────────────┘
```

## Tasks

### Task 1: framer-analyzer.js (TDD)
Tests first → implement → pass.

### Task 2: dashboard-generator.js (TDD)
Self-contained HTML. Inline CSS (dark theme: `#1a1a2e` bg, `#4a90e2` accent). No CDN.

### Task 3: Modify cli.js
Collect full `report` object. Write `dashboard.html` after ZIP.
Log: `✅ Dashboard saved to dashboard.html`

### Task 4: Modify zip-builder.js
Update manifest notes: `"Open dashboard.html in a browser for the full export report."`

## Verification
```bash
node bin/framer-exporter export https://daveos.fun/ ./test-dash
cd test-dash && python3 -m http.server 9000
# Open http://localhost:9000/dashboard.html
npm test -- tests/dashboard.test.js
```
