import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';

const require = createRequire(import.meta.url);
const { exportSite } = require('framer-exporter/src/cli');
const { AssetFinder } = require('framer-exporter/src/extractor/asset-finder');

async function main() {
  const url = process.argv[2];
  const keepTemp = process.argv.includes('--keep-temp');
  const outputDir = process.argv.find((arg) => arg.startsWith('--output-dir='))?.split('=')[1];

  if (!url) {
    console.error('Usage: node scripts/verify-materialized-export.mjs <https-url> [--keep-temp] [--output-dir=path]');
    process.exit(1);
  }

  const tempDir = outputDir || fs.mkdtempSync(path.join(os.tmpdir(), 'framer-verify-materialized-'));

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const startedAt = Date.now();
    const zipPath = await exportSite(url, tempDir);

    if (!zipPath || !fs.existsSync(zipPath)) {
      throw new Error('Exporter did not produce a zip file.');
    }

    const { html } = extractHtmlFromZip(zipPath);
    const materialized = await materializeCloneAssets({
      pageUrl: url,
      outputDir: tempDir,
      html,
      htmlEntryName: 'index.html',
    });

    const rebuiltZipPath = path.join(tempDir, 'materialized-export.zip');
    rebuildCloneZip(tempDir, rebuiltZipPath);
    const totalMs = Date.now() - startedAt;

    const zip = new AdmZip(rebuiltZipPath);
    const entries = zip.getEntries().filter((entry) => !entry.isDirectory);

    const report = {
      url,
      zipPath: rebuiltZipPath,
      tempDir,
      totalMs,
      totalEntries: entries.length,
      entries: entries.map((entry) => entry.entryName),
      assetEntries: entries.filter((entry) =>
        /^(images|css|js)\//.test(entry.entryName)
      ).length,
      materializedAssets: materialized.report,
    };

    console.log(JSON.stringify(report, null, 2));
    if (keepTemp || outputDir) {
      console.log(`\n📁 Artifacts preserved at: ${tempDir}`);
    }
  } catch (error) {
    console.error(`\n❌ Materialization failed: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`\n📁 Artifacts preserved at: ${tempDir}`);
    throw error;
  } finally {
    if (fs.existsSync(tempDir) && !keepTemp && !outputDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

function extractHtmlFromZip(zipPath) {
  const zip = new AdmZip(zipPath);
  const htmlEntry =
    zip.getEntries().find((entry) => entry.entryName === 'index.html') ||
    zip.getEntries().find((entry) => entry.entryName.endsWith('/index.html')) ||
    zip.getEntries().find((entry) => entry.entryName.endsWith('.html'));

  if (!htmlEntry) {
    throw new Error('No HTML entry found in export.');
  }

  return {
    html: zip.readAsText(htmlEntry),
    htmlEntryName: htmlEntry.entryName,
  };
}

async function materializeCloneAssets({ pageUrl, outputDir, html, htmlEntryName }) {
  ensureAssetDirs(outputDir);

  const $ = cheerio.load(html);
  const finder = new AssetFinder($, pageUrl);
  const discoveredAssets = finder.findAllAssets();
  const discoveredCount = Object.values(discoveredAssets).flat().length;

  const cache = new Map();
  let downloaded = 0;
  let failed = 0;

  const localize = async (assetUrl, contextUrl) => {
    const normalized = normalizeAssetUrl(assetUrl, contextUrl);
    if (!normalized) return null;
    if (cache.has(normalized)) return cache.get(normalized);

    const bucket = inferBucket(normalized);
    const filename = buildAssetFilename(normalized);
    const absolutePath = path.join(outputDir, bucket, filename);

    try {
      const response = await fetch(normalized, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FramerExporter/1.0)' },
      });

      if (!response.ok) {
        failed += 1;
        return null;
      }

      if (bucket === 'css') {
        let cssText = await response.text();
        cssText = await rewriteCssUrls(cssText, normalized, async (nestedUrl, nestedContextUrl) => {
          const nestedLocal = await localize(nestedUrl, nestedContextUrl);
          if (!nestedLocal) return null;
          return path.posix.relative('css', nestedLocal);
        });
        fs.writeFileSync(absolutePath, cssText, 'utf-8');
      } else {
        const bytes = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(absolutePath, bytes);
      }

      const relativePath = toPosixPath(path.join(bucket, filename));
      cache.set(normalized, relativePath);
      downloaded += 1;
      return relativePath;
    } catch {
      failed += 1;
      return null;
    }
  };

  async function rewriteAttr(selector, attrName, rewriter) {
    const elements = $(selector).toArray();
    for (const el of elements) {
      const current = $(el).attr(attrName);
      if (!current) continue;
      $(el).attr(attrName, await rewriter(current));
    }
  }

  await rewriteAttr('img[src]', 'src', async (value) => (await localize(value, pageUrl)) ?? value);
  await rewriteAttr('script[src]', 'src', async (value) => (await localize(value, pageUrl)) ?? value);
  await rewriteAttr('link[href]', 'href', async (value) => (await localize(value, pageUrl)) ?? value);
  await rewriteAttr('img[srcset]', 'srcset', async (value) => {
    const parts = await Promise.all(
      value.split(',').map(async (part) => {
        const [assetUrl, descriptor] = part.trim().split(/\s+/, 2);
        const rewritten = (await localize(assetUrl, pageUrl)) ?? assetUrl;
        return descriptor ? `${rewritten} ${descriptor}` : rewritten;
      })
    );
    return parts.join(', ');
  });

  await rewriteAttr('[style]', 'style', async (value) =>
    rewriteCssUrls(value, pageUrl, async (nestedUrl, nestedContextUrl) => {
      return (await localize(nestedUrl, nestedContextUrl)) ?? nestedUrl;
    })
  );

  const styleTags = $('style').toArray();
  for (const el of styleTags) {
    $(el).text(
      await rewriteCssUrls($(el).text(), pageUrl, async (nestedUrl, nestedContextUrl) => {
        return (await localize(nestedUrl, nestedContextUrl)) ?? nestedUrl;
      })
    );
  }

  const rewrittenHtml = $.html();
  fs.writeFileSync(path.join(outputDir, htmlEntryName), rewrittenHtml, 'utf-8');

  return {
    html: rewrittenHtml,
    report: { discovered: discoveredCount, downloaded, failed },
  };
}

async function rewriteCssUrls(cssText, contextUrl, localize) {
  const matches = [...cssText.matchAll(/url\((['"]?)([^'")]+)\1\)/g)];
  let rewritten = cssText;
  for (const match of matches) {
    const original = match[0];
    const assetUrl = match[2];
    const localized = await localize(assetUrl, contextUrl);
    if (!localized) continue;
    rewritten = rewritten.replace(original, `url("${localized}")`);
  }
  return rewritten;
}

function normalizeAssetUrl(assetUrl, contextUrl) {
  if (
    !assetUrl ||
    assetUrl.startsWith('data:') ||
    assetUrl.startsWith('#') ||
    assetUrl.startsWith('mailto:') ||
    assetUrl.startsWith('tel:') ||
    assetUrl.startsWith('javascript:')
  ) {
    return null;
  }

  try {
    return new URL(assetUrl, contextUrl).toString();
  } catch {
    return null;
  }
}

function inferBucket(assetUrl) {
  const pathname = new URL(assetUrl).pathname.toLowerCase();
  if (pathname.endsWith('.js') || pathname.includes('/js')) return 'js';
  if (
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.otf') ||
    pathname.endsWith('.eot')
  ) {
    return 'css';
  }
  return 'images';
}

function buildAssetFilename(assetUrl) {
  const url = new URL(assetUrl);
  const ext = path.extname(url.pathname) || '.bin';
  const base = path.basename(url.pathname, ext) || 'asset';
  const safeBase = base.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80) || 'asset';
  return `${safeBase}-${shortHash(assetUrl)}${ext}`;
}

function shortHash(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function ensureAssetDirs(outputDir) {
  fs.mkdirSync(path.join(outputDir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'js'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'css'), { recursive: true });
}

function rebuildCloneZip(outputDir, zipPath) {
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }
  const zip = new AdmZip();
  addDirectoryToZip(zip, outputDir, outputDir);
  zip.writeZip(zipPath);
}

function addDirectoryToZip(zip, baseDir, currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    const relativePath = toPosixPath(path.relative(baseDir, absolutePath));
    if (relativePath.endsWith('.zip')) continue;
    if (entry.isDirectory()) {
      addDirectoryToZip(zip, baseDir, absolutePath);
    } else {
      zip.addFile(relativePath, fs.readFileSync(absolutePath));
    }
  }
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
