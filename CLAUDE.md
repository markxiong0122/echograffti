# EchoGraffiti

Location-based AR graffiti app for Cambridge AI x XR hackathon.

## Stack
- Next.js 15 (App Router) with TypeScript and Tailwind
- Supabase (PostgreSQL + Storage)
- A-Frame + AR.js for location-based AR
- Nano Banana 2 (Gemini 3.1 Flash Image) for AI art generation
- Leaflet + OpenStreetMap for map view
- Playwright for E2E tests

## Commands
- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm exec playwright test` — run E2E tests

## Project Structure
- `src/app/` — Next.js App Router pages
- `src/app/api/` — API routes
- `src/components/` — shared React components
- `src/lib/` — utility modules (supabase client, etc.)
- `tests/e2e/` — Playwright E2E tests
- `public/` — static assets

## Design System (from docs/design-doc.html)
- Logo: ECHO//GRAFFITI
- Colors: --spray-pink: #ff2d95, --spray-cyan: #00f0ff, --spray-purple: #a855f7, --spray-yellow: #ffd600, --spray-green: #39ff14
- Backgrounds: --wall-dark: #0a0a0f, --wall-mid: #141420, --wall-light: #1e1e2e
- Fonts: Permanent Marker (headings), Space Mono (labels), DM Sans (body)
- Aesthetic: brick wall texture, grain overlay, spray paint drips

## Conventions
- Use "use client" only when needed (interactivity, browser APIs)
- Supabase client initialized in src/lib/supabase.ts
- API keys are server-side only (no NEXT_PUBLIC_ prefix) except Supabase URL/anon key
- AR page dynamically loads A-Frame + AR.js scripts (not npm — they're script-tag libs)
- Use pnpm as the package manager
