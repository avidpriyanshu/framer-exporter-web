import { generateReactComponent } from '../component-generator';
import { SemanticTreeNode } from '../../pipeline/types';

describe('generateReactComponent', () => {
  it('should generate a valid React component with actual JSX', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-primary' },
      children: [],
      text: 'Click me',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('export default function Button');
    expect(code).toContain('import React');
    // Verify it contains actual button JSX, not stubs
    expect(code).toContain('<button');
    expect(code).toContain('Click me');
    expect(code).not.toContain('auto-generated');
  });

  it('should include TypeScript props interface when props exist', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-primary' },
      children: [],
      text: 'Click me',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('interface ButtonProps');
  });

  it('should not include props interface when no props detected', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Spacer',
      attributes: {},
      children: [],
    };

    const code = generateReactComponent(node);
    expect(code).toContain('export default function Spacer()');
  });

  it('should include Tailwind classes in JSX when styles map to Tailwind', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Card',
      attributes: { style: 'padding: 16px' },
      children: [],
    };

    const code = generateReactComponent(node);
    // Should have Tailwind class for padding: 16px
    expect(code).toContain('className=');
    expect(code).toContain('p-4');
  });

  it('should generate JSX for nested elements', () => {
    const childNode: SemanticTreeNode = {
      tag: 'span',
      semanticName: undefined,
      attributes: {},
      children: [],
      text: 'Child text',
    };

    const parentNode: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Container',
      attributes: { style: 'padding: 16px' },
      children: [childNode],
    };

    const code = generateReactComponent(parentNode);
    expect(code).toContain('<div');
    expect(code).toContain('<span');
    expect(code).toContain('Child text');
    expect(code).toContain('</span>');
    expect(code).toContain('</div>');
  });

  it('should handle button with onClick handler', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'ActionButton',
      attributes: { onclick: 'handleClick' },
      children: [],
      text: 'Action',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('onClick');
    expect(code).toContain('interface ActionButtonProps');
    expect(code).toContain('onClick?: () => void');
  });

  it('should generate proper JSX structure without auto-generated comments', () => {
    const node: SemanticTreeNode = {
      tag: 'section',
      semanticName: 'HeroSection',
      attributes: { style: 'padding: 32px' },
      children: [
        {
          tag: 'h1',
          semanticName: undefined,
          attributes: {},
          children: [],
          text: 'Welcome',
        },
        {
          tag: 'p',
          semanticName: undefined,
          attributes: {},
          children: [],
          text: 'This is a section.',
        },
      ],
    };

    const code = generateReactComponent(node);
    // Should not contain stub comments
    expect(code).not.toContain('auto-generated');
    expect(code).not.toContain('Component content');
    // Should contain actual JSX
    expect(code).toContain('<section');
    expect(code).toContain('<h1');
    expect(code).toContain('Welcome');
    expect(code).toContain('<p');
    expect(code).toContain('This is a section');
  });

  it('should generate component with variant props', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-primary' },
      children: [],
      text: 'Click me',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('variant');
    expect(code).toContain('"primary" | "secondary"');
  });

  it('should properly format JSX with indentation', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'FormField',
      attributes: {},
      children: [
        {
          tag: 'label',
          semanticName: undefined,
          attributes: {},
          children: [],
          text: 'Email:',
        },
        {
          tag: 'input',
          semanticName: undefined,
          attributes: { type: 'email' },
          children: [],
        },
      ],
    };

    const code = generateReactComponent(node);
    // Check proper structure exists (actual JSX, not stubs)
    expect(code).toContain('<div');
    expect(code).toContain('<label');
    expect(code).toContain('Email:');
    expect(code).toContain('<input');
    expect(code).toContain('type=');
  });
});
