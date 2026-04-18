import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import AdmZip from 'adm-zip';

const require = createRequire(import.meta.url);

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: node scripts/verify-live-export.mjs <https-url>');
    process.exit(1);
  }

  const { exportSite } = require('framer-exporter/src/cli');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framer-verify-live-'));

  try {
    const startedAt = Date.now();
    const zipPath = await exportSite(url, tempDir);
    const cloneMs = Date.now() - startedAt;

    if (!zipPath || !fs.existsSync(zipPath)) {
      throw new Error('Exporter did not produce a zip file.');
    }

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
    const htmlEntries = entries.filter((entry) => entry.entryName.endsWith('.html'));
    const assetEntries = entries.filter((entry) =>
      /\.(css|js|png|jpe?g|webp|svg|gif|woff2?|ttf|ico)$/i.test(entry.entryName)
    );
    const manifestEntry = entries.find((entry) => entry.entryName === 'MANIFEST.json');
    const manifest = manifestEntry ? JSON.parse(zip.readAsText(manifestEntry)) : null;
    const indexEntry =
      entries.find((entry) => entry.entryName === 'index.html') ||
      entries.find((entry) => entry.entryName.endsWith('/index.html')) ||
      htmlEntries[0];

    if (!indexEntry) {
      throw new Error('Clone zip does not contain an HTML entry.');
    }

    const html = zip.readAsText(indexEntry);

    const report = {
      url,
      zipPath,
      cloneMs,
      totalEntries: entries.length,
      entries: entries.map((entry) => entry.entryName),
      htmlEntries: htmlEntries.length,
      assetEntries: assetEntries.length,
      primaryHtmlEntry: indexEntry.entryName,
      htmlBytes: Buffer.byteLength(html),
      hasDoctype: /<!doctype html>/i.test(html),
      hasFramerMarker: /framer/i.test(html),
      title: extractTitle(html),
      manifest,
    };

    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
