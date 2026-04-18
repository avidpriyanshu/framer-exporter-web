import { generateWebComponent } from '../web-component-generator';
import { SemanticTreeNode } from '../../pipeline/types';

describe('generateWebComponent', () => {
  it('should generate a custom element class', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: { class: 'btn-primary' },
      children: [],
      text: 'Click me',
    };

    const code = generateWebComponent(node);
    expect(code).toContain('customElements.define');
    expect(code).toContain('class Button extends HTMLElement');
  });

  it('should include connectedCallback lifecycle', () => {
    const node: SemanticTreeNode = {
      tag: 'button',
      semanticName: 'Button',
      attributes: {},
      children: [],
    };

    const code = generateWebComponent(node);
    expect(code).toContain('connectedCallback');
    expect(code).toContain('attachShadow');
  });
});
