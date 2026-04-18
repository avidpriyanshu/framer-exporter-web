import { NamedTree, ProductionOutput, SemanticTreeNode, EnhancedComponent } from '../types';
import { scaffoldNextjsProject } from '../../generators/project-scaffolder';
import { detectComponentBoundaries, ComponentBoundary, generateReactComponent } from '../../generators/component-generator';
import { extractDesignTokens, generateTokenCSS } from '../../generators/token-generator';
import { extractAndMapStyles } from '../../generators/style-generator';
import { validateGeneratedCode } from '../../generators/validator';

/**
 * Stage 7: Code Generator
 * Transforms the semantically-named tree into production-ready code with:
 * - Component extraction and React code generation
 * - Design token extraction and CSS variable generation
 * - Next.js project scaffolding
 * - Code validation and formatting
 */
export async function generateProductionCode(
  namedTree: NamedTree
): Promise<ProductionOutput> {
  // Extract component boundaries from the semantic tree
  const boundaries = detectComponentBoundaries(namedTree.tree);

  // Serialize tree for token extraction
  const html = serializeTree(namedTree.tree);

  // Extract design tokens from HTML and inline styles
  const designTokens = extractDesignTokens(html);
  const cssVariables = generateTokenCSS(designTokens);

  // Build enhanced components from boundaries
  const components = boundaries
    .filter((b) => b.type !== 'section')
    .map((boundary) => ({
      name: boundary.name,
      path: `${boundary.name}.tsx`,
      code: generateComponentCode(boundary),
      props: extractComponentProps(boundary.node),
    }));

  // Validate generated code and apply formatting
  const validatedComponents = components.map((component) => {
    const validation = validateGeneratedCode(component.code);
    if (!validation.isValid) {
      console.warn(`Validation issues in ${component.name}:`, validation.errors);
    }
    return {
      ...component,
      code: validation.formatted,
    };
  });

  // Scaffold Next.js project with components
  const projectName = 'framer-export';
  const output = scaffoldNextjsProject(projectName, validatedComponents);

  // Attach tokens and variables
  output.designTokens = designTokens;
  output.cssVariables = cssVariables;
  output.metadata.tokensExtracted = Object.keys(designTokens.colors).length;
  output.metadata.estimatedBundleSize = calculateBundleSize(output);

  return output;
}

/**
 * Serializes the semantic tree into HTML for token extraction
 */
function serializeTree(node: SemanticTreeNode): string {
  const serialize = (n: SemanticTreeNode): string => {
    const dataAttr = n.semanticName ? ` data-component="${n.semanticName}"` : '';
    const attrs = Object.entries(n.attributes)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');

    const children = n.children.map(serialize).join('');
    const text = n.text || '';

    return `<${n.tag}${dataAttr}${attrs}>${text}${children}</${n.tag}>`;
  };

  return serialize(node);
}

/**
 * Generates React component code from a component boundary
 * Uses the improved generateReactComponent function to produce actual JSX content
 */
function generateComponentCode(boundary: ComponentBoundary): string {
  const { name, node } = boundary;

  // Use the improved component generator that produces actual JSX
  return generateReactComponent(node);
}

/**
 * Extracts prop names from a node's attributes and children
 */
function extractComponentProps(node: SemanticTreeNode): string[] {
  const props = new Set<string>();

  // Check for data attributes that indicate props
  Object.keys(node.attributes).forEach((attr) => {
    if (attr.startsWith('data-')) {
      const propName = attr
        .substring(5)
        .split('-')
        .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
        .join('');
      props.add(propName);
    }
  });

  // Common interactive attributes
  if (node.attributes.onclick) props.add('onClick');
  if (node.attributes.onchange) props.add('onChange');
  if (node.attributes.onsubmit) props.add('onSubmit');

  return Array.from(props);
}

/**
 * Calculates estimated bundle size for the output
 */
function calculateBundleSize(output: ProductionOutput): number {
  const codeSize = output.components.reduce((sum, c) => sum + c.code.length, 0);
  const tokenSize = JSON.stringify(output.designTokens).length;
  const cssSize = output.cssVariables.length;

  return codeSize + tokenSize + cssSize;
}

export type { ProductionOutput } from '../types';
