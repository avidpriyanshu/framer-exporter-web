# Iteration Checklist

## Project Goal
- [ ] Real Framer site can complete: clone → materialize → generate → npm build

## Current Iteration Goal
- [ ] Fix SVG attribute generation so real-site export compiles

## Known Blockers
- [x] Invalid `weight` prop emitted on native SVG `<g>` elements (FIXED)
- [x] `<text>` elements not converting to `<span>` (FIXED)
- [ ] Literal curly braces in text content cause JSX syntax errors (IN PROGRESS)
- [ ] Asset materialization only ~75% complete (SECONDARY)

## Task Breakdown

### Task 1: Locate SVG generation source
- [ ] Find where native SVG props are emitted in framer-exporter-core
- [ ] Identify why `weight="regular"` is preserved from Phosphor icons
- [ ] Confirm code path for SVG element generation

### Task 2: Implement fix
- [ ] Remove unsupported props (`weight`, `mirrored`, etc.) from native SVG elements
- [ ] Preserve valid SVG attributes (viewBox, xmlns, etc.)
- [ ] Add regression test for SVG props filtering

### Task 3: Re-validate
- [ ] Run synthetic structural gate
- [ ] Run real-site production build validation on https://authentic-travelers-434120.framer.app/
- [ ] Confirm `npm build` passes

## New Tasks Discovered During Iteration
- (none yet)

## Evidence / Notes

### Validation Run #1 (2026-04-19 03:40)
**Real Site:** https://authentic-travelers-434120.framer.app/
**Result:** npm build FAILED
**Error Location:** ./components/A103.tsx:17:84
**Error Details:** 
```
Type error: Type '{ children: Element; color: string; weight: string; }' 
is not assignable to type 'SVGProps<SVGGElement>'.
Property 'weight' does not exist on type 'SVGProps<SVGGElement>'.
```
**Scope:** 75 components affected with `weight="regular"` on `<g>` elements
**Artifacts:** /var/folders/js/4m4nrg9s1_vcs0qd6pr82mf00000gn/T/framer-production-test-ajEZbx

### Code Example (A103.tsx line 17)
```tsx
<g color="var(...)" weight="regular">  {/* ❌ invalid */}
  <path d="M200,64V168..."></path>
</g>
```

## Iteration Log

### Iteration 1: Fix SVG & Text Element Generation + Curly Brace Escaping
- **Goal:** Fix invalid `weight` attribute, `<text>` to `<span>` conversion, and JSX curly brace syntax
- **Status:** HANDOFF - 3 fixes committed, curly brace escape needs build & test
- **Changes made:**
  1. ✅ Added `isValidSVGAttribute()` function to filter icon library attrs (weight, mirrored, size, color)
  2. ✅ Updated nodeToJSX to validate SVG attributes with `isInvalidSVGAttr` check
  3. ✅ Fixed isValidHTMLElement to exclude 'text'/'tspan' from valid SVG list (allow Framer text mapping)
  4. ✅ Text elements correctly map to 'span' via mapInvalidElement()
  5. 🔧 Added escapeCurlyBraces() function to escape literal { } in JSX text content
     - Converts `{` to `{'{'}`  and `}` to `{'}'}` for valid JSX
- **Files changed:** `lib/generators/component-generator.ts`
- **Test results:** 
  - ✅ All 79 component generation tests pass
  - ✅ SVG weight attribute filtering verified
  - ✅ Text to span conversion verified
- **Commits:**
  - `aa43c03` - "fix: filter invalid SVG attributes and fix text element mapping"
  - (curly brace fix needs commit - see "To Continue" section below)
- **Last Real-Site Error:** `A174.tsx:13:12 Expression expected` from `<span>{</span>` (needs escaping)

## HANDOFF - To Continue in Next Session

**What's Uncommitted:**
```typescript
// Added to component-generator.ts around line 163:
function escapeCurlyBraces(text: string): string {
  return text.replace(/([{}])/g, (match) => {
    return match === '{' ? "{'{'}" : "{'}'}" ;
  });
}
```

**Where to Use It:**
- Apply `escapeCurlyBraces()` to `node.text` when building JSX text content in nodeToJSX
- Locations: lines ~238, ~248, ~260 where text is being added to output

**Exact Steps to Complete:**
1. `npm run build` - compile the curly brace escaping fix
2. `npm run test` - verify all tests still pass
3. `npm run verify:production-build -- https://authentic-travelers-434120.framer.app/ --keep-temp` - validate real site
4. If build passes: Create commit with message: "fix: escape literal curly braces in JSX text content"
5. Run full suite: `npm run test:gate && npm run test:e2e-fixture`
6. Final verdict: Go/No-Go based on real-site build success

**Evidence to Preserve:**
- Test artifacts in `/var/folders/js/4m4nrg9s1_vcs0qd6pr82mf00000gn/T/framer-production-test-*` (if needed)
- Validation logs show: clone ✅, materialize ✅, generate ✅, npm install ✅, npm build 🔄 (blocked by JSX curly braces)
