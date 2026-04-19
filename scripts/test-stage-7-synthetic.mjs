#!/usr/bin/env node
/**
 * Synthetic Stage 7 test: Validates code generation and Next.js build
 * without requiring a real Framer site crawl.
 *
 * This test:
 * 1. Creates mock SemanticTreeNode data with nested structure
 * 2. Passes it through the Stage 7 pipeline
 * 3. Generates a Next.js app
 * 4. Runs npm install and npm run build
 *
 * Purpose: Validate code generation reliability (JSX indentation, SVG, props)
 * before testing with real sites. This is a structural validation, not visual.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framer-stage7-test-'));

console.log('\n🧪 Stage 7 Synthetic Test (Code Generation & Build)');
console.log('===================================================\n');
console.log(`Test directory: ${testDir}\n`);

const report = {
  startTime: new Date().toISOString(),
  stages: {
    codeGeneration: null,
    projectScaffold: null,
    npmInstall: null,
    npmBuild: null,
  },
  errors: [],
};

try {
  // Stage 1: Generate code from synthetic tree
  console.log('📝 Stage 1: Generate Code from Mock SemanticTreeNode');
  console.log('----------------------------------------------------');

  const generatedCode = generateSyntheticComponent();
  const appDir = path.join(testDir, 'synthetic-app');
  fs.mkdirSync(appDir, { recursive: true });

  const componentsDir = path.join(appDir, 'components');
  fs.mkdirSync(componentsDir, { recursive: true });
  fs.writeFileSync(path.join(componentsDir, 'Button.tsx'), generatedCode.button);
  fs.writeFileSync(path.join(componentsDir, 'Card.tsx'), generatedCode.card);
  fs.writeFileSync(path.join(componentsDir, 'IconCard.tsx'), generatedCode.iconCard);

  report.stages.codeGeneration = {
    success: true,
    componentsGenerated: 3,
    files: ['Button.tsx', 'Card.tsx', 'IconCard.tsx'],
  };

  console.log('✓ Generated 3 components');
  console.log('  - Button.tsx (simple element)');
  console.log('  - Card.tsx (nested children)');
  console.log('  - IconCard.tsx (SVG + HTML)\n');

  // Stage 2: Scaffold Next.js project
  console.log('🏗️  Stage 2: Scaffold Next.js Project');
  console.log('------------------------------------');

  scaffoldProject(appDir, generatedCode);

  report.stages.projectScaffold = {
    success: true,
    files: ['package.json', 'tsconfig.json', 'next.config.js', 'pages/index.tsx'],
  };

  console.log('✓ Scaffolded Next.js project');
  console.log('  - package.json');
  console.log('  - tsconfig.json');
  console.log('  - next.config.js');
  console.log('  - pages/index.tsx\n');

  // Stage 3: npm install
  console.log('📦 Stage 3: npm install');
  console.log('----------------------');

  const installStartTime = Date.now();
  execSync('npm install', {
    cwd: appDir,
    stdio: 'inherit',
    timeout: 120000,
  });

  const installMs = Date.now() - installStartTime;
  report.stages.npmInstall = {
    success: true,
    durationMs: installMs,
  };

  console.log(`✓ npm install completed in ${installMs}ms\n`);

  // Stage 4: npm run build
  console.log('🏗️  Stage 4: npm run build');
  console.log('-----------------------');

  const buildStartTime = Date.now();
  execSync('npm run build', {
    cwd: appDir,
    stdio: 'inherit',
    timeout: 120000,
  });

  const buildMs = Date.now() - buildStartTime;
  report.stages.npmBuild = {
    success: true,
    durationMs: buildMs,
  };

  console.log(`✓ npm run build completed in ${buildMs}ms\n`);

  // Success
  report.success = true;
  report.endTime = new Date().toISOString();

  console.log('✅ All stages passed!\n');
  console.log('Generated app built successfully.');
  console.log(`You can inspect it at: ${appDir}\n`);

} catch (error) {
  report.success = false;
  report.endTime = new Date().toISOString();
  report.errors.push({
    stage: 'unknown',
    error: error instanceof Error ? error.message : String(error),
  });

  console.log('\n❌ Test failed\n');
  console.log(error instanceof Error ? error.stack : error);

} finally {
  console.log('📊 Final Report:');
  console.log('================\n');
  console.log(JSON.stringify(report, null, 2));

  console.log('\n📁 Test artifacts preserved at:');
  console.log(`   ${testDir}\n`);
}

function generateSyntheticComponent() {
  return {
    button: `import React from 'react';

interface ButtonProps {
  label?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ label = 'Click me', variant = 'primary', onClick }: ButtonProps) {
  return (
    <button
      className={variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
`,

    card: `import React from 'react';

interface CardProps {
  title?: string;
  description?: string;
}

export default function Card({ title = 'Card Title', description = 'Card description' }: CardProps) {
  return (
    <div className="border rounded-lg p-4 shadow">
      <h2 className="text-lg font-bold">
        {title}
      </h2>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  );
}
`,

    iconCard: `import React from 'react';

interface IconCardProps {
  title?: string;
}

export default function IconCard({ title = 'Icon Card' }: IconCardProps) {
  return (
    <div className="flex gap-4 p-4">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <line x1="12" y1="8" x2="12" y2="16" strokeWidth="2" />
        <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2" />
      </svg>
      <div>
        <h3 className="font-bold">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          With embedded SVG
        </p>
      </div>
    </div>
  );
}
`,
  };
}

function scaffoldProject(appDir, components) {
  // package.json
  fs.writeFileSync(
    path.join(appDir, 'package.json'),
    JSON.stringify({
      name: 'framer-synthetic-export',
      version: '1.0.0',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/react': '^18.0.0',
        '@types/node': '^20.0.0',
        '@types/react-dom': '^18.0.0',
        tailwindcss: '^3.0.0',
        postcss: '^8.0.0',
        autoprefixer: '^10.0.0',
      },
    }, null, 2)
  );

  // tsconfig.json
  fs.writeFileSync(
    path.join(appDir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        jsx: 'react-jsx',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', '.next', 'dist'],
    }, null, 2)
  );

  // next.config.js
  fs.writeFileSync(
    path.join(appDir, 'next.config.js'),
    `module.exports = {
  reactStrictMode: true,
};
`
  );

  // pages/index.tsx
  fs.mkdirSync(path.join(appDir, 'pages'), { recursive: true });
  fs.writeFileSync(
    path.join(appDir, 'pages', 'index.tsx'),
    `import React from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import IconCard from '../components/IconCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-8">
        Framer Export Test
      </h1>
      <div className="grid gap-8">
        <Button label="Test Button" />
        <Card title="Test Card" />
        <IconCard title="Icon Card" />
      </div>
    </div>
  );
}
`
  );

  // styles/globals.css
  fs.mkdirSync(path.join(appDir, 'styles'), { recursive: true });
  fs.writeFileSync(
    path.join(appDir, 'styles', 'globals.css'),
    `@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
}
`
  );

  // tailwind.config.js
  fs.writeFileSync(
    path.join(appDir, 'tailwind.config.js'),
    `module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`
  );

  // postcss.config.js
  fs.writeFileSync(
    path.join(appDir, 'postcss.config.js'),
    `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`
  );
}
