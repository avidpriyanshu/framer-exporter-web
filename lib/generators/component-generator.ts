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

export function generateReactComponent(node: SemanticTreeNode): string {
  const componentName = node.semanticName || 'Component';
  const props = inferComponentProps(node);
  const styles = extractAndMapStyles(node);

  // Create props interface
  const propsInterface = t.tsInterfaceDeclaration(
    t.identifier(`${componentName}Props`),
    null,
    null,
    t.tsInterfaceBody(
      props.map((prop) => {
        const propName = prop.split(':')[0].trim();
        const propType = prop.split(':')[1]?.trim() || 'string';

        return t.tsPropertySignature(
          t.identifier(propName),
          t.tsTypeAnnotation(
            propType.includes('|')
              ? t.tsUnionType(
                  propType.split('|').map((t1) => {
                    const trimmed = t1.trim().replace(/['"]/g, '');
                    return t.tsStringKeyword();
                  })
                )
              : t.tsStringKeyword()
          )
        );
      })
    )
  );

  // Create JSX attributes
  const jsxAttributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> = [];

  // Add className if there are styles
  if (styles.tailwindClasses.length > 0) {
    jsxAttributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('className'),
        t.stringLiteral(styles.tailwindClasses.join(' '))
      )
    );
  }

  // Create JSX element
  const jsxElement = t.jsxElement(
    t.jsxOpeningElement(
      t.jsxIdentifier(node.tag),
      jsxAttributes,
      !node.text && node.children.length === 0
    ),
    !node.text && node.children.length === 0 ? null : t.jsxClosingElement(t.jsxIdentifier(node.tag)),
    node.text ? [t.jsxText(node.text)] : []
  );

  // Create component function
  const componentFunction = t.exportDefaultDeclaration(
    t.functionDeclaration(
      t.identifier(componentName),
      [
        t.objectPattern([
          t.restElement(t.identifier('props'))
        ]),
      ],
      t.blockStatement([t.returnStatement(jsxElement)])
    )
  );

  // Create React import statement
  const reactImport = t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier('React'))],
    t.stringLiteral('react')
  );

  // Create program
  const program = t.program([reactImport, propsInterface, componentFunction]);
  const { code } = generate(program);

  return code;
}

export function inferComponentProps(node: SemanticTreeNode): string[] {
  const props = new Set<string>();

  // From class names
  const className = node.attributes.class || '';
  if (className.includes('primary') || className.includes('secondary')) {
    props.add('variant: "primary" | "secondary"');
  }
  if (className.includes('small') || className.includes('large')) {
    props.add('size: "small" | "large"');
  }

  // From text content
  if (node.text) {
    props.add('label?: string');
  }

  // From href attribute
  if (node.attributes.href) {
    props.add('href?: string');
  }

  // From data attributes
  Object.keys(node.attributes).forEach((attr) => {
    if (attr.startsWith('data-')) {
      const propName = attr.replace('data-', '');
      props.add(`${propName}?: string`);
    }
  });

  return Array.from(props);
}
