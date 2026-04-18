import { SemanticTreeNode, EnhancedComponent } from '../pipeline/types';

export interface ComponentBoundary {
  name: string;
  type: 'leaf' | 'composite' | 'section';
  node: SemanticTreeNode;
  depth: number;
  children: ComponentBoundary[];
}

export function detectComponentBoundaries(
  node: SemanticTreeNode,
  depth: number = 0
): ComponentBoundary[] {
  const boundaries: ComponentBoundary[] = [];

  if (node.semanticName && node.semanticName !== 'Root') {
    const type = node.semanticType === 'section' ? 'section' : isLeafComponent(node) ? 'leaf' : 'composite';

    boundaries.push({
      name: node.semanticName,
      type,
      node,
      depth,
      children: [],
    });
  }

  node.children.forEach((child) => {
    const childBoundaries = detectComponentBoundaries(child, depth + 1);
    boundaries.push(...childBoundaries);
  });

  return boundaries;
}

function isLeafComponent(node: SemanticTreeNode): boolean {
  const leafTypes = ['Button', 'Input', 'Card', 'Badge', 'Icon', 'Link', 'Image'];
  return leafTypes.includes(node.semanticName || '');
}

export function generateReactComponent(node: SemanticTreeNode): string {
  const boundaries = detectComponentBoundaries(node);
  if (boundaries.length === 0) return '';

  const componentName = boundaries[0].name;
  const isLeaf = boundaries[0].type === 'leaf';

  return `export default function ${componentName}(props: any) {
  return <div>{/* Component implementation */}</div>;
}`;
}
