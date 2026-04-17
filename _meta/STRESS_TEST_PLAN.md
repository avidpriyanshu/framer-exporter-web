# Framer Exporter - Stress Test & Edge Cases

## Test Strategy

### Category 1: Content Types
- [ ] **SPA (Single Page App)** - Site that renders everything in JS
- [ ] **Multi-page navigation** - Does it crawl all pages or just index?
- [ ] **Infinite scroll** - When does it stop crawling?
- [ ] **Heavy video content** - Download size, timeout
- [ ] **Canvas/WebGL** - Can it capture rendered output?

### Category 2: Dynamic Content
- [ ] **CSS-in-JS** (styled-components, emotion) - Runtime-generated CSS
- [ ] **Dark mode toggle** - Only one theme exported?
- [ ] **Modals/popovers** - Do we actually capture hidden content?
- [ ] **Lazy-loaded images** - srcset variants, webp
- [ ] **Form inputs** - Can we export form state?

### Category 3: Authentication
- [ ] **Public share link** vs **Login required** - Does exporter need auth?
- [ ] **Protected routes** - Can it access all pages?
- [ ] **Token expiry** - Does crawl timeout mid-way?

### Category 4: Performance & Scale
- [ ] **Timeout limits** - What's the max crawl time?
- [ ] **Memory usage** - How big can a site be?
- [ ] **Asset limits** - Max number of images?
- [ ] **URL complexity** - Query params, hash navigation

### Category 5: External Dependencies
- [ ] **External APIs** - Weather, crypto prices, real-time data
- [ ] **Tracking pixels** - Google Analytics, Facebook Pixel
- [ ] **Third-party embeds** - YouTube, Spotify, Tweets
- [ ] **CDN resources** - Can it handle CORS?
- [ ] **Webfonts** - From Google Fonts vs Custom hosts

### Category 6: Browser-Specific
- [ ] **Viewport-specific content** - Mobile menu that doesn't appear on desktop
- [ ] **Touch-only interactions** - Swipe gestures
- [ ] **Geolocation** - Location-based content
- [ ] **Device sensor APIs** - Accelerometer, camera

### Category 7: Export Quality
- [ ] **Broken link count accuracy** - False positives/negatives?
- [ ] **Asset deduplication** - Same asset imported twice?
- [ ] **CSS minification** - Can we strip unused CSS?
- [ ] **ZIP integrity** - Does it extract cleanly?
- [ ] **Mobile responsiveness** - Do responsive images work?

### Category 8: Known Limitations
- [ ] **Redirects** - What if page 301 redirects?
- [ ] **Authentication cookies** - Session-dependent content
- [ ] **Rate limiting** - What if server throttles?
- [ ] **Bot detection** - Can it bypass CloudFlare, DDoS protection?
- [ ] **JavaScript frameworks** - React, Vue, Svelte rendering

---

## Test Sites to Try

### Easy (Should work)
- [ ] Static Framer site
- [ ] Framer with basic animations
- [ ] Framer with embedded components

### Medium (Might fail)
- [ ] Framer with dark mode toggle
- [ ] Framer with forms
- [ ] Framer with external embeds

### Hard (Likely to fail)
- [ ] Framer with real-time data (WebSocket)
- [ ] Framer with authentication required
- [ ] Framer with heavy JS interactivity

### Extreme (Will definitely break)
- [ ] Site behind login
- [ ] Site with infinite scroll
- [ ] Site with CAPTCHA
- [ ] Site with geolocation checks
- [ ] SPA with client-side routing

---

## Failure Scenarios to Document

### Current Known Issues:
1. ⚠️ **5 broken links per site** - Why? (external URLs? dynamic?)
2. ⚠️ **Multi-page sites** - Only exports first page?
3. ⚠️ **Webdriver detection** - Our bypass may fail on hardened sites
4. ⚠️ **Large sites** - Timeout after 30s (what if site needs 60s?)
5. ⚠️ **Hidden content** - Only expands first 10 interactive elements

### To Test:
1. **Can we export a site with 5+ pages?**
2. **Can we capture a modal that requires clicking?**
3. **Can we handle a site that loads 1000 images?**
4. **Can we export a form that connects to backend?**
5. **Can we handle authentication redirects?**

---

## Performance Benchmarks

Current (baseline):
- Average crawl time: 15 seconds
- Average assets found: 106
- Average export size: 316 KB
- ZIP compression: ~85%

To measure:
- How does crawl time scale with asset count?
- How does ZIP size scale with image count?
- Memory usage during crawl
- Concurrent site export limits

---

## Edge Cases That Will Break Us

### Definitely Broken:
1. **WebSocket sites** - Real-time data can't be exported
2. **Login-required sites** - No auth credentials
3. **Sites using localStorage/sessionStorage** - State can't be preserved
4. **Sites with geolocation checks** - Can't spoof location
5. **Infinite scroll with API pagination** - Never finishes

### Probably Broken:
1. **CSS-in-JS** - Runtime styles might not load
2. **Heavy React/Vue SPAs** - Takes >30s to render
3. **Sites with third-party tracking** - Broken links
4. **Multi-domain assets** - CORS issues
5. **Dynamically generated sitemaps** - Can't find all pages

### Might Be Broken:
1. **Dark mode sites** - Only exports light/dark mode
2. **Sites with feature flags** - May export wrong variation
3. **Internationalized sites** - Only exports default locale
4. **Dynamic meta tags** - Open Graph might not be captured
5. **Sites with service workers** - May cache wrong version

---

## Test Command Template

```bash
# Test a problematic site
node bin/framer-exporter export [URL] ./test-[NAME]

# Check what was captured
unzip -l test-[NAME]/test-[NAME].zip

# Start local server
cd test-[NAME]
python3 -m http.server 9000

# Verify in browser
# http://localhost:9000
```

---

## What We'll Learn

By stress testing, we'll identify:
1. **Where the 30s timeout hits** (sites needing longer crawl)
2. **What breaks the asset extractor** (edge case file types)
3. **What fools the URL rewriter** (complex URL patterns)
4. **What fails the validator** (false positive broken links)
5. **What ZIPs won't recreate** (truly dynamic content)

This will show us:
- Real limitations vs fixable bugs
- What needs architectural changes
- What's fundamentally impossible for static export
- Where to add better error messages
