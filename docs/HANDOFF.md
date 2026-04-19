# Session Handoff - SVG & JSX Generation Fixes

**Date:** 2026-04-19 | **Status:** 3 blockers identified & fixed, 1 fix pending build+test

## Quick Summary

Real Framer site validation against `https://authentic-travelers-434120.framer.app/` revealed 3 critical code generation issues. Fixed 2, identified 3rd. All changes are in `lib/generators/component-generator.ts`.

## What's Done ✅

### Blocker #1: Invalid SVG Attributes (FIXED - COMMITTED)
- **Problem:** 75 components had `weight="regular"` on SVG `<g>` elements
- **Root Cause:** Icon library props (Phosphor) weren't filtered from native SVG elements
- **Fix:** Added `isValidSVGAttribute()` function + validation check in nodeToJSX
- **Commit:** `aa43c03` - "fix: filter invalid SVG attributes and fix text element mapping"
- **Evidence:** All 79 unit tests pass ✅

### Blocker #2: Text Element Mapping (FIXED - COMMITTED)
- **Problem:** `<text>` elements generated as-is, should convert to `<span>`
- **Root Cause:** `text` was in valid SVG elements set, blocking Framer text → span mapping
- **Fix:** Removed `text`/`tspan` from valid SVG in `isValidHTMLElement()`
- **Evidence:** Component generation test "should handle nested text element" passes ✅

## What's In Progress 🔧

### Blocker #3: JSX Curly Braces (PENDING BUILD+TEST)
- **Problem:** Literal `{` and `}` in text content create invalid JSX: `<span>{</span>`
- **Root Cause:** Framer exports literal curly braces that JSX interprets as expression syntax
- **Fix:** Added `escapeCurlyBraces()` function (needs to be wired into nodeToJSX)
- **Status:** Code written, needs build/test/validation
- **Error Location:** `A174.tsx:13:12 Expression expected`

## Files Modified

```
lib/generators/component-generator.ts
├── Lines 107-158: Added isValidSVGAttribute() function
├── Lines 162-170: Added escapeCurlyBraces() function  
├── Line 89: Removed 'text', 'tspan' from valid SVG elements
├── Line 192: Added isInvalidSVGAttr check in nodeToJSX
└── Lines 214-216: Placeholder for applying escapeCurlyBraces to text content
```

## How to Continue (Next Session)

### Step 1: Apply Curly Brace Escaping
In `nodeToJSX()` function, find where text content is added to output (~lines 238, 248, 260):

**Current Code (WRONG):**
```typescript
if (hasText && node.text) {
  contentParts.push(node.text.trim());
}
```

**Fixed Code:**
```typescript
if (hasText && node.text) {
  const escapedText = escapeCurlyBraces(node.text.trim());
  contentParts.push(escapedText);
}
```

Also fix single-line cases (~line 255):
```typescript
// BEFORE: return `<${elementTag}${attrString}>${node.text}</${elementTag}>`;
// AFTER:
return `<${elementTag}${attrString}>${escapeCurlyBraces(node.text)}</${elementTag}>`;
```

### Step 2: Validate
```bash
npm run build                    # Compile TypeScript
npm run test                     # Verify all tests pass
npm run test:gate               # Synthetic validation
npm run verify:production-build -- https://authentic-travelers-434120.framer.app/ --keep-temp
```

### Step 3: Commit
```bash
git add lib/generators/component-generator.ts
git commit -m "fix: escape literal curly braces in JSX text content"
```

### Step 4: Final Verdict
- ✅ If npm build passes → **GO** 🎉 (proceed to asset materialization improvements)
- ❌ If build fails → debug error and iterate

## Real-Site Validation Results

| Stage | Result | Time | Notes |
|-------|--------|------|-------|
| Clone | ✅ | 7.8s | 130 assets discovered |
| Materialize | ✅ | 26.9s | 97/130 downloaded (75% success) |
| Generate Code | ✅ | 19.6s | 732 components + 2 stylesheets |
| npm install | ✅ | 34s | No manual intervention needed |
| npm build | 🔄 | — | Blocked by JSX curly brace syntax |

## Key Learnings

1. **SVG vs HTML:** Icon library attributes (weight, mirrored) must be filtered for native SVG
2. **Ambiguous Elements:** `<text>` exists in both Framer elements & SVG - fix mapping order
3. **JSX Escaping:** Literal `{` and `}` in text need expression wrapping for valid JSX
4. **Test-Driven Fixes:** Unit tests caught issues before real-site validation

## Next Blockers (After This Resolves)

1. Asset materialization: 33/130 assets missing (25% loss)
2. Component fragmentation: 732 components for single page (over-decomposed?)
3. Fidelity comparison: Visual comparison to original Framer site

---

**Status:** Ready for next session to complete curly brace fix + final validation
