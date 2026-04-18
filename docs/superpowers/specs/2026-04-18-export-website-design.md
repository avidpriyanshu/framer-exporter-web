# Framer Exporter Website Design

**Date:** 2026-04-18  
**Scope:** Web UI for cloning Framer/Webflow sites and downloading as zip  
**Target Users:** Both technical and non-technical users  
**Hosting:** Vercel (free tier)

---

## Overview

A simple, single-page Next.js website that wraps the existing `framer-exporter` CLI tool. Users paste a Framer/Webflow URL, click export, and download the cloned site as a zip file. No accounts, no tracking, no costs.

---

## Architecture

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Frontend:** React (TypeScript)
- **Backend:** API routes (Node.js)
- **Hosting:** Vercel (free tier)
- **CLI Integration:** Spawn existing `framer-exporter` CLI via child process

### Core Concept
```
Browser UI → POST /api/export → Spawn CLI → Stream Zip → Browser Download
```

### Why Next.js on Vercel?
- Built-in serverless function support (clean API routes)
- 100GB bandwidth + 100 hours function execution per month (free)
- Auto-deploys from GitHub
- Handles long-running requests better than traditional serverless
- Single codebase for frontend + backend
- No separate server maintenance needed

---

## Frontend Design

### Single Page Component
**URL:** Root path (`/`)

**Elements:**
1. **Header:** "Clone Your Framer Website"
2. **Subtitle:** "Paste a Framer or Webflow URL and download your cloned site"
3. **Input Field:** Text input placeholder "https://framer.com/..." (required)
4. **Export Button:** "Export" button (disabled until valid URL entered)
5. **Status Display:** Shows "Exporting..." while processing
6. **Download Link:** Appears when export completes, auto-triggers browser download
7. **Error Message:** Simple text error (red) if export fails

### Styling
- Dark background (navy/dark gray)
- Minimal, centered layout
- Mobile-responsive
- No animations needed (keep it simple)

### State Flow
```
Empty → URL entered → Export clicked → Exporting... → Download ready
  ↓                                                          ↓
  (invalid URL → show error)                    (auto-download + reset form)
```

---

## Backend API

### Endpoint: `POST /api/export`

**Input:**
```json
{
  "url": "https://framer.com/projects/..."
}
```

**Validation:**
- URL must be present and non-empty
- URL must be a valid Framer or Webflow domain
- No duplicate exports allowed within 5 seconds (prevent spam)

**Process:**
1. Validate URL format
2. Create temp directory for export
3. Spawn child process: `framer-exporter --url=<url> --output=<tempdir>/export.zip`
4. Wait for CLI to complete (timeout: 60 seconds)
5. Stream zip file to client with `Content-Disposition: attachment`
6. Clean up temp files
7. Return zip bytes

**Response:**
- **Success:** Binary zip file (Content-Type: application/zip)
- **Failure:** JSON error with simple message

**Error Cases:**
- Invalid URL → 400 with "Please enter a valid URL"
- CLI timeout → 408 with "Export took too long. Try a simpler site."
- CLI error → 500 with "Something went wrong. Please try again."
- URL format error → 400 with "Invalid Framer or Webflow URL"

**Status Updates:**
- No real-time polling
- Frontend shows "Exporting..." text during wait
- No progress bars or live updates (keep it simple)

---

## Project Structure

```
framer-exporter-web/          (new Next.js app)
├── app/
│   ├── layout.tsx            (root layout)
│   ├── page.tsx              (main UI component)
│   ├── api/
│   │   └── export/
│   │       └── route.ts      (POST /api/export handler)
│   └── globals.css           (minimal styling)
├── lib/
│   ├── validator.ts          (URL validation logic)
│   └── cli.ts                (spawn framer-exporter CLI)
├── public/                   (static assets if needed)
├── package.json
├── tsconfig.json
├── next.config.js
└── .gitignore
```

---

## Data Flow

1. **User enters URL in browser** → Frontend validates format
2. **User clicks "Export"** → Disable button, show "Exporting..."
3. **Frontend sends POST to `/api/export`** with URL
4. **Backend validates URL** → Returns 400 if invalid
5. **Backend spawns CLI process** → `framer-exporter --url=<url> --output=<temp>/export.zip`
6. **CLI runs** → Fetches site, optimizes assets, builds zip (uses existing framer-exporter logic)
7. **Backend waits for completion** → Max 60 seconds
8. **Backend streams zip to client** → Browser auto-downloads
9. **Frontend resets form** → Ready for next export
10. **Backend cleans up temp files** → Deletes temp directory

---

## Error Handling

### User-Facing Messages
- **"Please enter a valid Framer or Webflow URL"** — Invalid format
- **"Something went wrong. Please try again."** — CLI error, network error, unknown
- **"Export took too long. Try a simpler site."** — 60s timeout exceeded

No detailed logs or stack traces shown to users (keep it simple).

---

## Constraints & Limits

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Request timeout | 60 seconds | Vercel serverless limit; most sites export in 10-30s |
| Temp file cleanup | Immediate | No persistent storage; stateless |
| Rate limiting | 1 export per URL per 5 seconds | Prevent accidental spam |
| Supported domains | framer.com, webflow.com | Existing CLI scope |

---

## Dependencies

**New to add:**
- `next` - Framework
- `typescript` - Type safety
- `@types/node` - Node types for serverless functions
- `url-parse` - URL parsing (if not using built-in)

**Reuse existing:**
- `framer-exporter` package — already installed, spawn as CLI

---

## Deployment

1. Create GitHub repository: `framer-exporter-web`
2. Push code to GitHub
3. Connect to Vercel: vercel.com → import GitHub repo
4. Auto-deploy on push to main
5. Environment variables: None required (runs CLI locally)
6. Zip download: Automatic, no backend storage needed

---

## Success Criteria

✓ User can paste Framer URL and export in <30 seconds  
✓ Downloaded zip contains fully cloned site (uses existing CLI)  
✓ Works on desktop and mobile browsers  
✓ Handles errors gracefully with simple messages  
✓ Deploys to Vercel free tier with <1 second response time  
✓ No costs (stays within Vercel free limits)  

---

## Future Considerations (Out of Scope)

- User accounts / export history
- Rate limiting per IP
- Export status webhooks
- Support for other website builders
- Custom branding/theming
- Analytics / monitoring

These can be added in v2 if needed.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Export timeout on complex sites | Show clear message, suggest simpler sites, document in FAQ |
| Vercel free tier limits exceeded | Add rate limiting, monitor usage, users can self-host if needed |
| Browser cache interfering with download | Use unique filename with timestamp |
| Large zip files failing | Validate output before streaming, handle gracefully |

---

## Testing Strategy

**Manual:**
- Paste valid Framer URL → export should succeed
- Paste invalid URL → show error message
- Long URL → should timeout gracefully
- Mobile browser → UI should be responsive

**Automated (future):**
- URL validation logic
- API route error handling
- CLI process spawning and cleanup

---

## Notes

- This design prioritizes **simplicity** and **zero cost** over features
- Reuses 100% of existing `framer-exporter` CLI logic
- Stateless design means no database, auth, or persistent storage needed
- Users manage their own hosting/deployment of the cloned site
