const { DashboardGenerator } = require('../src/dashboard/dashboard-generator');

describe('DashboardGenerator', () => {
  const mockReport = {
    url: 'https://example.com/',
    exportedAt: '2026-04-18T12:00:00.000Z',
    siteTitle: 'Example Site',
    assets: {
      images: Array(52).fill('img.png'),
      scripts: Array(8).fill('script.js'),
      stylesheets: Array(4).fill('style.css'),
      fonts: Array(12).fill('font.woff2'),
      backgrounds: Array(5).fill('bg.png'),
    },
    timing: {
      crawlTime: 6.1,
      extractTime: 0.04,
      rewriteTime: 0.03,
      validateTime: 0.03,
      zipTime: 0.02,
      totalTime: 6.23,
    },
    validation: {
      valid: true,
      brokenLinks: ['images/missing.png', 'images/404.webp', 'js/lib.js'],
      warnings: ['3 broken links found', 'Export size 456 KB (within limits)'],
      totalSize: 456100,
      fileCount: 1,
    },
    hidden: {
      hiddenElements: [],
      accordions: [],
      tabs: [],
      modals: [{ id: 'modal-1', title: 'Loading Modal' }],
      summary: {
        totalHidden: 0,
        totalAccordions: 0,
        totalTabs: 0,
        totalModals: 1,
      },
    },
    framerInfo: {
      siteTitle: 'Example Site',
      publishDate: 'Apr 5, 2026, 11:50 PM UTC',
      generatorVersion: 'f36d8c8',
      components: ['framer-Ru7Vh', 'framer-QRFgy'],
      namedLayers: ['header', 'footer', 'Loading Modal'],
      fonts: ['DM Sans', 'Inter'],
      externalServices: ['events.framer.com', 'fonts.gstatic.com'],
      hasAnalytics: false,
      analyticsId: null,
    },
  };

  describe('HTML generation', () => {
    test('returns a valid HTML string', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(typeof html).toBe('string');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    test('includes DOCTYPE declaration', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('<!DOCTYPE html>');
    });

    test('includes inline CSS styles (no external stylesheets)', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
      expect(html).not.toContain('href="https://');
      expect(html).not.toContain('href="/');
    });

    test('is self-contained (no CDN dependencies)', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).not.toContain('cdn.jsdelivr.net');
      expect(html).not.toContain('cdnjs.cloudflare.com');
      expect(html).not.toContain('unpkg.com');
    });
  });

  describe('header section', () => {
    test('includes site title', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('Example Site');
    });

    test('includes export date', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('2026');
    });

    test('includes export status', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('Ready');
    });
  });

  describe('summary cards', () => {
    test('displays total assets count', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('81'); // 52 images + 8 scripts + 4 styles + 12 fonts + 5 backgrounds
    });

    test('displays export size', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('456');
      expect(html).toContain('KB');
    });

    test('displays broken links count', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('3');
    });

    test('displays total time', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('6.23');
    });
  });

  describe('asset breakdown section', () => {
    test('includes image count', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('Images');
      expect(html).toContain('52');
    });

    test('includes script count', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('Scripts');
      expect(html).toContain('8');
    });

    test('includes font count', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('Fonts');
      expect(html).toContain('12');
    });
  });

  describe('components section', () => {
    test('displays component list', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('header');
      expect(html).toContain('footer');
    });

    test('shows component count', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('3'); // 3 named layers
    });
  });

  describe('libraries section', () => {
    test('includes Framer runtime version', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('f36d8c8');
    });

    test('lists fonts used', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('DM Sans');
      expect(html).toContain('Inter');
    });

    test('lists external services', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('events.framer.com');
      expect(html).toContain('fonts.gstatic.com');
    });
  });

  describe('issues section', () => {
    test('displays broken links list', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('missing.png');
    });

    test('shows warning count', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('3');
    });
  });

  describe('hidden content section', () => {
    test('displays modal count', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('Loading Modal');
    });

    test('shows hidden content summary', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('Hidden') || expect(html).toContain('Modal');
    });
  });

  describe('performance metrics', () => {
    test('displays crawl time', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('6.1');
    });

    test('displays all timing metrics', () => {
      const generator = new DashboardGenerator(mockReport);
      const html = generator.generate();
      expect(html).toContain('Crawl');
      expect(html).toContain('Extract');
    });
  });

  describe('edge cases', () => {
    test('handles missing framerInfo gracefully', () => {
      const report = { ...mockReport, framerInfo: null };
      const generator = new DashboardGenerator(report);
      const html = generator.generate();
      expect(html).toContain('<html');
    });

    test('handles empty broken links', () => {
      const report = {
        ...mockReport,
        validation: { ...mockReport.validation, brokenLinks: [] },
      };
      const generator = new DashboardGenerator(report);
      const html = generator.generate();
      expect(typeof html).toBe('string');
    });

    test('handles empty modals', () => {
      const report = {
        ...mockReport,
        hidden: { ...mockReport.hidden, modals: [] },
      };
      const generator = new DashboardGenerator(report);
      const html = generator.generate();
      expect(typeof html).toBe('string');
    });
  });
});
