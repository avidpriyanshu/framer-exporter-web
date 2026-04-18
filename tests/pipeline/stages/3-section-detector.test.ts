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
