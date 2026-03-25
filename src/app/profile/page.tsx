// @/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { LogOut, Headphones, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("User");
  const [audioCount, setAudioCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return; }
      await fetchUserData(user.uid);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async (uid: string) => {
    try {
      // 1. Fetch User Name
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserName(userSnap.data().name || "User");
      }

      // 2. Fetch All-Time Audio Sessions Played
      const swmRef = collection(db, "users", uid, "swm_sessions");
      const swmSnap = await getDocs(swmRef);
      setAudioCount(swmSnap.size);
    } catch (e) { 
      console.error("Error fetching user data", e); 
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  if (isLoading) return <div className="h-[100dvh] bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <main className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 relative px-6">
      <motion.header initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pt-10 pb-6 flex items-center justify-center shrink-0 max-w-md w-full mx-auto">
        <h1 className="font-bold text-slate-800 text-lg">My Profile</h1>
      </motion.header>

      <div className="flex-1 flex flex-col gap-6 max-w-md w-full mx-auto overflow-y-auto pb-32 mt-4">
        
        {/* User Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
            <UserCircle className="w-12 h-12" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{userName}</h2>
          <p className="text-slate-500 text-sm font-medium">{auth.currentUser?.email}</p>
        </motion.div>

        {/* Audio Stats Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Audio Sessions</span>
            <p className="text-slate-800 font-black text-2xl leading-none">{audioCount} <span className="text-base font-semibold text-slate-500 tracking-normal">Played All-Time</span></p>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8">
          <button 
            onClick={handleSignOut}
            className="w-full bg-white border border-red-100 hover:bg-red-50 text-red-500 font-bold py-4 rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </motion.div>

      </div>

      <BottomNav />
    </main>
  );
}