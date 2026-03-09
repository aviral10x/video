# Video Editor MVP

A web app that lets users upload a vertical HeyGen talking-head video, choose a template, and generate a social-ready edited short with captions, hook text, punch-in zooms, highlighted keywords, and a CTA end card.

## Monorepo Structure

```
apps/web          → Next.js frontend (App Router + Tailwind)
packages/shared   → Shared TypeScript types & template configs
packages/video    → Remotion compositions & components
workers/render    → Render worker (stub)
```

## Local Setup

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Or run only the web app
cd apps/web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Monorepo**: npm workspaces + Turborepo
- **Frontend**: Next.js 14  (App Router) + Tailwind CSS 3
- **Video**: Remotion
- **Language**: TypeScript (strict)
