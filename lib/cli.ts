import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface SpawnResult {
  success: boolean;
  zipPath?: string;
  error?: string;
}

export function spawnExporter(
  url: string,
  outputDir: string,
  timeoutMs: number = 60000
): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const zipPath = path.join(outputDir, 'export.zip');
    let child: any;

    const timeout = setTimeout(() => {
      if (child) {
        child.kill();
      }
      resolve({
        success: false,
        error: 'Export took too long. Try a simpler site.',
      });
    }, timeoutMs);

    try {
      child = spawn('node', [
        require.resolve('../node_modules/.bin/framer-exporter'),
        `--url=${url}`,
        `--output=${zipPath}`,
      ]);

      let stderr = '';

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code: number) => {
        clearTimeout(timeout);

        if (code === 0 && fs.existsSync(zipPath)) {
          resolve({
            success: true,
            zipPath,
          });
        } else {
          resolve({
            success: false,
            error: stderr || 'Export failed. Please try again.',
          });
        }
      });

      child.on('error', (err: Error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: err.message || 'Failed to start export process.',
        });
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: 'Something went wrong. Please try again.',
      });
    }
  });
}
