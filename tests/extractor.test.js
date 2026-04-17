const { AssetFinder } = require('../src/extractor/asset-finder');
const { URLRewriter } = require('../src/extractor/url-rewriter');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

describe('Asset Finder', () => {
  test('finds all img src attributes', () => {
    const html = `
      <img src="test.png">
      <img src="nested/image.jpg">
    `;
    const $ = cheerio.load(html);
    const finder = new AssetFinder($);
    const assets = finder.findImages();
    expect(assets).toEqual(expect.arrayContaining(['test.png', 'nested/image.jpg']));
  });

  test('finds all srcset images', () => {
    const html = `<img srcset="small.png 480w, large.png 1024w">`;
    const $ = cheerio.load(html);
    const finder = new AssetFinder($);
    const assets = finder.findImages();
    expect(assets).toContain('small.png');
    expect(assets).toContain('large.png');
  });

  test('finds CSS background-image URLs', () => {
    const html = `<div style="background-image: url('bg.png')"></div>`;
    const $ = cheerio.load(html);
    const finder = new AssetFinder($);
    const assets = finder.findBackgroundImages();
    expect(assets).toContain('bg.png');
  });

  test('finds font URLs from Google Fonts', () => {
    const html = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700">`;
    const $ = cheerio.load(html);
    const finder = new AssetFinder($);
    const assets = finder.findFonts();
    expect(assets.length).toBeGreaterThan(0);
  });

  test('finds script sources', () => {
    const html = `<script src="app.js"></script>`;
    const $ = cheerio.load(html);
    const finder = new AssetFinder($);
    const assets = finder.findScripts();
    expect(assets).toContain('app.js');
  });

  test('finds stylesheet links', () => {
    const html = `<link rel="stylesheet" href="style.css">`;
    const $ = cheerio.load(html);
    const finder = new AssetFinder($);
    const assets = finder.findStylesheets();
    expect(assets).toContain('style.css');
  });

  test('deduplicates assets', () => {
    const html = `
      <img src="duplicate.png">
      <img src="duplicate.png">
    `;
    const $ = cheerio.load(html);
    const finder = new AssetFinder($);
    const assets = finder.findImages();
    expect(assets.filter(a => a === 'duplicate.png')).toHaveLength(1);
  });
});

describe('URL Rewriter', () => {
  let rewriter;
  let testDir;

  beforeEach(() => {
    testDir = path.join(__dirname, 'fixtures');
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'images'), { recursive: true });
    rewriter = new URLRewriter(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('rewrites img src from URL to local path', () => {
    const html = '<img src="https://example.com/image.png">';
    rewriter.registerAsset('image.png', 'https://example.com/image.png');
    fs.writeFileSync(path.join(testDir, 'images', 'image.png'), '');
    const result = rewriter.rewriteHTML(html);
    expect(result).toContain('src="image.png"');
  });

  test('rewrites srcset URLs', () => {
    const html = '<img srcset="https://example.com/small.png 480w, https://example.com/large.png 1024w">';
    rewriter.registerAsset('small.png', 'https://example.com/small.png');
    rewriter.registerAsset('large.png', 'https://example.com/large.png');
    fs.writeFileSync(path.join(testDir, 'images', 'small.png'), '');
    fs.writeFileSync(path.join(testDir, 'images', 'large.png'), '');
    const result = rewriter.rewriteHTML(html);
    expect(result).toContain('small.png');
    expect(result).toContain('large.png');
  });

  test('rewrites CSS background-image URLs', () => {
    const html = '<style>body { background-image: url("https://example.com/bg.png"); }</style>';
    rewriter.registerAsset('bg.png', 'https://example.com/bg.png');
    fs.writeFileSync(path.join(testDir, 'images', 'bg.png'), '');
    const result = rewriter.rewriteHTML(html);
    expect(result).toContain("url('bg.png')");
  });

  test('preserves anchors and mailto links', () => {
    const html = '<a href="#section">Anchor</a><a href="mailto:test@example.com">Email</a>';
    const result = rewriter.rewriteHTML(html);
    expect(result).toContain('href="#section"');
    expect(result).toContain('href="mailto:test@example.com"');
  });

  test('validates missing assets after rewriting', () => {
    rewriter.registerAsset('missing.png', 'https://example.com/missing.png');
    const validation = rewriter.validateAssets();
    expect(validation.missing).toContain('missing.png');
  });
});
