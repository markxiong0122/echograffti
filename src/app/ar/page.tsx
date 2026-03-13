"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase, Graffiti } from "@/lib/supabase";
import FAB from "@/components/FAB";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
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
        setStatus("Loading AR engine...");
        await loadScript("https://aframe.io/releases/1.6.0/aframe.min.js");
        await loadScript(
          "https://raw.githack.com/AR-js-org/AR.js/3.4.7/three.js/build/ar-threex-location-only.js"
        );
        await loadScript(
          "https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"
        );

        if (!mounted) return;

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

        setStatus("Loading nearby graffiti...");
        const RADIUS = 0.02;
        const { data: nearby } = await supabase
          .from("graffiti")
          .select("*")
          .gte("latitude", userLat - RADIUS)
          .lte("latitude", userLat + RADIUS)
          .gte("longitude", userLng - RADIUS)
          .lte("longitude", userLng + RADIUS)
          .limit(20);

        if (!mounted || !containerRef.current) return;

        const graffiti: Graffiti[] = (nearby as Graffiti[]) || [];

        const entityHTML = graffiti
  .map((g, index) => {
    const x = (index - (Math.min(graffiti.length, 5) - 1) / 2) * 2.5;
    const y = 1.5;
    const z = -6 - index * 0.5;

    return `
      <a-image
        src="${g.image_url}?t=${Date.now()}"
        position="${x} ${y} ${z}"
        look-at="[camera]"
        scale="2.5 2.5 2.5"
        material="transparent: true; alphaTest: 0.01;"
      ></a-image>
    `;
  })
  .join("\\n");

        containerRef.current.innerHTML = `
          <a-scene
            vr-mode-ui="enabled: false"
            arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false"
            renderer="antialias: true; alpha: true"
          >
            <a-camera id="camera"></a-camera>
            ${entityHTML}
          </a-scene>
        `;

        setStatus(
          graffiti.length > 0
            ? `Found ${graffiti.length} graffiti nearby`
            : "No graffiti nearby — create some!"
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
      <div ref={containerRef} className="absolute inset-0" />

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur border-b border-white/10">
        <Link
          href="/"
          className="text-white/80 hover:text-white transition text-sm font-mono"
        >
          &larr; Exit AR
        </Link>
        <span className="text-white/60 text-xs font-mono">{status}</span>
        <Link
          href="/create"
          className="bg-gradient-to-r from-[#ff2d95] to-[#a855f7] text-white font-bold py-2 px-4 rounded-xl text-sm"
        >
          + Create
        </Link>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center px-8">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="border border-white/20 py-2 px-6 rounded-xl hover:bg-white/10 transition text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <FAB />
    </div>
  );
}
