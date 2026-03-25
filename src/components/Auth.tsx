// @/components/Auth.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Added router
import { auth, googleProvider, db } from "@/lib/firebase";
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user has completed onboarding
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().name) {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/onboarding";
          }
        } catch (error) {
          // If Firestore fails, assume not onboarded
          window.location.href = "/onboarding";
        }
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Fallback redirect
      window.location.href = "/onboarding";
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Fallback redirect
      window.location.href = "/onboarding";
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md p-8 mx-auto bg-white rounded-2xl shadow-lg">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md p-8 mx-auto bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">
        {isLogin ? "Welcome Back" : "Create Account"}
      </h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button 
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold transition-colors mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 24c2.87 0 5.28-.95 7.04-2.58l-3.57-2.77c-.95.64-2.17 1.02-3.47 1.02-2.68 0-4.95-1.81-5.76-4.25H2.52v2.86C4.28 21.82 7.84 24 12 24z" />
          <path fill="#FBBC05" d="M6.24 15.42c-.2-.61-.32-1.26-.32-1.92s.12-1.31.32-1.92V8.72H2.52C1.83 10.09 1.44 11.64 1.44 13.3c0 1.66.39 3.21 1.08 4.58l3.72-2.46z" />
          <path fill="#EA4335" d="M12 5.38c1.56 0 2.96.54 4.07 1.59l3.05-3.05C17.28 2.05 14.87 1 12 1 7.84 1 4.28 3.18 2.52 6.72l3.72 2.86c.81-2.44 3.08-4.2 5.76-4.2z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center w-full mb-6">
        <hr className="flex-1 border-slate-200" />
        <span className="px-3 text-sm text-slate-400">or</span>
        <hr className="flex-1 border-slate-200" />
      </div>

      <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-4">
        <input 
          suppressHydrationWarning
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input 
          suppressHydrationWarning
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button 
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-colors mt-2"
        >
          {isLogin ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button 
          type="button"
          onClick={() => setIsLogin(!isLogin)} 
          className="ml-1 text-blue-500 font-semibold hover:underline"
        >
          {isLogin ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}