import * as fs from 'fs';
import { runPipeline, type PipelineMetrics } from './pipeline';
import AdmZip from 'adm-zip';

export interface SpawnResult {
  success: boolean;
  zipPath?: string;
  error?: string;
}

export async function spawnExporter(
  url: string,
  outputDir: string,
  timeoutMs: number = 60000
): Promise<SpawnResult> {
  try {
    const { exportSite } = require('framer-exporter/src/cli');

    const timeoutPromise = new Promise<SpawnResult>((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: 'Export took too long. Try a simpler site.',
        });
      }, timeoutMs);
    });

    const exportPromise = (async () => {
      try {
        const zipPath = await exportSite(url, outputDir);
        if (zipPath && fs.existsSync(zipPath)) {
          return {
            success: true,
            zipPath,
          };
        } else {
          return {
            success: false,
            error: 'Export failed to create zip file.',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Export failed. Please try again.',
        };
      }
    })();

    return Promise.race([exportPromise, timeoutPromise]);
  } catch (err) {
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
  }
}

export async function exportSiteWithPipeline(
  url: string,
  tempDir: string
): Promise<{ zipPath: string; pipelineMetrics: PipelineMetrics }> {
  try {
    const { exportSite } = require('framer-exporter/src/cli');

    const zipPath = await Promise.race([
      (async () => {
        return await exportSite(url, tempDir);
      })(),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve(''), 60000);
      }),
    ]);

    if (!zipPath) {
      throw new Error('Export took too long. Try a simpler site.');
    }

    // Extract HTML from zip
    const zip = new AdmZip(zipPath);
    const htmlEntry = zip.findEntry('index.html');
    if (!htmlEntry) {
      throw new Error('No index.html found in export');
    }

    const html = zip.readAsText(htmlEntry);

    // Run 6-stage pipeline on HTML
    const pipelineResult = runPipeline(html);

    // Update zip with enhanced files
    zip.updateFile(htmlEntry, Buffer.from(pipelineResult.enhancedHTML, 'utf-8'));

    // Add component index
    zip.addFile('COMPONENT_INDEX.md', Buffer.from(pipelineResult.componentIndex, 'utf-8'));

    // Re-save zip
    zip.writeZip(zipPath);

    return {
      zipPath,
      pipelineMetrics: pipelineResult.metrics,
    };
  } catch (error) {
    // If pipeline fails, still return the original export with error logged
    console.error('Pipeline execution failed:', error);
    throw error;
  }
}
