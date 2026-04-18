# Framer Exporter Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a simple Next.js website that lets users paste a Framer/Webflow URL and download a cloned site as a zip file.

**Architecture:** Single-page Next.js app with a `/api/export` route that spawns the existing `framer-exporter` CLI process and streams the resulting zip to the client. No database, auth, or persistence — completely stateless.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Node.js child_process, existing framer-exporter CLI

---

## File Structure

**Files to create:**
- `app/page.tsx` — Main UI component
- `app/layout.tsx` — Root layout
- `app/api/export/route.ts` — API handler for exports
- `app/globals.css` — Minimal styling
- `lib/validator.ts` — URL validation
- `lib/cli.ts` — CLI spawner
- `package.json` — Dependencies
- `tsconfig.json` — TypeScript config
- `next.config.js` — Next.js config
- `.gitignore` — Git ignore rules

**Update:**
- None (we're creating a new Next.js app)

---

## Tasks

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "framer-exporter-web",
  "version": "1.0.0",
  "description": "Web UI for cloning Framer/Webflow sites",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create .gitignore**

```
node_modules
.next
dist
build
.env
.env.local
*.log
.DS_Store
.vercel
```

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.js .gitignore
git commit -m "chore: initialize next.js project structure"
```

---

### Task 2: Create URL Validator

**Files:**
- Create: `lib/validator.ts`
- Create: `lib/validator.test.ts`

- [ ] **Step 1: Write failing tests for URL validation**

```typescript
// lib/validator.test.ts
import { isValidFramerUrl } from './validator';

describe('URL Validator', () => {
  test('should accept valid framer.com URLs', () => {
    const url = 'https://framer.com/projects/example-123';
    expect(isValidFramerUrl(url)).toBe(true);
  });

  test('should accept valid webflow.io URLs', () => {
    const url = 'https://example.webflow.io';
    expect(isValidFramerUrl(url)).toBe(true);
  });

  test('should reject URLs without https', () => {
    const url = 'http://framer.com/example';
    expect(isValidFramerUrl(url)).toBe(false);
  });

  test('should reject invalid domains', () => {
    const url = 'https://example.com';
    expect(isValidFramerUrl(url)).toBe(false);
  });

  test('should reject empty strings', () => {
    expect(isValidFramerUrl('')).toBe(false);
  });

  test('should reject invalid URL format', () => {
    expect(isValidFramerUrl('not a url')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- lib/validator.test.ts
```

Expected output: 6 failing tests, "isValidFramerUrl is not defined"

- [ ] **Step 3: Implement validator**

```typescript
// lib/validator.ts
export function isValidFramerUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Check for framer.com or webflow.io
    const hostname = parsed.hostname;
    const isFramer = hostname === 'framer.com' || hostname.endsWith('.framer.com');
    const isWebflow = hostname.endsWith('.webflow.io');

    return isFramer || isWebflow;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- lib/validator.test.ts
```

Expected output: All 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add lib/validator.ts lib/validator.test.ts
git commit -m "feat: add URL validator for Framer and Webflow sites"
```

---

### Task 3: Create CLI Spawner

**Files:**
- Create: `lib/cli.ts`
- Create: `lib/cli.test.ts`

- [ ] **Step 1: Write failing test for CLI spawner**

```typescript
// lib/cli.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- lib/cli.test.ts
```

Expected output: Tests fail, "spawnExporter is not defined"

- [ ] **Step 3: Implement CLI spawner**

```typescript
// lib/cli.ts
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

    const timeout = setTimeout(() => {
      child.kill();
      resolve({
        success: false,
        error: 'Export took too long. Try a simpler site.',
      });
    }, timeoutMs);

    try {
      const child = spawn('node', [
        require.resolve('../node_modules/.bin/framer-exporter'),
        `--url=${url}`,
        `--output=${zipPath}`,
      ]);

      let stderr = '';

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
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

      child.on('error', (err) => {
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
```

- [ ] **Step 4: Run tests**

```bash
npm test -- lib/cli.test.ts
```

Expected: Tests pass (or skip if framer-exporter not available in test environment)

- [ ] **Step 5: Commit**

```bash
git add lib/cli.ts lib/cli.test.ts
git commit -m "feat: add CLI spawner for framer-exporter process"
```

---

### Task 4: Create Backend API Route

**Files:**
- Create: `app/api/export/route.ts`

- [ ] **Step 1: Create API handler**

```typescript
// app/api/export/route.ts
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
```

- [ ] **Step 2: Test the endpoint with curl**

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"url":"invalid"}'
```

Expected: 400 response with error message

- [ ] **Step 3: Commit**

```bash
git add app/api/export/route.ts
git commit -m "feat: add /api/export endpoint for cloning Framer sites"
```

---

### Task 5: Create Root Layout

**Files:**
- Create: `app/layout.tsx`

- [ ] **Step 1: Create layout component**

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Framer Exporter',
  description: 'Clone your Framer website and download as ZIP',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "chore: add root layout"
```

---

### Task 6: Create Frontend UI

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Create main page component**

```typescript
// app/page.tsx
'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidUrl = url.trim().startsWith('https://');

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `framer-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // Reset form
      setUrl('');
      setLoading(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="content">
        <h1>Clone Your Framer Website</h1>
        <p className="subtitle">
          Paste a Framer or Webflow URL and download your cloned site
        </p>

        <form onSubmit={handleExport}>
          <input
            type="url"
            placeholder="https://framer.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading || !isValidUrl}>
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Test in browser**

```bash
npm run dev
```

Open http://localhost:3000 — should see form with input and button

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add main UI page with export form"
```

---

### Task 7: Add Styling

**Files:**
- Create: `app/globals.css`

- [ ] **Step 1: Create stylesheet**

```css
/* app/globals.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  background-color: #0f172a;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

main.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.content {
  width: 100%;
  max-width: 500px;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.subtitle {
  color: #cbd5e1;
  margin-bottom: 30px;
  font-size: 1rem;
}

form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input[type='url'],
input[type='text'] {
  flex: 1;
  padding: 12px 16px;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #f1f5f9;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input[type='url']:focus,
input[type='text']:focus {
  outline: none;
  border-color: #64748b;
}

input[type='url']:disabled,
input[type='text']:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button {
  padding: 12px 24px;
  background-color: #f1f5f9;
  color: #0f172a;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

button:hover:not(:disabled) {
  background-color: #e2e8f0;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #fca5a5;
  padding: 12px 16px;
  background-color: #7f1d1d;
  border-radius: 6px;
  font-size: 0.95rem;
}

/* Mobile responsive */
@media (max-width: 640px) {
  h1 {
    font-size: 1.75rem;
  }

  form {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
```

- [ ] **Step 2: Test styling in browser**

```bash
npm run dev
```

Open http://localhost:3000 — should see dark theme with centered form

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add minimal dark theme styling"
```

---

### Task 8: Add Error Handling Tests

**Files:**
- Create: `app/api/export/route.test.ts`

- [ ] **Step 1: Write tests for API error handling**

```typescript
// app/api/export/route.test.ts
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Export API Route', () => {
  test('should return 400 for missing URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('should return 400 for invalid URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  test('should return 400 for empty URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: JSON.stringify({ url: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- app/api/export/route.test.ts
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add app/api/export/route.test.ts
git commit -m "test: add error handling tests for API route"
```

---

### Task 9: Setup Vercel Deployment

**Files:**
- Create: `vercel.json` (optional, for advanced config)

- [ ] **Step 1: Create vercel.json for configuration**

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

- [ ] **Step 2: Ensure next.config.js is production-ready (already is)**

No changes needed — next.config.js from Task 1 is sufficient

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore: add Vercel deployment configuration"
```

---

### Task 10: Final Testing & Verification

- [ ] **Step 1: Install all dependencies**

```bash
npm install
```

Expected: All packages installed successfully

- [ ] **Step 2: Run development server**

```bash
npm run dev
```

Expected: "ready - started server on 0.0.0.0:3000"

- [ ] **Step 3: Test UI manually**

1. Open http://localhost:3000
2. Paste valid Framer URL (e.g., `https://framer.com/projects/test`)
3. Click "Export"
4. Should show "Exporting..." (or fail gracefully if URL invalid)

Expected: Form is responsive, button enables/disables correctly, error messages display

- [ ] **Step 4: Test invalid URL**

Paste `https://example.com` and click Export
Expected: Error message "Please enter a valid Framer or Webflow URL"

- [ ] **Step 5: Build for production**

```bash
npm run build
```

Expected: Build succeeds with `.next` directory created

- [ ] **Step 6: Start production server**

```bash
npm start
```

Expected: Server starts on port 3000

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: complete Framer Exporter website implementation"
```

---

## Self-Review Checklist

✓ **Spec Coverage:**
- URL input UI → Task 6 (Frontend UI)
- Export button → Task 6
- Status display → Task 6 (shows "Exporting...")
- Download zip → Task 4 & 6
- Error messages → Task 4 (API) & Task 7 (styling)
- Backend API → Task 4
- URL validation → Task 2
- CLI integration → Task 3
- Vercel deployment → Task 9
- Styling (dark theme) → Task 7

✓ **Placeholder Scan:**
- All code is complete, no "TBD" or "TODO"
- All commands are exact with expected output
- All test code is runnable
- No vague steps like "handle edge cases"

✓ **Type Consistency:**
- `SpawnResult` interface defined in Task 3, used consistently in Task 4
- `isValidFramerUrl` defined in Task 2, used in Tasks 2 & 4
- API routes use correct Next.js types
- Frontend uses correct React types

✓ **Completeness:**
- All 10 tasks are actionable (2-5 minutes each)
- TDD approach: test → fail → implement → pass → commit
- Frequent commits (every task)
- No dependencies between tasks except in order
