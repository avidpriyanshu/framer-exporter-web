import { generateEnhancedOutput } from '@/lib/pipeline/stages/6-code-generator';
import { NamedTree, SemanticTreeNode } from '@/lib/pipeline/types';

describe('Stage 6: CodeGenerator', () => {
  it('should generate enhanced HTML with semantic names', () => {
    const namedTree: NamedTree = {
      tree: {
        tag: 'div',
        attributes: { id: 'root' },
        children: [],
        semanticName: 'Root',
        semanticType: 'div',
      } as SemanticTreeNode,
      namingMap: { root: 'Root' },
    };

    const result = generateEnhancedOutput(namedTree);

    expect(result.enhancedHTML).toContain('Root');
    expect(result.components).toBeDefined();
  });

  it('should generate component index documentation', () => {
    const namedTree: NamedTree = {
      tree: {
        tag: 'div',
        attributes: {},
        children: [],
        semanticName: 'Container',
        semanticType: 'div',
      } as SemanticTreeNode,
      namingMap: {},
    };

    const result = generateEnhancedOutput(namedTree);

    expect(result.componentIndex).toContain('Components');
    expect(result.metrics).toBeDefined();
  });
});
