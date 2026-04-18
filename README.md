# Framer Exporter Web

A simple web application that lets users clone any Framer or Webflow website and download it as a zip file. Perfect for self-hosting Framer sites without the cloud platform.

## 🚀 Features

- **Paste any Framer/Webflow URL** - Supports custom domains, framer.app, webflow.io, and more
- **One-click download** - Get a complete clone as a zip file
- **Rate limiting** - 1 export per URL per 5 seconds (prevents abuse)
- **Timeout protection** - 60-second export limit (prevents runaway processes)
- **Dark theme UI** - Clean, responsive design
- **No accounts needed** - Stateless, instant downloads

## 🏗️ Tech Stack

- **Next.js 14** (App Router)
- **React 18** + TypeScript 5
- **Jest** for unit tests
- **Vercel** for serverless deployment
- **[framer-exporter-core](https://github.com/avidpriyanshu/framer-exporter-core)** for CLI

## 📋 How It Works

1. User enters a Framer/Webflow URL
2. Frontend validates HTTPS protocol + URL format
3. Backend delegates domain validation to framer-exporter CLI
4. CLI crawls the site, extracts assets, generates HTML
5. Zip file returned to browser for download
6. Temp files cleaned up automatically

## 🧪 Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run dev server
npm run dev
```

All tests pass ✅ (10 unit tests, ~0.4s):
- URL validator: 7 tests
- API route: 3 tests

## 🌐 Supported URLs

- ✅ framer.com (editor projects)
- ✅ *.framer.app (published sites)
- ✅ *.webflow.io (Webflow sites)  
- ✅ custom-domain.com (Framer custom domains)
- ❌ http:// (must be HTTPS)
- ❌ Invalid URLs (malformed)

## 📊 Edge Cases Handled

| Case | Behavior |
|------|----------|
| Non-HTTPS URL | Rejected (400) |
| Invalid format | Rejected (400) |
| Same URL within 5s | Rate limited (429) |
| Export takes >60s | Timeout (500) |
| Non-Framer HTTPS URL | Export fails with CLI error (500) |
| Disk full/permission error | Cleaned up, error returned |

## 🔧 Configuration

**Vercel Deployment** (`vercel.json`):
- Memory: 1024MB per function
- Timeout: 60 seconds max
- Environment: No variables needed

**Rate Limiting**:
- Per-URL (allows different URLs simultaneously)
- Window: 5 seconds
- Storage: In-memory (Vercel ephemeral instances)

**Export Timeout**:
- Limit: 60 seconds
- Enforcement: Promise.race()
- Reason: Typical exports: 5-10s, complex: 30-40s

## 📁 Project Structure

```
app/
  ├── api/export/route.ts    # POST handler + rate limiting + cleanup
  ├── page.tsx               # Form component + download logic
  ├── layout.tsx             # Root layout
  └── globals.css            # Dark theme

lib/
  ├── validator.ts           # HTTPS + format validation
  ├── cli.ts                 # framer-exporter wrapper + timeout
  └── *.test.ts              # Unit tests

vercel.json                   # Deployment config
next.config.js               # Next.js config
jest.config.js               # Jest config
```

## 🚨 Known Limitations

- No progress tracking (silent export)
- Rate limiting is in-memory (resets on redeploy)
- 60-second timeout (very complex sites might need longer)
- No persistence (downloads immediately, not stored)
- No authentication (public service by design)

## 📚 Implementation Details

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for:
- Architecture decisions
- Evolution of key features
- All failures & fixes
- Testing strategy
- Deployment considerations

## Stage 7: Production Code Generator

Converts Framer HTML + semantic metadata into production-ready Next.js projects.

**Inputs:**
- NamedTree with semantic component names (from Stage 6)
- HTML export from Framer

**Outputs:**
- Complete Next.js project with TypeScript
- React components with proper prop types
- Web Components for framework-agnostic usage
- Design token system (JSON + CSS variables)
- Tailwind CSS configuration
- ESLint + Prettier setup

**Key Features:**
- ✅ AST-based code generation (@babel/types)
- ✅ Tailwind-first styling with CSS module fallback
- ✅ Design token extraction (colors, spacing, typography)
- ✅ Web Components for leaf components
- ✅ TypeScript strict mode
- ✅ Next.js best practices

### Getting Started with Generated Project

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build
npm start

# Customize design tokens
# Edit styles/tokens.json
# Run: npm run build:tokens

# Lint code
npm run lint

# Format code
npm run format
```

See [TOKENS.md](docs/TOKENS.md) for design token customization guide.

## 🔗 Related

- [framer-exporter-core](https://github.com/avidpriyanshu/framer-exporter-core) - CLI that powers this
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Deployment](https://vercel.com)

## 💾 Installation & Deployment

```bash
# Local development
npm install
npm run dev    # http://localhost:3000

# Build for production
npm run build
npm start

# Deploy to Vercel
vercel deploy
```

---

**Status:** ✅ Working | Tests: 10/10 passing | Deployed: Vercel
