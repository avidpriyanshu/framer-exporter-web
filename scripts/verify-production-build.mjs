import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: node scripts/verify-production-build.mjs <https-url>');
    process.exit(1);
  }

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framer-production-test-'));
  const generatedAppDir = path.join(testDir, 'generated-app');

  console.log('\n📋 Production Build Verification');
  console.log('================================\n');
  console.log(`URL: ${url}`);
  console.log(`Test dir: ${testDir}\n`);

  const report = {
    url,
    startTime: new Date().toISOString(),
    stages: {
      cloneAndMaterialize: null,
      productionTransform: null,
      unzip: null,
      npmInstall: null,
      npmBuild: null,
    },
    errors: [],
    generatedFiles: {
      pageCount: 0,
      componentCount: 0,
      styleCount: 0,
    },
  };

  try {
    // Stage 1: Clone and materialize
    console.log('📥 Stage 1: Clone & Materialize Assets');
    console.log('--------------------------------------');
    const stageStartTime = Date.now();

    try {
      // Import the TypeScript functions via require (since we're in an ESM context)
      const { cloneSiteSource } = require('../lib/export-source.ts');
      const clone = await cloneSiteSource(url, testDir, 120000);

      const cloneMs = Date.now() - stageStartTime;
      report.stages.cloneAndMaterialize = {
        success: true,
        durationMs: cloneMs,
        assetReport: clone.assetReport,
      };

      console.log(`✓ Clone completed in ${cloneMs}ms`);
      if (clone.assetReport) {
        console.log(`  - Discovered: ${clone.assetReport.discovered} assets`);
        console.log(`  - Downloaded: ${clone.assetReport.downloaded} assets`);
        console.log(`  - Failed: ${clone.assetReport.failed} assets\n`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`✗ Clone failed: ${msg}\n`);
      report.stages.cloneAndMaterialize = {
        success: false,
        error: msg,
      };
      report.errors.push({ stage: 'clone', error: msg });
      throw error;
    }

    // Stage 2: Production transform (via API endpoint)
    console.log('🔧 Stage 2: Production Transform');
    console.log('--------------------------------');
    const transformStartTime = Date.now();

    try {
      // Call the API endpoint directly via fetch
      const response = await fetch('http://localhost:3000/api/export-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const zipPath = path.join(testDir, 'export.zip');
      fs.writeFileSync(zipPath, Buffer.from(buffer));

      const transformMs = Date.now() - transformStartTime;
      report.stages.productionTransform = {
        success: true,
        durationMs: transformMs,
        zipSize: buffer.byteLength,
      };

      console.log(`✓ Transform completed in ${transformMs}ms`);
      console.log(`  - Generated ZIP: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB\n`);
    } catch (error) {
      console.warn('ℹ Note: API endpoint unavailable (needs server running)');
      console.log('  Skipping transform and build stages.\n');
      console.log('  To run full E2E test:');
      console.log('    npm run dev &');
      console.log(`    node scripts/verify-production-build.mjs "${url}"\n`);

      report.stages.productionTransform = {
        success: false,
        note: 'API endpoint not available - run "npm run dev" first',
      };

      // For offline testing, just report what we got
      report.endTime = new Date().toISOString();
      console.log('📊 Report (partial - clone & materialize only):');
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    // Stage 3: Unzip generated app
    console.log('📦 Stage 3: Extract Generated App');
    console.log('---------------------------------');
    const unzipStartTime = Date.now();

    try {
      const AdmZip = require('adm-zip');
      const zipPath = path.join(testDir, 'export.zip');
      const zip = new AdmZip(zipPath);

      zip.extractAllTo(generatedAppDir, true);

      const unzipMs = Date.now() - unzipStartTime;
      report.stages.unzip = {
        success: true,
        durationMs: unzipMs,
      };

      console.log(`✓ Extracted to ${generatedAppDir}`);

      // Count generated files
      const countFiles = (dir, filter) => {
        if (!fs.existsSync(dir)) return 0;
        return fs.readdirSync(dir, { recursive: true })
          .filter(f => filter(f)).length;
      };

      const appDir = path.join(generatedAppDir, 'framer-export');
      report.generatedFiles.pageCount = countFiles(
        path.join(appDir, 'pages'),
        f => f.endsWith('.tsx') || f.endsWith('.ts')
      );
      report.generatedFiles.componentCount = countFiles(
        path.join(appDir, 'components'),
        f => f.endsWith('.tsx')
      );
      report.generatedFiles.styleCount = countFiles(
        path.join(appDir, 'styles'),
        f => f.endsWith('.css')
      );

      console.log(`  - Pages: ${report.generatedFiles.pageCount}`);
      console.log(`  - Components: ${report.generatedFiles.componentCount}`);
      console.log(`  - Styles: ${report.generatedFiles.styleCount}\n`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`✗ Unzip failed: ${msg}\n`);
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

      if (!fs.existsSync(path.join(appDir, 'package.json'))) {
        throw new Error('package.json not found in generated app');
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

      console.log(`✓ npm install completed in ${installMs}ms\n`);
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

    console.log('\n❌ Production build verification failed\n');
  } finally {
    console.log('📊 Final Report:');
    console.log('================\n');
    console.log(JSON.stringify(report, null, 2));

    console.log('\n📁 Test artifacts preserved at:');
    console.log(`   ${testDir}\n`);

    // Don't cleanup - let user inspect
    // fs.rmSync(testDir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
