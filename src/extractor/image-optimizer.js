const sharp = require('sharp');
const path = require('path');

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      minSizeForOptimization: 50000,
      jpegQuality: 80,
      webpQuality: 80,
      ...options,
    };

    this.viewportBreakpoints = {
      desktop: 1280,
      tablet: 768,
      mobile: 360,
    };
  }

  shouldOptimize(filename, fileSizeBytes) {
    if (fileSizeBytes < this.options.minSizeForOptimization) {
      return null;
    }

    const ext = path.extname(filename).toLowerCase();

    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      return 'webp';
    }

    return null;
  }

  generateVariants(filename, dimensions) {
    if (!dimensions || !dimensions.width) {
      return null;
    }

    const basename = path.parse(filename).name;
    const ext = path.extname(filename);

    const variants = {};
    for (const [viewport, width] of Object.entries(this.viewportBreakpoints)) {
      const scale = Math.min(1, width / dimensions.width);
      variants[viewport] = `${basename}-${width}${ext}`;
    }

    return variants;
  }

  generateSrcset(filename, variants) {
    if (!variants) return filename;

    const parts = [];
    for (const [viewport, variantFile] of Object.entries(variants)) {
      const width = this.viewportBreakpoints[viewport];
      parts.push(`${variantFile} ${width}w`);
    }

    return parts.join(', ');
  }

  async optimizeImage(inputPath, outputPath, targetWidth = null) {
    let pipeline = sharp(inputPath);

    if (targetWidth) {
      pipeline = pipeline.resize(targetWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    const ext = path.extname(outputPath).toLowerCase();
    if (ext === '.webp' || !ext) {
      pipeline = pipeline.webp({ quality: this.options.webpQuality });
      outputPath = outputPath.replace(/\.[^.]+$/, '.webp');
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      pipeline = pipeline.jpeg({ quality: this.options.jpegQuality });
    }

    await pipeline.toFile(outputPath);
    return outputPath;
  }

  async createResponsiveVariants(inputPath, outputDir, filename) {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const variants = this.generateVariants(filename, {
      width: metadata.width,
      height: metadata.height,
    });

    if (!variants) return null;

    const results = {};
    for (const [viewport, variantFilename] of Object.entries(variants)) {
      const width = this.viewportBreakpoints[viewport];
      const outputPath = `${outputDir}/${variantFilename}`;
      await this.optimizeImage(inputPath, outputPath, width);
      results[viewport] = variantFilename;
    }

    return results;
  }
}

module.exports = { ImageOptimizer };
