export interface CSSVariable {
  name: string;
  value: string;
}

export function extractCSSVariables(styleStr: string): CSSVariable[] {
  const varRegex = /var\((--[a-zA-Z0-9-]+)\)/g;
  const matches = [...styleStr.matchAll(varRegex)];
  return matches.map((match) => ({
    name: match[1],
    value: '',
  }));
}

export function removeFramerClasses(classStr: string): string {
  return classStr
    .split(' ')
    .filter((cls) => !cls.match(/^framer-[a-z0-9-]+$/i))
    .join(' ')
    .trim();
}
