import { ProductionOutput } from '../types';

describe('ProductionOutput type', () => {
  it('should have all required properties', () => {
    const output: ProductionOutput = {
      projectName: 'my-site',
      nextjsProject: {
        packageJson: {},
        tsconfig: {},
        nextConfig: {},
      },
      components: [],
      designTokens: {
        colors: { primary: '#0066FF' },
        spacing: { md: '16px' },
        typography: {},
        borders: {},
        shadows: {},
      },
      cssVariables: ':root { --color-primary: #0066FF; }',
      metadata: {
        componentsGenerated: 0,
        tokensExtracted: 0,
        estimatedBundleSize: 0,
      },
    };
    expect(output).toBeDefined();
  });
});
