// @/components/BottomNav.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  // Removed the Profile route from this array
  const navItems = [
    { icon: LayoutDashboard, path: "/dashboard" },
    { icon: BarChart3, path: "/progress" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-10 py-4 flex justify-around items-center z-40 max-w-md mx-auto rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push(item.path)}
            className={cn(
              "p-3 rounded-2xl transition-all duration-300 w-16 flex justify-center",
              isActive
                ? "bg-blue-50 text-blue-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <item.icon
              className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")}
            />
          </motion.button>
        );
      })}
    </nav>
  );
}