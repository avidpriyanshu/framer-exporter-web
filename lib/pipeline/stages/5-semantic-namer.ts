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
