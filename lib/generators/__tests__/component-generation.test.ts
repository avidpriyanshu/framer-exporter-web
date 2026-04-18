import { generateReactComponent } from '../component-generator';
import { SemanticTreeNode } from '../../pipeline/types';

describe('generateReactComponent', () => {
  it('should generate a valid React component', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-primary' },
      children: [],
      text: 'Click me',
    };

    const code = generateReactComponent(node);
    expect(code).toContain('export default function Button');
    expect(code).toContain('React');
  });

  it('should include TypeScript props interface', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-primary' },
      children: [],
    };

    const code = generateReactComponent(node);
    expect(code).toContain('interface ButtonProps');
  });

  it('should include Tailwind classes in JSX', () => {
    const node: SemanticTreeNode = {
      tag: 'div',
      semanticName: 'Card',
      attributes: { style: 'padding: 16px; background: #ffffff' },
      children: [],
    };

    const code = generateReactComponent(node);
    expect(code).toContain('className=');
  });
});
