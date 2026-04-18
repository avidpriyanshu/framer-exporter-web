const yargs = require('yargs');
const { CrawlerManager } = require('./crawler/puppeteer-manager');
const { AssetFinder } = require('./extractor/asset-finder');
const { URLRewriter } = require('./extractor/url-rewriter');
const { ExportValidator } = require('./validator/export-quality');
const { ZipBuilder } = require('./packager/zip-builder');
const { FramerAnalyzer } = require('./analyzer/framer-analyzer');
const { DashboardGenerator } = require('./dashboard/dashboard-generator');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function exportSite(url, outputDir) {
  const startTime = Date.now();
  console.log(`🚀 Starting export of ${url}`);
  console.log(`   Timeout: 30s | URL: ${url}`);

  // Create output directory
  fs.mkdirSync(path.join(outputDir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'js'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'css'), { recursive: true });

  // Step 1: Crawl
  const crawlStart = Date.now();
  console.log('📡 Crawling site...');
  const crawler = new CrawlerManager();
  await crawler.initialize();
  const { html, success } = await crawler.crawlUrl(url);
  await crawler.close();
  const crawlTime = ((Date.now() - crawlStart) / 1000).toFixed(2);

  if (!success) {
    throw new Error('Crawl failed');
  }

  console.log(`✅ Crawl complete (${crawlTime}s)`);

  // Step 2: Analyze Framer metadata
  const analyzeStart = Date.now();
  console.log('🔍 Analyzing metadata...');
  const analyzer = new FramerAnalyzer(html);
  const framerInfo = analyzer.analyze();
  const analyzeTime = ((Date.now() - analyzeStart) / 1000).toFixed(2);
  console.log(`✅ Metadata analyzed (${analyzeTime}s)`);

  // Step 3: Extract assets
  const extractStart = Date.now();
  console.log('🎨 Extracting assets...');
  const $ = cheerio.load(html);
  const finder = new AssetFinder($, url);
  const assets = finder.findAllAssets();
  const extractTime = ((Date.now() - extractStart) / 1000).toFixed(2);
  console.log(`✅ Found ${Object.values(assets).flat().length} assets (${extractTime}s)`);

  // Step 4: Rewrite URLs
  const rewriteStart = Date.now();
  console.log('🔗 Rewriting URLs...');
  const rewriter = new URLRewriter(outputDir);
  const rewrittenHTML = rewriter.rewriteHTML(html);
  fs.writeFileSync(path.join(outputDir, 'index.html'), rewrittenHTML);
  const rewriteTime = ((Date.now() - rewriteStart) / 1000).toFixed(2);
  console.log(`✅ URLs rewritten (${rewriteTime}s)`);

  // Step 5: Validate
  const validateStart = Date.now();
  console.log('🔍 Validating export...');
  const validator = new ExportValidator(outputDir);
  const validationReport = validator.generateReport();
  const validateTime = ((Date.now() - validateStart) / 1000).toFixed(2);
  console.log(`✅ Validation complete (${validateTime}s)`);
  console.log(`   ${validationReport.summary.filesProcessed} files`);
  console.log(`   ${validationReport.summary.totalSize}`);

  if (validationReport.summary.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validationReport.summary.warnings.forEach(w => console.log(`   - ${w}`));
  }

  // Step 6: Create ZIP
  const zipStart = Date.now();
  console.log('📦 Creating ZIP...');
  const builder = new ZipBuilder(outputDir);
  const zipPath = await builder.build(path.basename(outputDir));
  const zipTime = ((Date.now() - zipStart) / 1000).toFixed(2);
  console.log(`✅ Export saved to ${zipPath} (${zipTime}s)`);

  // Step 7: Generate Dashboard
  const dashboardStart = Date.now();
  console.log('📊 Generating dashboard...');
  const report = {
    url,
    exportedAt: new Date().toISOString(),
    siteTitle: framerInfo.siteTitle,
    assets,
    timing: {
      crawlTime: parseFloat(crawlTime),
      extractTime: parseFloat(extractTime),
      rewriteTime: parseFloat(rewriteTime),
      validateTime: parseFloat(validateTime),
      zipTime: parseFloat(zipTime),
      totalTime: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
    },
    validation: validationReport.validation,
    hidden: validationReport.hidden,
    framerInfo,
  };
  const dashboardGenerator = new DashboardGenerator(report);
  const dashboardHTML = dashboardGenerator.generate();
  fs.writeFileSync(path.join(outputDir, 'dashboard.html'), dashboardHTML);
  const dashboardTime = ((Date.now() - dashboardStart) / 1000).toFixed(2);
  console.log(`✅ Dashboard saved to dashboard.html (${dashboardTime}s)`);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  Total time: ${totalTime}s`);

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
