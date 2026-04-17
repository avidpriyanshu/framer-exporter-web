const yargs = require('yargs');
const { CrawlerManager } = require('./crawler/puppeteer-manager');
const { AssetFinder } = require('./extractor/asset-finder');
const { URLRewriter } = require('./extractor/url-rewriter');
const { ExportValidator } = require('./validator/export-quality');
const { ZipBuilder } = require('./packager/zip-builder');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function exportSite(url, outputDir) {
  console.log(`🚀 Starting export of ${url}`);

  // Create output directory
  fs.mkdirSync(path.join(outputDir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'js'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'css'), { recursive: true });

  // Step 1: Crawl
  console.log('📡 Crawling site...');
  const crawler = new CrawlerManager();
  await crawler.initialize();
  const { html, success } = await crawler.crawlUrl(url);
  await crawler.close();

  if (!success) {
    throw new Error('Crawl failed');
  }

  console.log('✅ Crawl complete');

  // Step 2: Extract assets
  console.log('🎨 Extracting assets...');
  const $ = cheerio.load(html);
  const finder = new AssetFinder($, url);
  const assets = finder.findAllAssets();
  console.log(`✅ Found ${Object.values(assets).flat().length} assets`);

  // Step 3: Rewrite URLs
  console.log('🔗 Rewriting URLs...');
  const rewriter = new URLRewriter(outputDir);
  const rewrittenHTML = rewriter.rewriteHTML(html);
  fs.writeFileSync(path.join(outputDir, 'index.html'), rewrittenHTML);
  console.log('✅ URLs rewritten');

  // Step 4: Validate
  console.log('🔍 Validating export...');
  const validator = new ExportValidator(outputDir);
  const report = validator.generateReport();
  console.log('✅ Validation complete');
  console.log(`   ${report.summary.filesProcessed} files`);
  console.log(`   ${report.summary.totalSize}`);

  if (report.summary.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    report.summary.warnings.forEach(w => console.log(`   - ${w}`));
  }

  // Step 5: Create ZIP
  console.log('📦 Creating ZIP...');
  const builder = new ZipBuilder(outputDir);
  const zipPath = await builder.build(path.basename(outputDir));
  console.log(`✅ Export saved to ${zipPath}`);

  return zipPath;
}

const cli = yargs
  .command(
    'export <url> [output]',
    'Export a Framer/Webflow site',
    (yargs) => {
      return yargs
        .positional('url', { describe: 'URL of site to export' })
        .positional('output', { describe: 'Output directory', default: './export' });
    },
    async (argv) => {
      try {
        const zipPath = await exportSite(argv.url, argv.output);
        console.log(`\n✨ Export complete: ${zipPath}`);
        process.exit(0);
      } catch (error) {
        console.error(`\n❌ Export failed: ${error.message}`);
        process.exit(1);
      }
    }
  )
  .help()
  .argv;

module.exports = { exportSite };
