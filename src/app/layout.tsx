// @/src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OfflineManager from "@/components/OfflineManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- ENHANCED GLOBAL SEO METADATA ---
export const metadata: Metadata = {
  title: {
    template: "%s | Quitcia",
    default: "Quitcia - Rewire Your Habits",
  },
  description:
    "Overcome urges, build better habits, and track your daily progress with scientifically-backed audio therapy and mindfulness.",
  keywords: [
    "habit tracker",
    "addiction recovery",
    "mindfulness",
    "urge surfing",
    "mental health app",
    "quitcia",
  ],
  authors: [{ name: "Neel" }],
  creator: "Quitcia",
  manifest: "/manifest.json",

  // ✅ GOOGLE VERIFICATION ADDED (only this new part)
  verification: {
    google: "0XPrDPVrlqOU_umQNTDoeP-AUeNiwrhuZGAUl9Dvstg",
  },

  openGraph: {
    title: "Quitcia - Rewire Your Habits",
    description: "Master your urges and build a better you.",
    url: "https://quitcia.com",
    siteName: "Quitcia",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Quitcia App Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Quitcia - Rewire Your Habits",
    description: "Master your urges and build a better you.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <OfflineManager />
      </body>
    </html>
  );
}
