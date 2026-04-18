import { generateProductionCode } from '../stages/7-code-generator';
import { NamedTree, SemanticTreeNode } from '../types';

describe('Stage 7: Production Code Generator Integration', () => {
  it('should generate a complete Next.js project structure', async () => {
    const mockNode: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Root',
      attributes: {},
      children: [
        {
          tag: 'button',
          semanticName: 'Button',
          attributes: { class: 'btn-primary' },
          children: [],
          text: 'Click me',
        },
      ],
    };

    const namedTree: NamedTree = {
      tree: mockNode,
      namingMap: { 'button-1': 'Button' },
    };

    const output = await generateProductionCode(namedTree);

    expect(output.projectName).toBe('framer-export');
    expect(output.components.length).toBeGreaterThan(0);
    expect(output.designTokens.colors).toBeDefined();
    expect(output.cssVariables).toContain('--color-');
  });

  it('should generate valid TypeScript components', async () => {
    const mockNode: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Root',
      attributes: {},
      children: [
        {
          tag: 'div',
          semanticName: 'Card',
          attributes: { style: 'padding: 16px' },
          children: [],
        },
      ],
    };

    const namedTree: NamedTree = {
      tree: mockNode,
      namingMap: {},
    };

    const output = await generateProductionCode(namedTree);
    const cardComponent = output.components.find((c) => c.name === 'Card');

    expect(cardComponent).toBeDefined();
    expect(cardComponent!.code).toContain('export default');
    expect(cardComponent!.code).toContain('function Card');
  });
});
