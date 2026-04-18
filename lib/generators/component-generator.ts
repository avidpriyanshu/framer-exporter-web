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
 * Converts HTML attribute names to React camelCase equivalents
 * Maps common HTML attributes to their React names
 */
export function convertAttributeToReact(name: string): string {
  const attributeMap: Record<string, string> = {
    'tabindex': 'tabIndex',
    'contenteditable': 'contentEditable',
    'spellcheck': 'spellCheck',
    'readonly': 'readOnly',
    'maxlength': 'maxLength',
    'for': 'htmlFor',
    'class': 'className',
    'autofocus': 'autoFocus',
    'autocomplete': 'autoComplete',
    'formaction': 'formAction',
    'formenctype': 'formEncType',
    'formmethod': 'formMethod',
    'formnovalidate': 'formNoValidate',
    'formtarget': 'formTarget',
    'novalidate': 'noValidate',
    'accept-charset': 'acceptCharset',
    'http-equiv': 'httpEquiv',
  };

  return attributeMap[name.toLowerCase()] || name;
}

/**
 * Checks if a tag is a valid HTML element
 */
export function isValidHTMLElement(tag: string): boolean {
  const validElements = new Set([
    'div', 'span', 'p', 'a', 'button', 'input', 'img', 'svg', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'nav', 'section', 'article',
    'form', 'label', 'textarea', 'select', 'option', 'table', 'tr', 'td', 'th',
    'iframe', 'video', 'audio', 'canvas', 'main', 'aside', 'footer', 'address',
    'blockquote', 'code', 'pre', 'hr', 'br', 'strong', 'em', 'b', 'i', 'u',
    'small', 'mark', 'del', 'ins', 'sub', 'sup', 'figure', 'figcaption',
    // SVG elements
    'g', 'line', 'polyline', 'polygon', 'circle', 'rect', 'ellipse', 'path',
    'text', 'tspan', 'defs', 'use', 'symbol', 'clipPath', 'mask', 'linearGradient',
    'radialGradient', 'stop', 'pattern', 'style', 'desc', 'title',
  ]);
  return validElements.has(tag.toLowerCase());
}

/**
 * Maps invalid/Framer-specific elements to valid HTML elements
 */
export function mapInvalidElement(tag: string): string {
  const mapping: Record<string, string> = {
    'text': 'span',           // Framer text element
    'component': 'div',       // Framer component
    'frame': 'div',           // Framer frame
    'group': 'div',           // Framer group
    'instance': 'div',        // Framer instance
    'scrollcontainer': 'div', // Framer scroll
  };

  return mapping[tag.toLowerCase()] || 'div';  // Default to div
}

/**
 * Converts a SemanticTreeNode into JSX content
 * Handles nested elements, text content, attributes, and styles
 * Properly converts HTML attributes to React camelCase syntax
 */
function nodeToJSX(node: SemanticTreeNode, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  const nextIndent = '  '.repeat(depth + 1);

  // Validate and map element tag
  let elementTag = node.tag;
  if (!isValidHTMLElement(elementTag)) {
    elementTag = mapInvalidElement(elementTag);
  }

  // Build attributes string
  const attrs: string[] = [];

  // Add className from style extraction
  const styles = extractAndMapStyles(node);
  if (styles.tailwindClasses.length > 0) {
    attrs.push(`className="${styles.tailwindClasses.join(' ')}"`);
  }

  // Check if this is an SVG element (SVG elements don't need camelCase conversion)
  const isSVGElement = elementTag === 'svg' || ['g', 'line', 'polyline', 'polygon', 'circle', 'rect', 'ellipse', 'path', 'text', 'tspan', 'defs', 'use', 'symbol', 'clipPath', 'mask', 'linearGradient', 'radialGradient', 'stop', 'pattern'].includes(elementTag);

  // Add other HTML/SVG attributes (excluding style which was processed)
  Object.entries(node.attributes).forEach(([key, value]) => {
    if (key !== 'style' && key !== 'class' && !key.startsWith('data-component')) {
      // SVG attributes preserve their names (stroke-width stays as-is, not stroked-width)
      const attrName = isSVGElement ? key : convertAttributeToReact(key);

      // Skip event handlers (onclick, onchange, etc.) - convert to React event syntax
      if (key.toLowerCase().startsWith('on')) {
        // For onclick → onClick, onchange → onChange, etc.
        const eventName = key.substring(2).charAt(0).toUpperCase() + key.substring(3);
        attrs.push(`on${eventName}={() => {}}`);
      } else if (key.startsWith('data-')) {
        // Data attributes remain as-is
        attrs.push(`${key}="${value}"`);
      } else if (value === 'true' || value === 'false') {
        // Boolean attributes
        attrs.push(`${attrName}={${value}}`);
      } else if (!isNaN(Number(value)) && value !== '') {
        // Numeric attributes
        attrs.push(`${attrName}={${value}}`);
      } else {
        // String attributes
        attrs.push(`${attrName}="${value}"`);
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
    const selfClosingTags = new Set(['input', 'img', 'br', 'hr', 'meta', 'link']);
    if (selfClosingTags.has(elementTag)) {
      return `<${elementTag}${attrString} />`;
    }
    return `<${elementTag}${attrString}></${elementTag}>`;
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
    return `${indent}<${elementTag}${attrString}>${node.text}</${elementTag}>`;
  }

  // Multi-line format
  if (hasChildren || (hasText && node.text && node.text.length >= 60)) {
    return `${indent}<${elementTag}${attrString}>\n${nextIndent}${content}\n${indent}</${elementTag}>`;
  }

  if (hasText && node.text) {
    return `${indent}<${elementTag}${attrString}>${node.text}</${elementTag}>`;
  }

  return `${indent}<${elementTag}${attrString}></${elementTag}>`;
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

  // Extract prop names for function signature (remove optional markers for destructuring)
  const destructuredProps = props.length > 0
    ? `{ ${props.map((p) => p.split(':')[0].trim().replace(/\?$/, '')).join(', ')} }`
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
