import type { Metadata, Viewport } from "next";
import { Permanent_Marker, Space_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const permanentMarker = Permanent_Marker({
  weight: "400",
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ECHO//GRAFFITI",
  description:
    "Leave your mark on the world. AI-powered street art, pinned to real places with augmented reality.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${permanentMarker.variable} ${spaceMono.variable} ${dmSans.variable} antialiased bg-[#0a0a0f] text-[#e8e6f0] min-h-screen`}
      >
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
