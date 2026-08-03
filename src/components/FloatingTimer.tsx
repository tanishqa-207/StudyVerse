"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { useTimer } from "@/lib/timerStore";
import { useUI } from "@/lib/uiStore";
import { useStore } from "@/lib/store";

export default function FloatingTimer() {
  const targetEndTime = useTimer((s) => s.targetEndTime);
  const originalDurationMins = useTimer((s) => s.originalDurationMins);
  const stopTimer = useTimer((s) => s.stopTimer);
  const modal = useUI((s) => s.modal);
  const openModal = useUI((s) => s.openModal);
  const completeFocusSession = useStore((s) => s.completeFocusSession);
  const showToast = useUI((s) => s.showToast);

  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!targetEndTime) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
      setLeft(remaining);
      // We only process completion here if the main FocusSessionModal is NOT open.
      // If it is open, FocusSessionModal's own useEffect will handle it.
      if (remaining === 0 && originalDurationMins && modal !== "focus") {
        stopTimer();
        completeFocusSession(originalDurationMins);
        showToast(`Focus complete · +${originalDurationMins * 10} XP · +${originalDurationMins * 4} coins`);
      }
    };
    tick(); // run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetEndTime, originalDurationMins, modal, stopTimer, completeFocusSession, showToast]);

  // Only show if timer is running AND full modal is closed
  if (!targetEndTime || modal === "focus") return null;

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-6 right-6 z-[100] cursor-grab active:cursor-grabbing"
    >
      <div 
        className="glass-strong flex items-center gap-3 rounded-full px-5 py-2.5 hover:brightness-110 transition shadow-2xl"
        onClick={() => openModal("focus")}
      >
        <div className="relative grid h-7 w-7 place-items-center">
           <motion.div 
             className="absolute inset-0 rounded-full border-2 border-[var(--violet-bright)] border-t-transparent"
             animate={{ rotate: 360 }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           />
           <Icon name="clock" size={13} className="text-[var(--violet-bright)]" />
        </div>
        <div className="font-mono text-[17px] font-bold text-white tabular-nums">
          {mm}:{ss}
        </div>
      </div>
    </motion.div>
  );
}
