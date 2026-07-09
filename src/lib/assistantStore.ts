"use client";

// State for the floating AI assistant. The conversation is kept in memory for
// the whole session (survives closing/reopening the panel) and is cleared on
// reload. Talks to the /api/assistant route which calls Claude.

import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantState {
  open: boolean;
  loading: boolean;
  messages: ChatMessage[];
  error: string | null;
  openPanel: () => void;
  closePanel: () => void;
  toggle: () => void;
  reset: () => void;
  send: (text: string) => Promise<void>;
}

export const useAssistant = create<AssistantState>((set, get) => ({
  open: false,
  loading: false,
  messages: [],
  error: null,

  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
  reset: () => set({ messages: [], error: null }),

  send: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().loading) return;

    const history = [...get().messages, { role: "user" as const, content: trimmed }];
    set({ open: true, messages: history, loading: true, error: null });

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        set({
          loading: false,
          error: data.error || "Something went wrong. Please try again.",
        });
        return;
      }
      set((s) => ({
        loading: false,
        messages: [...s.messages, { role: "assistant", content: data.text }],
      }));
    } catch {
      set({ loading: false, error: "Network error. Please try again." });
    }
  },
}));
