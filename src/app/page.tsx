import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background glow effects */}
      <div
        className="pointer-events-none absolute top-1/4 -left-32 h-96 w-96 rounded-full opacity-20 blur-[120px]"
        style={{ background: "#ff2d95" }}
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full opacity-15 blur-[120px]"
        style={{ background: "#00f0ff" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[100px]"
        style={{ background: "#a855f7" }}
      />

      <main className="relative z-10 flex max-w-2xl flex-col items-center text-center gap-8">
        {/* Logo */}
        <h1
          className="text-5xl sm:text-7xl md:text-8xl leading-tight tracking-tight"
          style={{
            fontFamily: "var(--font-permanent-marker), cursive",
            background:
              "linear-gradient(135deg, #ff2d95, #a855f7 50%, #00f0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(255, 45, 149, 0.3))",
          }}
        >
          ECHO//GRAFFITI
        </h1>

        {/* Tagline */}
        <p
          className="text-xl sm:text-2xl md:text-3xl font-light text-[#e8e6f0]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          Leave your mark on the world
        </p>

        {/* Subtitle */}
        <p
          className="text-sm sm:text-base text-[#e8e6f0]/60 max-w-md"
          style={{ fontFamily: "var(--font-space-mono), monospace" }}
        >
          AI-powered street art, pinned to real places
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
          <Link
            href="/ar"
            className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,45,149,0.4)] active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, #ff2d95, #a855f7)",
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}
          >
            Explore AR
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center justify-center rounded-full border border-[#e8e6f0]/20 px-8 py-3.5 text-base font-bold text-[#e8e6f0] transition-all hover:border-[#00f0ff]/60 hover:text-[#00f0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] active:scale-95"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            View Map
          </Link>
        </div>
      </main>
    </div>
  );
}
