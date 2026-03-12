# EchoGraffiti Design Document

## Overview

EchoGraffiti is a location-based web app for a Cambridge AI x XR hackathon. Users type a text prompt, Nano Banana 2 (Gemini 3.1 Flash Image) generates graffiti-style art, and it appears in AR at their GPS location for anyone nearby to discover.

**Pitch**: "Leave your mark on the world — type what you want to say, AI turns it into street art, and it appears on the wall in AR for anyone nearby to discover."

## Scope

### In (MVP)

- **Landing page** — branding, entry point to AR and Map views
- **AR View** — point phone camera, see graffiti floating at GPS locations (A-Frame + AR.js)
- **AI Create** — text prompt -> Nano Banana 2 3 generates graffiti art -> pinned to current GPS location
- **Map View** — browse/discover nearby graffiti on a Leaflet map
- **Anonymous usage** — optional nickname, no auth
- **E2E tests** — Playwright tests covering core flows

### Cut

- Drawing canvas (AI generation is the creation method)
- Collections/saves
- Time layers
- Conditional visibility
- Video graffiti
- Themed zones
- User accounts/auth

## Architecture

```
+---------------------------------------------+
|  User's Phone Browser                       |
|                                             |
|  Next.js App                                |
|  |-- /          -> Landing page             |
|  |-- /map       -> Map view (Leaflet)       |
|  |-- /ar        -> AR camera (A-Frame+AR.js)|
|  +-- /create    -> Prompt input + generate  |
+---------------+-----------------------------+
                |
                v
+------------------------------+
|  Supabase                    |
|  |-- Edge Function           |
|  |   +-- POST /generate      |
|  |       -> Calls Gemini API      |
|  |       -> Saves image to   |
|  |         Storage bucket    |
|  |       -> Inserts row in DB|
|  |-- PostgreSQL              |
|  |   +-- graffiti table      |
|  +-- Storage                 |
|      +-- generated images    |
+------------------------------+
```

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database + Storage + Edge Functions**: Supabase
- **AR**: A-Frame + AR.js (location-based module)
- **Map**: Leaflet.js + OpenStreetMap tiles (free, no API key)
- **AI**: Nano Banana 2 (Gemini 3.1 Flash Image, `gemini-3.1-flash-image-preview`) via Google Gemini API (called from Supabase Edge Function)
- **Testing**: Playwright (E2E)
- **Deploy**: Vercel (Next.js) + Supabase (hosted)

## Database Schema

Single table:

```sql
CREATE TABLE graffiti (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt     TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  latitude   FLOAT8 NOT NULL,
  longitude  FLOAT8 NOT NULL,
  creator    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Pages

| Page      | Rendering    | Purpose                                           |
|-----------|-------------|---------------------------------------------------|
| `/`       | SSR/static  | Landing page — branding + entry point              |
| `/map`    | SSR/static  | Map showing nearby graffiti pins                   |
| `/ar`     | Client-only | AR camera view. A-Frame + AR.js at GPS coords.    |
| `/create` | Client-only | Text prompt -> edge function -> graffiti created   |

## User Journeys

### Discover (AR)

1. Landing page -> Tap "Explore AR"
2. Browser requests camera + GPS permissions
3. Fetch graffiti within ~200m radius from Supabase
4. AR.js renders images as planes at their GPS coords
5. User walks around, sees graffiti floating in camera view

### Create

1. Tap "+" FAB button (available on /ar and /map)
2. Enter text prompt + optional nickname
3. Tap "Generate"
4. Edge function calls Nano Banana 2 3 with styled prompt
5. Image saved to Supabase Storage, row inserted with lat/lng
6. New graffiti appears in AR/on map

### Browse (Map)

1. Landing page -> Tap "View Map"
2. Map centered on user's GPS location
3. Graffiti pins loaded from Supabase (nearby)
4. Tap pin -> See graffiti image + prompt + creator + timestamp

## Error Handling (Hackathon-Grade)

- GPS denied: "Location access needed" + retry
- Nano Banana 2 fails: "Generation failed, try again"
- No graffiti nearby: "No graffiti here yet — be the first!"

## Demo Strategy

1. Pre-seed 5-10 graffiti pieces around the venue before pitching
2. Show landing page (visual impact)
3. Open map -> show graffiti around venue
4. Switch to AR -> point phone, graffiti floating in view
5. Live create: type prompt -> Nano Banana 2 generates -> appears in AR
6. Ask judge to open on their phone -> shared experience proves it's real

### Backup

If GPS is flaky indoors, have a screen recording of AR working outdoors. Show live map + creation, play the AR video.

## Testing Strategy

- Playwright E2E tests covering:
  - Landing page renders and navigation works
  - Map page loads, displays graffiti pins
  - Create flow: submit prompt, graffiti appears
  - AR page loads (camera/GPS mocked in test)
- Supabase and Gemini API calls mocked in E2E tests for reliability
