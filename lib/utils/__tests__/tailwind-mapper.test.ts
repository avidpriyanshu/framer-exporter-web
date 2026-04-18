import { inlineStyleToTailwind } from '../tailwind-mapper';

describe('tailwind-mapper', () => {
  it('should map background color to Tailwind', () => {
    const result = inlineStyleToTailwind('background: #ff0000');
    expect(result.tailwindClasses).toContain('bg-red-600');
  });

  it('should map padding to Tailwind', () => {
    const result = inlineStyleToTailwind('padding: 16px');
    expect(result.tailwindClasses).toContain('p-4');
  });

  it('should return unmapped styles for complex values', () => {
    const result = inlineStyleToTailwind('background: linear-gradient(to right, red, blue)');
    expect(result.unmappedStyles).toBeDefined();
    expect(Object.keys(result.unmappedStyles).length).toBeGreaterThan(0);
  });

  it('should handle multiple style properties', () => {
    const result = inlineStyleToTailwind('padding: 16px; margin: 8px');
    expect(result.tailwindClasses).toContain('p-4');
    expect(result.tailwindClasses).toContain('m-2');
  });

  it('should map margin correctly', () => {
    const result = inlineStyleToTailwind('margin: 24px');
    expect(result.tailwindClasses).toContain('m-6');
  });

  it('should map border-radius to rounded classes', () => {
    const result = inlineStyleToTailwind('border-radius: 8px');
    expect(result.tailwindClasses).toContain('rounded');
  });

  it('should handle white background', () => {
    const result = inlineStyleToTailwind('background-color: #ffffff');
    expect(result.tailwindClasses).toContain('bg-white');
  });

  it('should handle black background', () => {
    const result = inlineStyleToTailwind('background-color: #000000');
    expect(result.tailwindClasses).toContain('bg-black');
  });

  it('should collect unmapped properties', () => {
    const result = inlineStyleToTailwind('text-shadow: 2px 2px 4px rgba(0,0,0,0.5)');
    expect(result.unmappedStyles['text-shadow']).toBeDefined();
  });

  it('should handle empty style string', () => {
    const result = inlineStyleToTailwind('');
    expect(result.tailwindClasses.length).toBe(0);
    expect(Object.keys(result.unmappedStyles).length).toBe(0);
  });
});
