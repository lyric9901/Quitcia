"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X } from "lucide-react";
import { getOfflineAudioUrl } from "@/lib/offlineAudio";
import { usePostHog } from 'posthog-js/react';

const AUDIO_TRACKS = [
  "/audio/track1.mp3",
  "/audio/track2.mp3",
  "/audio/track3.mp3"
];

export default function PlayAudioPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTime, setShowTime] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [hasLoggedSession, setHasLoggedSession] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let objectUrl = ""; 

    const loadAudio = async () => {
      const randomTrack = AUDIO_TRACKS[Math.floor(Math.random() * AUDIO_TRACKS.length)];
      objectUrl = await getOfflineAudioUrl(randomTrack);
      setAudioSrc(objectUrl);
    };

    loadAudio();

    return () => {
      if (objectUrl && objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = async () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      if (audioRef.current.duration > 0) setProgress((current / audioRef.current.duration) * 100);
      setCurrentTimeStr(`${Math.floor(current / 60)}:${Math.floor(current % 60).toString().padStart(2, '0')}`);

      if (current >= 14 && !hasLoggedSession && auth.currentUser) {
        setHasLoggedSession(true);
        try {
          await addDoc(collection(db, "users", auth.currentUser.uid, "swm_sessions"), {
            timestamp: serverTimestamp(),
            type: "SWM_start"
          });
        } catch (error) { console.error("Logging error", error); }
      }
    }
  };

  const handleExitAudio = () => {
    if (audioRef.current) {
      posthog.capture('audio_quit_early', {
        time_listened_seconds: Math.floor(audioRef.current.currentTime),
        total_duration_seconds: Math.floor(audioRef.current.duration || 0),
        percentage_completed: Math.floor(progress),
        track_url: audioSrc
      });
    }
    router.push("/dashboard");
  };

  const handleAudioEnded = () => {
    posthog.capture('audio_completed', {
      track_url: audioSrc
    });
    router.push("/dashboard");
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  return (
    <main className="flex flex-col items-center justify-center h-[100dvh] bg-gradient-to-b from-[#E6F4F8] via-[#D9EEF4] to-[#FFFFFF] overflow-hidden relative selection:bg-transparent">
      <button onClick={handleExitAudio} className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 z-50 p-3 bg-black/5 hover:bg-black/10 rounded-full backdrop-blur-md transition-all">
        <X className="w-6 h-6" />
      </button>

      {audioSrc && <audio ref={audioRef} src={audioSrc} onTimeUpdate={handleTimeUpdate} onEnded={handleAudioEnded} />}

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center w-full h-full relative z-20">
        <div className="relative flex items-center justify-center mb-12">
          <div className="absolute inset-0 z-30 rounded-full cursor-pointer" onClick={() => { setShowTime(true); setTimeout(() => setShowTime(false), 2500); }} />
          
          <svg className="transform -rotate-90 w-[280px] h-[280px]">
            <circle cx="140" cy="140" r={radius} stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
            <motion.circle cx="140" cy="140" r={radius} stroke={hasLoggedSession ? "#10b981" : "#3b82f6"} strokeWidth="8" fill="transparent" strokeLinecap="round" animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }} style={{ strokeDasharray: circumference }} transition={{ ease: "linear", duration: 0.2 }} />
          </svg>
          
          <div className="absolute z-40 flex flex-col items-center justify-center">
            <button onClick={togglePlay} className="w-20 h-20 bg-white/60 hover:bg-white/90 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-slate-800 border border-slate-200 transition-all">
              {isPlaying ? <Pause className="w-8 h-8 fill-slate-800 text-slate-800" /> : <Play className="w-8 h-8 fill-slate-800 text-slate-800 ml-1" />}
            </button>
            <AnimatePresence>
              {showTime && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} 
                  className="absolute -bottom-12 text-slate-700 font-bold font-mono text-sm tracking-widest bg-white/80 shadow-sm px-3 py-1 rounded-full"
                >
                  {currentTimeStr}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <p className={`text-sm tracking-widest uppercase mb-4 transition-colors duration-500 ${hasLoggedSession ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium'}`}>
          {hasLoggedSession ? "Session Recorded" : "Focus Mode Active"}
        </p>
      </motion.div>
    </main>
  );
}