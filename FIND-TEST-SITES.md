# Finding Small Framer Test Sites

## Quick Search Strategies

### 1. Official Framer Templates (easiest, starting point)
```bash
# Search site:framer.com for simple demo pages
# https://www.google.com/search?q=site:framer.com example portfolio
```

**Look for:**
- Framer's own demo pages (usually under 50KB HTML, 10-20 assets)
- Beginner templates (intentionally kept simple)
- Educational examples with step-by-step guides

**Examples to try:**
- https://framer.com/templates/  (click through demos)
- Framer community gallery (often links to smaller projects)
- Framer blog posts with live examples

### 2. Identify Characteristics of "Small"
- **HTML size:** < 100KB (not minified)
- **Asset count:** < 30 files (images, CSS, JS, fonts)
- **Structure:** 1-3 pages max
- **Dynamic elements:** Minimal (no complex animations, real-time data)

**Check with curl:**
```bash
curl -s https://example.framer.website/ | wc -c  # HTML size in bytes
# < 100000 bytes = good
```

### 3. Fast Sites to Test (suggestions)
These are hypothetical - verify actual asset counts before committing to them:

| URL | Estimated Size | Est. Crawl Time | Notes |
|---|---|---|---|
| https://framer.com/templates/ | ~50KB | < 1 min | Framer's template gallery |
| Any Framer template demo | ~100KB | < 1 min | Click "View Demo" |
| Example SaaS landing | ~150KB | < 2 min | Product page, no auth |
| Portfolio template | ~80KB | < 1 min | Simple showcase |

### 4. How to Verify Before Committing
```bash
# 1. Check HTML size
curl -s <URL> 2>/dev/null | head -c 1000 | wc -c

# 2. Count external assets mentioned in HTML
curl -s <URL> 2>/dev/null | grep -o 'src="[^"]*"' | wc -l

# 3. Run with timeout to see crawl speed
timeout 30 node scripts/verify-materialized-export.mjs <URL> --keep-temp

# If finishes in < 30 sec, it's a good candidate
```

### 5. Create Your Own Minimal Test Site (if needed)
If you can't find a small public site:

1. Create a minimal Framer project:
   - Single page
   - 3-5 components (Button, Card, etc.)
   - 1-2 images
   - Basic CSS

2. Publish to Framer (free tier)

3. Use as test fixture

This guarantees small, controlled, reproducible test case.

## What to Do When You Find One

```bash
# 1. Verify it works
node scripts/verify-materialized-export.mjs <URL> --keep-temp

# 2. Save the output
OUTPUT=$(node scripts/verify-materialized-export.mjs <URL> --output-dir=/tmp/test-site 2>&1 | grep tempDir | cut -d'"' -f4)

# 3. Note the stats
cat /tmp/test-site/*.json

# 4. Archive for future use
cp -r /tmp/test-site ~/projects/framer-exporter/fixtures/test-site-1
```

## Success Criteria

Site is "good to test" when:
- [ ] Materializes in < 2 minutes
- [ ] Has 10-50 assets
- [ ] No timeout errors
- [ ] HTML is valid (contains DOCTYPE, body, etc.)
- [ ] At least one image (to test asset materialization)

## Red Flags (Sites to Skip)

- **Takes > 5 min to materialize** → Too heavy for iteration
- **Has < 5 assets** → Too simple to catch real bugs
- **Requires login/auth** → Can't crawl authenticated content
- **Dynamic (loads via JS)** → Exporter might not capture real DOM
- **Heavy animations** → Likely complex semantic tree (harder to debug)
