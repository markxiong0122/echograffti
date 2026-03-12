# EchoGraffiti Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a location-based AR graffiti web app where users generate AI art from text prompts and pin it to GPS locations for others to discover through their phone camera.

**Architecture:** Next.js App Router serves four routes (landing, map, create, AR). A Next.js API route calls Nano Banana 2 (Gemini 3.1 Flash Image) to generate graffiti art, uploads images to Supabase Storage, and stores metadata in a Supabase PostgreSQL table. The AR page uses A-Frame + AR.js to render graffiti at GPS coordinates through the phone camera. The map page uses Leaflet + OpenStreetMap for discovery.

**Tech Stack:** Next.js 15 (App Router), Supabase (PostgreSQL + Storage), A-Frame + AR.js (location-based), Nano Banana 2 via @google/genai, Leaflet.js + react-leaflet, Playwright (E2E), Tailwind CSS

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`, `CLAUDE.md`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`

**Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with App Router, Tailwind, TypeScript.

**Step 2: Install production dependencies**

Run:
```bash
npm install @supabase/supabase-js @google/genai leaflet react-leaflet
```

**Step 3: Install dev dependencies**

Run:
```bash
npm install -D @playwright/test @types/leaflet
npx playwright install chromium
```

Note: Only install Chromium browser for speed. We only need one browser for hackathon testing.

**Step 4: Create environment variables file**

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

Also create `.env.example` with the same keys but no values, for reference.

Add `.env.local` to `.gitignore` (create-next-app should already do this).

**Step 5: Create CLAUDE.md**

Create `CLAUDE.md`:
```markdown
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
- `npm run dev` — start dev server
- `npm run build` — production build
- `npx playwright test` — run E2E tests
- `npx playwright test --ui` — run E2E tests with UI

## Project Structure
- `src/app/` — Next.js App Router pages
- `src/app/api/` — API routes
- `src/components/` — shared React components
- `src/lib/` — utility modules (supabase client, etc.)
- `tests/e2e/` — Playwright E2E tests
- `public/` — static assets

## Conventions
- Use `"use client"` only when needed (interactivity, browser APIs)
- Supabase client initialized in `src/lib/supabase.ts`
- API keys are server-side only (no NEXT_PUBLIC_ prefix) except Supabase URL/anon key
- AR page dynamically loads A-Frame + AR.js scripts (not npm — they're script-tag libs)
```

**Step 6: Verify project runs**

Run: `npm run dev`
Expected: Next.js dev server starts at http://localhost:3000

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

### Task 2: Supabase Setup

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `supabase/schema.sql` (for reference)

**Step 1: Save the database schema for reference**

Create `supabase/schema.sql`:
```sql
-- EchoGraffiti database schema
CREATE TABLE graffiti (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt     TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  latitude   FLOAT8 NOT NULL,
  longitude  FLOAT8 NOT NULL,
  creator    TEXT DEFAULT 'Anonymous',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for location-based queries (bounding box)
CREATE INDEX idx_graffiti_location ON graffiti (latitude, longitude);

-- Allow public read access (hackathon — no auth)
ALTER TABLE graffiti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON graffiti FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON graffiti FOR INSERT WITH CHECK (true);
```

**Step 2: Set up Supabase project**

Via Supabase MCP (if available) or Supabase Dashboard:
1. Create the `graffiti` table with the schema above
2. Create a storage bucket named `graffiti-images` with public access enabled
3. Add a storage policy allowing public uploads and reads

If using Supabase Dashboard manually:
- Go to SQL Editor → paste the schema SQL → Run
- Go to Storage → New bucket → name: `graffiti-images` → Public bucket: ON
- Go to Settings → API → copy the URL and anon key into `.env.local`

