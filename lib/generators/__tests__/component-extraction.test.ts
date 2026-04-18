import { detectComponentBoundaries } from '../component-generator';
import { SemanticTreeNode } from '../../pipeline/types';

describe('detectComponentBoundaries', () => {
  it('should identify leaf components by semantic name', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Button',
      semanticType: 'leaf',
      attributes: {},
      children: [],
    };

    const boundaries = detectComponentBoundaries(node);
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].name).toBe('Button');
  });

  it('should identify section components', () => {
    const node: SemanticTreeNode = {
      tag: 'section',
      semanticName: 'HeroSection',
      semanticType: 'section',
      attributes: {},
      children: [],
    };

    const boundaries = detectComponentBoundaries(node);
    expect(boundaries[0].type).toBe('section');
  });

  it('should recursively find nested components', () => {
    const buttonNode: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: {},
      children: [],
    };

    const parentNode: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Card',
      attributes: {},
      children: [buttonNode],
    };

    const boundaries = detectComponentBoundaries(parentNode);
    expect(boundaries.length).toBeGreaterThanOrEqual(2);
  });
});
