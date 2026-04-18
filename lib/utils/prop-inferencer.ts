import { RawDOMNode } from '../pipeline/types';

export interface InferredProps {
  [key: string]: string | string[] | boolean | number;
}

/**
 * Infer props from a DOM node based on its attributes, classes, and content
 */
export function inferPropsFromNode(node: RawDOMNode): InferredProps {
  const props: InferredProps = {};

  // Extract from className
  const className = node.attributes.class || '';
  inferPropsFromClass(className, props);

  // Extract from text content
  if (node.text && node.text.trim()) {
    props.label = node.text.trim();
    props.children = node.text.trim();
  }

  // Extract from specific attributes
  if (node.attributes.href) {
    props.href = node.attributes.href;
  }

  if (node.attributes['data-value']) {
    props.value = node.attributes['data-value'];
  }

  if (node.attributes.placeholder) {
    props.placeholder = node.attributes.placeholder;
  }

  if (node.attributes.type) {
    props.type = node.attributes.type;
  }

  if (node.attributes.disabled !== undefined) {
    props.disabled = true;
  }

  if (node.attributes.required !== undefined) {
    props.required = true;
  }

  if (node.attributes['aria-label']) {
    props.ariaLabel = node.attributes['aria-label'];
  }

  // Extract alt text for images
  if (node.tag === 'img') {
    if (node.attributes.alt) {
      props.alt = node.attributes.alt;
    }
    if (node.attributes.src) {
      props.src = node.attributes.src;
    }
  }

  // Extract title and description
  if (node.attributes.title) {
    props.title = node.attributes.title;
  }

  // Add data attributes
  for (const [key, value] of Object.entries(node.attributes)) {
    if (key.startsWith('data-')) {
      const propName = key.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      props[propName] = value;
    }
  }

  return props;
}

/**
 * Infer component variant and size from class names
 */
function inferPropsFromClass(className: string, props: InferredProps): void {
  // Button variants
  if (className.includes('btn-primary')) {
    props.variant = 'primary';
  } else if (className.includes('btn-secondary')) {
    props.variant = 'secondary';
  } else if (className.includes('btn-tertiary')) {
    props.variant = 'tertiary';
  } else if (className.includes('btn-destructive')) {
    props.variant = 'destructive';
  }

  // Button sizes
  if (className.includes('btn-small')) {
    props.size = 'small';
  } else if (className.includes('btn-medium')) {
    props.size = 'medium';
  } else if (className.includes('btn-large')) {
    props.size = 'large';
  }

  // Common semantic classes
  if (className.includes('active')) {
    props.active = true;
  }

  if (className.includes('selected')) {
    props.selected = true;
  }

  if (className.includes('loading')) {
    props.loading = true;
  }

  if (className.includes('error')) {
    props.error = true;
  }

  if (className.includes('success')) {
    props.success = true;
  }

  // Extract color from class
  const colorMatch = className.match(/(?:text|bg|border)-([\w-]+)/);
  if (colorMatch && !props.color) {
    props.color = colorMatch[1];
  }

  // Extract spacing from class (margin, padding)
  const marginMatch = className.match(/m[xy]?-(\d+)/);
  if (marginMatch) {
    props.margin = marginMatch[1];
  }

  const paddingMatch = className.match(/p[xy]?-(\d+)/);
  if (paddingMatch) {
    props.padding = paddingMatch[1];
  }

  // Check for flex layout
  if (className.includes('flex')) {
    props.display = 'flex';
  }

  // Check for grid layout
  if (className.includes('grid')) {
    props.display = 'grid';
  }

  // Extract alignment
  if (className.includes('justify-center')) {
    props.justifyContent = 'center';
  } else if (className.includes('justify-between')) {
    props.justifyContent = 'space-between';
  } else if (className.includes('justify-end')) {
    props.justifyContent = 'flex-end';
  }

  if (className.includes('items-center')) {
    props.alignItems = 'center';
  } else if (className.includes('items-end')) {
    props.alignItems = 'flex-end';
  } else if (className.includes('items-start')) {
    props.alignItems = 'flex-start';
  }
}

/**
 * Infer which component type this node should become based on its structure
 */
export function inferComponentType(node: RawDOMNode): string {
  const tag = node.tag.toLowerCase();
  const className = node.attributes.class || '';
  const id = node.attributes.id || '';

  // Direct tag mapping
  if (tag === 'button') return 'Button';
  if (tag === 'a') return 'Link';
  if (tag === 'img') return 'Image';
  if (tag === 'input') return 'Input';
  if (tag === 'textarea') return 'TextArea';
  if (tag === 'select') return 'Select';
  if (tag === 'header') return 'Header';
  if (tag === 'footer') return 'Footer';
  if (tag === 'nav') return 'Navigation';
  if (tag === 'form') return 'Form';
  if (tag === 'table') return 'Table';
  if (tag === 'ul' || tag === 'ol') return 'List';
  if (tag === 'li') return 'ListItem';

  // Class-based inference
  if (className.includes('card')) return 'Card';
  if (className.includes('modal')) return 'Modal';
  if (className.includes('dropdown')) return 'Dropdown';
  if (className.includes('menu')) return 'Menu';
  if (className.includes('badge')) return 'Badge';
  if (className.includes('alert')) return 'Alert';
  if (className.includes('hero')) return 'Hero';
  if (className.includes('footer')) return 'Footer';
  if (className.includes('navbar')) return 'Navbar';

  // ID-based inference
  if (id.includes('header')) return 'Header';
  if (id.includes('footer')) return 'Footer';
  if (id.includes('nav')) return 'Navigation';
  if (id.includes('main')) return 'Container';
  if (id.includes('sidebar')) return 'Sidebar';

  // Default to generic Container or Section
  if (tag === 'div') {
    if (node.children.length > 0) return 'Container';
    return 'Spacer';
  }

  if (tag === 'span' || tag === 'p') return 'Text';

  return 'Component';
}

/**
 * Extract multiple nodes and infer common props pattern
 */
export function inferPropsPattern(nodes: RawDOMNode[]): Record<string, string[]> {
  const propPatterns: Record<string, Set<string>> = {};

  for (const node of nodes) {
    const props = inferPropsFromNode(node);
    for (const [key, value] of Object.entries(props)) {
      if (!propPatterns[key]) {
        propPatterns[key] = new Set();
      }
      if (typeof value === 'string') {
        propPatterns[key].add(value);
      }
    }
  }

  // Convert sets to arrays
  const result: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(propPatterns)) {
    result[key] = Array.from(values);
  }

  return result;
}
