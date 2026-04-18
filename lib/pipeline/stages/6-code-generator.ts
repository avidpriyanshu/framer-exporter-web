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
