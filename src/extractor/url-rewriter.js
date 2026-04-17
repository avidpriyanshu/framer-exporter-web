const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class URLRewriter {
  constructor(exportDir) {
    this.exportDir = exportDir;
    this.assetMap = new Map();
    this.missingAssets = [];
  }

  registerAsset(localPath, originalUrl) {
    this.assetMap.set(originalUrl, localPath);
  }

  getLocalPath(url) {
    if (this.assetMap.has(url)) {
      return this.assetMap.get(url);
    }

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = path.basename(pathname);

      if (this.assetExists(filename)) {
        this.assetMap.set(url, filename);
        return filename;
      }
    } catch (e) {
      return url;
    }

    return null;
  }

  assetExists(filename) {
    const imagesDir = path.join(this.exportDir, 'images');
    return fs.existsSync(path.join(imagesDir, filename));
  }

  rewriteHTML(html) {
    const $ = cheerio.load(html);

    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      const newSrc = this.getLocalPath(src);
      if (newSrc) {
        $(el).attr('src', newSrc);
      }
    });

    $('img[srcset]').each((_, el) => {
      const srcset = $(el).attr('srcset');
      const newSrcset = srcset.split(',').map(part => {
        const [url, descriptor] = part.trim().split(/\s+/);
        const newUrl = this.getLocalPath(url);
        return newUrl ? `${newUrl} ${descriptor}`.trim() : part.trim();
      }).join(', ');
      $(el).attr('srcset', newSrcset);
    });

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        const newHref = this.getLocalPath(href);
        if (newHref && !newHref.startsWith('http')) {
          $(el).attr('href', newHref);
        }
      }
    });

    $('style').each((_, el) => {
      let css = $(el).text();
      const urlRegex = /url\(['"]?([^'"\)]+)['"]?\)/g;
      css = css.replace(urlRegex, (match, url) => {
        const newUrl = this.getLocalPath(url);
        return newUrl ? `url('${newUrl}')` : match;
      });
      $(el).text(css);
    });

    $('[style]').each((_, el) => {
      let style = $(el).attr('style');
      const urlRegex = /url\(['"]?([^'"\)]+)['"]?\)/g;
      style = style.replace(urlRegex, (match, url) => {
        const newUrl = this.getLocalPath(url);
        return newUrl ? `url('${newUrl}')` : match;
      });
      $(el).attr('style', style);
    });

    return $.html();
  }

  validateAssets() {
    const imagesDir = path.join(this.exportDir, 'images');
    const missing = [];

    for (const [originalUrl, localPath] of this.assetMap.entries()) {
      const fullPath = path.join(imagesDir, localPath);
      if (!fs.existsSync(fullPath)) {
        missing.push(localPath);
      }
    }

    return { missing, total: this.assetMap.size };
  }
}

module.exports = { URLRewriter };