**Step 3: Create Supabase client module**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Graffiti = {
  id: string;
  prompt: string;
  image_url: string;
  latitude: number;
  longitude: number;
  creator: string;
  created_at: string;
};
```

**Step 4: Verify Supabase connection**

Temporarily add to `src/app/page.tsx`:
```typescript
import { supabase } from "@/lib/supabase";
// In the component, fetch graffiti and console.log the result
```

Run: `npm run dev`, check browser console for successful Supabase response (empty array is fine).

Remove the test code after verifying.

**Step 5: Commit**

```bash
git add src/lib/supabase.ts supabase/schema.sql
git commit -m "feat: add Supabase client and database schema"
```

---

### Task 3: Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Update the root layout**

Modify `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EchoGraffiti",
  description: "Leave your mark on the world — AI-powered AR graffiti",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Build the landing page**

Modify `src/app/page.tsx`:
```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
        EchoGraffiti
      </h1>
      <p className="text-xl text-gray-400 mb-12 max-w-md">
        Leave your mark on the world. AI-powered street art, pinned to real places.
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/ar"
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl text-center text-lg hover:opacity-90 transition"
        >
          Explore AR
        </Link>
        <Link
          href="/map"
          className="border border-gray-700 text-white font-bold py-4 px-8 rounded-2xl text-center text-lg hover:bg-gray-900 transition"
        >
          View Map
        </Link>
      </div>
    </main>
  );
}
```

**Step 3: Clean up globals.css**

Replace `src/app/globals.css` with only the Tailwind directives (remove all the default Next.js boilerplate CSS):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Verify in browser**

Run: `npm run dev`
Expected: Dark background, gradient title "EchoGraffiti", two buttons.

