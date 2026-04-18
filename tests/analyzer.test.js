const { FramerAnalyzer } = require('../src/analyzer/framer-analyzer');

describe('FramerAnalyzer', () => {
  describe('publishDate extraction', () => {
    test('extracts publish date from HTML comment', () => {
      const html = `
        <!-- Made in Framer · framer.com ✨ -->
        <!-- Published Apr 5, 2026, 11:50 PM UTC -->
        <html></html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.publishDate).toBe('Apr 5, 2026, 11:50 PM UTC');
    });

    test('returns null if no publish date found', () => {
      const html = `<html><body></body></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.publishDate).toBeNull();
    });
  });

  describe('generator version extraction', () => {
    test('extracts Framer version from meta tag', () => {
      const html = `
        <html>
          <head>
            <meta name="generator" content="Framer f36d8c8">
          </head>
        </html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.generatorVersion).toBe('f36d8c8');
    });

    test('returns null if no generator meta tag', () => {
      const html = `<html></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.generatorVersion).toBeNull();
    });
  });

  describe('site title extraction', () => {
    test('extracts title from title tag', () => {
      const html = `<html><head><title>DaveOS</title></head></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.siteTitle).toBe('DaveOS');
    });

    test('returns null if no title tag', () => {
      const html = `<html></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.siteTitle).toBeNull();
    });
  });

  describe('components extraction', () => {
    test('extracts components from data-framer-components attribute', () => {
      const html = `
        <html>
          <body data-framer-components="framer-Ru7Vh framer-QRFgy framer-bNhZP">
          </body>
        </html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.components).toEqual(['framer-Ru7Vh', 'framer-QRFgy', 'framer-bNhZP']);
    });

    test('returns empty array if no components attribute', () => {
      const html = `<html><body></body></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.components).toEqual([]);
    });
  });

  describe('font extraction', () => {
    test('extracts fonts from @font-face declarations', () => {
      const html = `
        <html>
          <head>
            <style>
              @font-face { font-family: "DM Sans"; }
              @font-face { font-family: "Inter"; }
            </style>
          </head>
        </html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.fonts).toContain('DM Sans');
      expect(info.fonts).toContain('Inter');
    });

    test('returns empty array if no fonts', () => {
      const html = `<html></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.fonts).toEqual([]);
    });
  });

  describe('external services detection', () => {
    test('extracts hostnames from external scripts and links', () => {
      const html = `
        <html>
          <head>
            <script src="https://events.framer.com/script?v=2"></script>
            <script src="https://www.googletagmanager.com/gtag/js?id=G-123"></script>
            <link href="https://fonts.gstatic.com/s/inter/v1/font.woff2" rel="preload">
          </head>
        </html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.externalServices).toContain('events.framer.com');
      expect(info.externalServices).toContain('www.googletagmanager.com');
      expect(info.externalServices).toContain('fonts.gstatic.com');
    });

    test('excludes relative URLs', () => {
      const html = `
        <html>
          <head>
            <script src="/js/app.js"></script>
          </head>
        </html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.externalServices.length).toBe(0);
    });
  });

  describe('analytics detection', () => {
    test('detects Google Analytics tracking ID', () => {
      const html = `
        <html>
          <head>
            <script src="https://www.googletagmanager.com/gtag/js?id=G-52BG7CNKJ7"></script>
          </head>
        </html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.hasAnalytics).toBe(true);
      expect(info.analyticsId).toBe('G-52BG7CNKJ7');
    });

    test('returns hasAnalytics false if no analytics', () => {
      const html = `<html></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.hasAnalytics).toBe(false);
      expect(info.analyticsId).toBeNull();
    });
  });

  describe('return shape', () => {
    test('returns complete object with all fields', () => {
      const html = `<html></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info).toHaveProperty('siteTitle');
      expect(info).toHaveProperty('publishDate');
      expect(info).toHaveProperty('generatorVersion');
      expect(info).toHaveProperty('components');
      expect(info).toHaveProperty('namedLayers');
      expect(info).toHaveProperty('fonts');
      expect(info).toHaveProperty('externalServices');
      expect(info).toHaveProperty('hasAnalytics');
      expect(info).toHaveProperty('analyticsId');
    });
  });

  describe('named layers extraction', () => {
    test('extracts data-framer-name attribute values', () => {
      const html = `
        <html>
          <body>
            <div data-framer-name="header-wrapper"></div>
            <div data-framer-name="Loading Modal"></div>
            <div data-framer-name="overlay"></div>
          </body>
        </html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.namedLayers).toContain('header-wrapper');
      expect(info.namedLayers).toContain('Loading Modal');
      expect(info.namedLayers).toContain('overlay');
    });

    test('returns empty array if no named layers', () => {
      const html = `<html></html>`;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.namedLayers).toEqual([]);
    });

    test('deduplicates named layers', () => {
      const html = `
        <html>
          <body>
            <div data-framer-name="button"></div>
            <div data-framer-name="button"></div>
            <div data-framer-name="button"></div>
          </body>
        </html>
      `;
      const analyzer = new FramerAnalyzer(html);
      const info = analyzer.analyze();
      expect(info.namedLayers.filter(n => n === 'button').length).toBe(1);
    });
  });
});
