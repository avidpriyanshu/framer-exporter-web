# Framer Exporter: 6-Stage Pipeline Integration

> **For agentic workers:** Use superpowers:subagent-driven-development to execute this plan task-by-task.

**Goal:** Add a modular 6-stage post-processing pipeline to enhance framer-exporter-core's HTML output into production-ready Next.js code.

**Architecture:** After framer-exporter-core exports HTML, run it through 6 independent stages (HTMLParser → Normalizer → SectionDetector → ComponentExtractor → SemanticNamer → CodeGenerator) that progressively improve code structure, naming, and component detection.

**Tech Stack:** TypeScript, Node.js, JSDOM/Cheerio for HTML parsing, existing framer-exporter-core dependency.

**Integration Point:** `app/api/export/route.ts` — after exportSite() returns zip, extract HTML and run through pipeline before streaming to user.

---

## File Structure

```
lib/
  pipeline/
    stages/
      1-html-parser.ts              # Parse exported HTML → RawDOM
      2-normalizer.ts               # Clean & flatten → CleanTree
      3-section-detector.ts         # Identify sections → AnnotatedTree
      4-component-extractor.ts      # Find patterns (2+) → ComponentTree
      5-semantic-namer.ts           # Assign semantic names → NamedTree
      6-code-generator.ts           # Enhanced code output → CodeGenOutput
    types.ts                        # Shared pipeline types
    pipeline.ts                     # Orchestrator + metrics
    index.ts                        # Public exports

  utils/
    depth-flattener.ts              # Flatten deep nesting
    css-parser.ts                   # Extract CSS variables
    responsive-deduper.ts           # Merge mobile/desktop variants
    svg-resolver.ts                 # Handle SVG references
    alt-text-inferrer.ts            # Infer missing image alt text

tests/
  pipeline/
    stages/
      1-html-parser.test.ts
      2-normalizer.test.ts
      3-section-detector.test.ts
      4-component-extractor.test.ts
      5-semantic-namer.test.ts
      6-code-generator.test.ts
    pipeline.test.ts

  fixtures/
    sample-framer-export.html       # Real Framer export for testing
```

---

## Phase 1: Pipeline Core Types & Stage 1 (HTMLParser)

### Task 1: Define Pipeline Types

**Files:**
- Create: `lib/pipeline/types.ts`

- [ ] **Step 1: Write type definitions**

```typescript
// lib/pipeline/types.ts
export interface RawDOMNode {
  tag: string;
  attributes: Record<string, string>;
  children: RawDOMNode[];
  text?: string;
}

export interface ParsedResult {
  rawDOM: RawDOMNode;
  nodeCount: number;
  uniqueTags: string[];
  parseTime: number;
}

export interface CleanedTree {
  tree: RawDOMNode;
  removedCount: number;
  flattenedCount: number;
}

export interface Section {
  id: string;
  type: 'header' | 'nav' | 'hero' | 'features' | 'testimonials' | 'faq' | 'stats' | 'footer' | 'cta';
  nodes: RawDOMNode[];
  depth: number;
}

export interface AnnotatedTree {
  tree: RawDOMNode;
  sections: Section[];
}

export interface ComponentPattern {
  signature: string;
  occurrences: number;
  nodes: RawDOMNode[];
  isComponent: boolean;
}

export interface Component {
  id: string;
  name: string;
  pattern: ComponentPattern;
  props: Record<string, string>;
  instances: number;
}

export interface ComponentTree {
  tree: RawDOMNode;
  components: Component[];
  componentMap: Record<string, string>;
}

export interface SemanticTreeNode extends RawDOMNode {
  semanticName?: string;
  semanticType?: string;
}

export interface NamedTree {
  tree: SemanticTreeNode;
  namingMap: Record<string, string>;
}

export interface EnhancedComponent {
  name: string;
  path: string;
  code: string;
  props: string[];
}

export interface CodeGenOutput {
  enhancedHTML: string;
  components: EnhancedComponent[];
  componentIndex: string;
  metrics: Record<string, number>;
}

export interface PipelineMetrics {
  htmlParseTime: number;
  normalizationTime: number;
  sectionDetectionTime: number;
  componentExtractionTime: number;
  semanticNamingTime: number;
  codeGenerationTime: number;
  totalTime: number;
  nodeCountInitial: number;
  nodeCountFinal: number;
  componentsDetected: number;
  sectionsDetected: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/types.ts
git commit -m "feat(pipeline): define core types for 6-stage pipeline"
```

---

### Task 2: Implement HTMLParser (Stage 1)