**Step 5: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: add landing page with graffiti branding"
```

---

### Task 4: API Route — Generate Graffiti

**Files:**
- Create: `src/app/api/generate/route.ts`

**Step 1: Write the API route**

Create `src/app/api/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { prompt, latitude, longitude, creator } = await request.json();

    if (!prompt || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "prompt, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    // Generate graffiti image with Nano Banana 2
    const styledPrompt = `Street art graffiti mural style, spray painted on a brick wall: ${prompt}. Vibrant colors, urban art aesthetic, bold and expressive.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-image-generation",
      contents: styledPrompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Extract image from response
    let imageData: string | null = null;
    let mimeType = "image/png";

    for (const part of response.candidates![0].content!.parts!) {
      if (part.inlineData) {
        imageData = part.inlineData.data!;
        mimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${crypto.randomUUID()}.png`;
    const buffer = Buffer.from(imageData, "base64");

    const { error: uploadError } = await supabase.storage
      .from("graffiti-images")
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("graffiti-images")
      .getPublicUrl(fileName);

    // Insert graffiti record
    const { data: graffiti, error: insertError } = await supabase
      .from("graffiti")
      .insert([
        {
          prompt,
          image_url: urlData.publicUrl,
          latitude,
          longitude,
          creator: creator || "Anonymous",
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save graffiti" },
        { status: 500 }
      );
    }

    return NextResponse.json(graffiti);
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Test the API route manually**

Run: `npm run dev`

Then in a separate terminal:
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a neon dragon", "latitude": 52.2053, "longitude": 0.1218, "creator": "test"}'
```

Expected: JSON response with graffiti record including `image_url`.

**Step 3: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: add API route for AI graffiti generation via Nano Banana 2"
```

---

### Task 5: Create Graffiti Page

**Files:**
- Create: `src/app/create/page.tsx`

**Step 1: Build the create page**

Create `src/app/create/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [creator, setCreator] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [result, setResult] = useState<{
    image_url: string;
    prompt: string;
  } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Location access is needed to place your graffiti")
    );
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || !location) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          latitude: location.lat,
          longitude: location.lng,
          creator: creator.trim() || "Anonymous",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const graffiti = await res.json();
      setResult(graffiti);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="text-gray-500 mb-8 hover:text-white transition">
        &larr; Back
      </Link>

      <h1 className="text-3xl font-bold mb-8">Create Graffiti</h1>

      {result ? (
        <div className="flex flex-col items-center gap-6">
          <img
            src={result.image_url}
            alt={result.prompt}
            className="w-80 h-80 object-cover rounded-2xl border border-gray-800"
          />
          <p className="text-gray-400">
            &quot;{result.prompt}&quot; — pinned to your location
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setResult(null);
                setPrompt("");
              }}
              className="border border-gray-700 py-3 px-6 rounded-xl hover:bg-gray-900 transition"
            >
              Create Another
            </button>
            <Link
              href="/ar"
              className="bg-gradient-to-r from-pink-500 to-purple-600 py-3 px-6 rounded-xl font-bold hover:opacity-90 transition"
            >
              View in AR
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-md">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
          />
          <textarea
            placeholder="Describe your graffiti... (e.g. 'a neon dragon breathing fire')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || !location}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Graffiti"}
          </button>
          {loading && (
            <p className="text-gray-500 text-center text-sm">
              AI is painting your graffiti — this takes a few seconds...
            </p>
          )}
        </div>
      )}
    </main>
  );
}
```

**Step 2: Verify in browser**

Run: `npm run dev`, navigate to `/create`.
Expected: Form with name input, prompt textarea, and generate button. Location permission prompt appears.

**Step 3: Test end-to-end generation**

Enter a prompt, click Generate. After a few seconds, the generated graffiti image should appear.
If Supabase and Gemini are configured correctly, the image should be stored and visible.

**Step 4: Commit**

```bash
git add src/app/create/page.tsx
git commit -m "feat: add create graffiti page with AI generation flow"
```

---

### Task 6: Map Page

**Files:**
- Create: `src/components/MapView.tsx`
- Create: `src/app/map/page.tsx`

**Step 1: Create the map component (client-side only)**

Create `src/components/MapView.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { supabase, Graffiti } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapView() {
  const [graffiti, setGraffiti] = useState<Graffiti[]>([]);
  const [center, setCenter] = useState<[number, number]>([52.2053, 0.1218]); // Cambridge default
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        loadNearby(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Use default location if GPS denied
        loadNearby(center[0], center[1]);
      }
    );
  }, []);

  const loadNearby = async (lat: number, lng: number) => {
    const RADIUS = 0.01; // ~1km bounding box
    const { data } = await supabase
      .from("graffiti")
      .select("*")
      .gte("latitude", lat - RADIUS)
      .lte("latitude", lat + RADIUS)
      .gte("longitude", lng - RADIUS)
      .lte("longitude", lng + RADIUS)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setGraffiti(data);
    setLoaded(true);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading map...
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={16}
      className="w-full h-full"
      style={{ background: "#111" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {graffiti.map((g) => (
        <Marker key={g.id} position={[g.latitude, g.longitude]} icon={icon}>
          <Popup>
            <div className="text-black">
              <img
                src={g.image_url}
                alt={g.prompt}
                className="w-48 h-48 object-cover rounded-lg mb-2"
              />
              <p className="font-bold text-sm">&quot;{g.prompt}&quot;</p>
              <p className="text-xs text-gray-600">
                by {g.creator} &middot;{" "}
                {new Date(g.created_at).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

**Step 2: Create the map page with dynamic import**

Create `src/app/map/page.tsx`:
```tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-500">
      Loading map...
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur border-b border-gray-800">
        <Link href="/" className="text-gray-400 hover:text-white transition">
          &larr; Home
        </Link>
        <h1 className="font-bold">Map</h1>
        <Link
          href="/create"
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 px-4 rounded-xl text-sm"
        >
          + Create
        </Link>
      </header>
      <div className="flex-1">
        <MapView />
      </div>
    </div>
  );
}
```

**Step 3: Verify in browser**

Run: `npm run dev`, navigate to `/map`.
Expected: Full-screen map centered on user's location (or Cambridge). If graffiti exists, markers appear with image popups.

**Step 4: Commit**

```bash
git add src/components/MapView.tsx src/app/map/page.tsx
git commit -m "feat: add map page with Leaflet and graffiti markers"
```

---

### Task 7: AR Page

**Files:**
- Create: `src/app/ar/page.tsx`

**Note:** A-Frame and AR.js are script-tag libraries that register custom HTML elements. They conflict with React's DOM management. The approach: load scripts dynamically in `useEffect`, then build the A-Frame scene via direct DOM manipulation inside a container div. This is intentionally bypassing React for the AR scene — it's the standard approach.

**Step 1: Build the AR page**

Create `src/app/ar/page.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase, Graffiti } from "@/lib/supabase";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Skip if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function ARPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Initializing AR...");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Load A-Frame and AR.js
        setStatus("Loading AR engine...");
        await loadScript("https://aframe.io/releases/1.6.0/aframe.min.js");
        await loadScript(
          "https://raw.githack.com/AR-js-org/AR.js/3.4.7/three.js/build/ar-threex-location-only.js"
        );
        await loadScript(
          "https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"
        );

        if (!mounted) return;

        // Get user location
        setStatus("Getting your location...");
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
            });
          }
        );

        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Fetch nearby graffiti
        setStatus("Loading nearby graffiti...");
        const RADIUS = 0.005; // ~500m
        const { data: nearby } = await supabase
          .from("graffiti")
          .select("*")
          .gte("latitude", userLat - RADIUS)
          .lte("latitude", userLat + RADIUS)
          .gte("longitude", userLng - RADIUS)
          .lte("longitude", userLng + RADIUS)
          .limit(20);

        if (!mounted || !containerRef.current) return;

        // Build A-Frame scene via DOM
        const graffiti: Graffiti[] = nearby || [];

        const entityHTML = graffiti
          .map(
            (g) => `
          <a-image
            src="${g.image_url}"
            gps-new-entity-place="latitude: ${g.latitude}; longitude: ${g.longitude}"
            look-at="[gps-new-camera]"
            scale="15 15 15"
            position="0 3 0"
          ></a-image>
        `
          )
          .join("\n");

        containerRef.current.innerHTML = `
          <a-scene
            vr-mode-ui="enabled: false"
            arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false"
            renderer="antialias: true; alpha: true"
          >
            <a-camera gps-new-camera="gpsMinDistance: 5"></a-camera>
            ${entityHTML}
          </a-scene>
        `;

        setStatus(
          graffiti.length > 0
            ? `Found ${graffiti.length} graffiti nearby — look around!`
            : "No graffiti nearby yet. Create some!"
        );
      } catch (err) {
        if (!mounted) return;
        console.error("AR init error:", err);
        setError(
          "Could not start AR. Make sure you allow camera and location access."
        );
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-screen w-screen relative">
      {/* AR scene container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur">
        <Link href="/" className="text-white/80 hover:text-white transition">
          &larr; Exit AR
        </Link>
        <span className="text-white/60 text-sm">{status}</span>
        <Link
          href="/create"
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 px-4 rounded-xl text-sm"
        >
          + Create
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center px-8">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="border border-gray-600 py-2 px-6 rounded-xl hover:bg-gray-900 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify in browser**

Run: `npm run dev`, navigate to `/ar`.
Expected: Browser requests camera + location. If granted, camera feed appears with AR overlay. If graffiti exists nearby, images float at GPS positions. On desktop, camera will work but GPS may use a default — this is fine, real testing happens on phone.

**Step 3: Test on phone**

Connect phone to same network, navigate to `https://<your-ip>:3000/ar` (must be HTTPS for camera access — use `next dev --experimental-https` or ngrok).

**Step 4: Commit**

```bash
git add src/app/ar/page.tsx
git commit -m "feat: add AR page with A-Frame + AR.js location-based graffiti"
```

---

### Task 8: FAB Button + Navigation Polish

**Files:**
- Create: `src/components/FAB.tsx`
- Modify: `src/app/ar/page.tsx` (already has create link, but verify)
- Modify: `src/app/map/page.tsx` (already has create link, but verify)

**Step 1: Create a reusable FAB component**

Create `src/components/FAB.tsx`:
```tsx
import Link from "next/link";

export default function FAB() {
  return (
    <Link
      href="/create"
      className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg hover:scale-110 transition"
      aria-label="Create graffiti"
    >
      +
    </Link>
  );
}
```

**Step 2: Add FAB to map and AR pages**

Import and add `<FAB />` to both `/map` and `/ar` pages, replacing the header create button if desired. Or keep both — the FAB is more visible on mobile.

**Step 3: Commit**

```bash
git add src/components/FAB.tsx
git commit -m "feat: add floating action button for graffiti creation"
```

---

### Task 9: Playwright E2E Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/landing.spec.ts`
- Create: `tests/e2e/create.spec.ts`
- Create: `tests/e2e/map.spec.ts`
- Create: `tests/e2e/ar.spec.ts`

**Step 1: Configure Playwright**

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 2: Write landing page tests**

Create `tests/e2e/landing.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders the app title and navigation buttons", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("EchoGraffiti")).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore AR" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Map" })).toBeVisible();
  });

  test("Explore AR button navigates to /ar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Explore AR" }).click();
    await expect(page).toHaveURL("/ar");
  });

  test("View Map button navigates to /map", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "View Map" }).click();
    await expect(page).toHaveURL("/map");
  });
});
```

**Step 3: Write create page tests**

Create `tests/e2e/create.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Create Graffiti Page", () => {
  test("renders the create form", async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 52.2053, longitude: 0.1218 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();

    await page.goto("/create");

    await expect(page.getByText("Create Graffiti")).toBeVisible();
    await expect(
      page.getByPlaceholder("Describe your graffiti")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate Graffiti" })
    ).toBeVisible();

    await context.close();
  });

  test("generates graffiti from a prompt (mocked API)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 52.2053, longitude: 0.1218 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();

    // Mock the generate API
    await page.route("**/api/generate", async (route) => {
      await route.fulfill({
        json: {
          id: "test-id",
          prompt: "a neon dragon",
          image_url: "https://via.placeholder.com/400",
          latitude: 52.2053,
          longitude: 0.1218,
          creator: "Tester",
          created_at: new Date().toISOString(),
        },
      });
    });

    await page.goto("/create");

    // Fill in the form
    await page.getByPlaceholder("Your name").fill("Tester");
    await page.getByPlaceholder("Describe your graffiti").fill("a neon dragon");
    await page.getByRole("button", { name: "Generate Graffiti" }).click();

    // Wait for result
    await expect(page.getByText("pinned to your location")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View in AR" })
    ).toBeVisible();

    await context.close();
  });
});
```

**Step 4: Write map page tests**

Create `tests/e2e/map.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Map Page", () => {
  test("renders the map page with header", async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 52.2053, longitude: 0.1218 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();

    // Mock Supabase graffiti query
    await page.route("**/rest/v1/graffiti**", async (route) => {
      await route.fulfill({
        json: [
          {
            id: "test-1",
            prompt: "test graffiti",
            image_url: "https://via.placeholder.com/200",
            latitude: 52.2053,
            longitude: 0.1218,
            creator: "Tester",
            created_at: new Date().toISOString(),
          },
        ],
      });
    });

    await page.goto("/map");

    await expect(page.getByText("Map")).toBeVisible();
    await expect(page.getByRole("link", { name: /Home/ })).toBeVisible();

    // Wait for map to load (Leaflet container)
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 10000,
    });

    await context.close();
  });
});
```

**Step 5: Write AR page tests**

Create `tests/e2e/ar.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("AR Page", () => {
  test("renders AR page with overlay UI", async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 52.2053, longitude: 0.1218 },
      permissions: ["geolocation", "camera"],
    });
    const page = await context.newPage();

    // Mock Supabase graffiti query
    await page.route("**/rest/v1/graffiti**", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/ar");

    // Overlay navigation should be visible
    await expect(page.getByText("Exit AR")).toBeVisible();
    await expect(page.getByRole("link", { name: /Create/ })).toBeVisible();

    await context.close();
  });
});
```

**Step 6: Run all tests**

Run:
```bash
npx playwright test
```

Expected: All tests pass. Fix any failures before proceeding.

**Step 7: Add test script to package.json**

Modify `package.json` scripts:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**Step 8: Commit**

```bash
git add playwright.config.ts tests/
git commit -m "test: add Playwright E2E tests for all pages"
```

---

### Task 10: Mobile Polish & Demo Prep

**Files:**
- Modify: `src/app/layout.tsx` (viewport meta)
- Create: `scripts/seed.ts` (optional: seed script for demo)

**Step 1: Ensure mobile viewport is correct**

Verify `src/app/layout.tsx` has the viewport metadata preventing zoom issues on mobile:
```typescript
export const metadata: Metadata = {
  title: "EchoGraffiti",
  description: "Leave your mark on the world — AI-powered AR graffiti",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
```

Note: In Next.js 15, `viewport` is exported separately from `metadata`.

**Step 2: Create a seed script for demo prep**

Create `scripts/seed.ts`:
```typescript
/**
 * Seed script: generates graffiti around a location for demo purposes.
 * Usage: npx tsx scripts/seed.ts
 *
 * Set these env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   GEMINI_API_KEY
 */

import "dotenv/config";

const API_URL = "http://localhost:3000/api/generate";

const DEMO_GRAFFITI = [
  { prompt: "a glowing phoenix rising from circuit boards", offset: [0, 0] },
  { prompt: "neon cyber samurai with katana", offset: [0.0003, 0.0002] },
  { prompt: "cosmic whale swimming through stars", offset: [-0.0002, 0.0004] },
  { prompt: "robot playing saxophone on a rooftop", offset: [0.0005, -0.0003] },
  { prompt: "abstract fractal mandala in spray paint", offset: [-0.0004, -0.0001] },
];

// Cambridge city center
const BASE_LAT = 52.2053;
const BASE_LNG = 0.1218;

async function seed() {
  console.log("Seeding demo graffiti...\n");

  for (const item of DEMO_GRAFFITI) {
    console.log(`Generating: "${item.prompt}"...`);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: item.prompt,
          latitude: BASE_LAT + item.offset[0],
          longitude: BASE_LNG + item.offset[1],
          creator: "EchoGraffiti Demo",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(`  Failed: ${err.error}`);
      } else {
        const data = await res.json();
        console.log(`  Done: ${data.image_url}`);
      }
    } catch (err) {
      console.error(`  Error: ${err}`);
    }
  }

  console.log("\nSeeding complete!");
}

