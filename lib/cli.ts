import * as fs from 'fs';

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
