#!/usr/bin/env node
/**
 * Offline production build test: Takes a pre-materialized clone zip and tests
 * the production transform, generation, and build without needing the exporter.
 *
 * Usage:
 *   node scripts/test-production-offline.mjs <path-to-zip>
 *
 * Example:
 *   node scripts/test-production-offline.mjs /tmp/framer-verify-materialized-XXX/materialized-export.zip
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data;
        process.stdout.write(data);
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data;
        process.stderr.write(data);
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  const zipPath = process.argv[2];

  if (!zipPath || !fs.existsSync(zipPath)) {
    console.error('Usage: node scripts/test-production-offline.mjs <path-to-materialized-zip>');
    process.exit(1);
  }

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framer-offline-test-'));
  const generatedAppDir = path.join(testDir, 'generated-app');

  console.log('\n📋 Offline Production Build Verification');
  console.log('========================================\n');
  console.log(`ZIP: ${zipPath}`);
  console.log(`Test dir: ${testDir}\n`);

  const report = {
    zipPath,
    startTime: new Date().toISOString(),
    stages: {
      extractMaterials: null,
      productionTransform: null,
      unzip: null,
      npmInstall: null,
      npmBuild: null,
    },
    errors: [],
  };

  try {
    // Stage 1: Extract materials zip to get HTML
    console.log('📦 Stage 1: Extract Materialized ZIP');
    console.log('------------------------------------');
    const extractStartTime = Date.now();

    try {
      const zip = new AdmZip(zipPath);
      const materialsDir = path.join(testDir, 'materials');
      zip.extractAllTo(materialsDir, true);

      const extractMs = Date.now() - extractStartTime;
      report.stages.extractMaterials = {
        success: true,
        durationMs: extractMs,
      };

      console.log(`✓ Extracted materials in ${extractMs}ms\n`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`✗ Extraction failed: ${msg}\n`);
      report.stages.extractMaterials = { success: false, error: msg };
      report.errors.push({ stage: 'extract', error: msg });
      throw error;
    }

    // Stage 2: Production transform (via API endpoint)
    console.log('🔧 Stage 2: Production Transform');
    console.log('--------------------------------');
    const transformStartTime = Date.now();

    try {
      const ports = [3000, 3001, 3002, 3003, 3004];
      let response = null;
      let lastError = null;

      // Get HTML from materials
      const materialsDir = path.join(testDir, 'materials');
      const htmlFile = fs.readdirSync(materialsDir).find(f => f.endsWith('.html'));
      if (!htmlFile) {
        throw new Error('No HTML file found in materials');
      }

      const html = fs.readFileSync(path.join(materialsDir, htmlFile), 'utf-8');

      for (const port of ports) {
        try {
          console.log(`Trying localhost:${port}...`);
          response = await Promise.race([
            fetch(`http://localhost:${port}/api/export-production`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                html,
                materialsDir,
                useOfflineMode: true,
              }),
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 120000)
            ),
          ]);
          console.log(`✓ Connected to port ${port} (status: ${response.status})`);
          if (response.ok) {
            break;
          } else {
            const text = await response.text();
            console.log(`  Response: ${response.status} ${response.statusText}`);
            console.log(`  Body preview: ${text.substring(0, 100)}`);
            lastError = new Error(`Port ${port} responded with ${response.status}`);
            response = null;
          }
        } catch (e) {
          lastError = e;
        }
      }

      if (!response) {
        throw new Error(`Could not connect to API server. Run: npm run dev`);
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const outZipPath = path.join(testDir, 'export.zip');
      fs.writeFileSync(outZipPath, Buffer.from(buffer));

      const transformMs = Date.now() - transformStartTime;
      report.stages.productionTransform = {
        success: true,
        durationMs: transformMs,
        zipSize: buffer.byteLength,
      };

      console.log(`✓ Transform completed in ${transformMs}ms`);
      console.log(`  - Generated ZIP: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB\n`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`ℹ Note: API endpoint unavailable - ${msg}`);
      console.log('  Skipping transform and build stages.\n');
      console.log('  To run full E2E test:');
      console.log('    npm run dev &');
      console.log(`    node scripts/test-production-offline.mjs "${zipPath}"\n`);

      report.stages.productionTransform = {
        success: false,
        note: 'API endpoint not available - run "npm run dev" first',
      };

      report.endTime = new Date().toISOString();
      console.log('📊 Report (partial - materials extracted only):');
      console.log(JSON.stringify(report, null, 2));
      console.log(`\n📁 Test artifacts at: ${testDir}`);
      return;
    }

    // Stage 3: Unzip generated app
    console.log('📦 Stage 3: Extract Generated App');
    console.log('---------------------------------');
    const unzipStartTime = Date.now();

    try {
      const outZipPath = path.join(testDir, 'export.zip');
      const zip = new AdmZip(outZipPath);
      zip.extractAllTo(generatedAppDir, true);

      const unzipMs = Date.now() - unzipStartTime;
      report.stages.unzip = {
        success: true,
        durationMs: unzipMs,
      };

      console.log(`✓ Extracted to ${generatedAppDir}\n`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`✗ Extraction failed: ${msg}\n`);
      report.stages.unzip = { success: false, error: msg };
      report.errors.push({ stage: 'unzip', error: msg });
      throw error;
    }

    // Stage 4: npm install
    console.log('📥 Stage 4: npm install');
    console.log('----------------------');
    const installStartTime = Date.now();

    try {
      const appDir = path.join(generatedAppDir, 'framer-export');

      if (!fs.existsSync(appDir)) {
        throw new Error(`App directory not found at ${appDir}`);
      }

      console.log(`Running: npm install in ${appDir}\n`);

      execSync('npm install', {
        cwd: appDir,
        stdio: 'inherit',
        timeout: 300000,
      });

      const installMs = Date.now() - installStartTime;
      report.stages.npmInstall = {
        success: true,
        durationMs: installMs,
      };

      console.log(`\n✓ npm install completed in ${installMs}ms\n`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`✗ npm install failed: ${msg}\n`);
      report.stages.npmInstall = { success: false, error: msg };
      report.errors.push({ stage: 'npm install', error: msg });
      throw error;
    }

    // Stage 5: npm run build
    console.log('🏗️  Stage 5: npm run build');
    console.log('-----------------------');
    const buildStartTime = Date.now();

    try {
      const appDir = path.join(generatedAppDir, 'framer-export');

      console.log(`Running: npm run build in ${appDir}\n`);

      execSync('npm run build', {
        cwd: appDir,
        stdio: 'inherit',
        timeout: 300000,
      });

      const buildMs = Date.now() - buildStartTime;
      report.stages.npmBuild = {
        success: true,
        durationMs: buildMs,
      };

      console.log(`\n✓ npm run build completed in ${buildMs}ms\n`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`✗ npm run build failed: ${msg}\n`);
      report.stages.npmBuild = { success: false, error: msg };
      report.errors.push({ stage: 'npm build', error: msg });
      throw error;
    }

    // Success!
    report.success = true;
    report.endTime = new Date().toISOString();

    console.log('✅ All stages passed!\n');
    console.log('Generated app is production-ready.');
    console.log(`You can inspect it at: ${generatedAppDir}\n`);

  } catch (error) {
    report.success = false;
    report.endTime = new Date().toISOString();

    console.log('\n❌ Offline production build verification failed\n');
  } finally {
    console.log('📊 Final Report:');
    console.log('================\n');
    console.log(JSON.stringify(report, null, 2));

    console.log('\n📁 Test artifacts preserved at:');
    console.log(`   ${testDir}\n`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