seed();
```

Add to `package.json` scripts:
```json
"seed": "tsx scripts/seed.ts"
```

Install tsx:
```bash
npm install -D tsx dotenv
```

**Step 3: Test seeding**

Run the dev server in one terminal, then:
```bash
npm run seed
```

Expected: 5 graffiti pieces generated and saved. Verify they appear on `/map`.

**Step 4: Final verification**

1. Landing page loads with gradient title and two buttons
2. Map shows seeded graffiti markers with image popups
3. Create page generates new graffiti from prompts
4. AR page loads camera feed and shows graffiti (test on phone)
5. All E2E tests pass: `npx playwright test`

**Step 5: Commit**

```bash
git add scripts/ src/app/layout.tsx
git commit -m "feat: add seed script and mobile viewport polish"
```

---

## Execution Order Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Project scaffolding | — |
| 2 | Supabase setup | 1 |
| 3 | Landing page | 1 |
| 4 | API route (generate) | 2 |
| 5 | Create page | 4 |
| 6 | Map page | 2 |
| 7 | AR page | 2 |
| 8 | FAB component | 3 |
| 9 | E2E tests | 3, 4, 5, 6, 7 |
| 10 | Polish + seed | All |

**Parallelizable:** Tasks 3, 4, 6, 7 can be developed in parallel after Task 2 completes.