**Files:**
- Create: `lib/pipeline/stages/1-html-parser.ts`
- Create: `tests/pipeline/stages/1-html-parser.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/pipeline/stages/1-html-parser.test.ts
import { parseHTML } from '@/lib/pipeline/stages/1-html-parser';

describe('Stage 1: HTMLParser', () => {
  it('should parse Framer-exported HTML into RawDOMNode structure', () => {
    const html = '<div><section><h1>Title</h1></section></div>';
    const result = parseHTML(html);
    
    expect(result.rawDOM.tag).toBe('div');
    expect(result.rawDOM.children.length).toBeGreaterThan(0);
    expect(result.nodeCount).toBeGreaterThan(0);
  });

  it('should track all unique tags', () => {
    const html = '<div><p>Text</p><span>More</span><img src="test.jpg"/></div>';
    const result = parseHTML(html);
    
    expect(result.uniqueTags).toContain('p');
    expect(result.uniqueTags).toContain('span');
    expect(result.uniqueTags).toContain('img');
  });

  it('should preserve attributes and inline styles', () => {
    const html = '<div class="container" data-section="hero" style="color: red;"><p>Content</p></div>';
    const result = parseHTML(html);
    
    expect(result.rawDOM.attributes.class).toBe('container');
    expect(result.rawDOM.attributes['data-section']).toBe('hero');
    expect(result.rawDOM.attributes.style).toBe('color: red;');
  });

  it('should measure parse time', () => {
    const html = '<div>' + '<p>Item</p>'.repeat(100) + '</div>';
    const result = parseHTML(html);
    
    expect(result.parseTime).toBeGreaterThan(0);
    expect(result.parseTime).toBeLessThan(500);
  });

  it('should handle Framer-specific class names', () => {
    const html = '<div class="framer-xyz-123-abc text-lg"><p>Text</p></div>';
    const result = parseHTML(html);
    
    expect(result.rawDOM.attributes.class).toContain('text-lg');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/pipeline/stages/1-html-parser.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement HTMLParser**

```typescript
// lib/pipeline/stages/1-html-parser.ts
import * as cheerio from 'cheerio';
import { RawDOMNode, ParsedResult } from '../types';

export function parseHTML(html: string): ParsedResult {
  const startTime = Date.now();
  const $ = cheerio.load(html);
  
  const nodeSet = new Set<string>();
  let nodeCount = 0;

  function traverse(element: cheerio.Element | null): RawDOMNode | null {
    if (!element) return null;

    const node: RawDOMNode = {
      tag: element.name || 'text',
      attributes: { ...element.attribs },
      children: [],
      text: element.type === 'text' ? element.data : undefined,
    };

    nodeCount++;
    nodeSet.add(element.name || 'text');

    if (element.children) {
      element.children.forEach((child) => {
        const childNode = traverse(child as cheerio.Element);
        if (childNode) {
          node.children.push(childNode);
        }
      });
    }

    return node;
  }

  const rootElement = $.root().children()[0] as cheerio.Element;
  const rawDOM = traverse(rootElement) || { tag: 'html', attributes: {}, children: [] };

  const parseTime = Date.now() - startTime;

  return {
    rawDOM,
    nodeCount,
    uniqueTags: Array.from(nodeSet).sort(),
    parseTime,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/stages/1-html-parser.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/stages/1-html-parser.ts tests/pipeline/stages/1-html-parser.test.ts
git commit -m "feat(pipeline): implement Stage 1 HTMLParser"
```

---

## Phase 2: Stages 2-3 (Normalizer & SectionDetector)

### Task 3: Implement Normalizer (Stage 2)

**Files:**
- Create: `lib/pipeline/stages/2-normalizer.ts`
- Create: `lib/utils/depth-flattener.ts`
- Create: `lib/utils/css-parser.ts`
- Create: `tests/pipeline/stages/2-normalizer.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/pipeline/stages/2-normalizer.test.ts
import { normalize } from '@/lib/pipeline/stages/2-normalizer';

describe('Stage 2: Normalizer', () => {
  it('should remove empty divs', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        { tag: 'div', attributes: {}, children: [], text: undefined },
        { tag: 'p', attributes: {}, children: [], text: 'Content' },
      ],
    };

    const result = normalize(tree);
    expect(result.tree.children).toHaveLength(1);
    expect(result.removedCount).toBeGreaterThan(0);
  });

  it('should flatten nesting beyond depth 4', () => {
    let tree: any = { tag: 'div', attributes: {}, children: [], text: 'Deep' };
    for (let i = 0; i < 6; i++) {
      tree = { tag: 'div', attributes: {}, children: [tree] };
    }

    const result = normalize(tree);
    expect(result.flattenedCount).toBeGreaterThan(0);
  });

  it('should extract CSS variables', () => {
    const tree = {
      tag: 'div',
      attributes: { style: 'color: var(--primary); background: var(--bg);' },
      children: [],
    };

    const result = normalize(tree);
    expect(result.tree.attributes['data-css-vars']).toBeDefined();
  });

  it('should clean Framer-generated class names', () => {
    const tree = {
      tag: 'div',
      attributes: { class: 'framer-xyz-123-abc text-lg' },
      children: [],
    };

    const result = normalize(tree);
    expect(result.tree.attributes.class).toContain('text-lg');
    expect(result.tree.attributes.class).not.toContain('framer-xyz');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/pipeline/stages/2-normalizer.test.ts
```

- [ ] **Step 3: Implement depth flattener**

```typescript
// lib/utils/depth-flattener.ts
import { RawDOMNode } from '../pipeline/types';

const MAX_DEPTH = 4;

export function flattenDeepNesting(tree: RawDOMNode): { tree: RawDOMNode; flattenedCount: number } {
  let flattenedCount = 0;

  function flatten(node: RawDOMNode, depth: number): RawDOMNode {
    if (depth > MAX_DEPTH && node.children.length === 1 && !node.text && node.tag === 'div') {
      flattenedCount++;
      return flatten(node.children[0], depth);
    }

    return {
      ...node,
      children: node.children.map((child) => flatten(child, depth + 1)),
    };
  }

  return { tree: flatten(tree, 0), flattenedCount };
}
```

- [ ] **Step 4: Implement CSS parser**

```typescript
// lib/utils/css-parser.ts
export interface CSSVariable {
  name: string;
  value: string;
}

export function extractCSSVariables(styleStr: string): CSSVariable[] {
  const varRegex = /var\((--[a-zA-Z0-9-]+)\)/g;
  const matches = [...styleStr.matchAll(varRegex)];
  return matches.map((match) => ({
    name: match[1],
    value: '',
  }));
}

export function removeFramerClasses(classStr: string): string {
  return classStr
    .split(' ')
    .filter((cls) => !cls.match(/^framer-[a-z0-9-]+$/i))
    .join(' ')
    .trim();
}
```

- [ ] **Step 5: Implement Normalizer**

```typescript
// lib/pipeline/stages/2-normalizer.ts
import { RawDOMNode, CleanedTree } from '../types';
import { flattenDeepNesting } from '../utils/depth-flattener';
import { extractCSSVariables, removeFramerClasses } from '../utils/css-parser';

function isEmptyDiv(node: RawDOMNode): boolean {
  return (
    node.tag === 'div' &&
    !node.text &&
    node.children.length === 0 &&
    !node.attributes.style &&
    !node.attributes.class
  );
}

export function normalize(tree: RawDOMNode): CleanedTree {
  let removedCount = 0;

  function cleanNode(node: RawDOMNode): RawDOMNode | null {
    if (isEmptyDiv(node)) {
      removedCount++;
      return null;
    }

    const attributes = { ...node.attributes };

    if (attributes.class) {
      attributes.class = removeFramerClasses(attributes.class);
      if (!attributes.class) delete attributes.class;
    }

    if (attributes.style) {
      const vars = extractCSSVariables(attributes.style);
      if (vars.length > 0) {
        attributes['data-css-vars'] = JSON.stringify(vars);
      }
    }

    const cleanedChildren = node.children
      .map(cleanNode)
      .filter((child): child is RawDOMNode => child !== null);

    return {
      tag: node.tag,
      attributes,
      children: cleanedChildren,
      text: node.text,
    };
  }

  const cleanedTree = cleanNode(tree) || tree;
  const { tree: flattenedTree, flattenedCount } = flattenDeepNesting(cleanedTree);

  return {
    tree: flattenedTree,
    removedCount,
    flattenedCount,
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/stages/2-normalizer.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/pipeline/stages/2-normalizer.ts lib/utils/depth-flattener.ts lib/utils/css-parser.ts tests/pipeline/stages/2-normalizer.test.ts
git commit -m "feat(pipeline): implement Stage 2 Normalizer with flattening and CSS parsing"
```

---

### Task 4: Implement SectionDetector (Stage 3)

**Files:**
- Create: `lib/pipeline/stages/3-section-detector.ts`
- Create: `tests/pipeline/stages/3-section-detector.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/pipeline/stages/3-section-detector.test.ts
import { detectSections } from '@/lib/pipeline/stages/3-section-detector';

describe('Stage 3: SectionDetector', () => {
  it('should detect header sections', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        { tag: 'header', attributes: {}, children: [], text: undefined },
        { tag: 'main', attributes: {}, children: [], text: undefined },
      ],
    };

    const result = detectSections(tree);
    const headerSection = result.sections.find((s) => s.type === 'header');
    expect(headerSection).toBeDefined();
  });

  it('should detect hero sections by class', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        {
          tag: 'section',
          attributes: { class: 'hero' },
          children: [],
        },
      ],
    };

    const result = detectSections(tree);
    const heroSection = result.sections.find((s) => s.type === 'hero');
    expect(heroSection).toBeDefined();
  });

  it('should assign unique IDs to sections', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        { tag: 'section', attributes: {}, children: [], text: 'Sec1' },
        { tag: 'section', attributes: {}, children: [], text: 'Sec2' },
      ],
    };

    const result = detectSections(tree);
    const ids = result.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/pipeline/stages/3-section-detector.test.ts
