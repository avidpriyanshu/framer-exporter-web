const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

class ZipBuilder {
  constructor(sourceDir) {
    this.sourceDir = sourceDir;
    this.outputDir = sourceDir;
  }

  async build(projectName) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.outputDir, `${projectName}.zip`);
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        resolve(outputPath);
      });

      archive.on('error', reject);
      archive.pipe(output);

      const manifest = this.generateManifest();
      archive.append(JSON.stringify(manifest, null, 2), { name: 'MANIFEST.json' });

      archive.directory(this.sourceDir, false);

      archive.finalize();
    });
  }

  generateManifest() {
    const files = this.listFiles();
    return {
      exportedAt: new Date().toISOString(),
      totalFiles: files.length,
      structure: {
        images: this.countFiles('images'),
        js: this.countFiles('js'),
        css: this.countFiles('css'),
      },
      notes: 'This is a static export. All assets are included locally.',
    };
  }

  listFiles() {
    const files = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          files.push(fullPath);
        }
      });
    };
    walk(this.sourceDir);
    return files;
  }

  countFiles(subdir) {
    const dirPath = path.join(this.sourceDir, subdir);
    if (!fs.existsSync(dirPath)) return 0;

    const files = fs.readdirSync(dirPath);
    return files.length;
  }
}

module.exports = { ZipBuilder };
