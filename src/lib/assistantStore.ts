"use client";

// State for the floating AI assistant. The conversation is kept in memory for
// the whole session (survives closing/reopening the panel) and is cleared on
// reload. Talks to the /api/assistant route which streams tokens back from
// Claude as Server-Sent Events; we append them to the last assistant message as
// they arrive, so the answer types out for real (no simulated typewriter).

import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantState {
  open: boolean;
  loading: boolean; // request sent, waiting for the first token (typing indicator)
  streaming: boolean; // tokens are actively arriving
  messages: ChatMessage[];
  error: string | null;
  openPanel: () => void;
  closePanel: () => void;
  toggle: () => void;
  reset: () => void;
  send: (text: string) => Promise<void>;
  retry: () => void; // re-send the last user turn after an error
}

// Abort controller for the in-flight request, so a new send / reset / close can
// cancel a stream cleanly.
let controller: AbortController | null = null;

export const useAssistant = create<AssistantState>((set, get) => {
  const abort = () => {
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  // Core streaming turn: `history` already includes the user's new message.
  const run = async (history: ChatMessage[]) => {
    abort();
    controller = new AbortController();
    const signal = controller.signal;

    set({ open: true, messages: history, loading: true, streaming: false, error: null });

    let res: Response;
    try {
      res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal,
      });
    } catch {
      if (signal.aborted) return;
      set({ loading: false, error: "Network error. Please check your connection and try again." });
      return;
    }

    if (!res.ok || !res.body) {
      // Non-streaming error path (e.g. 400 validation from the route).
      let msg = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {
        /* keep default */
      }
      set({ loading: false, error: msg });
      return;
    }

    // Read the SSE stream and append deltas to a fresh assistant message.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantOpen = false;
    let acc = "";
    let sawError: string | null = null;

    const openAssistant = () => {
      if (assistantOpen) return;
      assistantOpen = true;
      set((s) => ({
        loading: false,
        streaming: true,
        messages: [...s.messages, { role: "assistant", content: "" }],
      }));
    };

    const pushDelta = (text: string) => {
      openAssistant();
      acc += text;
      set((s) => {
        const msgs = s.messages.slice();
        msgs[msgs.length - 1] = { role: "assistant", content: acc };
        return { messages: msgs };
      });
    };

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json) continue;
            let evt: { type?: string; text?: string; error?: string };
            try {
              evt = JSON.parse(json);
            } catch {
              continue;
            }
            if (evt.type === "delta" && evt.text) pushDelta(evt.text);
            else if (evt.type === "error") sawError = evt.error || "The coach hit an error.";
          }
        }
      }
    } catch {
      if (signal.aborted) return;
      // Stream dropped mid-flight.
      if (!acc) sawError = "The connection dropped. Please try again.";
    } finally {
      if (controller?.signal === signal) controller = null;
    }

    if (signal.aborted) return;

    // If the server sent an error and we have no partial content, surface it and
    // drop the empty assistant bubble.
    if (sawError && !acc) {
      set((s) => {
        const msgs = s.messages.slice();
        if (assistantOpen && msgs.length && msgs[msgs.length - 1].role === "assistant") {
          msgs.pop();
        }
        return { messages: msgs, loading: false, streaming: false, error: sawError };
      });
      return;
    }

    set({ loading: false, streaming: false, error: sawError ? null : get().error });
  };

  return {
    open: false,
    loading: false,
    streaming: false,
    messages: [],
    error: null,

    openPanel: () => set({ open: true }),
    closePanel: () => set({ open: false }),
    toggle: () => set((s) => ({ open: !s.open })),
    reset: () => {
      abort();
      set({ messages: [], error: null, loading: false, streaming: false });
    },

    send: async (text) => {
      const trimmed = text.trim();
      if (!trimmed || get().loading || get().streaming) return;
      const history = [...get().messages, { role: "user" as const, content: trimmed }];
      await run(history);
    },

    retry: () => {
      const { messages, loading, streaming } = get();
      if (loading || streaming) return;
      // Find the last user message and re-run from there (drop any trailing
      // assistant remnants left by the failed turn).
      let lastUser = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUser = i;
          break;
        }
      }
      if (lastUser === -1) return;
      const history = messages.slice(0, lastUser + 1);
      void run(history);
    },
  };
});