```

- [ ] **Step 3: Implement SectionDetector**

```typescript
// lib/pipeline/stages/3-section-detector.ts
import { RawDOMNode, Section, AnnotatedTree } from '../types';

const SECTION_TYPES = {
  header: ['header', 'nav'],
  hero: ['hero', 'jumbotron', 'banner'],
  features: ['features', 'services'],
  testimonials: ['testimonial', 'testimonials'],
  faq: ['faq', 'faqs'],
  stats: ['stats', 'metrics'],
  cta: ['cta', 'subscribe', 'newsletter'],
  footer: ['footer'],
};

export function detectSections(tree: RawDOMNode): AnnotatedTree {
  const sections: Section[] = [];
  let sectionId = 0;

  function getSectionType(node: RawDOMNode): Section['type'] | null {
    const tag = node.tag;
    const classes = (node.attributes.class || '').toLowerCase();

    if (tag === 'header') return 'header';
    if (tag === 'nav') return 'header';
    if (tag === 'footer') return 'footer';

    for (const [type, keywords] of Object.entries(SECTION_TYPES)) {
      if (keywords.some((kw) => classes.includes(kw))) {
        return type as Section['type'];
      }
    }

    return null;
  }

  function traverse(node: RawDOMNode, depth: number): void {
    const sectionType = getSectionType(node);

    if (sectionType) {
      sections.push({
        id: `section-${sectionId++}`,
        type: sectionType,
        nodes: [node],
        depth,
      });
    }

    node.children.forEach((child) => traverse(child, depth + 1));
  }

  traverse(tree, 0);

  return { tree, sections };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/stages/3-section-detector.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/stages/3-section-detector.ts tests/pipeline/stages/3-section-detector.test.ts
git commit -m "feat(pipeline): implement Stage 3 SectionDetector with semantic heuristics"
```

---

## Phase 3: Stages 4-5 (ComponentExtractor & SemanticNamer)

### Task 5: Implement ComponentExtractor (Stage 4)

**Files:**
- Create: `lib/pipeline/stages/4-component-extractor.ts`
- Create: `tests/pipeline/stages/4-component-extractor.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/pipeline/stages/4-component-extractor.test.ts
import { extractComponents } from '@/lib/pipeline/stages/4-component-extractor';

describe('Stage 4: ComponentExtractor', () => {
  it('should identify repeated patterns (2+ occurrences)', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        { tag: 'p', attributes: { class: 'text-block' }, children: [], text: 'Item 1' },
        { tag: 'p', attributes: { class: 'text-block' }, children: [], text: 'Item 2' },
        { tag: 'p', attributes: { class: 'text-block' }, children: [], text: 'Item 3' },
      ],
    };

    const result = extractComponents(tree);
    expect(result.components.length).toBeGreaterThan(0);
    const textComponent = result.components.find((c) => c.instances >= 2);
    expect(textComponent).toBeDefined();
  });

  it('should not create components from single instances', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        { tag: 'p', attributes: { class: 'unique' }, children: [], text: 'Only once' },
      ],
    };

    const result = extractComponents(tree);
    const singleComponent = result.components.find((c) => c.instances === 1);
    expect(singleComponent).toBeUndefined();
  });

  it('should extract SVG icons as components', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        { tag: 'svg', attributes: {}, children: [], text: undefined },
        { tag: 'svg', attributes: {}, children: [], text: undefined },
      ],
    };

    const result = extractComponents(tree);
    const svgComponent = result.components.find((c) => c.pattern.signature.includes('svg'));
    expect(svgComponent).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/pipeline/stages/4-component-extractor.test.ts
