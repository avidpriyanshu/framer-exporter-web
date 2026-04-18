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

  it('should convert HTML attributes to React camelCase', () => {
    const node: SemanticTreeNode = {
      tag: 'input',
      semanticName: 'FormInput',
      attributes: {
        tabindex: '0',
        readonly: 'true',
        maxlength: '100',
        autocomplete: 'off',
      },
      children: [],
    };

    const code = generateReactComponent(node);
    expect(code).toContain('tabIndex={0}');
    expect(code).not.toContain('tabindex=');
    expect(code).toContain('readOnly={true}');
    expect(code).not.toContain('readonly=');
    expect(code).toContain('maxLength={100}');
    expect(code).not.toContain('maxlength=');
    expect(code).toContain('autoComplete=');
    expect(code).not.toContain('autocomplete=');
  });

  it('should map invalid Framer elements to valid HTML', () => {
    const node: SemanticTreeNode = {
      tag: 'text',
      semanticName: 'TextElement',
      attributes: {},
      children: [],
      text: 'Book a call',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('<span>');
    expect(code).toContain('Book a call');
    expect(code).toContain('</span>');
    expect(code).not.toContain('<text>');
  });

  it('should handle onclick event handler properly', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'ActionButton',
      attributes: {
        onclick: 'handleClick',
      },
      children: [],
      text: 'Action',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('onClick={() => {}}');
    expect(code).not.toContain('onclick=');
  });

  it('should handle onchange event handler properly', () => {
    const node: SemanticTreeNode = {
      tag: 'input',
      semanticName: 'FormField',
      attributes: {
        onchange: 'handleChange',
        type: 'text',
      },
      children: [],
    };

    const code = generateReactComponent(node);
    expect(code).toContain('onChange={() => {}}');
    expect(code).not.toContain('onchange=');
    expect(code).toContain('type=');
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

  it('should map frame element to div', () => {
    const node: SemanticTreeNode = {
      tag: 'frame',
      semanticName: 'Card',
      attributes: {},
      children: [],
      text: 'Frame content',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('<div');
    expect(code).not.toContain('<frame>');
    expect(code).toContain('Frame content');
  });

  it('should map group element to div', () => {
    const node: SemanticTreeNode = {
      tag: 'group',
      semanticName: 'Group',
      attributes: {},
      children: [],
      text: 'Group content',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('<div');
    expect(code).not.toContain('<group>');
  });

  it('should handle multiple invalid elements in nested tree', () => {
    const node: SemanticTreeNode = {
      tag: 'frame',
      semanticName: 'Container',
      attributes: {},
      children: [
        {
          tag: 'text',
          semanticName: undefined,
          attributes: {},
          children: [],
          text: 'Title',
        },
        {
          tag: 'group',
          semanticName: undefined,
          attributes: {},
          children: [],
          text: 'Content',
        },
      ],
    };

    const code = generateReactComponent(node);
    expect(code).toContain('<div');
    expect(code).toContain('<span>');
    expect(code).toContain('Title');
    expect(code).toContain('Content');
    expect(code).not.toContain('<frame>');
    expect(code).not.toContain('<text>');
    expect(code).not.toContain('<group>');
  });

  it('should handle link with tabindex and rel attributes', () => {
    const node: SemanticTreeNode = {
      tag: 'a',
      semanticName: 'Link',
      attributes: {
        href: '/contact',
        tabindex: '0',
        rel: 'noopener noreferrer',
      },
      children: [],
      text: 'Click here',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('<a');
    expect(code).toContain('href="/contact"');
    expect(code).toContain('tabIndex={0}');
    expect(code).not.toContain('tabindex=');
    expect(code).toContain('rel=');
    expect(code).toContain('Click here');
  });

  it('should preserve data attributes as-is', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'DataDiv',
      attributes: {
        'data-highlight': 'true',
        'data-framer-name': 'Element',
      },
      children: [],
      text: 'Data element',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('data-highlight=');
    expect(code).toContain('data-framer-name=');
  });

  it('should handle for attribute conversion to htmlFor', () => {
    const node: SemanticTreeNode = {
      tag: 'label',
      semanticName: 'Label',
      attributes: {
        for: 'email-input',
      },
      children: [],
      text: 'Email',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('htmlFor=');
    expect(code).not.toContain('for=');
  });

  it('should handle nested text element (Framer-specific)', () => {
    const node: SemanticTreeNode = {
      tag: 'p',
      semanticName: 'P821',
      attributes: { 'data-styles-preset': 'wAv3gn1J4' },
      children: [
        {
          tag: 'text',
          semanticName: undefined,
          attributes: {},
          children: [],
          text: 'Revisions and feedback are crucial.',
        },
      ],
    };

    const code = generateReactComponent(node);
    // Should convert <text> to <span>
    expect(code).toContain('<span>');
    expect(code).toContain('Revisions and feedback');
    expect(code).not.toContain('<text>');
    expect(code).toContain('</span>');
  });

  it('should convert tabindex to tabIndex in links', () => {
    const node: SemanticTreeNode = {
      tag: 'a',
      semanticName: 'Link',
      attributes: {
        href: '/contact',
        tabindex: '0',
        target: '_blank',
      },
      children: [],
      text: 'Contact',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('tabIndex={0}');
    expect(code).not.toContain('tabindex=');
    expect(code).toContain('target="_blank"');
    expect(code).toContain('href="/contact"');
  });
});
