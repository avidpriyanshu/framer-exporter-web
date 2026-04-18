# Stage 7: Production Code Generator — Architecture Design

**Date:** 2026-04-19  
**Status:** Design Review  
**Investment Level:** High  

---

## 1. ARCHITECTURE OVERVIEW

**Input:** Framer HTML + Semantic Metadata (from Stage 6)
```
NamedTree {
  tree: RawDOMNode with data-component attributes
  semanticNames: { "div-123": "HeroSection", "button-456": "Button" }
}
```

**Processing Pipeline:**
```
Parse HTML
  ↓
Extract component boundaries (semantic types)
  ↓
Generate React components (AST-based)
  ↓
Extract & convert styles (Tailwind + CSS modules)
  ↓
Extract design tokens (colors, spacing, fonts)
  ↓
Generate Web Components (leaf types only)
  ↓
Scaffold Next.js project
  ↓
Validate & format code
  ↓
Output: Production-ready Next.js project
```

**Output:** Complete Next.js project with design tokens
```
my-framer-site/
├── components/
│   ├── Button.tsx (React + Web Component)
│   ├── Card.tsx
│   ├── Hero.tsx (composite, React only)
│   ├── Navigation.tsx
│   └── ...
├── pages/
│   └── index.tsx
├── styles/
│   ├── globals.css
│   ├── Button.module.css (Tailwind-incompatible styles)
│   ├── variables.css
│   └── tokens.json (design token system)
├── public/
│   ├── images/ (optimized)
│   └── fonts/
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

---

## 2. COMPONENT EXTRACTION STRATEGY

**How we identify components:**

**Step 1: Parse semantic metadata from Stage 6**
- `data-component="Button"` → Extract as component
- `data-section="hero"` → Extract as section (composite)
- Repeating patterns → Deduplicate into single component definition

**Step 2: Classify components**
- **Leaf components** (Button, Card, Icon, Badge, Link, Input)
  - Extracted as both React + Web Component
  - Props: text, variant, size, onClick, etc.
  
- **Composite components** (Hero, Features, Testimonials, Footer)
  - React-only (built from leaf components)
  - Props: sectionData array, heading, etc.

**Step 3: Extract props from Framer metadata**
- `data-component-props="{ label: string, variant: 'primary' | 'secondary' }"`
- Fallback: Infer from attributes (class="btn-primary" → `variant: 'primary'`)

**Step 4: Deduplicate instances**
- 100 identical buttons → 1 Button component + 100 instances
- Saves 50KB+ of code

---

## 3. CODE GENERATION PIPELINE

**Phase 1: Component Code Generation**

Using `@babel/types` + `@babel/generator`:

```typescript
// Generates valid React components via AST
const buttonAST = t.exportDefaultDeclaration(
  t.functionDeclaration(
    t.identifier('Button'),
    [t.identifier('props')],
    t.blockStatement([
      // Generate JSX: <button className="...">
    ])
  )
);

const { code } = generate(buttonAST);
// Output: Valid, formatted React component
```

**Result:** `components/Button.tsx`
- TypeScript with proper types
- Tailwind classes where possible
- Inline styles for Tailwind-incompatible props
- Web Component wrapper at bottom

---

**Phase 2: Style Extraction**

For each component, extract inline styles:

```
Input:  style="background: #ff0000; padding: 12px; border-radius: 4px"
Output: 
  - Tailwind: className="bg-red-600 p-3 rounded"
  - CSS Module: styles.buttonBase (if complex)
```

Algorithm:
1. Parse inline style string
2. Map to Tailwind class names (built-in mapping)
3. If unmappable → CSS module + className combination
4. Generate `.module.css` file

---

**Phase 3: Design Token Extraction**

Extract Framer's CSS variables into a structured token system:

```
Input:  var(--token-5b23898e-f48a-4c0b-a7d1-01a559bbd900, rgb(248, 248, 248))
Output:
  - tokens.json: { "colors": { "background": "rgb(248, 248, 248)" } }
  - variables.css: --color-background: rgb(248, 248, 248);
