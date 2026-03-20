// @/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Wind, User, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TASKS DATABASE ---
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

// --- BREATHING MODAL COMPONENT ---
const BreathingModal = ({ onClose }: { onClose: () => void }) => {
  const [phase, setPhase] = useState<"Breathe In" | "Breathe Out">("Breathe In");

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev === "Breathe In" ? "Breathe Out" : "Breathe In"));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 relative flex flex-col items-center justify-center min-h-[350px] shadow-2xl overflow-hidden border border-slate-700"
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white z-10 p-2 bg-slate-800 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="relative flex items-center justify-center w-56 h-56 mt-4">
          <motion.div
            className="absolute bg-blue-500 rounded-full blur-xl"
            animate={{ 
              scale: phase === "Breathe In" ? 1.4 : 0.8,
              opacity: phase === "Breathe In" ? 0.3 : 0.1,
              backgroundColor: phase === "Breathe In" ? "#3b82f6" : "#6366f1" 
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            style={{ width: "100%", height: "100%", willChange: "transform, opacity" }}
          />
          <motion.div
            className="absolute bg-blue-500 rounded-full shadow-2xl flex items-center justify-center"
            animate={{ scale: phase === "Breathe In" ? 1.1 : 0.85 }}
            transition={{ duration: 4, ease: "easeInOut" }}
            style={{ width: "70%", height: "70%", willChange: "transform" }}
          >
            <motion.h2 
              key={phase}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.5 }}
              className="text-white font-bold tracking-widest text-center absolute"
            >
              {phase}
            </motion.h2>
          </motion.div>
        </div>
        <p className="mt-8 text-slate-400 text-xs tracking-widest uppercase">Focus on the circle</p>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN DASHBOARD PAGE ---
export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // App State
  const [activeModal, setActiveModal] = useState<"none" | "breathing">("none");
  const [isUrgeMarked, setIsUrgeMarked] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);

  useEffect(() => {
    // 1. Authenticate & Streak Check
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }
      await calculateStreakInBackground(currentUser.uid);
      setIsLoading(false);
    });

    // 2. Generate or Load Daily Tasks (Locks to the exact day)
    const storedDate = localStorage.getItem("taskDate");
    const todayStr = new Date().toDateString();
    
    if (storedDate !== todayStr) {
      // It's a new day! Generate 4 random tasks and save them
      const shuffled = [...TASKS].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4).map((text, idx) => ({
        id: idx, text, completed: false
      }));
      setDailyTasks(selected);
      localStorage.setItem("taskDate", todayStr);
      localStorage.setItem("dailyTasks", JSON.stringify(selected));
    } else {
      // Same day, load existing progress
      const storedTasks = localStorage.getItem("dailyTasks");
      if (storedTasks) {
        setDailyTasks(JSON.parse(storedTasks));
      }
    }

    return () => unsubscribe();
  }, [router]);

  const toggleTask = (taskId: number) => {
    setDailyTasks(prev => {
      const updated = prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      localStorage.setItem("dailyTasks", JSON.stringify(updated)); // Save progress
      return updated;
    });
  };

  const calculateStreakInBackground = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    const today = new Date().setHours(0, 0, 0, 0); 

    if (docSnap.exists()) {
      const data = docSnap.data();
      const lastLogin = data.lastLogin;
      let currentStreak = data.currentStreak || 0;
      let newMaxStreak = data.maxStreak || 0;
      const diffDays = Math.round((today - lastLogin) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) currentStreak += 1;
      else if (diffDays > 1) currentStreak = 1;
      if (currentStreak > newMaxStreak) newMaxStreak = currentStreak;

      if (diffDays > 0) {
        await setDoc(userRef, { currentStreak, maxStreak: newMaxStreak, lastLogin: today }, { merge: true });
      }
    } else {
      await setDoc(userRef, { currentStreak: 1, maxStreak: 1, lastLogin: today }, { merge: true });
    }
  };

  const handleMarkUrge = () => {
    setIsUrgeMarked(true);
    setTimeout(() => { setIsUrgeMarked(false); }, 2500);
  };

  // --- UI Math for Tiny Progress Ring ---
  const completedCount = dailyTasks.filter(t => t.completed).length;
  const progressPercent = dailyTasks.length > 0 ? Math.round((completedCount / dailyTasks.length) * 100) : 0;
  const radius = 18; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (isLoading) return <div className="h-[100dvh] bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    // h-[100dvh] and overflow-hidden locks the screen so it never scrolls
    <main className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 relative">
      
      {/* Header */}
      <motion.header 
        initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="px-5 pt-10 pb-4 flex items-center justify-end shrink-0"
      >
        <button onClick={() => router.push("/profile")} className="w-10 h-10 bg-white border border-slate-200 shadow-sm hover:bg-slate-100 transition-colors rounded-full flex items-center justify-center text-slate-500">
          <User className="w-5 h-5" />
        </button>
      </motion.header>

      <div className="flex-1 px-5 pb-6 flex flex-col gap-5 max-w-md w-full mx-auto">
        
        {/* The Urge Logger Button */}
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="shrink-0">
          <motion.button 
            whileTap={{ scale: 0.98 }} onClick={handleMarkUrge} disabled={isUrgeMarked}
            className={`w-full py-4 rounded-[1.25rem] shadow flex items-center justify-center transition-all duration-300 ${
              isUrgeMarked ? "bg-green-500 shadow-green-200 text-white" : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-200/40 hover:from-blue-600 text-white"
            }`}
          >
            <span className="font-bold text-lg tracking-wide">{isUrgeMarked ? "Logged successfully" : "Urges Present"}</span>
          </motion.button>
        </motion.div>

        {/* Ultra-Compact Daily Tasks Card */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 w-full flex-1 flex flex-col min-h-0">
          
          {/* Title & Tiny Ring */}
          <div className="flex justify-between items-center mb-4 shrink-0 px-1">
            <h2 className="text-lg font-extrabold text-slate-800">Daily Tasks</h2>
            <div className="relative flex items-center justify-center w-12 h-12">
              <svg className="transform -rotate-90 w-12 h-12">
                <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                <motion.circle 
                  cx="24" cy="24" r={radius} 
                  stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" className="text-blue-500"
                  initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }}
                  style={{ strokeDasharray: circumference }} transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-700">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Tasks List (Tightly packed) */}
          <div className="space-y-2 overflow-y-auto pr-1">
            {dailyTasks.map((task) => (
              <motion.button 
                key={task.id} whileTap={{ scale: 0.98 }} onClick={() => toggleTask(task.id)}
                className={`w-full flex items-center p-3 rounded-xl border transition-all duration-200 text-left min-h-[48px] ${
                  task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 transition-colors shrink-0 ${
                  task.completed ? 'bg-green-500 text-white' : 'bg-slate-100 border-2 border-slate-200 text-transparent'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
                <span className={`flex-1 font-semibold text-sm leading-snug truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {task.text}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Grounding Toolkit (Slimmed down) */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-full shrink-0 mt-auto">
          <motion.button 
            whileTap={{ scale: 0.98 }} onClick={() => setActiveModal("breathing")} 
            className="w-full bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <Wind className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-slate-800 text-sm">Breathing Exercise</span>
                <span className="text-xs text-slate-500 font-medium">Reset your nervous system</span>
              </div>
            </div>
          </motion.button>
        </motion.div>

      </div>

      <AnimatePresence>
        {activeModal === "breathing" && <BreathingModal onClose={() => setActiveModal("none")} />}
      </AnimatePresence>

    </main>
  );
}