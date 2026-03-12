import Link from "next/link";

export default function FAB() {
  return (
    <Link
      href="/create"
      className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-r from-[#ff2d95] to-[#a855f7] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#ff2d95]/20 hover:scale-110 transition"
      aria-label="Create graffiti"
    >
      +
    </Link>
  );
}
