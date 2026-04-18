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
