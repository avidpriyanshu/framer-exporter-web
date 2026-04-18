import { RawDOMNode, CleanedTree } from '../types';
import { flattenDeepNesting } from '../../utils/depth-flattener';
import { extractCSSVariables, removeFramerClasses } from '../../utils/css-parser';

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
