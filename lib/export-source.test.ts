import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { extractHtmlFromZip } from './export-source';

describe('export-source', () => {
  it('prefers root index.html when extracting the primary document', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-source-test-'));
    const zipPath = path.join(tempDir, 'site.zip');
    const zip = new AdmZip();

    zip.addFile('index.html', Buffer.from('<html><body>root</body></html>', 'utf-8'));
    zip.addFile('nested/index.html', Buffer.from('<html><body>nested</body></html>', 'utf-8'));
    zip.writeZip(zipPath);

    const result = extractHtmlFromZip(zipPath);

    expect(result.htmlEntryName).toBe('index.html');
    expect(result.html).toContain('root');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('falls back to nested index.html when needed', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-source-test-'));
    const zipPath = path.join(tempDir, 'site.zip');
    const zip = new AdmZip();

    zip.addFile('dist/index.html', Buffer.from('<html><body>dist</body></html>', 'utf-8'));
    zip.addFile('about.html', Buffer.from('<html><body>about</body></html>', 'utf-8'));
    zip.writeZip(zipPath);

    const result = extractHtmlFromZip(zipPath);

    expect(result.htmlEntryName).toBe('dist/index.html');
    expect(result.html).toContain('dist');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
