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
