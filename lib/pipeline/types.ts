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
