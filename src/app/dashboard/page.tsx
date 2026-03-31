// @/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { Wind, User, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { usePostHog } from 'posthog-js/react';

const TASKS = [
  "Drink a full glass of water",
  "Write down 3 things you're grateful for",
  "Do a 5-minute full-body stretch",
  "Read one chapter of a book",
  "Tidy your room for 10 minutes",
  "15-min walk without your phone",
  "Sit in silence for 5 minutes",
  "Send a kind message to a friend",
  "Listen to your favorite song",
  "Do 15 pushups or squats",
  "No social media for 2 hours",
  "Eat a piece of fresh fruit",
  "Journal your thoughts for 5 mins",
  "Splash cold water on your face",
  "Plan 3 goals for tomorrow",
  "Watch an educational video",
  "Practice a hobby for 20 mins",
  "Take 10 deep breaths outside",
  "Give yourself a compliment",
  "Visualize who you are becoming"
];

interface Task { id: number; text: string; completed: boolean; }

// --- UPDATED ORB MODAL ---
const OrbModal = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  
  useEffect(() => {
    // Timer updated to 8 seconds to match one full expand/contract cycle
    const timer = setTimeout(() => {
      router.push("/play-audio");
    }, 8000); 
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-b from-[#E6F4F8] via-[#D9EEF4] to-[#FFFFFF] backdrop-blur-xl"
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 z-50 p-3 bg-black/5 hover:bg-black/10 rounded-full backdrop-blur-md transition-all">
        <X className="w-6 h-6" />
      </button>
      <div className="flex flex-col items-center justify-center w-full h-full relative">
        {/* Changed to an 8-second expand/contract loop */}
        <motion.div 
          animate={{ scale: [1.0, 1.35, 1.0] }} 
          transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }} 
          className="w-64 h-64 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 blur-3xl opacity-40 absolute" 
        />
        <motion.div 
          animate={{ scale: [1.0, 1.35, 1.0] }} 
          transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }} 
          className="w-48 h-48 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-300 shadow-[0_0_80px_rgba(96,165,250,0.5)] z-10" 
        />
        
        <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.5 }} className="text-slate-800 mt-24 text-xl font-medium tracking-wide z-20 text-center px-6">
          Just stay here, forget everything.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<"none" | "breathing" | "orb">("none");
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/"); return; }
      setIsLoading(false);
    });

    const storedDate = localStorage.getItem("taskDate");
    const todayStr = new Date().toDateString();

    if (storedDate !== todayStr) {
      const shuffled = [...TASKS].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3).map((text, idx) => ({ id: idx, text, completed: false }));
      setDailyTasks(selected);
      localStorage.setItem("taskDate", todayStr);
      localStorage.setItem("dailyTasks", JSON.stringify(selected));
    } else {
      const storedTasks = localStorage.getItem("dailyTasks");
      if (storedTasks) setDailyTasks(JSON.parse(storedTasks));
    }
    return () => unsubscribe();
  }, [router]);

  const completeTask = (taskId: number) => {
    setDailyTasks(prev => {
      const isAlreadyCompleted = prev.find(t => t.id === taskId)?.completed;
      if (isAlreadyCompleted) return prev;

      const updated = prev.map(t => t.id === taskId ? { ...t, completed: true } : t);
      localStorage.setItem("dailyTasks", JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkUrge = async () => {
    // PostHog Tracking for Intent
    posthog.capture('Urges Preset Clicked', {
      intent: 'Immediate Relief Required',
      active_tasks_completed: dailyTasks.filter(t => t.completed).length
    });

    if (auth.currentUser) {
      try {
        const urgesRef = collection(db, "users", auth.currentUser.uid, "urges");
        await addDoc(urgesRef, {
          timestamp: new Date(),
          type: "urge_logged"
        });
      } catch (error) {
        console.error("Error logging urge:", error);
      }
    }
    setActiveModal("orb");
  };

  const progressPercent = Math.round((dailyTasks.filter(t => t.completed).length / dailyTasks.length) * 100) || 0;
  const circumference = 2 * Math.PI * 18;

  if (isLoading) return <div className="h-[100dvh] bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <main className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 relative">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col h-full w-full"
      >
        <motion.header variants={itemVariants} className="px-5 pt-10 pb-4 flex items-center justify-between shrink-0 max-w-md w-full mx-auto">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">       </h1>
          <motion.button 
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push("/profile")} 
            className="w-10 h-10 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <User className="w-5 h-5" />
          </motion.button>
        </motion.header>

        <div className="flex-1 px-5 pb-32 flex flex-col gap-5 max-w-md w-full mx-auto overflow-y-auto">
          <motion.div variants={itemVariants} className="shrink-0">
            <motion.button 
              whileTap={{ scale: 0.98 }} 
              onClick={handleMarkUrge} 
              className="w-full py-4 rounded-[1.27rem] text-white font-bold text-lg tracking-wide relative overflow-hidden"
              style={{
                background: "linear-gradient(to right, #F9A12A, #F57C00)",
                boxShadow: "0 0 20px rgba(245, 124, 0, 0.15)"
              }}
            >
              <span 
                className="absolute top-0 left-0 w-full h-1/2 pointer-events-none"
                style={{
                  background: "linear-gradient(to bottom, #FFC56E, transparent)",
                  opacity: 0.4
                }}
              />
              Urges Preset
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-[1.6rem] p-4 shadow-sm border border-slate-100 w-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-lg font-extrabold text-slate-800">Daily Challenges</h2>
              <div className="relative flex items-center justify-center w-12 h-12">
                <svg className="transform -rotate-90 w-12 h-12">
                  <circle cx="24" cy="24" r="18" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                  <motion.circle 
                    cx="24" cy="24" r="18" stroke="#3b82f6" strokeWidth="4" fill="transparent" strokeLinecap="round" 
                    strokeDasharray={circumference} 
                    animate={{ strokeDashoffset: circumference - (progressPercent / 100) * circumference }} 
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-slate-700">{progressPercent}%</span>
              </div>
            </div>
            <div className="space-y-2">
              {dailyTasks.map((task) => (
                <button 
                  key={task.id} 
                  onClick={() => completeTask(task.id)} 
                  disabled={task.completed}
                  className={`w-full flex items-center p-3 rounded-xl border transition-all ${
                    task.completed 
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through cursor-default' 
                      : 'bg-white border-slate-100 hover:border-blue-200 text-slate-700 cursor-pointer'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 text-white' : 'bg-slate-100 border-2 border-slate-200'}`}>
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span className="font-semibold text-sm truncate">{task.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <BottomNav />

      <AnimatePresence>
        {activeModal === "orb" && <OrbModal onClose={() => setActiveModal("none")} />}
      </AnimatePresence>
    </main>
  );
}