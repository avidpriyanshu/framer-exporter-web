const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { HiddenContentDetector } = require('./hidden-content');

class ExportValidator {
  constructor(exportDir) {
    this.exportDir = exportDir;
    this.issues = [];
  }

  validate() {
    const results = {
      valid: true,
      missing: [],
      brokenLinks: [],
      warnings: [],
      totalSize: 0,
      fileCount: 0,
    };

    const requiredFiles = ['index.html'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.exportDir, file))) {
        results.missing.push(file);
        results.valid = false;
      }
    }

    const htmlPath = path.join(this.exportDir, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const brokenLinks = this.checkLinks(html);
      results.brokenLinks = brokenLinks;
      if (brokenLinks.length > 0) {
        results.warnings.push(`${brokenLinks.length} broken links found`);
      }
    }

    const sizeInfo = this.calculateSize();
    results.totalSize = sizeInfo.totalSize;
    results.fileCount = sizeInfo.fileCount;

    if (results.totalSize > 100 * 1024 * 1024) {
      results.warnings.push('Export size > 100MB (may be slow to download)');
    }

    return results;
  }

  checkLinks(html) {
    const $ = cheerio.load(html);
    const brokenLinks = [];

    const checkPath = (url) => {
      if (url.startsWith('http') || url.startsWith('#') || url.startsWith('data:')) {
        return true;
      }

      const fullPath = path.join(this.exportDir, url);
      return fs.existsSync(fullPath);
    };

    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (!checkPath(src)) {
        brokenLinks.push(src);
      }
    });

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!checkPath(href)) {
        brokenLinks.push(href);
      }
    });

    return [...new Set(brokenLinks)];
  }

  calculateSize() {
    let totalSize = 0;
    let fileCount = 0;

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else {
          totalSize += stat.size;
          fileCount++;
        }
      });
    };

    if (fs.existsSync(this.exportDir)) {
      walkDir(this.exportDir);
    }

    return { totalSize, fileCount };
  }

  generateReport() {
    const validation = this.validate();
    const hidden = this.checkHiddenContent();

    return {
      validation,
      hidden,
      summary: {
        passed: validation.valid && hidden.summary.totalHidden === 0,
        message: validation.valid ? 'Export ready' : 'Export has issues',
        filesProcessed: validation.fileCount,
        totalSize: this.formatBytes(validation.totalSize),
        warnings: validation.warnings,
        hiddenItemsFound: hidden.summary.totalHidden,
      },
    };
  }

  checkHiddenContent() {
    const htmlPath = path.join(this.exportDir, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      return { summary: { totalHidden: 0, totalAccordions: 0, totalTabs: 0, totalModals: 0 } };
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');
    const $ = cheerio.load(html);
    const detector = new HiddenContentDetector($);
    return detector.generateReport();
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = { ExportValidator };
