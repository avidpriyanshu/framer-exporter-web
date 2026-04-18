import * as t from '@babel/types';
import generate from '@babel/generator';
import { SemanticTreeNode, EnhancedComponent } from '../pipeline/types';
import { extractAndMapStyles } from './style-generator';

export interface ComponentBoundary {
  name: string;
  type: 'leaf' | 'composite' | 'section';
  node: SemanticTreeNode;
  depth: number;
  children: ComponentBoundary[];
}

export function detectComponentBoundaries(
  node: SemanticTreeNode,
  depth: number = 0
): ComponentBoundary[] {
  const boundaries: ComponentBoundary[] = [];

  if (node.semanticName && node.semanticName !== 'Root') {
    const type = node.semanticType === 'section' ? 'section' : isLeafComponent(node) ? 'leaf' : 'composite';

    boundaries.push({
      name: node.semanticName,
      type,
      node,
      depth,
      children: [],
    });
  }

  node.children.forEach((child) => {
    const childBoundaries = detectComponentBoundaries(child, depth + 1);
    boundaries.push(...childBoundaries);
  });

  return boundaries;
}

function isLeafComponent(node: SemanticTreeNode): boolean {
  const leafTypes = ['Button', 'Input', 'Card', 'Badge', 'Icon', 'Link', 'Image'];
  return leafTypes.includes(node.semanticName || '');
}

/**
 * Converts a SemanticTreeNode into JSX content
 * Handles nested elements, text content, attributes, and styles
 */
function nodeToJSX(node: SemanticTreeNode, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  const nextIndent = '  '.repeat(depth + 1);

  // Build attributes string
  const attrs: string[] = [];

  // Add className from style extraction
  const styles = extractAndMapStyles(node);
  if (styles.tailwindClasses.length > 0) {
    attrs.push(`className="${styles.tailwindClasses.join(' ')}"`);
  }

  // Add other HTML attributes (excluding style which was processed)
  Object.entries(node.attributes).forEach(([key, value]) => {
    if (key !== 'style' && key !== 'class' && !key.startsWith('data-component')) {
      // Handle special attributes
      if (key === 'onclick' || key === 'onchange' || key === 'onsubmit') {
        // Convert to React event handler syntax
        const eventName = 'on' + key.substring(2);
        attrs.push(`${eventName}={handleEvent}`);
      } else if (key.startsWith('data-')) {
        attrs.push(`${key}="${value}"`);
      } else {
        attrs.push(`${key}="${value}"`);
      }
    }
  });

  const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

  // Build children content
  const children = node.children;
  const hasChildren = children.length > 0;
  const hasText = node.text && node.text.trim().length > 0;

  // Handle self-closing tags or empty elements
  if (!hasChildren && !hasText) {
    // Check if this is a self-closing tag
    const selfClosingTags = ['input', 'img', 'br', 'hr', 'meta', 'link'];
    if (selfClosingTags.includes(node.tag)) {
      return `<${node.tag}${attrString} />`;
    }
    return `<${node.tag}${attrString}></${node.tag}>`;
  }

  // Build the content (text + children)
  const contentParts: string[] = [];

  if (hasText && node.text) {
    contentParts.push(node.text.trim());
  }

  if (hasChildren) {
    const childJSX = children
      .map((child) => nodeToJSX(child, depth + 1))
      .join('\n' + nextIndent);
    contentParts.push(childJSX);
  }

  const content = contentParts.join('\n' + nextIndent);

  // Determine if we should use single-line or multi-line format
  const isSingleLine = !hasChildren && hasText && node.text && node.text.length < 60;

  if (isSingleLine && node.text) {
    return `<${node.tag}${attrString}>${node.text}</${node.tag}>`;
  }

  // Multi-line format
  if (hasChildren || (hasText && node.text && node.text.length >= 60)) {
    return `<${node.tag}${attrString}>\n${nextIndent}${content}\n${indent}</${node.tag}>`;
  }

  if (hasText && node.text) {
    return `<${node.tag}${attrString}>${node.text}</${node.tag}>`;
  }

  return `<${node.tag}${attrString}></${node.tag}>`;
}

export function generateReactComponent(node: SemanticTreeNode): string {
  const componentName = node.semanticName || 'Component';
  const props = inferComponentProps(node);
  const styles = extractAndMapStyles(node);

  // Generate JSX content from the node tree
  const jsxContent = nodeToJSX(node);

  // Create props interface with proper types
  const propsInterfaceBody = props.length > 0
    ? props.map((prop) => {
        const [propName, propType] = prop.split(':').map((s) => s.trim());
        return `  ${propName}: ${propType || 'string'};`;
      }).join('\n')
    : '';

  const propsInterface = props.length > 0
    ? `interface ${componentName}Props {
${propsInterfaceBody}
}\n`
    : '';

  // Extract prop names for function signature
  const destructuredProps = props.length > 0
    ? `{ ${props.map((p) => p.split(':')[0].trim()).join(', ')} }`
    : '';

  const functionSignature = props.length > 0
    ? `export default function ${componentName}(${destructuredProps}: ${componentName}Props) {`
    : `export default function ${componentName}() {`;

  // Build component code
  const code = `import React from 'react';

${propsInterface}${functionSignature}
  return (
    ${jsxContent}
  );
}
`;

  return code;
}

export function inferComponentProps(node: SemanticTreeNode): string[] {
  const props = new Set<string>();

  // From class names that indicate variants
  const className = node.attributes.class || '';
  if (className.includes('primary') || className.includes('secondary')) {
    props.add('variant: "primary" | "secondary"');
  }
  if (className.includes('small') || className.includes('large')) {
    props.add('size: "small" | "large"');
  }

  // From text content - make it a prop if it exists
  if (node.text) {
    props.add('label?: string');
  }

  // From href attribute
  if (node.attributes.href) {
    props.add('href?: string');
  }

  // From data attributes
  Object.keys(node.attributes).forEach((attr) => {
    if (attr.startsWith('data-') && !attr.startsWith('data-component')) {
      const propName = attr.replace('data-', '').replace(/-/g, (m, offset) => offset > 0 ? '' : m);
      props.add(`${propName}?: string`);
    }
  });

  // From event handlers
  if (node.attributes.onclick) {
    props.add('onClick?: () => void');
  }
  if (node.attributes.onchange) {
    props.add('onChange?: (value: any) => void');
  }

  return Array.from(props);
}
