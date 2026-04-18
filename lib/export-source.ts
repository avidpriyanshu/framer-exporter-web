import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';

const { AssetFinder } = require('framer-exporter/src/extractor/asset-finder');

export interface ClonedSiteSource {
  zipPath: string;
  html: string;
  htmlEntryName: string;
  assetReport?: {
    discovered: number;
    downloaded: number;
    failed: number;
    failedAssets?: string[];
  };
}

/**
 * Clone a source site using the upstream exporter and return the raw clone artifact.
 * This is the canonical entry point for any downstream transformation pipeline.
 */
export async function cloneSiteSource(
  url: string,
  outputDir: string,
  timeoutMs: number = 60000
): Promise<ClonedSiteSource> {
  const { exportSite } = require('framer-exporter/src/cli');

  const zipPath = await Promise.race([
    exportSite(url, outputDir),
    new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Export took too long. Try a simpler site.')), timeoutMs);
    }),
  ]);

  if (!zipPath || typeof zipPath !== 'string' || !fs.existsSync(zipPath)) {
    throw new Error('Export failed to create zip file.');
  }

  const { html, htmlEntryName } = extractHtmlFromZip(zipPath);
  const materialized = await materializeCloneAssets({
    pageUrl: url,
    outputDir,
    html,
    htmlEntryName,
  });
  rebuildCloneZip(outputDir, zipPath);

  return {
    zipPath,
    html: materialized.html,
    htmlEntryName,
    assetReport: materialized.report,
  };
}

/**
 * Extract the primary HTML document from a cloned site zip.
 * Prefer the root index.html, then any nested index.html, then the first html file.
 */
export function extractHtmlFromZip(zipPath: string): { html: string; htmlEntryName: string } {
  const zip = new AdmZip(zipPath);
  const htmlEntry = findPrimaryHtmlEntry(zip);

  if (!htmlEntry) {
    throw new Error('No HTML entry found in export.');
  }

  return {
    html: zip.readAsText(htmlEntry),
    htmlEntryName: htmlEntry.entryName,
  };
}

function findPrimaryHtmlEntry(zip: AdmZip): AdmZip.IZipEntry | undefined {
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);

  return (
    entries.find((entry) => entry.entryName === 'index.html') ||
    entries.find((entry) => entry.entryName.endsWith('/index.html')) ||
    entries.find((entry) => entry.entryName.endsWith('.html'))
  );
}

interface MaterializeCloneAssetsInput {
  pageUrl: string;
  outputDir: string;
  html: string;
  htmlEntryName: string;
}

