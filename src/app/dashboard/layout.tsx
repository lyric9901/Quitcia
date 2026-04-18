// src/app/dashboard/layout.tsx (or similar)
"use client";

import { useFCM } from "@/hooks/useFCM";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Calling this will trigger the browser permission prompt
  const { fcmToken } = useFCM(); 

  return (
    <div>
      {children}
    </div>
  );
}