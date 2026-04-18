# Design Tokens System

## Overview

Your exported Framer project includes a complete design token system that allows you to globally customize colors, spacing, typography, borders, and shadows.

## Token Files

### `styles/tokens.json`
Structured, programmatic representation of all design tokens. Edit this file to customize your design system.

```json
{
  "colors": {
    "primary": "#0066FF",
    "secondary": "#FF6B00"
  },
  "spacing": {
    "xs": "4px",
    "md": "16px"
  }
}
```

### `styles/variables.css`
Auto-generated from tokens.json. Contains CSS custom properties for runtime use.

```css
:root {
  --color-primary: #0066FF;
  --spacing-md: 16px;
}
```

## How to Customize

### 1. Edit tokens.json
Modify any token value:

```json
{
  "colors": {
    "primary": "#FF0000"  // Changed from #0066FF
  }
}
```

### 2. Rebuild CSS variables
Run:
```bash
npm run build:tokens
```

### 3. Changes apply automatically
All components using these tokens will update on next build.

## Using Tokens in Components

### Option 1: Tailwind Config
Tokens are integrated into Tailwind:

```tsx
<button className="bg-primary text-white">Click</button>
```

### Option 2: CSS Variables
Use directly in CSS:

```css
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
}
```

### Option 3: Import JSON
For programmatic access:

```tsx
import tokens from '@/styles/tokens.json';

<div style={{ color: tokens.colors.primary }}>Text</div>
```

## Token Categories

- **colors**: Primary, secondary, background, text, borders
- **spacing**: xs, sm, md, lg, xl (padding/margin sizes)
- **typography**: Font family, size, weight, line height
- **borders**: Border radius sizes
- **shadows**: Box shadow definitions

## Best Practices

1. Keep token names descriptive and semantic
2. Use consistent naming: `color-primary`, `spacing-md`, `font-heading`
3. Test after updating tokens to ensure all components render correctly
4. Commit changes to version control