```

Token categories extracted:
- **Colors** (primary, secondary, background, text, border)
- **Spacing** (padding, margin, gap sizes)
- **Typography** (font-family, font-size, line-height, font-weight)
- **Borders** (border-radius, border-width)
- **Shadows** (box-shadow definitions)

Users can:
- Edit `tokens.json` to rebrand globally
- Update `variables.css` for CSS customization
- Integrate with design systems (Storybook, etc.)

---

**Phase 4: Web Component Generation**

For leaf components, generate Web Component wrapper:

```typescript
// Appended to React component
if (!customElements.get('humble-button')) {
  customElements.define('humble-button', class extends HTMLElement {
    connectedCallback() {
      const root = this.attachShadow({ mode: 'open' });
      const label = this.getAttribute('label') || 'Click me';
      root.innerHTML = `
        <style>/* Scoped styles */</style>
        <button>${label}</button>
      `;
    }
  });
}
```

Result: Can use `<humble-button label="Submit" />` in any HTML/framework.

---

## 4. NEXT.JS PROJECT SCAFFOLDING

**Generated files:**

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: next, react, typescript, tailwindcss |
| `next.config.js` | Image optimization, asset paths |
| `tsconfig.json` | Strict mode, path aliases (@/components) |
| `pages/index.tsx` | Main page, imports sections |
| `components/Button.tsx` | Reusable leaf component |
| `components/sections/Hero.tsx` | Composite section |
| `styles/globals.css` | Tailwind imports, reset |
| `styles/variables.css` | CSS custom properties for tokens |
| `styles/tokens.json` | Structured design tokens (JSON) |
| `.env.local.example` | API keys, image CDN config |
| `README.md` | Setup instructions, token docs, component docs |

**Key decisions:**
- `components/` for reusable pieces
- `components/sections/` for full sections
- `pages/index.tsx` as single entry point
- TypeScript strict mode (0 `any` types)
- Tailwind configured with custom theme from tokens
- Design tokens in both JSON (structured) and CSS (runtime)

---

## 5. DESIGN TOKENS SYSTEM (NEW)

**Why tokens matter:**
- ✅ Global rebranding (change primary color everywhere)
- ✅ Design system alignment (Figma → Code sync)
- ✅ Team collaboration (designers can update tokens.json)
- ✅ Accessibility (centralized contrast ratios, font sizes)

**Token Structure (tokens.json):**
```json
{
  "colors": {
    "primary": "#0066FF",
    "secondary": "#FF6B00",
    "success": "#00CC66",
    "background": "#FFFFFF",
    "text": "#000000"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  },
  "typography": {
    "heading": {
      "fontFamily": "Inter",
      "fontSize": "32px",
      "fontWeight": "700",
      "lineHeight": "1.2"
    },
    "body": {
      "fontFamily": "Inter",
      "fontSize": "16px",
      "fontWeight": "400",
      "lineHeight": "1.5"
    }
  },
  "borders": {
    "radius": {
      "sm": "4px",
      "md": "8px",
      "lg": "16px"
    }
  }
}
```

**Runtime usage (variables.css):**
```css
:root {
  --color-primary: #0066FF;
  --color-secondary: #FF6B00;
  --spacing-xs: 4px;
  --spacing-md: 16px;
  --font-heading: "Inter", sans-serif;
}
```

**In components:**
```tsx
// Option 1: CSS variables
<button style={{ color: 'var(--color-primary)' }} />

// Option 2: Tailwind with theme override
<button className="bg-blue-600" /> // Uses tailwind.config.js

// Option 3: Import tokens
import tokens from '@/styles/tokens.json';
<button style={{ color: tokens.colors.primary }} />
```

**Customization workflow:**
1. User edits `styles/tokens.json`
2. Runs build script: `npm run build:tokens` (regenerates variables.css)
3. All components automatically update

---

## 6. TESTING & VALIDATION STRATEGY

**At Export Time (Minimal):**
- ✅ ESLint syntax check
- ✅ Prettier format validation
- ✅ TypeScript compilation check
- ❌ Jest unit tests (slow, run in CI instead)
- ❌ Playwright visual regression (slow)

**In CI/Post-Export (User doesn't wait):**
- ✅ Jest: Each component renders without errors
- ✅ Playwright: Visual regression vs original Framer export
- ✅ Coverage: Aim for 80%+ code coverage
- ⚠️ If tests fail: User sees warnings, code still works

**Graceful Degradation:**
- Unparseable styles → Falls back to inline style
- Missing prop inference → Defaults to empty string
- Missing token → Uses fallback value
- Broken component → Still renders as `<div>` with error boundary

---

## 7. INTEGRATION POINTS

**In existing codebase:**

```
lib/
├── pipeline/
│   ├── stages/
│   │   ├── 1-6.ts (existing)
│   │   └── 7-code-generator.ts (NEW - Stage 7)
│   ├── types.ts (ADD: ProductionOutput type)
│   └── index.ts (export Stage 7)
├── generators/ (NEW folder)
│   ├── component-generator.ts (AST code generation)
│   ├── style-generator.ts (Tailwind extraction)
│   ├── token-generator.ts (NEW: Design token extraction)
│   ├── web-component-generator.ts (Custom elements)
│   └── project-scaffolder.ts (Next.js structure)
└── utils/
    ├── tailwind-mapper.ts (NEW: inline → Tailwind)
    ├── token-mapper.ts (NEW: Framer vars → tokens)
    ├── prop-inferencer.ts (NEW: extract props)
    └── existing utils
