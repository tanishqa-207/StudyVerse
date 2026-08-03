"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimerState {
  targetEndTime: number | null;
  originalDurationMins: number | null;
  startTimer: (mins: number) => void;
  stopTimer: () => void;
  clearTimer: () => void;
}

export const useTimer = create<TimerState>()(
  persist(
    (set) => ({
      targetEndTime: null,
      originalDurationMins: null,
      startTimer: (mins: number) => set({
        targetEndTime: Date.now() + mins * 60000,
        originalDurationMins: mins,
      }),
      stopTimer: () => set({ targetEndTime: null, originalDurationMins: null }),
      clearTimer: () => set({ targetEndTime: null, originalDurationMins: null }),
    }),
    {
      name: "studyverse-timer",
    }
  )
);
