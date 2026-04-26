"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface FeedbackScreenProps {
  onClose: () => void;
}

export default function FeedbackScreen({ onClose }: FeedbackScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-slate-50 px-6"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-black/5 hover:bg-black/10 rounded-full text-slate-500 hover:text-slate-800 transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-xs w-full"
      >
        <h2 className="text-3xl font-black text-slate-800 mb-4 leading-tight">
          Thanks for being<br />with us
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-10">
          Please take a short time to share your feedbacks, like where the audio failed, helped and anything you want to share with us. This helps us improve our services.
        </p>

        <motion.a
          whileTap={{ scale: 0.97 }}
          href="https://urgerelieffeedback.carrd.co/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-base hover:bg-slate-900 transition-colors block"
        >
          Share feedback
        </motion.a>
      </motion.div>
    </motion.div>
  );
}