```

**API Integration (app/api/export/route.ts):**
```typescript
// NEW endpoint: /api/export-production
// Input: URL, options { format: 'html' | 'production' }
// Output: 
//   - 'html' → Current framer-exporter ZIP
//   - 'production' → Next.js project ZIP with tokens
```

**Web app UX:**
- Two export buttons: "Export HTML" vs "Export Production Code"
- Different pricing tiers
- Different file sizes/delivery times

---

## 8. RISK ASSESSMENT & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Animations lost** | High | Document in README, offer Framer Motion integration guide |
| **Custom Framer code** | High | Skip sites with custom code, warn user |
| **Responsive variants** | Medium | Convert Framer breakpoints to Tailwind (sm:/md:/lg:) |
| **CSS edge cases** | Medium | CSS module fallback for unmappable styles |
| **Token collision** | Medium | Namespace tokens (e.g., `color-primary` vs `primary`) |
| **Performance regressions** | Medium | Next.js image optimization, code-splitting by default |
| **Breaking changes in Framer format** | Low | Version lock Framer exports, document format |

---

## 9. SUCCESS CRITERIA

✅ **Functional:**
- Generated Next.js project runs without errors (`npm run dev`)
- All components render correctly
- Tailwind classes apply properly
- Web Components work in HTML + React
- Design tokens are extractable and customizable

✅ **Quality:**
- 95%+ visual match to original Framer export
- TypeScript strict mode (0 errors)
- ESLint clean
- Jest: 80%+ coverage

✅ **Performance:**
- Export time: <2 minutes (including validation)
- Bundle size: <50% of Framer HTML
- First Contentful Paint: <2 seconds

✅ **Usability:**
- README explains how to customize tokens
- Component prop types are clear
- Design tokens documented
- Setup: `npm install && npm run dev` works immediately
- Token update workflow is clear

---

## 10. IMPLEMENTATION PHASES (PREVIEW)

**Phase 1: Foundation (2-3 days)**
- Set up `lib/generators/` folder
- Create types for production output
- Add ESLint/Prettier/TypeScript config

**Phase 2: Component Extraction (3-4 days)**
- Parse semantic metadata
- Implement prop inference
- Build component boundary detection

**Phase 3: Code Generation (5-7 days)**
- Implement `component-generator.ts` (AST-based)
- Implement `style-generator.ts` (Tailwind mapping)
- Implement `token-generator.ts` (Token extraction)
- Implement `web-component-generator.ts`

**Phase 4: Project Scaffolding (2-3 days)**
- Generate Next.js boilerplate
- Create package.json, tsconfig, next.config
- Copy/optimize assets
- Generate tokens.json and variables.css

**Phase 5: Testing & Polish (3-4 days)**
- Implement validation pipeline
- Set up Jest + Playwright
- Document token customization

**Phase 6: Integration (2-3 days)**
- Wire into pipeline.ts
- Add to API endpoint
- Test end-to-end

---

## 11. DESIGN DECISIONS LOCKED

✅ Sections stay as sections + Semantic types extracted as components  
✅ AST-based code generation (@babel/types)  
✅ Tailwind-first styles with CSS module fallback  
✅ Leaf Web Components only (Button, Card, Icon)  
✅ Minimal validation at export (syntax only)  
✅ Design tokens extracted and customizable  
✅ Two-tier export (HTML + Production)  

---

**Status:** Ready for implementation planning
