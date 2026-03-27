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
    template: "%s | Quitcia", // This automatically adds "| Quitcia" to page titles
    default: "Quitcia - Rewire Your Habits", 
  },
  description: "Overcome urges, build better habits, and track your daily progress with scientifically-backed audio therapy and mindfulness.",
  keywords: ["habit tracker", "addiction recovery", "mindfulness", "urge surfing", "mental health app", "quitcia"],
  authors: [{ name: "Neel" }],
  creator: "Quitcia",
  manifest: "/manifest.json",
  
  // Open Graph (How it looks when shared on Facebook, LinkedIn, iMessage, WhatsApp)
  openGraph: {
    title: "Quitcia - Rewire Your Habits",
    description: "Master your urges and build a better you.",
    url: "https://quitcia.com", // Replace with your actual live URL
    siteName: "Quitcia",
    images: [
      {
        url: "/og-image.jpg", // Create a 1200x630 image and put it in your public folder
        width: 1200,
        height: 630,
        alt: "Quitcia App Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  // Twitter Card (How it looks when shared on Twitter/X)
  twitter: {
    card: "summary_large_image",
    title: "Quitcia - Rewire Your Habits",
    description: "Master your urges and build a better you.",
    images: ["/og-image.jpg"], 
  },
  
  // Tell Google to index the site
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
