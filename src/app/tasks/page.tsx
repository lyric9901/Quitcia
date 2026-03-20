// @/app/tasks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Our list of 20+ grounding, productive, and positive tasks
const TASKS = [
  "Drink a full glass of water right now.",
  "Write down 3 things you are grateful for today.",
  "Do a 5-minute full-body stretch.",
  "Read one chapter of a book or an educational article.",
  "Tidy up your room or workspace for exactly 10 minutes.",
  "Go for a 15-minute walk outside without looking at your phone.",
  "Sit in silence and meditate for 5 minutes.",
  "Send a kind, unexpected message to a friend or family member.",
  "Listen to your favorite song with your eyes closed.",
  "Do 15 pushups, squats, or sit-ups.",
  "Disconnect from all social media for the next 2 hours.",
  "Eat a piece of fresh fruit or try a healthy snack.",
  "Journal your raw thoughts for 5 continuous minutes.",
  "Splash cold water on your face to reset your nervous system.",
  "Unsubscribe from 5 promotional emails cluttering your inbox.",
  "Plan your top 3 non-negotiable goals for tomorrow.",
  "Watch a short, inspiring TED Talk or educational video.",
  "Learn how to say 'Hello' and 'Thank you' in a new language.",
  "Practice a hobby you love for at least 20 minutes.",
  "Step outside and take 10 deep breaths of fresh air.",
  "Give yourself a genuine compliment in the mirror.",
  "Close your eyes and visualize the person you are working hard to become."
];

export default function TasksPage() {
  const router = useRouter();
  const [currentTask, setCurrentTask] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Pick a random task when the page loads
  useEffect(() => {
    generateRandomTask();
  }, []);

  const generateRandomTask = () => {
    setIsCompleted(false);
    const randomIndex = Math.floor(Math.random() * TASKS.length);
    setCurrentTask(TASKS[randomIndex]);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={() => router.push("/dashboard")} 
          className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Your Daily Task</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Task Card */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <motion.div 
          key={currentTask} // Animates every time the task changes
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className={`w-8 h-8 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-6 leading-tight">
            {currentTask}
          </h2>

          {!isCompleted ? (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsCompleted(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-200"
              >
                I Did It
              </button>
              <button 
                onClick={generateRandomTask}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Pick Another
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4"
            >
              <p className="text-green-600 font-bold text-lg mb-4">Awesome job!</p>
              <button 
                onClick={() => router.push("/dashboard")}
                className="text-slate-500 font-medium hover:text-slate-800 underline"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}