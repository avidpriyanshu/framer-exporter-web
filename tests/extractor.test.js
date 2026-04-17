const { AssetFinder } = require('../src/extractor/asset-finder');
const cheerio = require('cheerio');

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