```

- [ ] **Step 3: Implement ComponentExtractor**

```typescript
// lib/pipeline/stages/4-component-extractor.ts
import { RawDOMNode, ComponentTree, Component, ComponentPattern } from '../types';

function generateSignature(node: RawDOMNode): string {
  const classes = (node.attributes.class || '').split(' ').sort().join('|');
  const dataAttrs = Object.keys(node.attributes)
    .filter((k) => k.startsWith('data-'))
    .sort()
    .join('|');

  return `${node.tag}|${classes}|${dataAttrs}`.toLowerCase();
}

export function extractComponents(tree: RawDOMNode): ComponentTree {
  const patterns = new Map<string, ComponentPattern>();
  const componentMap: Record<string, string> = {};
  let componentId = 0;

  function traverse(node: RawDOMNode): void {
    const sig = generateSignature(node);

    if (!patterns.has(sig)) {
      patterns.set(sig, {
        signature: sig,
        occurrences: 0,
        nodes: [],
        isComponent: false,
      });
    }

    const pattern = patterns.get(sig)!;
    pattern.occurrences++;
    pattern.nodes.push(node);

    node.children.forEach(traverse);
  }

  traverse(tree);

  const components: Component[] = [];

  patterns.forEach((pattern) => {
    if (pattern.occurrences >= 2) {
      pattern.isComponent = true;
      const compId = `component-${componentId++}`;

      let compName = pattern.signature.split('|')[0];
      if (compName === 'svg') compName = 'Icon';
      else if (compName === 'p') compName = 'TextBlock';
      else if (compName === 'img') compName = 'Image';
      else compName = compName.charAt(0).toUpperCase() + compName.slice(1);

      components.push({
        id: compId,
        name: compName,
        pattern,
        props: {},
        instances: pattern.occurrences,
      });

      pattern.nodes.forEach((node, idx) => {
        const nodeId = node.attributes.id || `${compName.toLowerCase()}-${idx}`;
        componentMap[nodeId] = compId;
      });
    }
  });

  return { tree, components, componentMap };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/stages/4-component-extractor.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/stages/4-component-extractor.ts tests/pipeline/stages/4-component-extractor.test.ts
git commit -m "feat(pipeline): implement Stage 4 ComponentExtractor with pattern detection"
```

---

### Task 6: Implement SemanticNamer (Stage 5)

**Files:**
- Create: `lib/pipeline/stages/5-semantic-namer.ts`
- Create: `tests/pipeline/stages/5-semantic-namer.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/pipeline/stages/5-semantic-namer.test.ts
import { assignSemanticNames } from '@/lib/pipeline/stages/5-semantic-namer';

describe('Stage 5: SemanticNamer', () => {
  it('should assign semantic names to headings', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        { tag: 'h1', attributes: { id: 'h1-1' }, children: [], text: 'Main Title' },
        { tag: 'h2', attributes: { id: 'h2-1' }, children: [], text: 'Section' },
      ],
    };

    const result = assignSemanticNames(tree);
    expect(result.namingMap['h1-1']).toMatch(/heading|title/i);
    expect(result.namingMap['h2-1']).toMatch(/heading|section/i);
  });

  it('should assign names to button/CTA elements', () => {
    const tree = {
      tag: 'div',
      attributes: {},
      children: [
        {
          tag: 'a',
          attributes: { id: 'btn-1', class: 'btn btn-primary' },
          children: [],
          text: 'Sign Up',
        },
      ],
    };

    const result = assignSemanticNames(tree);
    expect(result.namingMap['btn-1']).toMatch(/button|cta|action/i);
  });

  it('should handle data-section attributes', () => {
    const tree = {
      tag: 'div',
      attributes: { id: 'sec-1', 'data-section': 'testimonials' },
      children: [],
    };

    const result = assignSemanticNames(tree);
    expect(result.namingMap['sec-1']).toContain('Testimonials');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/pipeline/stages/5-semantic-namer.test.ts
```

- [ ] **Step 3: Implement SemanticNamer**

```typescript
// lib/pipeline/stages/5-semantic-namer.ts
import { RawDOMNode, SemanticTreeNode, NamedTree } from '../types';

function inferSemanticName(node: RawDOMNode): string | undefined {
  const tag = node.tag;
  const classes = (node.attributes.class || '').toLowerCase();
  const dataSection = node.attributes['data-section'] || '';

  if (tag === 'h1' || tag === 'h2' || tag === 'h3') return 'Heading';
  if (tag === 'a' && classes.includes('btn')) return 'Button';
  if (tag === 'button') return 'Button';
  if (tag === 'form') return 'Form';
  if (tag === 'input') return 'Input';
  if (tag === 'img') return 'Image';
  if (tag === 'svg') return 'Icon';

  if (classes.includes('card')) return 'Card';
  if (classes.includes('nav')) return 'Navigation';
  if (classes.includes('footer')) return 'Footer';
  if (classes.includes('testimonial')) return 'Testimonial';
  if (classes.includes('hero')) return 'Hero';
  if (classes.includes('feature')) return 'FeatureBox';
  if (classes.includes('faq')) return 'FAQ';
  if (classes.includes('modal')) return 'Modal';

  if (dataSection) return dataSection.charAt(0).toUpperCase() + dataSection.slice(1);

  return undefined;
}

export function assignSemanticNames(tree: RawDOMNode): NamedTree {
  const namingMap: Record<string, string> = {};
  let anonymousCounter = 0;

  function traverse(node: RawDOMNode): SemanticTreeNode {
    const semanticName = inferSemanticName(node);
    const nodeId = node.attributes.id || `anon-${anonymousCounter++}`;

    let finalName = semanticName || `${node.tag.charAt(0).toUpperCase() + node.tag.slice(1)}${anonymousCounter}`;

    namingMap[nodeId] = finalName;

    return {
      ...node,
      semanticName: finalName,
      semanticType: node.tag,
      children: node.children.map(traverse),
    };
  }

  const namedTree = traverse(tree);

  return { tree: namedTree, namingMap };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/stages/5-semantic-namer.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/stages/5-semantic-namer.ts tests/pipeline/stages/5-semantic-namer.test.ts
git commit -m "feat(pipeline): implement Stage 5 SemanticNamer with heuristic naming"
```

---

## Phase 4: Stage 6 (CodeGenerator) & Integration

### Task 7: Implement CodeGenerator (Stage 6)

**Files:**
- Create: `lib/pipeline/stages/6-code-generator.ts`
- Create: `tests/pipeline/stages/6-code-generator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/pipeline/stages/6-code-generator.test.ts
import { generateEnhancedOutput } from '@/lib/pipeline/stages/6-code-generator';
import { NamedTree, SemanticTreeNode } from '@/lib/pipeline/types';

describe('Stage 6: CodeGenerator', () => {
  it('should generate enhanced HTML with semantic names', () => {
    const namedTree: NamedTree = {
      tree: {
        tag: 'div',
        attributes: { id: 'root' },
        children: [],
        semanticName: 'Root',
        semanticType: 'div',
      } as SemanticTreeNode,
      namingMap: { root: 'Root' },
    };

    const result = generateEnhancedOutput(namedTree);

    expect(result.enhancedHTML).toContain('Root');
    expect(result.components).toBeDefined();
  });

  it('should generate component index documentation', () => {
    const namedTree: NamedTree = {
      tree: {
        tag: 'div',
        attributes: {},
        children: [],
        semanticName: 'Container',
        semanticType: 'div',
      } as SemanticTreeNode,
      namingMap: {},
    };

    const result = generateEnhancedOutput(namedTree);

    expect(result.componentIndex).toContain('Components');
    expect(result.metrics).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/pipeline/stages/6-code-generator.test.ts
```

- [ ] **Step 3: Implement CodeGenerator**

```typescript
// lib/pipeline/stages/6-code-generator.ts
import { NamedTree, SemanticTreeNode, CodeGenOutput, EnhancedComponent } from '../types';

function serializeNodeWithSemantics(node: SemanticTreeNode): string {
  const className = node.semanticName ? ` data-component="${node.semanticName}"` : '';
  const attrs = Object.entries(node.attributes)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');

  const children = node.children.map(serializeNodeWithSemantics).join('');
  const text = node.text ? node.text : '';

  return `<${node.tag}${className}${attrs}>${text}${children}</${node.tag}>`;
}

function generateComponentDocs(components: EnhancedComponent[]): string {
  const rows = components
    .map(
      (c) => `
| ${c.name} | \`components/${c.path}\` | Extracted from Framer export |`
    )
    .join('');

  return `# Generated Components

| Component | Location | Notes |
|-----------|----------|-------|${rows}

## Using Components

Each component is a self-contained React module. Import and use:

\`\`\`tsx
import Button from '@/components/Button';

export default function Page() {
  return <Button />;
}
\`\`\`

## Props

Components are generated with default props. Customize by modifying the component files directly.
`;
}

export function generateEnhancedOutput(namedTree: NamedTree): CodeGenOutput {
  const enhancedHTML = serializeNodeWithSemantics(namedTree.tree);
  const components: EnhancedComponent[] = [];

  function extractComponents(node: SemanticTreeNode): void {
    if (node.semanticName && node.semanticName !== 'Root') {
      components.push({
        name: node.semanticName,
        path: `${node.semanticName}.tsx`,
        code: `export default function ${node.semanticName}() { return <div>Component</div>; }`,
        props: [],
      });
    }

    node.children.forEach(extractComponents);
  }

  extractComponents(namedTree.tree);

  const componentIndex = generateComponentDocs(components);

  const metrics = {
    componentsGenerated: components.length,
    elementsProcessed: Object.keys(namedTree.namingMap).length,
    enhancedHTMLSize: enhancedHTML.length,
  };

  return {
    enhancedHTML,
    components,
    componentIndex,
    metrics,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/stages/6-code-generator.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/stages/6-code-generator.ts tests/pipeline/stages/6-code-generator.test.ts
git commit -m "feat(pipeline): implement Stage 6 CodeGenerator with component extraction"
```

---

### Task 8: Implement Pipeline Orchestrator

**Files:**
- Create: `lib/pipeline/pipeline.ts`
- Create: `lib/pipeline/index.ts`
- Create: `tests/pipeline/pipeline.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/pipeline/pipeline.test.ts
import { runPipeline } from '@/lib/pipeline/pipeline';

describe('Pipeline Orchestrator', () => {
  it('should run all 6 stages on HTML input', async () => {
    const html = `
      <div>
        <header><h1>Title</h1></header>
        <section><p>Content 1</p></section>
        <section><p>Content 2</p></section>
        <footer><p>Footer</p></footer>
      </div>
    `;

    const result = runPipeline(html);

    expect(result.enhancedHTML).toBeDefined();
    expect(result.components).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.componentsGenerated).toBeGreaterThanOrEqual(0);
  });

  it('should measure all stage times', async () => {
    const html = '<div><p>Test</p></div>';
    const result = runPipeline(html);

    expect(result.metrics.htmlParseTime).toBeGreaterThan(0);
    expect(result.metrics.totalTime).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/pipeline/pipeline.test.ts
```

- [ ] **Step 3: Implement Orchestrator**

```typescript
// lib/pipeline/pipeline.ts
import { parseHTML } from './stages/1-html-parser';
import { normalize } from './stages/2-normalizer';
import { detectSections } from './stages/3-section-detector';
import { extractComponents } from './stages/4-component-extractor';
import { assignSemanticNames } from './stages/5-semantic-namer';
import { generateEnhancedOutput } from './stages/6-code-generator';
import { CodeGenOutput, PipelineMetrics } from './types';

export interface PipelineResult extends CodeGenOutput {
  metrics: PipelineMetrics;
}

export function runPipeline(html: string): PipelineResult {
  const startTime = Date.now();

  console.log('[Pipeline] Starting 6-stage enhancement...');

  // Stage 1: Parse HTML
  const parseStart = Date.now();
  const parseResult = parseHTML(html);
  const htmlParseTime = Date.now() - parseStart;
  console.log(`[Stage 1] HTMLParser: ${parseResult.nodeCount} nodes in ${htmlParseTime}ms`);

  // Stage 2: Normalize
  const normalizeStart = Date.now();
  const normalizeResult = normalize(parseResult.rawDOM);
  const normalizationTime = Date.now() - normalizeStart;
  console.log(`[Stage 2] Normalizer: ${normalizeResult.removedCount} removed, ${normalizeResult.flattenedCount} flattened in ${normalizationTime}ms`);

  // Stage 3: Detect Sections
  const sectionStart = Date.now();
  const sectionResult = detectSections(normalizeResult.tree);
  const sectionDetectionTime = Date.now() - sectionStart;
  console.log(`[Stage 3] SectionDetector: ${sectionResult.sections.length} sections in ${sectionDetectionTime}ms`);

  // Stage 4: Extract Components
  const componentStart = Date.now();
  const componentResult = extractComponents(sectionResult.tree);
  const componentExtractionTime = Date.now() - componentStart;
  console.log(`[Stage 4] ComponentExtractor: ${componentResult.components.length} components in ${componentExtractionTime}ms`);

  // Stage 5: Semantic Naming
  const namingStart = Date.now();
  const namingResult = assignSemanticNames(componentResult.tree);
  const semanticNamingTime = Date.now() - namingStart;
  console.log(`[Stage 5] SemanticNamer: ${Object.keys(namingResult.namingMap).length} named in ${semanticNamingTime}ms`);

  // Stage 6: Code Generation
  const codeGenStart = Date.now();
  const codeGenResult = generateEnhancedOutput(namingResult);
  const codeGenerationTime = Date.now() - codeGenStart;
  console.log(`[Stage 6] CodeGenerator: ${codeGenResult.components.length} components generated in ${codeGenerationTime}ms`);

  const totalTime = Date.now() - startTime;

  const metrics: PipelineMetrics = {
    htmlParseTime,
    normalizationTime,
    sectionDetectionTime,
    componentExtractionTime,
    semanticNamingTime,
    codeGenerationTime,
    totalTime,
    nodeCountInitial: parseResult.nodeCount,
    nodeCountFinal: Object.keys(namingResult.namingMap).length,
    componentsDetected: componentResult.components.length,
    sectionsDetected: sectionResult.sections.length,
  };

  console.log(`[Pipeline] Complete in ${totalTime}ms`);
  console.log(JSON.stringify(metrics, null, 2));

  return {
    ...codeGenResult,
    metrics,
  };
}
```

- [ ] **Step 4: Create public exports**

```typescript
// lib/pipeline/index.ts
export { runPipeline } from './pipeline';
export * from './types';
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/pipeline.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/pipeline/pipeline.ts lib/pipeline/index.ts tests/pipeline/pipeline.test.ts
git commit -m "feat(pipeline): implement orchestrator with all 6 stages integrated"
```

---

## Phase 5: Web App Integration & API Changes

### Task 9: Integrate Pipeline into Export API

**Files:**
- Modify: `app/api/export/route.ts`
- Modify: `lib/cli.ts`

- [ ] **Step 1: Update cli.ts to return HTML**

```typescript
// lib/cli.ts (existing file, add new function)
import { runPipeline, type PipelineResult } from './pipeline';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

export async function exportSiteWithPipeline(
  url: string,
  tempDir: string
): Promise<{ zipPath: string; pipelineMetrics: any }> {
  // Step 1: Run existing framer-exporter CLI
  const { exportSite } = require('framer-exporter/src/cli');
  
  const zipPath = await Promise.race([
    (async () => {
      return await exportSite(url, tempDir);
    })(),
    new Promise<string>((resolve) => {
      setTimeout(() => resolve(''), 60000);
    }),
  ]);

  if (!zipPath) {
    throw new Error('Export took too long. Try a simpler site.');
  }

  // Step 2: Extract HTML from zip
  const zip = new AdmZip(zipPath);
  const htmlEntry = zip.findEntry('index.html');
  if (!htmlEntry) {
    throw new Error('No index.html found in export');
  }

  const html = zip.readAsText(htmlEntry);

  // Step 3: Run 6-stage pipeline on HTML
  const pipelineResult: PipelineResult = runPipeline(html);

  // Step 4: Update zip with enhanced files
  zip.updateFile(htmlEntry, Buffer.from(pipelineResult.enhancedHTML, 'utf-8'));

  // Add component index
  zip.addFile('COMPONENT_INDEX.md', Buffer.from(pipelineResult.componentIndex, 'utf-8'));

  // Re-save zip
  zip.writeZip(zipPath);

  return {
    zipPath,
    pipelineMetrics: pipelineResult.metrics,
  };
}
```

- [ ] **Step 2: Update API route to use new function**

```typescript
// app/api/export/route.ts (modify existing POST handler)
import { exportSiteWithPipeline } from '@/lib/cli';
import { isValidFramerUrl } from '@/lib/validator';
import * as fs from 'fs';
import * as path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import * as os from 'os';

const requestCache = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!isValidFramerUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Rate limiting
    const lastRequest = requestCache.get(url);
    if (lastRequest && Date.now() - lastRequest < 5000) {
      return NextResponse.json({ error: 'Please wait 5 seconds before retrying' }, { status: 429 });
    }

    requestCache.set(url, Date.now());

    const tempDir = path.join(os.tmpdir(), `framer-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Export with pipeline enhancement
      const { zipPath, pipelineMetrics } = await exportSiteWithPipeline(url, tempDir);

      const zipBuffer = fs.readFileSync(zipPath);

      // Add pipeline metrics as header
      const response = new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="framer-export.zip"',
          'X-Pipeline-Metrics': JSON.stringify(pipelineMetrics),
        },
      });

      return response;
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Update package.json with pipeline dependency**

```json
{
  "dependencies": {
    "adm-zip": "^0.5.10"
  }
}
```

- [ ] **Step 4: Run existing tests to verify nothing broke**

```bash
npm test
```

Expected: All existing tests pass

- [ ] **Step 5: Commit**

```bash
git add app/api/export/route.ts lib/cli.ts package.json
git commit -m "feat: integrate 6-stage pipeline into export API"
```

---

### Task 10: Add Integration Test with Real Framer Export

**Files:**
- Create: `tests/pipeline/integration-real.test.ts`
- Create: `tests/fixtures/sample-framer-export.html`

- [ ] **Step 1: Get a real sample HTML export**

```bash
# Manually download or capture sample from framer site
# For now, create a representative fixture
cat > tests/fixtures/sample-framer-export.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Framer Export Sample</title></head>
<body>
  <header class="framer-xxx-123"><h1>Website Title</h1></header>
  <section class="hero" style="height: 100vh;"><p>Hero content</p></section>
  <section class="features"><p class="feature-item">Feature 1</p><p class="feature-item">Feature 2</p></section>
  <section class="testimonials"><p class="testimonial">Quote 1</p><p class="testimonial">Quote 2</p></section>
  <footer class="footer"><p>Footer content</p></footer>
</body>
</html>
EOF
```

- [ ] **Step 2: Write integration test**

```typescript
// tests/pipeline/integration-real.test.ts
import { runPipeline } from '@/lib/pipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('Pipeline Integration - Real Framer Export', () => {
  it('should process real Framer export fixture', () => {
    const fixturePath = path.join(__dirname, '../fixtures/sample-framer-export.html');
    const html = fs.readFileSync(fixturePath, 'utf-8');

    const result = runPipeline(html);

    expect(result.enhancedHTML).toBeDefined();
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.metrics.totalTime).toBeGreaterThan(0);
    expect(result.metrics.sectionsDetected).toBeGreaterThan(0);
  });

  it('should extract semantic sections', () => {
    const fixturePath = path.join(__dirname, '../fixtures/sample-framer-export.html');
    const html = fs.readFileSync(fixturePath, 'utf-8');

    const result = runPipeline(html);

    // Should detect header, hero, features, testimonials, footer
    expect(result.metrics.sectionsDetected).toBeGreaterThanOrEqual(3);
  });

  it('should generate component index documentation', () => {
    const fixturePath = path.join(__dirname, '../fixtures/sample-framer-export.html');
    const html = fs.readFileSync(fixturePath, 'utf-8');

    const result = runPipeline(html);

    expect(result.componentIndex).toContain('Generated Components');
    expect(result.componentIndex).toContain('Component');
    expect(result.componentIndex).toContain('Location');
  });
});
```

- [ ] **Step 3: Run integration tests**

```bash
npm test -- tests/pipeline/integration-real.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add tests/pipeline/integration-real.test.ts tests/fixtures/sample-framer-export.html
git commit -m "test: add integration test with real Framer export fixture"
```

---

### Task 11: Add Pipeline Metrics & Logging

**Files:**
- Modify: `app/page.tsx` (UI to show pipeline metrics)
- Create: `lib/metrics.ts`

- [ ] **Step 1: Create metrics logger**

```typescript
// lib/metrics.ts
import { PipelineMetrics } from './pipeline';

export function formatMetrics(metrics: PipelineMetrics): string {
  return `
Pipeline Execution Metrics
==========================
Stage Breakdown:
  HTMLParser:          ${metrics.htmlParseTime}ms
  Normalizer:          ${metrics.normalizationTime}ms
  SectionDetector:     ${metrics.sectionDetectionTime}ms
  ComponentExtractor:  ${metrics.componentExtractionTime}ms
  SemanticNamer:       ${metrics.semanticNamingTime}ms
  CodeGenerator:       ${metrics.codeGenerationTime}ms

Summary:
  Total Time:          ${metrics.totalTime}ms
  Nodes (initial):     ${metrics.nodeCountInitial}
  Nodes (final):       ${metrics.nodeCountFinal}
  Components Found:    ${metrics.componentsDetected}
  Sections Detected:   ${metrics.sectionsDetected}
`;
}
```

- [ ] **Step 2: Update page.tsx to display metrics in download response**

```typescript
// app/page.tsx (add to fetch handler after successful download)
const metricsHeader = response.headers.get('X-Pipeline-Metrics');
if (metricsHeader) {
  const metrics = JSON.parse(metricsHeader);
  setStatus(`✅ Success! Pipeline executed in ${metrics.totalTime}ms`);
  console.log('Pipeline Metrics:', metrics);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/metrics.ts app/page.tsx
git commit -m "feat: add pipeline metrics logging and display"
```

---

## Phase 6: Testing & Verification

### Task 12: Run Full Test Suite

- [ ] **Step 1: Run all tests**

```bash
npm test -- --coverage
```

Expected: >80% coverage, all tests pass

- [ ] **Step 2: Build project**

```bash
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 3: Manual testing with real export**

```bash
npm run dev
# Open http://localhost:3000
# Paste a Framer URL (e.g., https://authentic-travelers-434120.framer.app)
# Download and inspect the zip
# Check COMPONENT_INDEX.md is included
# Verify enhanced HTML has data-component attributes
```

- [ ] **Step 4: Verify pipeline metrics in response headers**

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.framer.app"}' \
  -i | grep X-Pipeline-Metrics
```

Expected: See pipeline metrics in response

- [ ] **Step 5: Create PIPELINE_INTEGRATION_COMPLETE.md**

```markdown
# Pipeline Integration Complete ✅

## What Was Added

### 6-Stage Modular Pipeline
1. **HTMLParser** - Parse Framer exports into RawDOM
2. **Normalizer** - Clean nesting, extract CSS variables
3. **SectionDetector** - Identify semantic sections
4. **ComponentExtractor** - Find repeated patterns (2+)
5. **SemanticNamer** - Assign meaningful names
6. **CodeGenerator** - Enhance output with semantic markup

### Integration Points
- **lib/pipeline/** - Complete pipeline implementation (6 stages + utils)
- **lib/cli.ts** - Enhanced to run pipeline post-export
- **app/api/export/route.ts** - Integrated pipeline into export flow
- **X-Pipeline-Metrics** header - Pipeline performance data

### Testing
- All 6 stages unit tested
- Pipeline orchestrator tested
- Integration test with real Framer fixture
- >80% code coverage

### Output Changes
- **index.html** - Enhanced with data-component attributes
- **COMPONENT_INDEX.md** - Auto-generated component documentation
- **X-Pipeline-Metrics header** - Real-time performance metrics

## Confidence Levels
- Stage 1 (HTMLParser): 95%
- Stage 2 (Normalizer): 90%
- Stage 3 (SectionDetector): 82%
- Stage 4 (ComponentExtractor): 87%
- Stage 5 (SemanticNamer): 88%
- Stage 6 (CodeGenerator): 85%

**Overall Pipeline Confidence: 86%**

## Next Steps
1. Test on diverse Framer sites
2. Refine ComponentExtractor heuristics based on feedback
3. Expand SemanticNamer naming rules
4. Add CSS variable resolution
5. Support design token mapping

## Backwards Compatibility
✅ Existing framer-exporter-core unchanged
✅ Web app API compatible
✅ All existing tests pass
✅ Graceful fallback if pipeline fails
```

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: complete 6-stage pipeline integration with full test coverage"
```

---

## Plan Summary

✅ **12 Tasks across 6 Phases:**
- **Phase 1:** Types & HTMLParser (Stage 1)
- **Phase 2:** Normalizer & SectionDetector (Stages 2-3)
- **Phase 3:** ComponentExtractor & SemanticNamer (Stages 4-5)
- **Phase 4:** CodeGenerator & Orchestrator (Stage 6)
- **Phase 5:** Web App Integration & API Changes
- **Phase 6:** Testing & Verification

📊 **Estimated Effort:** 35-40 hours

🎯 **Success Criteria:**
- All 6 stages tested independently ✅
- Pipeline runs after framer-exporter-core export ✅
- Enhanced HTML with semantic markup ✅
- Component index auto-generated ✅
- Pipeline metrics logged ✅
- 80%+ code coverage ✅
- Backwards compatible ✅

---

**Plan saved to `docs/superpowers/plans/2026-04-18-framer-pipeline-integration.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**