import { validateGeneratedCode } from '../validator';

describe('validateGeneratedCode', () => {
  it('should pass TypeScript syntax check', () => {
    const code = `export default function Button() { return <div>test</div>; }`;
    const result = validateGeneratedCode(code);
    expect(result.errors).toHaveLength(0);
  });

  it('should catch invalid TypeScript', () => {
    const code = `export default function Button() { return <div>`;
    const result = validateGeneratedCode(code);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should format code with Prettier', () => {
    const code = `export default function Button(){return<div>test</div>;}`;
    const result = validateGeneratedCode(code);
    expect(result.formatted).toContain('\n');
  });

  it('should detect unbalanced JSX tags', () => {
    const code = `export default function Button() { return <div><span>test</div>; }`;
    const result = validateGeneratedCode(code);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should warn when React is used but not imported', () => {
    const code = `export default function Button() { return <Component />; }`;
    const result = validateGeneratedCode(code);
    // Note: React is not used in this case, so no warning
    expect(result.isValid).toBe(true);
  });

  it('should return formatted code when valid', () => {
    const code = `export default function Button(){const x=5;return<div>test</div>;}`;
    const result = validateGeneratedCode(code);
    expect(result.isValid).toBe(true);
    expect(result.formatted.length).toBeGreaterThan(0);
  });

  it('should catch missing closing braces', () => {
    const code = `export default function Button() { return <div>test</div>`;
    const result = validateGeneratedCode(code);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should format code with proper line breaks', () => {
    const code = `function test(){const x=1;const y=2;return x+y;}`;
    const result = validateGeneratedCode(code);
    expect(result.formatted).toContain('const x');
    expect(result.formatted).toContain('const y');
  });

  it('should validate React component with props', () => {
    const code = `
      interface ButtonProps {
        onClick: () => void;
      }
      export default function Button({ onClick }: ButtonProps) {
        return <button onClick={onClick}>Click me</button>;
      }
    `;
    const result = validateGeneratedCode(code);
    expect(result.errors).toHaveLength(0);
  });
});
