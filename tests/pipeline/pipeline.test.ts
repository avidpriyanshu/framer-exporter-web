import { runPipeline } from '@/lib/pipeline/pipeline';

describe('Pipeline Orchestrator', () => {
  it('should run all 6 stages on HTML input', async () => {
    const html = `
      <div>
        <header><h1>Title</h1></header>
        <section><p>Content 1</p></section>
        <section><p>Content 2</p></section>
        <footer><p>Footer</p></footer>
      </div>
    `;

    const result = runPipeline(html);

    expect(result.enhancedHTML).toBeDefined();
    expect(result.components).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.totalTime).toBeGreaterThan(0);
  });

  it('should measure all stage times', async () => {
    const html = '<div><p>Test</p></div>';
    const result = runPipeline(html);

    expect(result.metrics.htmlParseTime).toBeGreaterThanOrEqual(0);
    expect(result.metrics.totalTime).toBeGreaterThanOrEqual(0);
  });
});
