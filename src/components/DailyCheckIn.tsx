"use client";

import { useState, useEffect } from "react";

export default function DailyCheckIn({ children }: { children: React.ReactNode }) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkTimeAndDate = () => {
      const now = new Date();
      const hours = now.getHours();
      const todayStr = now.toDateString(); // e.g., "Sun Apr 19 2026"

      const lastCheckIn = localStorage.getItem("lastDailyCheckIn");

      // Check if current time is between 8:00 AM (inclusive) and 11:00 AM (exclusive)
      const isTimeWindow = hours >= 8 && hours < 11;
      
      // Check if they already clicked "ready" today
      const isAlreadyCheckedIn = lastCheckIn === todayStr;

      if (isTimeWindow && !isAlreadyCheckedIn) {
        setShowCheckIn(true);
      }
      setIsChecking(false);
    };

    checkTimeAndDate();
  }, []);

  const handleReady = () => {
    const todayStr = new Date().toDateString();
    // Save today's date so it doesn't show again until tomorrow
    localStorage.setItem("lastDailyCheckIn", todayStr);
    setShowCheckIn(false);
  };

  // Prevent UI flashing while checking local storage
  if (isChecking) return null; 

  // If it's not time, or they already checked in, show the normal dashboard
  if (!showCheckIn) return <>{children}</>;

  // Otherwise, show the Daily Check-in UI
  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-between bg-[#09090B] px-6 pb-10 pt-20 animate-in fade-in duration-500">
      
      {/* Top Graphic / Illustration */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* Glowing Orb matching the UI vibe */}
        <div className="relative mb-12 flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500/10 to-yellow-500/10 shadow-[0_0_80px_rgba(249,115,22,0.15)] border border-white/5">
          <div className="absolute h-36 w-36 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 blur-[2px] opacity-90 shadow-inner"></div>
          
          {/* Simple Sparkle SVGs */}
          <svg className="absolute top-4 right-8 h-6 w-6 text-yellow-200 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0l2.5 8.5L23 11l-8.5 2.5L12 22l-2.5-8.5L1 11l8.5-2.5z"/></svg>
          <svg className="absolute bottom-8 left-6 h-4 w-4 text-orange-200 animate-pulse delay-150" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0l2.5 8.5L23 11l-8.5 2.5L12 22l-2.5-8.5L1 11l8.5-2.5z"/></svg>
        </div>

        {/* Text Content */}
        <div className="text-center">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-white">
            Good Morning
          </h1>
          <h2 className="mb-4 text-xl font-medium text-gray-200">
            Ready to conquer the day?
          </h2>
          <p className="mx-auto max-w-[280px] text-[15px] leading-relaxed text-gray-400">
            Take a deep breath, review your goals, and let's start fresh.
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="w-full">
        <button
          onClick={handleReady}
          className="w-full rounded-2xl bg-white px-4 py-4 text-[17px] font-bold text-black transition-transform hover:bg-gray-100 active:scale-[0.98] shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
        >
          I'm ready for today
        </button>
      </div>
      
    </div>
  );
}