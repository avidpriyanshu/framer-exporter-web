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
