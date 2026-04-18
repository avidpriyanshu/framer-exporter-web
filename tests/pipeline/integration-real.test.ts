import { runPipeline } from '@/lib/pipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('Pipeline Integration - Real Framer Export', () => {
  it('should process real Framer export fixture', () => {
    const fixturePath = path.join(__dirname, '../fixtures/sample-framer-export.html');
    const html = fs.readFileSync(fixturePath, 'utf-8');

    const result = runPipeline(html);

    expect(result.enhancedHTML).toBeDefined();
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.metrics.totalTime).toBeGreaterThan(0);
    expect(result.metrics.sectionsDetected).toBeGreaterThan(0);
  });

  it('should extract semantic sections', () => {
    const fixturePath = path.join(__dirname, '../fixtures/sample-framer-export.html');
    const html = fs.readFileSync(fixturePath, 'utf-8');

    const result = runPipeline(html);

    // Should detect header, hero, features, testimonials, footer
    expect(result.metrics.sectionsDetected).toBeGreaterThanOrEqual(3);
  });

  it('should generate component index documentation', () => {
    const fixturePath = path.join(__dirname, '../fixtures/sample-framer-export.html');
    const html = fs.readFileSync(fixturePath, 'utf-8');

    const result = runPipeline(html);

    expect(result.componentIndex).toContain('Generated Components');
    expect(result.componentIndex).toContain('Component');
    expect(result.componentIndex).toContain('Location');
  });
});
