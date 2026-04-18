import { isValidFramerUrl } from './validator';

describe('URL Validator', () => {
  test('should accept valid framer.com URLs', () => {
    const url = 'https://framer.com/projects/example-123';
    expect(isValidFramerUrl(url)).toBe(true);
  });

  test('should accept valid webflow.io URLs', () => {
    const url = 'https://example.webflow.io';
    expect(isValidFramerUrl(url)).toBe(true);
  });

  test('should reject URLs without https', () => {
    const url = 'http://framer.com/example';
    expect(isValidFramerUrl(url)).toBe(false);
  });

  test('should reject invalid domains', () => {
    const url = 'https://example.com';
    expect(isValidFramerUrl(url)).toBe(false);
  });

  test('should reject empty strings', () => {
    expect(isValidFramerUrl('')).toBe(false);
  });

  test('should reject invalid URL format', () => {
    expect(isValidFramerUrl('not a url')).toBe(false);
  });
});
