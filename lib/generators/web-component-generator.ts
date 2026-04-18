import { SemanticTreeNode } from '../pipeline/types';

export function generateWebComponent(node: SemanticTreeNode): string {
  const tagName = `humble-${kebabCase(node.semanticName || 'element')}`;
  const className = node.semanticName || 'Element';

  return `
if (!customElements.get('${tagName}')) {
  customElements.define('${tagName}', class ${className} extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const root = this.attachShadow({ mode: 'open' });
      const label = this.getAttribute('label') || '${node.text || 'Button'}';

      root.innerHTML = \`
        <style>
          :host {
            display: inline-block;
          }
          button {
            padding: 8px 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
          }
        </style>
        <button>\${label}</button>
      \`;
    }
  });
}
`;
}

function kebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}
