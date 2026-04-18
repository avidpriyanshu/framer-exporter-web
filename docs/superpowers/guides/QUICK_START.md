# Quick Start: Using Stage 7 Production Code Generator

## TL;DR

Export a Framer site to a production-ready Next.js project:

```bash
curl -X POST http://localhost:3000/api/export-production \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-site.framer.app"}'
```

Unzip the result and run:
```bash
cd my-framer-site
npm install
npm run dev
```

Done. Your Framer site is now a live Next.js app.

## What You Get

- 🎨 All components converted to React (TypeScript)
- 🎯 Design tokens extracted (colors, spacing, typography)
- 🎨 Tailwind CSS configured
- 🧩 Web Components for reusability
- 📱 Fully responsive
- ♿ TypeScript strict mode
- 🧪 Testing infrastructure included

## Key Features

### Design Tokens
Edit `styles/tokens.json` to rebrand globally:
```json
{
  "colors": {
    "primary": "#0066FF"
  }
}
```

Run `npm run build:tokens` and all components update.

### Component Props
All components have TypeScript interfaces:
```typescript
interface ButtonProps {
  label?: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}
```

### Web Components
Use in plain HTML:
```html
<humble-button label="Submit" />
```

## Next Steps

1. Extract the ZIP
2. `npm install`
3. `npm run dev`
4. Edit components in `components/`
5. Update tokens in `styles/tokens.json`
6. `npm run build` for production

See README.md in the exported project for full documentation.
