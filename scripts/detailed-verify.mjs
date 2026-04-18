import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import AdmZip from 'adm-zip';

const require = createRequire(import.meta.url);
const { exportSite } = require('framer-exporter/src/cli');

const url = 'https://boost.framer.website/';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framer-detailed-verify-'));

try {
  console.log('Verifying upstream export references...');
  const zipPath = await exportSite(url, tempDir);
  
  // Load and extract HTML 
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter(e => !e.isDirectory);
  
  const htmlEntry = entries.find(e => e.entryName === 'index.html');
  const html = htmlEntry ? zip.readAsText(htmlEntry) : '';
  
  // Count references by looking at the HTML
  const imgSrcMatches = [...html.matchAll(/src="([^"]+)"/g)];
  const linkHrefMatches = [...html.matchAll(/href="([^"]+)"/g)];
  const styleUrlMatches = [...html.matchAll(/url\(([^)]+)\)/g)];
  
  // Check for local asset references
  const localImgRefs = imgSrcMatches.filter(m => m[1].match(/^(images|css|js)\//)).length;
  const localLinkRefs = linkHrefMatches.filter(m => m[1].match(/^(images|css|js)\//)).length;
  const localStyleRefs = styleUrlMatches.filter(m => m[1].match(/^(images|css|js)\//)).length;
  
  console.log('\nHTML Reference Analysis (UPSTREAM ZIP):');
  console.log('  img src references:', imgSrcMatches.length, '(local:', localImgRefs, ')');
  console.log('  link href references:', linkHrefMatches.length, '(local:', localLinkRefs, ')');
  console.log('  style url references:', styleUrlMatches.length, '(local:', localStyleRefs, ')');
  
  // Check for self-zip
  const hasSelfZip = entries.some(e => e.entryName.endsWith('.zip'));
  console.log('  Self-referential zip:', hasSelfZip ? 'YES (BAD)' : 'NO (good)');
  
  // Show some examples
  console.log('\n  Sample img src values (first 3):');
  imgSrcMatches.slice(0, 3).forEach(m => console.log('    -', m[1]));
  
  console.log('\n  Sample link href values (first 3):');
  linkHrefMatches.slice(0, 3).forEach(m => console.log('    -', m[1]));
  
} finally {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
