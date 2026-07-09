"use client";

// Transient UI state (never persisted): which nav view is active, which modal is
// open, and a lightweight toast. Kept separate from the persisted profile/progress
// store so UI chrome doesn't leak into local storage.

import { create } from "zustand";

export type View =
  | "home"
  | "study"
  | "rooms"
  | "quests"
  | "memory-forest"
  | "streak";

export type Modal =
  | null
  | "focus"
  | "quests"
  | "rooms"
  | "memory-forest"
  | "memory-forest-premium"
  | "streak"
  | "profile"
  | "shop";

interface UIState {
  view: View;
  modal: Modal;
  toast: string | null;
  setView: (v: View) => void;
  openModal: (m: Modal) => void;
  closeModal: () => void;
  showToast: (t: string) => void;
  clearToast: () => void;
}

export const useUI = create<UIState>((set) => ({
  view: "home",
  modal: null,
  toast: null,
  setView: (view) => set({ view }),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}));
