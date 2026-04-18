import { inferComponentProps } from '../component-generator';
import { SemanticTreeNode } from '../../pipeline/types';

describe('inferComponentProps', () => {
  it('should infer button variant from class name', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-primary' },
      children: [],
      text: 'Click me',
    };

    const props = inferComponentProps(node);
    expect(props).toContain('variant: "primary" | "secondary"');
    expect(props).toContain('label?: string');
  });

  it('should infer size from class name', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-large' },
      children: [],
    };

    const props = inferComponentProps(node);
    expect(props).toContain('size: "small" | "large"');
  });

  it('should infer href prop from attributes', () => {
    const node: SemanticTreeNode = {
      tag: 'a',
      semanticName: 'Link',
      attributes: { href: '/about' },
      children: [],
      text: 'About',
    };

    const props = inferComponentProps(node);
    expect(props).toContain('href?: string');
    expect(props).toContain('label?: string');
  });

  it('should infer data attributes as props', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Card',
      attributes: { 'data-testid': 'card', 'data-role': 'presentation' },
      children: [],
    };

    const props = inferComponentProps(node);
    expect(props).toContain('testid?: string');
    expect(props).toContain('role?: string');
  });

  it('should handle node without text content', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Container',
      attributes: {},
      children: [],
    };

    const props = inferComponentProps(node);
    expect(props.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle multiple variant classes', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-primary btn-large' },
      children: [],
      text: 'Action',
    };

    const props = inferComponentProps(node);
    expect(props).toContain('variant: "primary" | "secondary"');
    expect(props).toContain('size: "small" | "large"');
  });
});
