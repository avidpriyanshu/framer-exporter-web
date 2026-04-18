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
