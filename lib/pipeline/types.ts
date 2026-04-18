export interface RawDOMNode {
  tag: string;
  attributes: Record<string, string>;
  children: RawDOMNode[];
  text?: string;
}

export interface ParsedResult {
  rawDOM: RawDOMNode;
  nodeCount: number;
  uniqueTags: string[];
  parseTime: number;
}

export interface CleanedTree {
  tree: RawDOMNode;
  removedCount: number;
  flattenedCount: number;
}

export interface Section {
  id: string;
  type: 'header' | 'nav' | 'hero' | 'features' | 'testimonials' | 'faq' | 'stats' | 'footer' | 'cta';
  nodes: RawDOMNode[];
  depth: number;
}

export interface AnnotatedTree {
  tree: RawDOMNode;
  sections: Section[];
}

export interface ComponentPattern {
  signature: string;
  occurrences: number;
  nodes: RawDOMNode[];
  isComponent: boolean;
}

export interface Component {
  id: string;
  name: string;
  pattern: ComponentPattern;
  props: Record<string, string>;
  instances: number;
}

export interface ComponentTree {
  tree: RawDOMNode;
  components: Component[];
  componentMap: Record<string, string>;
}

export interface SemanticTreeNode extends RawDOMNode {
  semanticName?: string;
  semanticType?: string;
}

export interface NamedTree {
  tree: SemanticTreeNode;
  namingMap: Record<string, string>;
}

export interface EnhancedComponent {
  name: string;
  path: string;
  code: string;
  props: string[];
}

export interface CodeGenOutput {
  enhancedHTML: string;
  components: EnhancedComponent[];
  componentIndex: string;
  metrics: Record<string, number>;
}

export interface DesignToken {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, Record<string, string>>;
  borders: Record<string, Record<string, string>>;
  shadows: Record<string, string>;
}

export interface NextjsProject {
  packageJson: Record<string, any>;
  tsconfig: Record<string, any>;
  nextConfig: Record<string, any>;
  pages?: Record<string, string>;
  components?: Record<string, string>;
  styles?: Record<string, string>;
  public?: Record<string, Buffer>;
}

export interface ProductionOutput {
  projectName: string;
  nextjsProject: NextjsProject;
  components: EnhancedComponent[];
  designTokens: DesignToken;
  cssVariables: string;
  metadata: {
    componentsGenerated: number;
    tokensExtracted: number;
    estimatedBundleSize: number;
  };
}

export interface PipelineMetrics {
  htmlParseTime: number;
  normalizationTime: number;
  sectionDetectionTime: number;
  componentExtractionTime: number;
  semanticNamingTime: number;
  codeGenerationTime: number;
  totalTime: number;
  nodeCountInitial: number;
  nodeCountFinal: number;
  componentsDetected: number;
  sectionsDetected: number;
}
