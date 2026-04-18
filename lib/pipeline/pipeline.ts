import { parseHTML } from './stages/1-html-parser';
import { normalize } from './stages/2-normalizer';
import { detectSections } from './stages/3-section-detector';
import { extractComponents } from './stages/4-component-extractor';
import { assignSemanticNames } from './stages/5-semantic-namer';
import { generateEnhancedOutput } from './stages/6-code-generator';
import { CodeGenOutput, PipelineMetrics } from './types';

export interface PipelineResult extends CodeGenOutput {
  metrics: PipelineMetrics;
}

export function runPipeline(html: string): PipelineResult {
  const startTime = Date.now();

  console.log('[Pipeline] Starting 6-stage enhancement...');

  // Stage 1: Parse HTML
  const parseStart = Date.now();
  const parseResult = parseHTML(html);
  const htmlParseTime = Date.now() - parseStart;
  console.log(`[Stage 1] HTMLParser: ${parseResult.nodeCount} nodes in ${htmlParseTime}ms`);

  // Stage 2: Normalize
  const normalizeStart = Date.now();
  const normalizeResult = normalize(parseResult.rawDOM);
  const normalizationTime = Date.now() - normalizeStart;
  console.log(`[Stage 2] Normalizer: ${normalizeResult.removedCount} removed, ${normalizeResult.flattenedCount} flattened in ${normalizationTime}ms`);

  // Stage 3: Detect Sections
  const sectionStart = Date.now();
  const sectionResult = detectSections(normalizeResult.tree);
  const sectionDetectionTime = Date.now() - sectionStart;
  console.log(`[Stage 3] SectionDetector: ${sectionResult.sections.length} sections in ${sectionDetectionTime}ms`);

  // Stage 4: Extract Components
  const componentStart = Date.now();
  const componentResult = extractComponents(sectionResult.tree);
  const componentExtractionTime = Date.now() - componentStart;
  console.log(`[Stage 4] ComponentExtractor: ${componentResult.components.length} components in ${componentExtractionTime}ms`);

  // Stage 5: Semantic Naming
  const namingStart = Date.now();
  const namingResult = assignSemanticNames(componentResult.tree);
  const semanticNamingTime = Date.now() - namingStart;
  console.log(`[Stage 5] SemanticNamer: ${Object.keys(namingResult.namingMap).length} named in ${semanticNamingTime}ms`);

  // Stage 6: Code Generation
  const codeGenStart = Date.now();
  const codeGenResult = generateEnhancedOutput(namingResult);
  const codeGenerationTime = Date.now() - codeGenStart;
  console.log(`[Stage 6] CodeGenerator: ${codeGenResult.components.length} components generated in ${codeGenerationTime}ms`);

  const totalTime = Date.now() - startTime;

  const metrics: PipelineMetrics = {
    htmlParseTime,
    normalizationTime,
    sectionDetectionTime,
    componentExtractionTime,
    semanticNamingTime,
    codeGenerationTime,
    totalTime,
    nodeCountInitial: parseResult.nodeCount,
    nodeCountFinal: Object.keys(namingResult.namingMap).length,
    componentsDetected: componentResult.components.length,
    sectionsDetected: sectionResult.sections.length,
  };

  console.log(`[Pipeline] Complete in ${totalTime}ms`);
  console.log(JSON.stringify(metrics, null, 2));

  return {
    ...codeGenResult,
    metrics,
  };
}
