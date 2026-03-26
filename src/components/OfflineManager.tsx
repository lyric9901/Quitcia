// @/components/OfflineManager.tsx
"use client";

import { useEffect } from "react";
import { cacheAudioFiles } from "@/lib/offlineAudio";

export default function OfflineManager() {
  useEffect(() => {
    // Wait 3 seconds so the app loads quickly first, then download audio quietly
    const timer = setTimeout(() => {
      cacheAudioFiles();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return null; // This component is invisible
}