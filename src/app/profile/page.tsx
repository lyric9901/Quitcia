// @/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { LogOut, ArrowLeft, Flame, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setUserData({ email: user.email, ...docSnap.data() });
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!userData) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col">
      <button onClick={() => router.push("/dashboard")} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600 mb-8">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-inner">
          <UserIcon className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">{userData.name || "User"}</h1>
        <p className="text-slate-500">{userData.email}</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Progress</h2>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <span className="text-slate-700 font-medium">All-Time Max Streak</span>
          <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
            <Flame className="w-4 h-4 fill-orange-600" />
            <span className="font-bold">{userData.maxStreak || 0} Days</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-700 font-medium">Current Streak</span>
          <span className="font-bold text-slate-800">{userData.currentStreak || 0} Days</span>
        </div>
      </div>

      <button onClick={handleLogout} className="mt-auto w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2">
        <LogOut className="w-5 h-5" /> Sign Out
      </button>
    </main>
  );
}