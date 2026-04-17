class AssetFinder {
  constructor(cheerioInstance, baseUrl = '') {
    this.$ = cheerioInstance;
    this.baseUrl = baseUrl;
  }

  findImages() {
    const assets = [];
    this.$('img').each((_, el) => {
      const src = this.$(el).attr('src');
      const srcset = this.$(el).attr('srcset');

      if (src) assets.push(src);

      if (srcset) {
        srcset.split(',').forEach(part => {
          const path = part.trim().split(/\s+/)[0];
          if (path) assets.push(path);
        });
      }
    });

    this.$('[data-src], [data-lazy]').each((_, el) => {
      const src = this.$(el).attr('data-src') || this.$(el).attr('data-lazy');
      if (src) assets.push(src);
    });

    return [...new Set(assets)];
  }

  findBackgroundImages() {
    const assets = [];
    const urlRegex = /url\(['"]?([^'"\)]+)['"]?\)/g;

    this.$('[style]').each((_, el) => {
      const style = this.$(el).attr('style');
      let match;
      while ((match = urlRegex.exec(style)) !== null) {
        assets.push(match[1]);
      }
    });

    this.$('style').each((_, el) => {
      const content = this.$(el).text();
      let match;
      while ((match = urlRegex.exec(content)) !== null) {
        assets.push(match[1]);
      }
    });

    return [...new Set(assets)];
  }

  findFonts() {
    const assets = [];

    this.$('link[href*="fonts.googleapis"], link[href*="fonts.gstatic"]').each((_, el) => {
      const href = this.$(el).attr('href');
      if (href) assets.push(href);
    });

    const fontFaceRegex = /src:\s*url\(['"]?([^'"\)]+)['"]?\)/g;
    this.$('style').each((_, el) => {
      const content = this.$(el).text();
      let match;
      while ((match = fontFaceRegex.exec(content)) !== null) {
        assets.push(match[1]);
      }
    });

    return [...new Set(assets)];
  }

  findScripts() {
    const assets = [];
    this.$('script[src]').each((_, el) => {
      const src = this.$(el).attr('src');
      if (src && !src.includes('inline') && !src.startsWith('data:')) {
        assets.push(src);
      }
    });
    return assets;
  }

  findStylesheets() {
    const assets = [];
    this.$('link[rel="stylesheet"], link[rel="preload"][as="style"]').each((_, el) => {
      const href = this.$(el).attr('href');
      if (href && !href.startsWith('data:')) {
        assets.push(href);
      }
    });
    return assets;
  }

  findAllAssets() {
    return {
      images: this.findImages(),
      backgrounds: this.findBackgroundImages(),
      fonts: this.findFonts(),
      scripts: this.findScripts(),
      stylesheets: this.findStylesheets(),
    };
  }
}

module.exports = { AssetFinder };
