// @/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { 
  LogOut, Headphones, UserCircle, Settings, 
  AlertTriangle, X, AlertCircle, CheckCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("User");
  const [audioCount, setAudioCount] = useState<number>(0);
  const [memberSince, setMemberSince] = useState<string>("");

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return; }
      
      if (user.metadata.creationTime) {
        const creationDate = new Date(user.metadata.creationTime);
        const formattedDate = creationDate.toLocaleDateString("en-US", { 
          month: "short", 
          year: "numeric" 
        });
        setMemberSince(`Member since ${formattedDate}`);
      }

      await fetchUserData(user.uid);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserName(userSnap.data().name || "User");
      }

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
      toast.error("Failed to sign out", {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const user = auth.currentUser;
      if (!user) return;

      // 1. Delete user data from Firestore DB
      await deleteDoc(doc(db, "users", user.uid));

      // 2. Delete user auth record
      await deleteUser(user);

      // 3. Explicitly sign out to clear any lingering local state
      await signOut(auth);

      toast.success("Account deleted successfully", {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });

      // 4. Redirect to login/onboarding
      router.push("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      
      // Firebase requires recent authentication for sensitive actions like deletion
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Please sign out and sign back in to verify your identity before deleting.", {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          duration: 5000,
        });
      } else {
        toast.error("An error occurred while deleting your account. Please try again.", {
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />
        });
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) return <div className="h-[100dvh] bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <main className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 relative px-6">
      <motion.header initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pt-10 pb-6 flex items-center justify-center shrink-0 max-w-md w-full mx-auto relative">
        <h1 className="font-bold text-slate-800 text-lg">My Profile</h1>
        <button 
          onClick={() => setShowSettings(true)}
          className="absolute right-0 text-slate-400 hover:text-slate-600 transition-colors p-2"
        >
          <Settings className="w-6 h-6" />
        </button>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 max-w-md w-full mx-auto overflow-y-auto pb-32 mt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* User Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
            <UserCircle className="w-12 h-12" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{userName}</h2>
          <p className="text-slate-500 text-sm font-medium mb-3">{auth.currentUser?.email}</p>
          
          {memberSince && (
            <div className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full mt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {memberSince}
              </span>
            </div>
          )}
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

      {/* Settings Modal Overlay */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 flex flex-col justify-end sm:justify-center sm:items-center px-4 pb-4 sm:pb-0 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <button 
                onClick={() => { 
                  setShowSettings(false); 
                  setShowDeleteConfirm(true); 
                }}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                Delete Account
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Are you sure?</h2>
              <p className="text-slate-500 text-sm mb-8 px-2 leading-relaxed">
                This action is permanent and cannot be undone. All your progress, audio data, and account details will be wiped.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors"
                  disabled={isDeleting}
                >
                  No, Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
