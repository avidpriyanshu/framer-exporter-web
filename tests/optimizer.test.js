const { ImageOptimizer } = require('../src/extractor/image-optimizer');

describe('Image Optimizer', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new ImageOptimizer();
  });

  test('detects PNG and suggests WebP conversion', () => {
    const format = optimizer.shouldOptimize('image.png', 500000);
    expect(format).toBe('webp');
  });

  test('skips optimization for small images', () => {
    const format = optimizer.shouldOptimize('icon.png', 5000);
    expect(format).toBeNull();
  });

  test('generates responsive variants for different viewports', () => {
    const variants = optimizer.generateVariants('desktop-image.jpg', {
      width: 1280,
      height: 720,
    });
    expect(variants).toHaveProperty('desktop');
    expect(variants).toHaveProperty('tablet');
    expect(variants).toHaveProperty('mobile');
  });

  test('generates srcset string from variants', () => {
    const srcset = optimizer.generateSrcset('image.jpg', {
      desktop: 'image-1280.jpg',
      tablet: 'image-768.jpg',
      mobile: 'image-360.jpg',
    });
    expect(srcset).toContain('image-1280.jpg 1280w');
    expect(srcset).toContain('image-768.jpg 768w');
    expect(srcset).toContain('image-360.jpg 360w');
  });

  test('returns null for images without dimensions', () => {
    const variants = optimizer.generateVariants('image.jpg', null);
    expect(variants).toBeNull();
  });

  test('handles different image formats', () => {
    expect(optimizer.shouldOptimize('photo.jpeg', 100000)).toBe('webp');
    expect(optimizer.shouldOptimize('graphic.jpg', 100000)).toBe('webp');
  });
});
