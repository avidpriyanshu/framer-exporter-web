import { NextRequest, NextResponse } from 'next/server';
import { isValidFramerUrl } from '@/lib/validator';
import { spawnExporter } from '@/lib/cli';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const requestCache = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Please enter a valid Framer or Webflow URL' },
        { status: 400 }
      );
    }

    if (!isValidFramerUrl(url)) {
      return NextResponse.json(
        { error: 'Please enter a valid Framer or Webflow URL' },
        { status: 400 }
      );
    }

    // Rate limiting: 1 export per URL per 5 seconds
    const lastRequest = requestCache.get(url);
    if (lastRequest && Date.now() - lastRequest < 5000) {
      return NextResponse.json(
        { error: 'Please wait a few seconds before exporting again' },
        { status: 429 }
      );
    }
    requestCache.set(url, Date.now());

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), `framer-export-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Spawn exporter
      const result = await spawnExporter(url, tempDir, 60000);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Something went wrong. Please try again.' },
          { status: 500 }
        );
      }

      // Read zip file
      const zipPath = result.zipPath!;
      const zipBuffer = fs.readFileSync(zipPath);

      // Return zip with download headers
      const filename = `framer-export-${Date.now()}.zip`;
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      });
    } finally {
      // Cleanup temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    }
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
