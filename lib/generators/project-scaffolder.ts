import { ProductionOutput, EnhancedComponent, NextjsProject } from '../pipeline/types';

export function scaffoldNextjsProject(
  projectName: string,
  components: EnhancedComponent[]
): ProductionOutput {
  const packageJson = generatePackageJson(projectName);
  const tsconfig = generateTsConfig();
  const nextConfig = generateNextConfig();
  const pages = generatePages();
  const styles = generateStyles();

  const nextjsProject: NextjsProject = {
    packageJson,
    tsconfig,
    nextConfig,
    pages,
    components: {},
    styles,
    public: {},
  };

  return {
    projectName,
    nextjsProject,
    components,
    designTokens: {
      colors: {},
      spacing: {},
      typography: {},
      borders: {},
      shadows: {},
    },
    cssVariables: '',
    metadata: {
      componentsGenerated: components.length,
      tokensExtracted: 0,
      estimatedBundleSize: 0,
    },
  };
}

function generatePackageJson(projectName: string): Record<string, any> {
  return {
    name: projectName,
    version: '1.0.0',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'eslint . --ext .ts,.tsx',
      format: 'prettier --write "**/*.{ts,tsx,css,json}"',
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
      tailwindcss: '^3.0.0',
      postcss: '^8.0.0',
      autoprefixer: '^10.0.0',
      eslint: '^8.0.0',
      'prettier': '^3.0.0',
      jest: '^29.0.0',
      '@testing-library/react': '^14.0.0',
    },
  };
}

function generateTsConfig(): Record<string, any> {
  return {
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
      baseUrl: '.',
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['**/*.ts', '**/*.tsx'],
    exclude: ['node_modules', '.next', 'dist'],
  };
}

function generateNextConfig(): Record<string, any> {
  return {
    reactStrictMode: true,
    images: {
      formats: ['image/avif', 'image/webp'],
    },
    webpack: {
      resolve: {
        alias: {
          '@': '.',
        },
      },
    },
  };
}

function generatePages(): Record<string, string> {
  return {
    'pages/index.tsx': `import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <h1 className="text-4xl font-bold text-gray-900">Welcome</h1>
      <p className="text-lg text-gray-600">Your exported Framer project</p>
    </div>
  );
}`,
  };
}

function generateStyles(): Record<string, string> {
  return {
    'styles/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}`,
    'styles/variables.css': `:root {
  --color-primary: #0066FF;
  --color-secondary: #FF6B00;
  --color-success: #00CC66;
  --color-background: #FFFFFF;
  --color-text: #000000;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}`,
    'tailwind.config.js': `module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
    },
  },
  plugins: [],
};`,
  };
}
