import { DesignToken } from '../pipeline/types';

export function extractFramerTokens(html: string): DesignToken {
  const tokens: DesignToken = {
    colors: {},
    spacing: {},
    typography: {},
    borders: {},
    shadows: {},
  };

  // Regex to match CSS variables like var(--token-color-primary, #ff0000)
  const varRegex = /var\(--token-[\w-]+,\s*([^)]+)\)/g;
  let match;

  while ((match = varRegex.exec(html)) !== null) {
    const value = match[1].trim();

    if (isColor(value)) {
      const colorCount = Object.keys(tokens.colors).length;
      tokens.colors[`color-${colorCount}`] = value;
    } else if (isSpacing(value)) {
      const spacingCount = Object.keys(tokens.spacing).length;
      tokens.spacing[`spacing-${spacingCount}`] = value;
    } else if (isTypography(value)) {
      const typographyCount = Object.keys(tokens.typography).length;
      tokens.typography[`typography-${typographyCount}`] = { value };
    } else if (isBorder(value)) {
      const borderCount = Object.keys(tokens.borders).length;
      tokens.borders[`border-${borderCount}`] = { value };
    } else if (isShadow(value)) {
      const shadowCount = Object.keys(tokens.shadows).length;
      tokens.shadows[`shadow-${shadowCount}`] = value;
    }
  }

  return tokens;
}

/**
 * Check if a value is a color (hex, rgb, hsl, or color name)
 */
function isColor(value: string): boolean {
  const colorPatterns = [
    /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/, // hex
    /^rgb\(/, // rgb
    /^rgba\(/, // rgba
    /^hsl\(/, // hsl
    /^hsla\(/, // hsla
    /^(red|blue|green|yellow|black|white|gray|purple|pink|orange|cyan|transparent)$/i, // named colors
  ];

  return colorPatterns.some((pattern) => pattern.test(value));
}

/**
 * Check if a value is spacing (e.g., "16px", "1rem", "1.5em")
 */
function isSpacing(value: string): boolean {
  return /^\d+(\.\d+)?(px|rem|em|%|ch|vw|vh)$/.test(value);
}

/**
 * Check if a value is typography related (font sizes, weights, families)
 */
function isTypography(value: string): boolean {
  const typographyPatterns = [
    /^\d+(\.\d+)?(px|rem|em)$/, // font size
    /^(normal|bold|lighter|bolder|\d{3})$/, // font weight
    /^(serif|sans-serif|monospace|cursive|fantasy|[a-z\s-]+)$/i, // font family
    /^(italic|oblique|normal)$/, // font style
  ];

  return typographyPatterns.some((pattern) => pattern.test(value));
}

/**
 * Check if a value is a border (e.g., "1px solid black")
 */
function isBorder(value: string): boolean {
  return /^\d+px\s+(solid|dashed|dotted|double)\s+/.test(value);
}

/**
 * Check if a value is a shadow (e.g., "0 4px 6px rgba(0, 0, 0, 0.1)")
 */
function isShadow(value: string): boolean {
  return /^\d+px\s+\d+px\s+\d+px\s+/.test(value) || /^(inset\s+)?\d+px\s+\d+px/.test(value);
}

/**
 * Merge multiple design tokens into one
 */
export function mergeDesignTokens(...tokenSets: DesignToken[]): DesignToken {
  const merged: DesignToken = {
    colors: {},
    spacing: {},
    typography: {},
    borders: {},
    shadows: {},
  };

  for (const tokenSet of tokenSets) {
    Object.assign(merged.colors, tokenSet.colors);
    Object.assign(merged.spacing, tokenSet.spacing);
    Object.assign(merged.typography, tokenSet.typography);
    Object.assign(merged.borders, tokenSet.borders);
    Object.assign(merged.shadows, tokenSet.shadows);
  }

  return merged;
}

/**
 * Extract tokens from inline style attributes
 */
export function extractTokensFromInlineStyles(html: string): DesignToken {
  const tokens: DesignToken = {
    colors: {},
    spacing: {},
    typography: {},
    borders: {},
    shadows: {},
  };

  // Match style attributes
  const styleRegex = /style\s*=\s*["']([^"']*)["']/g;
  let match;

  while ((match = styleRegex.exec(html)) !== null) {
    const styleString = match[1];
    const declarations = styleString.split(';');

    for (const decl of declarations) {
      const [prop, value] = decl.split(':').map((s) => s.trim());
      if (!prop || !value) continue;

      if (prop.toLowerCase().includes('color') && isColor(value)) {
        const colorCount = Object.keys(tokens.colors).length;
        tokens.colors[`color-${colorCount}`] = value;
      } else if (
        (prop.toLowerCase().includes('padding') || prop.toLowerCase().includes('margin')) &&
        isSpacing(value)
      ) {
        const spacingCount = Object.keys(tokens.spacing).length;
        tokens.spacing[`spacing-${spacingCount}`] = value;
      }
    }
  }

  return tokens;
}
