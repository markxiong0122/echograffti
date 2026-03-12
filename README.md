# ECHO//GRAFFITI

Location-based AR graffiti app for the Cambridge AI x XR Hackathon 2026.

> Type what you want to say. AI turns it into street art. It appears on the wall in AR for anyone nearby to discover.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and Gemini API keys (see below)

# Run dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone for the full experience (AR + GPS).

## Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard > Settings > API |
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://aistudio.google.com/apikey) |

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (generated images) |
| AI | Nano Banana 2 (Gemini 3.1 Flash Image) |
| AR | A-Frame + AR.js (location-based, loaded via CDN) |
| Map | Leaflet + OpenStreetMap (free, no API key) |
| Testing | Playwright (E2E) |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    layout.tsx            # Root layout (fonts, metadata)
    globals.css           # Design system CSS variables
    api/generate/route.ts # POST — AI image generation endpoint
    ar/page.tsx           # AR camera view (A-Frame + AR.js)
    create/page.tsx       # Create graffiti form
    map/page.tsx          # Map discovery view (Leaflet)
  components/
    FAB.tsx               # Floating action button
    MapView.tsx           # Leaflet map component
  lib/
    supabase.ts           # Supabase client + Graffiti type
tests/e2e/                # Playwright E2E tests
docs/
  design-doc.html         # Visual design document
  plans/                  # Design + implementation plans
supabase/
  schema.sql              # Database schema (already applied)
```

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with "Explore AR" and "View Map" CTAs |
| `/ar` | AR camera view — graffiti floating at GPS locations |
| `/map` | Map with graffiti markers and image popups |
| `/create` | Text prompt -> AI generates graffiti -> pins to location |

## Architecture Walkthrough

```
  Phone Browser
  +--------------------------------------------------+
  |  Next.js App (Vercel)                             |
  |                                                   |
  |  /           Landing      +--> /ar   AR Camera    |
  |                           |         (A-Frame +    |
  |                           |          AR.js CDN)   |
  |                           |                       |
  |                           +--> /map  Leaflet Map  |
  |                           |         (OSM tiles)   |
  |                           |                       |
  |  /create  Prompt Form ----+--> POST /api/generate |
  +---------------------|-----------------------------+
                        |
                        v
  +--------------------------------------------------+
  |  /api/generate  (Next.js API Route)               |
  |                                                   |
  |  1. Receives { prompt, lat, lng, creator }        |
  |  2. Calls Gemini API (Nano Banana 2)              |
  |     - Styled prompt: "Street art graffiti mural   |
  |       style, spray painted on brick wall: {input}"|
  |     - Returns base64 PNG                          |
  |  3. Uploads image to Supabase Storage bucket      |
  |     (graffiti-images)                             |
  |  4. Inserts row into graffiti table with          |
  |     image_url + GPS coords                        |
  |  5. Returns the saved Graffiti record             |
  +--------------------------------------------------+
                        |
                        v
  +--------------------------------------------------+
  |  Supabase                                         |
  |                                                   |
  |  PostgreSQL:  graffiti table                      |
  |    - id, prompt, image_url, lat, lng, creator     |
  |    - RLS: public read + insert (no auth)          |
  |    - Index on (latitude, longitude)               |
  |                                                   |
  |  Storage:  graffiti-images bucket (public)        |
  |    - Stores generated PNG images                  |
  |    - Public read URLs                             |
  +--------------------------------------------------+
