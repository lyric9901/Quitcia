// @/app/play-audio/page.tsx
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
  "/audio/track3.mp3",
  "/audio/track4.mp3"
];

// Phase 1 (0 to 45 seconds)
const PHASE_1_TEXTS = [
  "Pause for a moment. Just listen.",
  "Stay here with me for a minute.",
  "Nothing needs to happen right now.",
  "Let this moment slow down.",
  "Take one steady breath and stay here.",
  "You're safe to pause for a moment.",
  "Just press play and stay present.",
  "Let the urge sit without reacting.",
  "Give yourself this small pause.",
  "Stay here. The intensity will pass."
];

// Phase 2 (45 to 95 seconds [1:35])
const PHASE_2_TEXTS = [
  "You're doing well. Keep staying here.",
  "The urge is already changing.",
  "Just keep breathing and listening.",
  "Notice how the intensity shifts.",
  "Stay steady for a few more breaths.",
  "You're riding out the wave.",
  "Each moment you wait weakens it.",
  "Let your mind settle naturally.",
  "You're handling this moment.",
  "Stay with the calm you're building."
];

// Phase 3 (1:35 [95 seconds] onwards)
const PHASE_3_TEXTS = [
  "You're almost through the wave.",
  "The moment is passing now.",
  "Take one more calm breath.",
  "You stayed through the hardest part.",
  "Notice how the urge has softened.",
  "This pause helped you regain control.",
  "Stay calm for a few more seconds.",
  "You're finishing strong.",
  "The intensity has passed.",
  "Take this calm with you."
];

