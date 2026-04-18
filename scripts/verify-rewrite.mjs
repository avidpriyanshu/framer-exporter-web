import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';

const require = createRequire(import.meta.url);
const { exportSite } = require('framer-exporter/src/cli');
const { AssetFinder } = require('framer-exporter/src/extractor/asset-finder');

const url = 'https://boost.framer.website/';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framer-verify-rewrite-'));

try {
  console.log('Step 1: Running upstream exporter...');
  const zipPath = await exportSite(url, tempDir);
  const zip = new AdmZip(zipPath);
  const htmlEntry = zip.getEntries().find(e => e.entryName === 'index.html');
  const originalHtml = htmlEntry ? zip.readAsText(htmlEntry) : '';
  
  console.log('Step 2: Simulating materialization...');
  const $ = cheerio.load(originalHtml);
  const finder = new AssetFinder($, url);
  const discoveredAssets = finder.findAllAssets();
  const discoveredCount = Object.values(discoveredAssets).flat().length;
  
  // Simulate the localize function behavior (simplified)
  const cache = new Map();
  let downloadCount = 0;
  
  const localize = async (assetUrl, contextUrl) => {
    const normalized = normalizeAssetUrl(assetUrl, contextUrl);
    if (!normalized) return null;
    if (cache.has(normalized)) return cache.get(normalized);
    
    // Simulate download (just create a local path without actually downloading)
    const bucket = inferBucket(normalized);
    const filename = buildAssetFilename(normalized);
    const relativePath = toPosixPath(path.join(bucket, filename));
    cache.set(normalized, relativePath);
    downloadCount++;
    return relativePath;
  };

  // Simulate rewriting img src
  const imgElements = $('img[src]').toArray();
  let rewrittenCount = 0;
  for (const el of imgElements) {
    const current = $(el).attr('src');
    if (!current) continue;
    const localized = await localize(current, url);
    if (localized) {
      $(el).attr('src', localized);
      rewrittenCount++;
    }
  }
  
  const rewrittenHtml = $.html();
  
  // Check the rewritten HTML
  const rewrittenImgMatches = [...rewrittenHtml.matchAll(/src="([^"]+)"/g)];
  const localImgRefs = rewrittenImgMatches.filter(m => m[1].match(/^(images|css|js)\//)).length;
  
  console.log('\nResults:');
  console.log('  Original img references:', imgElements.length);
  console.log('  Rewritten count:', rewrittenCount);
  console.log('  Local references in rewritten HTML:', localImgRefs);
  console.log('  Assets discovered:', discoveredCount);
  console.log('  Simulated downloads:', downloadCount);
  
  if (rewrittenCount > 0 && localImgRefs > 0) {
    console.log('\n✓ Rewriting appears to be working!');
    console.log('\nSample rewritten img src values:');
    rewrittenImgMatches.slice(0, 3).forEach(m => console.log('  -', m[1]));
  } else {
    console.log('\n✗ Rewriting may have issues');
  }

} finally {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function normalizeAssetUrl(assetUrl, contextUrl) {
  if (!assetUrl || assetUrl.startsWith('data:') || assetUrl.startsWith('#') || 
      assetUrl.startsWith('mailto:') || assetUrl.startsWith('tel:') || 
      assetUrl.startsWith('javascript:')) {
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
  if (pathname.endsWith('.css') || pathname.endsWith('.woff') || pathname.endsWith('.woff2') || 
      pathname.endsWith('.ttf') || pathname.endsWith('.otf') || pathname.endsWith('.eot')) {
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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}
