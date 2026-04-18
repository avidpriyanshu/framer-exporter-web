import { DesignToken } from '../pipeline/types';
import { extractFramerTokens, extractTokensFromInlineStyles } from '../utils/token-mapper';

export function extractDesignTokens(html: string): DesignToken {
  const tokens = extractFramerTokens(html);
  const inlineTokens = extractTokensFromInlineStyles(html);

  // Merge extracted tokens
  const merged: DesignToken = {
    colors: { ...tokens.colors, ...inlineTokens.colors },
    spacing: { ...tokens.spacing, ...inlineTokens.spacing },
    typography: { ...tokens.typography, ...inlineTokens.typography },
    borders: { ...tokens.borders, ...inlineTokens.borders },
    shadows: { ...tokens.shadows, ...inlineTokens.shadows },
  };

  // Add default tokens if missing
  if (Object.keys(merged.colors).length === 0) {
    merged.colors = {
      primary: '#0066FF',
      secondary: '#FF6B00',
      success: '#00CC66',
      background: '#FFFFFF',
      text: '#000000',
    };
  }

  if (Object.keys(merged.spacing).length === 0) {
    merged.spacing = {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    };
  }

  if (Object.keys(merged.typography).length === 0) {
    merged.typography = {
      heading: {
        fontFamily: 'Inter',
        fontSize: '32px',
        fontWeight: '700',
        lineHeight: '1.2',
      },
      body: {
        fontFamily: 'Inter',
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '1.5',
      },
    };
  }

  return merged;
}

export function generateTokenCSS(tokens: DesignToken): string {
  let css = ':root {\n';

  // Colors
  Object.entries(tokens.colors).forEach(([name, value]) => {
    css += `  --color-${name}: ${value};\n`;
  });

  // Spacing
  Object.entries(tokens.spacing).forEach(([name, value]) => {
    css += `  --spacing-${name}: ${value};\n`;
  });

  // Borders
  Object.entries(tokens.borders).forEach(([name, value]) => {
    if (typeof value === 'string') {
      css += `  --border-${name}: ${value};\n`;
    } else if (typeof value === 'object' && value.value) {
      css += `  --border-${name}: ${value.value};\n`;
    }
  });

  css += '}\n';
  return css;
}

export function generateTokenJSON(tokens: DesignToken): string {
  return JSON.stringify(tokens, null, 2);
}
