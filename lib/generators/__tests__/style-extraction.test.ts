import { extractAndMapStyles } from '../style-generator';
import { SemanticTreeNode } from '../../pipeline/types';

describe('extractAndMapStyles', () => {
  it('should extract and map inline styles to Tailwind', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      attributes: { style: 'background: #ff0000; padding: 16px' },
      children: [],
    };

    const result = extractAndMapStyles(node);
    expect(result.tailwindClasses).toContain('bg-red-600');
    expect(result.tailwindClasses).toContain('p-4');
  });

  it('should generate CSS module for unmapped styles', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      attributes: { style: 'background: linear-gradient(...)' },
      children: [],
    };

    const result = extractAndMapStyles(node);
    expect(result.cssModule).toBeDefined();
  });

  it('should return empty tailwindClasses for nodes without styles', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      attributes: {},
      children: [],
    };

    const result = extractAndMapStyles(node);
    expect(result.tailwindClasses).toEqual([]);
    expect(result.cssModule).toBeUndefined();
  });

  it('should handle mixed mapped and unmapped styles', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      attributes: {
        style: 'padding: 16px; background: linear-gradient(to right, #ff0000, #0000ff);',
      },
      children: [],
    };

    const result = extractAndMapStyles(node);
    expect(result.tailwindClasses).toContain('p-4');
    expect(result.cssModule).toBeDefined();
    expect(result.moduleClassName).toBeDefined();
  });

  it('should use provided class name for CSS module class name', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      attributes: {
        class: 'header',
        style: 'background: linear-gradient(to right, #ff0000, #0000ff);',
      },
      children: [],
    };

    const result = extractAndMapStyles(node);
    expect(result.moduleClassName).toBe('header-styles');
  });
});
