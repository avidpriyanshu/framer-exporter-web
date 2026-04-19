# Iteration Checklist

## Project Goal
- [ ] Real Framer site can complete: clone → materialize → generate → npm build

## Current Iteration Goal
- [ ] Fix SVG attribute generation so real-site export compiles

## Known Blockers
- [x] Invalid `weight` prop emitted on native SVG `<g>` elements (CRITICAL)
- [ ] Asset materialization only ~75% complete
- [ ] Real-world validation still failing

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

### Iteration 1: Fix SVG & Text Element Generation
- **Goal:** Fix invalid `weight` attribute AND `<text>` to `<span>` conversion
- **Status:** CODE CHANGES COMPLETE, RE-VALIDATING
- **Changes made:**
  1. Added `isValidSVGAttribute()` function to filter icon library attrs (weight, mirrored)
  2. Updated nodeToJSX to validate SVG attributes with `isInvalidSVGAttr` check
  3. Fixed isValidHTMLElement to exclude 'text'/'tspan' from valid SVG list (allow Framer text mapping)
  4. Now 'text' elements correctly map to 'span' via mapInvalidElement()
- **Files changed:** `lib/generators/component-generator.ts`
- **Test results:** 
  - ✅ All 79 component generation tests pass
  - ✅ SVG weight attribute filtering verified
  - ✅ Text to span conversion verified
- **Commands run:**
  - `npm run test` - PASS (all 79 tests)
  - `npm run build` - SUCCESS
  - `npm run verify:production-build <url>` - IN PROGRESS
- **Next step:** Confirm real site builds successfully with fixes