async function materializeCloneAssets(
  input: MaterializeCloneAssetsInput
): Promise<{
  html: string;
  report: { discovered: number; downloaded: number; failed: number; failedAssets?: string[] };
}> {
  ensureAssetDirs(input.outputDir);

  const $ = cheerio.load(input.html);
  const finder = new AssetFinder($, input.pageUrl);
  const discoveredAssets = finder.findAllAssets();
  const discoveredCount = Object.values(discoveredAssets).flat().length;

  const cache = new Map<string, string>();
  let downloaded = 0;
  let failed = 0;
  const failedAssets: string[] = [];

  const localize = async (assetUrl: string, contextUrl: string): Promise<string | null> => {
    const normalized = normalizeAssetUrl(assetUrl, contextUrl);
    if (!normalized) return null;
    if (cache.has(normalized)) return cache.get(normalized)!;

    const bucket = inferBucket(normalized);
    const filename = buildAssetFilename(normalized);
    const absolutePath = path.join(input.outputDir, bucket, filename);

    try {
      const response = await fetch(normalized, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FramerExporter/1.0)' },
      });

      if (!response.ok) {
        failed += 1;
        failedAssets.push(`${normalized} (${response.status})`);
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
    } catch (error) {
      failed += 1;
      failedAssets.push(`${normalized} (error: ${error instanceof Error ? error.message : String(error)})`);
      return null;
    }
  };

  const rewriteAttr = async (
    selector: string,
    attrName: string,
    rewriter: (value: string) => Promise<string>
  ) => {
    const elements = $(selector).toArray();
    for (const el of elements) {
      const current = $(el).attr(attrName);
      if (!current) continue;
      $(el).attr(attrName, await rewriter(current));
    }
  };

  await rewriteAttr('img[src]', 'src', async (value) => {
    return (await localize(value, input.pageUrl)) ?? value;
  });

  await rewriteAttr('img[srcset]', 'srcset', async (value) => {
    const parts = await Promise.all(
      value.split(',').map(async (part) => {
        const [assetUrl, descriptor] = part.trim().split(/\s+/, 2);
        const rewritten = (await localize(assetUrl, input.pageUrl)) ?? assetUrl;
        return descriptor ? `${rewritten} ${descriptor}` : rewritten;
      })
    );
    return parts.join(', ');
  });

  await rewriteAttr('script[src]', 'src', async (value) => {
    return (await localize(value, input.pageUrl)) ?? value;
  });

  await rewriteAttr('link[href]', 'href', async (value) => {
    return (await localize(value, input.pageUrl)) ?? value;
  });

  await rewriteAttr('[style]', 'style', async (value) => {
    return rewriteCssUrls(value, input.pageUrl, async (nestedUrl, nestedContextUrl) => {
      return (await localize(nestedUrl, nestedContextUrl)) ?? nestedUrl;
    });
  });

  const styleTags = $('style').toArray();
  for (const el of styleTags) {
    const cssText = $(el).text();
    const rewritten = await rewriteCssUrls(cssText, input.pageUrl, async (nestedUrl, nestedContextUrl) => {
      return (await localize(nestedUrl, nestedContextUrl)) ?? nestedUrl;
    });
    $(el).text(rewritten);
  }

  const rewrittenHtml = $.html();
  fs.writeFileSync(path.join(input.outputDir, input.htmlEntryName), rewrittenHtml, 'utf-8');

  return {
    html: rewrittenHtml,
    report: {
      discovered: discoveredCount,
      downloaded,
      failed,
      failedAssets: failedAssets.length > 0 ? failedAssets : undefined,
    },
  };
}

async function rewriteCssUrls(
  cssText: string,
  contextUrl: string,
  localize: (assetUrl: string, contextUrl: string) => Promise<string | null>
): Promise<string> {
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

function normalizeAssetUrl(assetUrl: string, contextUrl: string): string | null {
  if (!assetUrl) return null;
  if (
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

function inferBucket(assetUrl: string): 'images' | 'js' | 'css' {
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

function buildAssetFilename(assetUrl: string): string {
  const url = new URL(assetUrl);
  const ext = path.extname(url.pathname) || inferExtensionFromPath(url.pathname);
  const base = path.basename(url.pathname, ext) || 'asset';
  const safeBase = base.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80) || 'asset';
  return `${safeBase}-${shortHash(assetUrl)}${ext}`;
}

function inferExtensionFromPath(pathname: string): string {
  if (pathname.includes('woff2')) return '.woff2';
  if (pathname.includes('woff')) return '.woff';
  if (pathname.includes('css')) return '.css';
  if (pathname.includes('js')) return '.js';
  return '.bin';
}

function shortHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function ensureAssetDirs(outputDir: string) {
  fs.mkdirSync(path.join(outputDir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'js'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'css'), { recursive: true });
}

function rebuildCloneZip(outputDir: string, zipPath: string) {
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }

  const zip = new AdmZip();
  addDirectoryToZip(zip, outputDir, outputDir);
  zip.writeZip(zipPath);
}

function addDirectoryToZip(zip: AdmZip, baseDir: string, currentDir: string) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    const relativePath = toPosixPath(path.relative(baseDir, absolutePath));

    if (relativePath.endsWith('.zip')) {
      continue;
    }

    if (entry.isDirectory()) {
      addDirectoryToZip(zip, baseDir, absolutePath);
    } else {
      zip.addFile(relativePath, fs.readFileSync(absolutePath));
    }
  }
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}