export default function PlayAudioPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [trackName, setTrackName] = useState<string>("Unknown Track");
  const [currentTrackPath, setCurrentTrackPath] = useState<string>("");
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [displayText, setDisplayText] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<number>(1); 
  
  const [logged26s, setLogged26s] = useState(false);
  const [logged30s, setLogged30s] = useState(false);
  const [logged60s, setLogged60s] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let objectUrl = ""; 

    const loadAudio = async () => {
      let cycle: string[] = [];
      let index = 0;

      try {
        const storedCycle = localStorage.getItem("audioCycle");
        const storedIndex = localStorage.getItem("cycleIndex");
        if (storedCycle) cycle = JSON.parse(storedCycle);
        if (storedIndex) index = parseInt(storedIndex, 10);
      } catch (e) {
        console.error("Storage error", e);
      }

      if (!Array.isArray(cycle) || cycle.length !== AUDIO_TRACKS.length || index >= cycle.length || isNaN(index)) {
        cycle = [...AUDIO_TRACKS];
        
        for (let i = cycle.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cycle[i], cycle[j]] = [cycle[j], cycle[i]];
        }

        const lastPlayed = localStorage.getItem("lastPlayedTrack");
        if (cycle[0] === lastPlayed && cycle.length > 1) {
          [cycle[0], cycle[1]] = [cycle[1], cycle[0]];
        }

        index = 0;
        localStorage.setItem("audioCycle", JSON.stringify(cycle));
        localStorage.setItem("cycleIndex", "0");
      }

      const selectedTrack = cycle[index];
      setCurrentTrackPath(selectedTrack);
      
      const cleanName = selectedTrack.replace('/audio/', '').replace('.mp3', '').replace('track', 'Track ');
      setTrackName(cleanName);

      objectUrl = await getOfflineAudioUrl(selectedTrack);
      setAudioSrc(objectUrl);

      setDisplayText(PHASE_1_TEXTS[Math.floor(Math.random() * PHASE_1_TEXTS.length)]);
      setCurrentPhase(1);
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
      if (isPlaying) {
        audioRef.current.pause();
        posthog.capture('Audio Paused', { 'Track Name': trackName });
      } else {
        audioRef.current.play();
        
        if (!hasStartedPlaying) {
          setHasStartedPlaying(true);
          posthog.capture('Audio Therapy Started', { 'Track Name': trackName });
          
          try {
            let index = parseInt(localStorage.getItem("cycleIndex") || "0", 10);
            localStorage.setItem("lastPlayedTrack", currentTrackPath); 
            localStorage.setItem("cycleIndex", (index + 1).toString()); 
          } catch (e) {
            console.error("Error advancing cycle", e);
          }
        } else {
          posthog.capture('Audio Resumed', { 'Track Name': trackName });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = async () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      if (audioRef.current.duration > 0) setProgress((current / audioRef.current.duration) * 100);
      setCurrentTimeStr(`${Math.floor(current / 60)}:${Math.floor(current % 60).toString().padStart(2, '0')}`);

      if (current < 45 && currentPhase !== 1) {
        setCurrentPhase(1);
        setDisplayText(PHASE_1_TEXTS[Math.floor(Math.random() * PHASE_1_TEXTS.length)]);
      } else if (current >= 45 && current < 95 && currentPhase !== 2) {
        setCurrentPhase(2);
        setDisplayText(PHASE_2_TEXTS[Math.floor(Math.random() * PHASE_2_TEXTS.length)]);
      } else if (current >= 95 && currentPhase !== 3) {
        setCurrentPhase(3);
        setDisplayText(PHASE_3_TEXTS[Math.floor(Math.random() * PHASE_3_TEXTS.length)]);
      }

      if (current >= 26 && !logged26s) {
        setLogged26s(true);
        localStorage.setItem("lastAudioCompletionTime", Date.now().toString());
      }

      if (current >= 30 && !logged30s && auth.currentUser) {
        setLogged30s(true);
        posthog.capture('All-Time Milestone Reached (30s)', { 'Track Name': trackName });
        try {
          await addDoc(collection(db, "users", auth.currentUser.uid, "swm_sessions"), {
            timestamp: serverTimestamp(), type: "SWM_milestone_30s"
          });
        } catch (error) { console.error("Logging error", error); }
      }

      if (current >= 60 && !logged60s && auth.currentUser) {
        setLogged60s(true);
        posthog.capture('Daily Progress Milestone Reached (60s)', { 'Track Name': trackName });
        try {
          await addDoc(collection(db, "users", auth.currentUser.uid, "swm_sessions"), {
            timestamp: serverTimestamp(), type: "SWM_milestone_60s"
          });
        } catch (error) { console.error("Logging error", error); }
      }
    }
  };

  const handleExitAudio = async () => {
    if (audioRef.current) {
      const timeListened = Math.floor(audioRef.current.currentTime);
      const minutes = Math.floor(timeListened / 60);
      const seconds = timeListened % 60;

      posthog.capture('Audio Session Quit Early', {
        'Track Name': trackName,
        'Time Listened (Seconds)': timeListened,
        'Time Listened (Readable)': `${minutes}m ${seconds}s`,
        'Completion Percentage (%)': Math.floor(progress),
        'Hit 30s Milestone': timeListened >= 30 ? "Yes" : "No",
        'Hit 60s Milestone': timeListened >= 60 ? "Yes" : "No"
      });

      // Log drop-off for Admin Dashboard
      try {
        await addDoc(collection(db, "audio_sessions"), {
          status: "dropped",
          timeListened: timeListened,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Error logging drop-off", error);
      }
    }
    router.push("/dashboard");
  };

  const handleAudioEnded = async () => {
    posthog.capture('Audio Session Fully Completed', {
      'Track Name': trackName,
      'Counted As Successful Session': "Yes"
    });

    // Log completion for Admin Dashboard
    if (audioRef.current) {
      try {
        await addDoc(collection(db, "audio_sessions"), {
          status: "completed",
          timeListened: Math.floor(audioRef.current.duration || 0),
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Error logging completion", error);
      }
    }

    router.push("/dashboard");
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  // Breathing rhythms (Seconds per full breath cycle)
  // 4s = Anxious/Starting, 6s = Settling, 9s = Deep calm
  const breathingSpeed = currentPhase === 1 ? 4 : currentPhase === 2 ? 6 : 9;

  return (
    <main suppressHydrationWarning className="flex flex-col items-center justify-center h-[100dvh] bg-[#5e83c2] overflow-hidden relative selection:bg-transparent">
      
      {/* High-Performance Breathing Layer */}
      <motion.div 
        initial={false}
        animate={{
          scale: [1, 1.4, 1.4, 1], // Increased scale significantly for better visibility
          opacity: [0.15, 0.9, 0.9, 0.15], // Widened opacity bounds for higher contrast
        }}
        transition={{
          duration: breathingSpeed,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.4, 0.5, 1] 
        }}
        className="absolute inset-0 z-0 pointer-events-none w-full h-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, #a6c3f5 45%, transparent 80%)',
          willChange: 'transform, opacity' // Forces hardware acceleration on mobile
        }}
      />

      <button onClick={handleExitAudio} className="absolute top-6 right-6 text-white/80 hover:text-white z-50 p-3 bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-md transition-all">
        <X className="w-6 h-6" />
      </button>

      {audioSrc && <audio ref={audioRef} src={audioSrc} onTimeUpdate={handleTimeUpdate} onEnded={handleAudioEnded} />}

      <motion.div initial={false} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center w-full h-full relative z-20">
        
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 z-30 rounded-full pointer-events-none" />
          
          <svg className="transform -rotate-90 w-[280px] h-[280px]">
            <circle cx="140" cy="140" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="transparent" />
            <motion.circle 
              initial={false}
              cx="140" 
              cy="140" 
              r={radius} 
              stroke="#ffffff" // Removed isVisuallyRecorded green condition
              strokeWidth="8" 
              fill="transparent" 
              strokeLinecap="round" 
              animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }} 
              style={{ strokeDasharray: circumference }} 
              transition={{ ease: "linear", duration: 0.2 }} 
            />
          </svg>
          
          <div className="absolute z-40 flex flex-col items-center justify-center">
            <button onClick={togglePlay} className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center border border-white/30 transition-all">
              {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white ml-1" />}
            </button>
            {/* Always visible timeline text */}
            <span className="absolute -bottom-12 text-slate-800 font-bold font-mono text-sm tracking-widest bg-white/90 backdrop-blur-sm shadow-lg px-3 py-1 rounded-full">
              {currentTimeStr}
            </span>
          </div>
        </div>
        
        <div className="h-16 flex items-center justify-center mt-10 px-8 text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={displayText}
              initial={{ opacity: 0, y: 5, backgroundPosition: "200% center" }}
              animate={{ opacity: 1, y: 0, backgroundPosition: "-200% center" }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ 
                opacity: { duration: 0.6, ease: "easeOut" },
                y: { duration: 0.6, ease: "easeOut" },
                backgroundPosition: { repeat: Infinity, duration: 3.5, ease: "linear" }
              }}
              className="text-lg font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
              style={{
                backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.6) 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              {displayText}
            </motion.p>
          </AnimatePresence>
        </div>

      </motion.div>
    </main>
  );
}