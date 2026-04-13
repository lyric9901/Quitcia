import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPopup from '@/components/InstallPopup';
import OfflineManager from "@/components/OfflineManager";

import { PostHogProvider } from "@/providers/PostHogProvider";
import PostHogPageView from "@/components/PostHogPageView";


import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Added Viewport configuration for PWA theme colors
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | Urge Relief",
    default: "Urge Relief - Pause before you act",
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
  authors: [{ name: "Shah Nawaz" }], // Note: You might want to update this if you are the primary author!
  creator: "Quitcia",
  manifest: "/manifest.json",
  verification: {
    google: "0XPrDPVrlqOU_umQNTDoeP-AUeNiwrhuZGAUl9Dvstg",
  },
  openGraph: {
    title: "Urge Relief - Rewire Your Habits",
    description: "Master your urges and build a better you.",
    url: "https://urge-relief.in",
    siteName: "Urge Relief",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Urge Relief App Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Urge Relief - Change Your Habits",
    description: "Master your urges and build a better you.",
    images: ["/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Urge Relief",
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
        <PostHogProvider>
          <PostHogPageView />
          {children}
          <OfflineManager />
        </PostHogProvider>
        
        {/* Render the PWA Install Popup globally */}
        <InstallPopup />
        
        <Analytics />
      </body>
    </html>
  );
}