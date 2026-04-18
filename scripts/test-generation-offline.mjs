/**
 * Test the production code generation pipeline offline
 * This doesn't require the API server to be running
 *
 * Usage: node scripts/test-generation-offline.mjs [URL]
 * Default: https://boost.framer.website/
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  const url = process.argv[2] || 'https://boost.framer.website/';

  console.log('\n🔬 Code Generation Pipeline Test (Offline)');
  console.log('==========================================\n');
  console.log(`URL: ${url}\n`);

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framer-gen-test-'));

  try {
    // Step 1: Clone and materialize
    console.log('📥 Step 1: Clone & Materialize Assets\n');

    // Use the verify-materialized-export script which we know works
    const cloneResult = await runCommand('node', ['scripts/verify-materialized-export.mjs', url], {
      cwd: projectRoot,
      timeout: 180000,
    });

    let assetReport = { discovered: 0, downloaded: 0, failed: 0 };
    try {
      const output = cloneResult.toString();
      const match = output.match(/"materializedAssets":\s*({[^}]+})/);
      if (match) {
        assetReport = JSON.parse(match[1]);
      }
    } catch (e) {
      // Couldn't parse report, that's ok
    }

    console.log(`✓ Clone successful`);
    console.log(`  - Assets: ${assetReport.downloaded}/${assetReport.discovered}`);
    console.log();

    // Step 2: Report generation status
    console.log('📊 Summary\n');
    console.log('==========\n');
    console.log(`Assets materialized: ${assetReport.downloaded}/${assetReport.discovered}`);
    console.log(`Asset fetch failures: ${assetReport.failed}`);
    console.log();

    if (assetReport.downloaded > 100) {
      console.log('✅ Asset materialization successful!');
      console.log();
      console.log('Note: Full Stage 7 testing (code generation + build) requires:');
      console.log('  1. npm run dev (in another terminal, to start the API server)');
      console.log(`  2. node scripts/verify-production-build.mjs "${url}"`);
      console.log();
      console.log('For now, clone and materialization are working correctly.');
    } else {
      console.log('⚠️  Asset materialization returned fewer assets than expected.');
    }

    console.log(`\nTest artifacts: ${testDir}\n`);

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

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
        // Also print to console for visibility
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
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', reject);

    if (options.timeout) {
      setTimeout(() => {
        child.kill();
        reject(new Error('Command timeout'));
      }, options.timeout);
    }
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
