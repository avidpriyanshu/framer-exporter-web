import { parseHTML } from '@/lib/pipeline/stages/1-html-parser';

describe('Stage 1: HTMLParser', () => {
  it('should parse Framer-exported HTML into RawDOMNode structure', () => {
    const html = '<div><section><h1>Title</h1></section></div>';
    const result = parseHTML(html);

    expect(result.rawDOM.tag).toBe('div');
    expect(result.rawDOM.children.length).toBeGreaterThan(0);
    expect(result.nodeCount).toBeGreaterThan(0);
  });

  it('should track all unique tags', () => {
    const html = '<div><p>Text</p><span>More</span><img src="test.jpg"/></div>';
    const result = parseHTML(html);

    expect(result.uniqueTags).toContain('p');
    expect(result.uniqueTags).toContain('span');
    expect(result.uniqueTags).toContain('img');
  });

  it('should preserve attributes and inline styles', () => {
    const html = '<div class="container" data-section="hero" style="color: red;"><p>Content</p></div>';
    const result = parseHTML(html);

    expect(result.rawDOM.attributes.class).toBe('container');
    expect(result.rawDOM.attributes['data-section']).toBe('hero');
    expect(result.rawDOM.attributes.style).toBe('color: red;');
  });

  it('should measure parse time', () => {
    const html = '<div>' + '<p>Item</p>'.repeat(100) + '</div>';
    const result = parseHTML(html);

    expect(result.parseTime).toBeGreaterThan(0);
    expect(result.parseTime).toBeLessThan(500);
  });

  it('should handle Framer-specific class names', () => {
    const html = '<div class="framer-xyz-123-abc text-lg"><p>Text</p></div>';
    const result = parseHTML(html);

    expect(result.rawDOM.attributes.class).toContain('text-lg');
  });

  it('should handle self-closing tags', () => {
    const html = '<div><img src="test.jpg"/><br/><input type="text"/></div>';
    const result = parseHTML(html);

    expect(result.uniqueTags).toContain('img');
    expect(result.uniqueTags).toContain('br');
    expect(result.uniqueTags).toContain('input');
  });
});
