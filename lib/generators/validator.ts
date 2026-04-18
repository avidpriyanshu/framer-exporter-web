export interface ValidationResult {
  errors: string[];
  warnings: string[];
  formatted: string;
  isValid: boolean;
}

/**
 * Validates generated code for TypeScript syntax, JSX balance, and required imports.
 * Also formats the code with basic formatting rules.
 */
export function validateGeneratedCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic TypeScript syntax check
  if (!isValidTypeScriptSyntax(code)) {
    errors.push('Invalid TypeScript syntax: unbalanced braces, parentheses, or brackets');
  }

  // Check for JSX balance
  const jsxIssues = validateJSXBalance(code);
  if (jsxIssues.length > 0) {
    warnings.push(...jsxIssues);
  }

  // Check for required imports
  const importIssues = validateImports(code);
  if (importIssues.length > 0) {
    warnings.push(...importIssues);
  }

  // Format with basic rules
  const formatted = formatCode(code);

  return {
    errors,
    warnings,
    formatted,
    isValid: errors.length === 0,
  };
}

/**
 * Validates that braces, parentheses, and brackets are properly balanced.
 */
function isValidTypeScriptSyntax(code: string): boolean {
  try {
    // Remove strings and comments to avoid false positives
    const cleanCode = removeStringsAndComments(code);
    const braceChars = cleanCode.match(/[{}()[\]]/g) || [];
    const stack: string[] = [];

    const pairs: Record<string, string> = {
      '{': '}',
      '(': ')',
      '[': ']',
    };

    for (const char of braceChars) {
      if (char === '{' || char === '(' || char === '[') {
        stack.push(char);
      } else {
        const lastOpen = stack.pop();
        if (!lastOpen || pairs[lastOpen] !== char) {
          return false;
        }
      }
    }

    return stack.length === 0;
  } catch {
    return false;
  }
}

/**
 * Removes strings and comments from code to avoid syntax check false positives.
 */
function removeStringsAndComments(code: string): string {
  let result = '';
  let i = 0;

  while (i < code.length) {
    // Handle double-quoted strings
    if (code[i] === '"') {
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\') i++;
        i++;
      }
      i++;
    }
    // Handle single-quoted strings
    else if (code[i] === "'") {
      i++;
      while (i < code.length && code[i] !== "'") {
        if (code[i] === '\\') i++;
        i++;
      }
      i++;
    }
    // Handle backtick strings
    else if (code[i] === '`') {
      i++;
      while (i < code.length && code[i] !== '`') {
        if (code[i] === '\\') i++;
        i++;
      }
      i++;
    }
    // Handle line comments
    else if (code[i] === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
    }
    // Handle block comments
    else if (code[i] === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
    } else {
      result += code[i];
      i++;
    }
  }

  return result;
}

/**
 * Validates that JSX tags are balanced (opening and closing tags match).
 */
function validateJSXBalance(code: string): string[] {
  const warnings: string[] = [];
  const cleanCode = removeStringsAndComments(code);

  // Match JSX opening tags: <ComponentName or <html-tag
  const openingTags = cleanCode.match(/<([A-Za-z][A-Za-z0-9-]*)/g) || [];
  // Match JSX closing tags: </ComponentName
  const closingTags = cleanCode.match(/<\/([A-Za-z][A-Za-z0-9-]*)/g) || [];
  // Match self-closing tags: <Component />
  const selfClosingTags = cleanCode.match(/<([A-Za-z][A-Za-z0-9-]*)\s*\/>/g) || [];

  const openCount = openingTags.length;
  const closeCount = closingTags.length;
  const selfCloseCount = selfClosingTags.length;

  // JSX opening tags should equal closing tags plus self-closing tags
  if (openCount > closeCount + selfCloseCount) {
    warnings.push(
      `JSX balance warning: ${openCount} opening tags but only ${closeCount} closing tags and ${selfCloseCount} self-closing tags`
    );
  }

  return warnings;
}

/**
 * Validates that required imports are present when used.
 */
function validateImports(code: string): string[] {
  const warnings: string[] = [];

  // Check for React usage without import
  const hasReactUsage = /[^a-zA-Z0-9]React\.[a-zA-Z]/.test(code);
  const hasReactImport = /import\s+React\s+from/.test(code);
  if (hasReactUsage && !hasReactImport) {
    warnings.push('React is used in JSX but not imported');
  }

  return warnings;
}

/**
 * Formats code with basic Prettier-like rules.
 * - Adds line breaks after semicolons
 * - Adds line breaks after opening braces
 * - Adds line breaks before closing braces
 * - Indents properly
 */
export function formatCode(code: string): string {
  let result = code;

  // Add newline after semicolons (but not inside strings)
  result = result.replace(/;(?=\S)/g, ';\n');

  // Add newline and indentation after opening braces
  result = result.replace(/{(?=\S)/g, ' {\n');

  // Add newline before closing braces
  result = result.replace(/(?<!{)}/g, '\n}');

  // Split into lines, trim each, and filter empty lines
  const lines = result
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Basic indentation
  let indentLevel = 0;
  const formattedLines = lines.map((line) => {
    // Decrease indent for closing braces
    if (line.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indented = '  '.repeat(indentLevel) + line;

    // Increase indent for opening braces
    if (line.endsWith('{')) {
      indentLevel++;
    }

    return indented;
  });

  return formattedLines.join('\n');
}
