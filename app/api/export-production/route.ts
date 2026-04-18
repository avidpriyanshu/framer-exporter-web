import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { runPipeline } from '@/lib/pipeline';
import { generateProductionCode } from '@/lib/pipeline/stages/7-code-generator';
import { ProductionOutput } from '@/lib/pipeline/types';
import { cloneSiteSource } from '@/lib/export-source';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * POST /api/export-production
 *
 * Handles the complete export workflow:
 * 1. Clone the source site via the canonical exporter path
 * 2. Extract HTML from the raw clone artifact
 * 3. Run pipeline (Stages 1-6: Parse, Normalize, Detect, Extract, Name, Verify)
 * 4. Generate Stage 7 production code
 * 5. Create Next.js project files
 * 6. Package as ZIP archive
 * 7. Return as downloadable file
 */
export async function POST(req: NextRequest) {
  let tempDir: string | undefined;

  try {
    const { url } = await req.json();

    // Validate URL parameter
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`[API] Starting production export for URL: ${url}`);

    // Step 1: Clone the source site with the canonical exporter flow.
    // Every transformation should start from the same raw artifact the basic export uses.
    tempDir = path.join(os.tmpdir(), `framer-production-export-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    let html: string;
    let sourceZipPath: string | undefined;

    try {
      const clone = await cloneSiteSource(url, tempDir, 60000);
      html = clone.html;
      sourceZipPath = clone.zipPath;
      if (clone.assetReport) {
        console.log('[API] Asset materialization report:', {
          discovered: clone.assetReport.discovered,
          downloaded: clone.assetReport.downloaded,
          failed: clone.assetReport.failed,
        });
        if (clone.assetReport.failedAssets?.length) {
          console.log('[API] Failed assets:', clone.assetReport.failedAssets.slice(0, 5));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[API] Clone error:', errorMessage);
      return NextResponse.json(
        { error: 'Failed to clone source site: ' + errorMessage },
        { status: 502 }
      );
    }

    // Step 2: Run pipeline stages 1-6
    console.log('[API] Running pipeline stages 1-6...');
    runPipeline(html);

    // Extract the NamedTree from pipeline (we need it for Stage 7)
    // The pipeline runs stages 1-6 and we need to get the NamedTree output
    // For now, we'll run through the pipeline manually to get all stages

    // Re-run stages with logging to get NamedTree
    const { parseHTML } = await import('@/lib/pipeline/stages/1-html-parser');
    const { normalize } = await import('@/lib/pipeline/stages/2-normalizer');
    const { detectSections } = await import('@/lib/pipeline/stages/3-section-detector');
    const { extractComponents } = await import('@/lib/pipeline/stages/4-component-extractor');
    const { assignSemanticNames } = await import('@/lib/pipeline/stages/5-semantic-namer');

    const parseResult = parseHTML(html);
    const normalizeResult = normalize(parseResult.rawDOM);
    const sectionResult = detectSections(normalizeResult.tree);
    const componentResult = extractComponents(sectionResult.tree);
    const namedTree = assignSemanticNames(componentResult.tree);

    // Step 3: Generate Stage 7 production code
    console.log('[API] Generating Stage 7 production code...');
    const productionOutput = await generateProductionCode(namedTree);

    // Step 4: Create ZIP archive with all project files
    console.log('[API] Creating ZIP archive...');
    const zip = new JSZip();
    const projectFolder = zip.folder('framer-export');

    if (!projectFolder) {
      return NextResponse.json(
        { error: 'Failed to create ZIP structure' },
        { status: 500 }
      );
    }

    // Add root-level files
    projectFolder.file('package.json', JSON.stringify(productionOutput.nextjsProject.packageJson, null, 2));
    projectFolder.file('tsconfig.json', JSON.stringify(productionOutput.nextjsProject.tsconfig, null, 2));
    projectFolder.file('next.config.js', generateNextConfigContent(productionOutput.nextjsProject.nextConfig));
    projectFolder.file('.env.local.example', generateEnvExample());
    projectFolder.file('README.md', generateProjectReadme(productionOutput));

    // Add pages
    const pagesFolder = projectFolder.folder('pages');
    if (pagesFolder && productionOutput.nextjsProject.pages) {
      Object.entries(productionOutput.nextjsProject.pages).forEach(([filename, content]) => {
        pagesFolder.file(filename, content);
      });
    }

    // Add components
    const componentsFolder = projectFolder.folder('components');
    if (componentsFolder) {
      productionOutput.components.forEach((component) => {
        componentsFolder.file(component.path, component.code);
      });
    }

    // Add styles
    const stylesFolder = projectFolder.folder('styles');
    if (stylesFolder && productionOutput.nextjsProject.styles) {
      Object.entries(productionOutput.nextjsProject.styles).forEach(([filename, content]) => {
        stylesFolder.file(filename, content);
      });
    }

    // Add design tokens
    if (stylesFolder) {
      stylesFolder.file('tokens.json', JSON.stringify(productionOutput.designTokens, null, 2));
    }

    // Add public folder (empty if no assets)
    const publicFolder = projectFolder.folder('public');
    if (publicFolder && productionOutput.nextjsProject.public) {
      Object.entries(productionOutput.nextjsProject.public).forEach(([filename, buffer]) => {
        publicFolder.file(filename, buffer);
      });
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Step 5: Return ZIP as downloadable file
    console.log('[API] Export complete, returning ZIP archive...');

    return new NextResponse(Buffer.from(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="framer-export.zip"',
        'X-Suggested-Filename': 'framer-export.zip',
        'X-Source-Clone': sourceZipPath ? 'cli-export' : 'unknown',
        'Content-Length': String(Buffer.byteLength(zipBuffer)),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Export failed:', errorMessage);
    console.error('[API] Stack:', error instanceof Error ? error.stack : '');

    return NextResponse.json(
      {
        error: 'Export failed during processing',
        details: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

/**
 * Generates the next.config.js content from config object
 */
function generateNextConfigContent(config: Record<string, any>): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = ${JSON.stringify(config, null, 2)};

module.exports = nextConfig;`;
}

/**
 * Generates .env.local.example file
 */
function generateEnvExample(): string {
  return `# Environment Variables
# Copy this file to .env.local and fill in the values

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Add your custom environment variables below
`;
}

/**
 * Generates a comprehensive README.md for the project
 */
function generateProjectReadme(output: ProductionOutput): string {
  return `# ${output.projectName}

## Overview

This is an auto-generated Next.js project exported from Framer. It includes:

- **${output.components.length} Components**: Extracted and optimized React components
- **Design Tokens**: ${output.metadata.tokensExtracted} design tokens extracted from the original design
- **Full Next.js Stack**: Ready to deploy and customize

## Quick Start

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

\`\`\`bash
npm run build
npm run start
\`\`\`

## Project Structure

\`\`\`
framer-export/
├── pages/                 # Next.js pages
│   └── index.tsx         # Home page
├── components/           # React components (${output.components.length} components)
│   ${output.components.slice(0, 3).map(c => `├── ${c.name}.tsx`).join('\n│   ')}
│   ${output.components.length > 3 ? `└── ... (${output.components.length - 3} more components)` : ''}
├── styles/              # Global styles and design tokens
│   ├── globals.css      # Global styles
│   ├── variables.css    # CSS variables
│   └── tokens.json      # Design token definitions
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── next.config.js       # Next.js configuration
└── README.md           # This file
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run format\` - Format code with Prettier

## Component Overview

${output.components.map(c => `- **${c.name}** (\`components/${c.path}\`) - ${c.props.length > 0 ? `Accepts props: ${c.props.join(', ')}` : 'Stateless component'}`).join('\n')}

## Design Tokens

The project includes design tokens for colors, spacing, typography, and more. These are available as:

- **CSS Variables**: In \`styles/variables.css\` - Use directly in CSS
- **JSON Format**: In \`styles/tokens.json\` - Import and use programmatically

Example usage in CSS:
\`\`\`css
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
}
\`\`\`

## Customization

### Modifying Components

All components are in the \`components/\` directory. Feel free to:
- Update component code
- Add new props and interfaces
- Adjust styling as needed

### Updating Design Tokens

Edit \`styles/tokens.json\` to update colors, spacing, and other tokens. Then update the corresponding CSS variables in \`styles/variables.css\`.

### Adding Pages

Create new files in the \`pages/\` directory. Next.js will automatically create routes based on file names.

## Deployment

### Vercel (Recommended)

\`\`\`bash
npm i -g vercel
vercel
\`\`\`

### Other Platforms

This Next.js app can be deployed to any platform that supports Node.js:
- Netlify
- Heroku
- Railway
- AWS
- Google Cloud

## Bundle Size

Estimated bundle size: **${formatBytes(output.metadata.estimatedBundleSize)}**

## Metadata

- **Components Generated**: ${output.metadata.componentsGenerated}
- **Design Tokens Extracted**: ${output.metadata.tokensExtracted}
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS (configured)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Notes

- This is an auto-generated project. Review and test all components before deploying to production.
- Some styling may need adjustment depending on your specific use case.
- Consider adding tests using Jest and React Testing Library.
- Update dependencies regularly for security patches.

## Support

For issues or questions about the export process, please refer to the original Framer documentation.

---

Generated by Framer Exporter
`;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
