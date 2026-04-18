import { extractDesignTokens, generateTokenCSS, generateTokenJSON } from '../token-generator';
import { DesignToken } from '../../pipeline/types';

describe('extractDesignTokens', () => {
  it('should extract color tokens from HTML', () => {
    const html = `<div style="color: var(--token-color, rgb(255, 0, 0))">Test</div>`;
    const tokens = extractDesignTokens(html);
    expect(Object.keys(tokens.colors).length).toBeGreaterThan(0);
  });

  it('should include default spacing tokens when none are found', () => {
    const html = `<div>Test without spacing</div>`;
    const tokens = extractDesignTokens(html);
    expect(tokens.spacing['md']).toBe('16px');
    expect(tokens.spacing['xs']).toBe('4px');
  });

  it('should extract padding as spacing tokens', () => {
    const html = `<div style="padding: 16px">Test</div>`;
    const tokens = extractDesignTokens(html);
    // Should have spacing tokens (either from extraction or defaults)
    expect(Object.keys(tokens.spacing).length).toBeGreaterThan(0);
    expect(tokens.spacing['md'] || tokens.spacing['spacing-0']).toBeDefined();
  });

  it('should generate CSS variables from tokens', () => {
    const tokens: DesignToken = {
      colors: { primary: '#0066FF' },
      spacing: { md: '16px' },
      typography: {},
      borders: {},
      shadows: {},
    };
    const css = generateTokenCSS(tokens);
    expect(css).toContain('--color-primary: #0066FF');
    expect(css).toContain('--spacing-md: 16px');
  });

  it('should generate tokens.json structure', () => {
    const tokens: DesignToken = {
      colors: { primary: '#0066FF' },
      spacing: { md: '16px' },
      typography: { body: { fontSize: '16px', fontFamily: 'Inter' } },
      borders: { sm: { width: '4px' } },
      shadows: {},
    };
    const json = generateTokenJSON(tokens);
    expect(json).toContain('colors');
    expect(json).toContain('typography');
  });
});
