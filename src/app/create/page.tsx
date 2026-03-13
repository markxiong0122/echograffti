"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Graffiti } from "@/lib/supabase";

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [creator, setCreator] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Graffiti | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? "Location access denied. Please enable location permissions."
            : "Unable to determine your location."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let deviceId = localStorage.getItem("device_id");

if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem("device_id", deviceId);
}
    if (!prompt.trim() || latitude == null || longitude == null) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          latitude,
          longitude,
          creator: creator.trim() || undefined,
          deviceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate graffiti");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setError(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen px-6 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-80 w-80 rounded-full opacity-15 blur-[100px]"
        style={{ background: "#a855f7" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full opacity-10 blur-[100px]"
        style={{ background: "#ff2d95" }}
      />

      <div className="relative z-10 mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#e8e6f0]/50 transition-colors hover:text-[#00f0ff]"
            style={{ fontFamily: "var(--font-space-mono), monospace" }}
          >
            &larr; Back
          </Link>
          <h1
            className="mt-4 text-3xl sm:text-4xl"
            style={{
              fontFamily: "var(--font-permanent-marker), cursive",
              background:
                "linear-gradient(135deg, #ff2d95, #a855f7 50%, #00f0ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Create Graffiti
          </h1>
          <p
            className="mt-2 text-sm text-[#e8e6f0]/50"
            style={{ fontFamily: "var(--font-space-mono), monospace" }}
          >
            Describe your vision. AI will paint it.
          </p>
        </div>

        {/* Success State */}
        {result ? (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-[#e8e6f0]/10 bg-[#141420]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.image_url}
                alt={result.prompt}
                className="w-full aspect-square object-cover"
              />
              <div className="p-5 space-y-3">
                <p
                  className="text-sm text-[#e8e6f0]/60"
                  style={{
                    fontFamily: "var(--font-space-mono), monospace",
                  }}
                >
                  &ldquo;{result.prompt}&rdquo;
                </p>
                <div className="flex items-center gap-2 text-xs text-[#39ff14]/80">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono), monospace",
                    }}
                  >
                    Pinned to your location
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-full border border-[#e8e6f0]/20 px-6 py-3 text-sm font-bold text-[#e8e6f0] transition-all hover:border-[#00f0ff]/60 hover:text-[#00f0ff] active:scale-95"
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}
              >
                Create Another
              </button>
              <Link
                href="/ar"
                className="flex-1 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,45,149,0.4)] active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ff2d95, #a855f7)",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}
              >
                View in AR
              </Link>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Status */}
            <div
              className="text-xs"
              style={{ fontFamily: "var(--font-space-mono), monospace" }}
            >
              {locationError ? (
                <span className="text-[#ff2d95]">{locationError}</span>
              ) : latitude != null && longitude != null ? (
                <span className="text-[#39ff14]/70">
                  Location locked: {latitude.toFixed(4)},{" "}
                  {longitude.toFixed(4)}
                </span>
              ) : (
                <span className="text-[#ffd600]/70">
                  Acquiring GPS location...
                </span>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label
                htmlFor="creator"
                className="block text-xs font-bold uppercase tracking-wider text-[#e8e6f0]/40 mb-2"
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                }}
              >
                Tag name (optional)
              </label>
              <input
                id="creator"
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="Anonymous"
                maxLength={40}
                className="w-full rounded-xl border border-[#e8e6f0]/10 bg-[#141420] px-4 py-3 text-sm text-[#e8e6f0] placeholder-[#e8e6f0]/20 outline-none transition-colors focus:border-[#a855f7]/60 focus:ring-1 focus:ring-[#a855f7]/30"
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}
              />
            </div>

            {/* Prompt */}
            <div>
              <label
                htmlFor="prompt"
                className="block text-xs font-bold uppercase tracking-wider text-[#e8e6f0]/40 mb-2"
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                }}
              >
                What do you want to see?
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A dragon breathing neon fire..."
                rows={4}
                maxLength={500}
                required
                className="w-full resize-none rounded-xl border border-[#e8e6f0]/10 bg-[#141420] px-4 py-3 text-sm text-[#e8e6f0] placeholder-[#e8e6f0]/20 outline-none transition-colors focus:border-[#a855f7]/60 focus:ring-1 focus:ring-[#a855f7]/30"
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}
              />
              <p
                className="mt-1 text-right text-xs text-[#e8e6f0]/30"
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                }}
              >
                {prompt.length}/500
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-[#ff2d95]/30 bg-[#ff2d95]/10 px-4 py-3">
                <p
                  className="text-sm text-[#ff2d95]"
                  style={{
                    fontFamily: "var(--font-space-mono), monospace",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                loading ||
                !prompt.trim() ||
                latitude == null ||
                longitude == null
              }
              className="w-full rounded-full px-8 py-3.5 text-base font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,45,149,0.4)] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #ff2d95, #a855f7)",
                fontFamily: "var(--font-dm-sans), sans-serif",
              }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  AI is painting your graffiti...
                </span>
              ) : (
                "Generate Graffiti"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
