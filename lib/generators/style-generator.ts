import { SemanticTreeNode } from '../pipeline/types';
import { inlineStyleToTailwind } from '../utils/tailwind-mapper';

export interface StyleOutput {
  tailwindClasses: string[];
  cssModule?: string;
  moduleClassName?: string;
}

export function extractAndMapStyles(node: SemanticTreeNode): StyleOutput {
  const styleAttr = node.attributes.style || '';
  if (!styleAttr) return { tailwindClasses: [] };

  const { tailwindClasses, unmappedStyles } = inlineStyleToTailwind(styleAttr);

  if (Object.keys(unmappedStyles).length === 0) {
    return { tailwindClasses };
  }

  // Generate CSS module for unmapped styles
  const moduleClassName = `${node.attributes.class || 'element'}-styles`;
  const cssModule = generateCSSModule(moduleClassName, unmappedStyles);

  return {
    tailwindClasses,
    cssModule,
    moduleClassName,
  };
}

function generateCSSModule(
  className: string,
  styles: Record<string, string>
): string {
  const cssRules = Object.entries(styles)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n');

  return `.${className} {
${cssRules}
}`;
}
