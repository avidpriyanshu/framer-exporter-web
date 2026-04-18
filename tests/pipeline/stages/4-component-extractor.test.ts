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