```

### Data Flow: Creating Graffiti

1. User opens `/create`, browser requests GPS permission
2. User types a prompt (e.g., "a neon dragon breathing fire") and optional nickname
3. Client POSTs `{ prompt, latitude, longitude, creator }` to `/api/generate`
4. API route prepends a graffiti style prefix to the prompt
5. Gemini API (Nano Banana 2, model `gemini-2.5-flash-preview-image-generation`) generates an image and returns base64 data
6. API route uploads the image buffer to Supabase Storage (`graffiti-images` bucket)
7. API route inserts a row into the `graffiti` table with the public image URL + GPS coordinates
8. Client displays the generated image and confirmation

### Data Flow: Discovering Graffiti (AR)

1. User opens `/ar`, browser requests camera + GPS permissions
2. Page dynamically loads A-Frame + AR.js via `<script>` tags (CDN, not npm)
3. Client queries Supabase for graffiti within ~500m bounding box of user's GPS
4. For each graffiti record, an `<a-image>` A-Frame entity is created at that GPS coordinate
5. AR.js uses the phone's compass + accelerometer to position images in the camera feed
6. User walks around and sees graffiti floating at their real-world locations

### Data Flow: Discovering Graffiti (Map)

1. User opens `/map`, browser requests GPS permission
2. Leaflet renders an OpenStreetMap map centered on user's location
3. Client queries Supabase for graffiti within ~1km bounding box
4. Each graffiti is rendered as a map marker; clicking shows a popup with the image, prompt, creator, and date

### Key Architecture Decisions

- **No auth**: Hackathon scope — anonymous access via Supabase RLS public policies
- **API route for generation**: Keeps the Gemini API key server-side (not exposed to browser)
- **Bounding box queries**: Simple lat/lng range filters instead of PostGIS — good enough for a hackathon
- **A-Frame via CDN**: A-Frame registers custom HTML elements that conflict with React's DOM — loaded via script tags and DOM manipulation in useEffect, not as React components
- **Leaflet dynamic import**: `react-leaflet` requires `window`, so MapView is loaded with `dynamic(() => import(...), { ssr: false })`

## Commands

```bash
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm exec playwright test   # Run E2E tests
```

## Database Schema

Single table — `graffiti`:

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `prompt` | TEXT | What the user typed |
| `image_url` | TEXT | Supabase Storage URL |
| `latitude` | FLOAT8 | GPS latitude |
| `longitude` | FLOAT8 | GPS longitude |
| `creator` | TEXT | Optional nickname (default: "Anonymous") |
| `created_at` | TIMESTAMPTZ | Auto-set timestamp |

The schema is in `supabase/schema.sql` and has already been applied to the Supabase project.

## TODOs for Teammates

### High Priority (for demo)
- [ ] **Seed demo data**: Generate 5-10 graffiti pieces around the hackathon venue before the pitch. Run the app, go to `/create`, and generate pieces at known locations.
- [ ] **Test on phone**: AR requires HTTPS — use `pnpm dev --experimental-https` or ngrok to test on a real phone
- [ ] **Tune AR scale/position**: The `scale="15 15 15"` and `position="0 3 0"` values in `src/app/ar/page.tsx` may need adjusting based on real-world testing
- [ ] **Record backup video**: Screen-record the AR working outdoors in case GPS is flaky during the indoor demo

### Nice to Have
- [ ] **Loading animation on create page**: Add a spray-paint animation while AI generates
- [ ] **Custom map markers**: Replace default Leaflet pins with graffiti-styled markers
- [ ] **Gallery view**: A simple feed/grid of all graffiti (no location needed)
- [ ] **Share link**: Deep link to a specific graffiti piece
- [ ] **PWA manifest**: Add for "Add to Home Screen" on mobile
- [ ] **Offline fallback**: Service worker to cache the app shell

### Known Limitations
- GPS accuracy is ~5-10m outdoors, worse indoors — graffiti won't be pixel-perfect on walls
- AR.js location-based requires camera + GPS permissions in the browser
- Gemini image generation takes 3-8 seconds per image
- No user auth — anyone can create graffiti (fine for hackathon)

## Design System

See `docs/design-doc.html` for the full visual spec. Key tokens:

- **Logo**: ECHO//GRAFFITI
- **Colors**: `#ff2d95` (pink), `#00f0ff` (cyan), `#a855f7` (purple), `#ffd600` (yellow), `#39ff14` (green)
- **Backgrounds**: `#0a0a0f` (dark), `#141420` (mid), `#1e1e2e` (light)
- **Fonts**: Permanent Marker, Space Mono, DM Sans
