import { RawDOMNode } from '../pipeline/types';

const MAX_DEPTH = 4;

export function flattenDeepNesting(tree: RawDOMNode): { tree: RawDOMNode; flattenedCount: number } {
  let flattenedCount = 0;

  function flatten(node: RawDOMNode, depth: number): RawDOMNode {
    if (depth > MAX_DEPTH && node.children.length === 1 && !node.text && node.tag === 'div') {
      flattenedCount++;
      return flatten(node.children[0], depth);
    }

    return {
      ...node,
      children: node.children.map((child) => flatten(child, depth + 1)),
    };
  }

  return { tree: flatten(tree, 0), flattenedCount };
}
