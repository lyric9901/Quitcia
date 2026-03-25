// @/app/progress/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

export default function ProgressPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const [todaySessions, setTodaySessions] = useState(0);
  const [activeDaysCount, setActiveDaysCount] = useState(0);
  const [week, setWeek] = useState([
    { day: "M", done: false },
    { day: "T", done: false },
    { day: "W", done: false },
    { day: "T", done: false },
    { day: "F", done: false },
    { day: "S", done: false },
    { day: "S", done: false },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }
      await fetchWeeklyProgress(user.uid);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchWeeklyProgress = async (uid) => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const dayOfWeek = now.getDay() || 7; 
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - (dayOfWeek - 1));

      const swmRef = collection(db, "users", uid, "swm_sessions");
      const q = query(swmRef, where("timestamp", ">=", startOfWeek));
      const querySnapshot = await getDocs(q);

      let todayCount = 0;
      const newWeekData = [
        { day: "M", done: false }, { day: "T", done: false }, { day: "W", done: false },
        { day: "T", done: false }, { day: "F", done: false }, { day: "S", done: false },
        { day: "S", done: false },
      ];

      querySnapshot.forEach((doc) => {
        const date = doc.data().timestamp?.toDate();
        if (!date) return;

        if (date >= startOfDay) todayCount++;

        const d = date.getDay(); 
        const index = d === 0 ? 6 : d - 1; 
        newWeekData[index].done = true;
      });

      setTodaySessions(todayCount);
      setWeek(newWeekData);
      
      const activeDays = newWeekData.filter((d) => d.done).length;
      setActiveDaysCount(activeDays);

    } catch (error) {
      console.error("Error fetching progress data:", error);
    }
  };

  const getWeeklyReflection = (count) => {
    if (count === 0) return "A new week is a fresh start. Take it one step at a time and show up for yourself.";
    if (count <= 2) return "You've taken the first steps. Consistency is built day by day, keep pushing forward.";
    if (count <= 4) return "Great momentum! You are actively rewiring your habits. Keep your focus strong.";
    if (count <= 6) return "Outstanding dedication. Your commitment to change is showing real results this week.";
    return "A perfect week! You are mastering your urges and building lasting, positive change.";
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Animation Variants (Optimized for performance) ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 } // Cascades the animations
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      
      {/* Header Animation */}
      <motion.header 
        initial={{ y: -10, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.4 }}
        className="pt-10 pb-6 flex items-center justify-center shrink-0 max-w-md w-full mx-auto"
      >
        <h1 className="font-bold text-slate-800 text-lg">Your Progress</h1>
      </motion.header>

      {/* Main Content Staggered Animation */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-md space-y-5 pb-32 pt-2"
      >

        {/* Progress Card */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 text-center">
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs mb-3">Your Progress</p>
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className="text-6xl font-black text-slate-800 tracking-tighter"
          >
            {todaySessions}
          </motion.h1>
          <p className="text-slate-500 mt-2 font-medium">
            Sessions Completed Today
          </p>
          <p className="text-slate-400 text-sm mt-1">Keep showing up.</p>
        </motion.div>

        {/* Dynamic Weekly Reflection */}
        <motion.div variants={itemVariants} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">WEEKLY REFLECTION</p>
          <div className="flex items-start gap-3">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`w-1.5 min-h-[40px] rounded-full shrink-0 ${activeDaysCount > 0 ? 'bg-green-500' : 'bg-slate-300'}`}
            />
            <p className="text-slate-700 font-medium leading-snug">
              {getWeeklyReflection(activeDaysCount)}
            </p>
          </div>
        </motion.div>

        {/* This Week */}
        <motion.div variants={itemVariants} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">THIS WEEK</p>
          <div className="flex justify-between px-1">
            {week.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, delay: 0.3 + (i * 0.05) }} // Ripples left to right
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors duration-300 ${
                    d.done ? "bg-green-400 border border-green-500" : "bg-slate-100 border border-slate-200"
                  }`}
                />
                <span className={`text-xs font-bold transition-colors duration-300 ${d.done ? "text-green-600" : "text-slate-400"}`}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>

      <BottomNav />
    </div>
  );
}