"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import FAB from "@/components/FAB";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div
          className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3"
          style={{ borderColor: "#00f0ff", borderTopColor: "transparent" }}
        />
        <p className="text-white/60 text-sm font-mono">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Header bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10 z-20 shrink-0">
        <Link
          href="/"
          className="text-white/80 hover:text-white transition text-sm font-mono"
        >
          &larr; Home
        </Link>
        <h1
          className="text-lg tracking-wide"
          style={{
            fontFamily: "var(--font-permanent-marker), cursive",
            background:
              "linear-gradient(135deg, #00f0ff, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Map
        </h1>
        <Link
          href="/create"
          className="bg-gradient-to-r from-[#ff2d95] to-[#a855f7] text-white font-bold py-2 px-4 rounded-xl text-sm hover:scale-105 transition"
        >
          + Create
        </Link>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView />
      </div>

      <FAB />
    </div>
  );
}
