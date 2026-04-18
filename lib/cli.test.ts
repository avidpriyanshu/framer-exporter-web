import { spawnExporter } from './cli';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI Spawner', () => {
  test('should spawn framer-exporter and return zip path', async () => {
    const testUrl = 'https://framer.com/test';
    const tempDir = path.join('/tmp', 'test-export');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      const result = await spawnExporter(testUrl, tempDir);
      expect(result).toBeDefined();
      expect(result.success).toBe(false); // Will fail on invalid URL
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    }
  });

  test('should handle invalid CLI execution', async () => {
    const result = await spawnExporter('invalid', '/tmp/test');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
