"use client";

// Study Room state: create/join/leave, live participants, realtime chat and a
// shared Pomodoro timer. All backend work is delegated to the RoomTransport
// (Supabase Realtime when configured, else a same-browser BroadcastChannel
// fallback), so this store only tracks in-room UI state + subscriptions.

import { create } from "zustand";
import {
  getRoomTransport,
  generateCode,
  type Room,
  type Participant,
  type RoomMessage,
  type RoomTimer,
} from "./roomTransport";
import { useStore } from "./store";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `m_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** Identity for the current participant, derived from the active local profile. */
function identity(): { clientId: string; name: string; avatarId: number } {
  const s = useStore.getState();
  const p = s.profiles.find((x) => x.id === s.activeId);
  return {
    clientId: p?.id ?? "anon",
    name: p?.username ?? "Explorer",
    avatarId: p?.avatarId ?? 0,
  };
}

export type RoomStatus = "idle" | "busy" | "in-room";

interface RoomState {
  status: RoomStatus;
  room: Room | null;
  participants: Participant[];
  messages: RoomMessage[];
  error: string | null;
  prefillCode: string | null; // seeded from an invite link
  transportKind: "supabase" | "local";

  setPrefillCode: (code: string | null) => void;
  createRoom: (name: string, durationMin: number) => Promise<void>;
  joinByCode: (code: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendChat: (body: string) => Promise<void>;

  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimerDuration: (minutes: number) => void;
  completeTimer: () => void;
}

let unsubscribe: (() => void) | null = null;

export const useRoom = create<RoomState>((set, get) => {
  const transport = getRoomTransport();

  // Push a new timer state both optimistically (local) and to the backend.
  const pushTimer = (timer: RoomTimer) => {
    const room = get().room;
    if (!room) return;
    set({ room: { ...room, timer } });
    void transport.updateTimer(room.id, timer);
  };

  const enterRoom = async (room: Room) => {
    // Tear down any previous subscription first.
    unsubscribe?.();
    const me = identity();
    await transport.join(room.id, { ...me, joinedAt: Date.now() });

    const [participants, messages] = await Promise.all([
      transport.listParticipants(room.id),
      transport.listMessages(room.id),
    ]);

    unsubscribe = transport.subscribe(room.id, {
      onParticipants: (list) => set({ participants: list }),
      onMessage: (msg) =>
        set((s) =>
          s.messages.some((m) => m.id === msg.id) ? s : { messages: [...s.messages, msg] },
        ),
      onRoom: (r) => set((s) => (s.room ? { room: { ...r } } : s)),
    });

    set({ status: "in-room", room, participants, messages, error: null });
  };

  return {
    status: "idle",
    room: null,
    participants: [],
    messages: [],
    error: null,
    prefillCode: null,
    transportKind: transport.kind,

    setPrefillCode: (code) => set({ prefillCode: code }),

    createRoom: async (name, durationMin) => {
      const me = identity();
      set({ status: "busy", error: null });
      try {
        const room = await transport.createRoom({
          name: name.trim() || `${me.name}'s Room`,
          hostName: me.name,
          duration: Math.max(60, durationMin * 60),
        });
        await enterRoom(room);
      } catch (e) {
        set({ status: "idle", error: errMessage(e, "Could not create the room.") });
      }
    },

    joinByCode: async (code) => {
      const clean = code.trim().toUpperCase();
      if (clean.length < 4) {
        set({ error: "Enter a valid room code." });
        return;
      }
      set({ status: "busy", error: null });
      try {
        const room = await transport.getRoomByCode(clean);
        if (!room) {
          set({ status: "idle", error: "No room found for that code. Check the invite link or code." });
          return;
        }
        await enterRoom(room);
      } catch (e) {
        set({ status: "idle", error: errMessage(e, "Could not join the room.") });
      }
    },

    leaveRoom: async () => {
      const room = get().room;
      unsubscribe?.();
      unsubscribe = null;
      if (room) {
        try {
          await transport.leave(room.id, identity().clientId);
        } catch {
          /* best effort */
        }
      }
      set({ status: "idle", room: null, participants: [], messages: [], error: null });
    },

    sendChat: async (body) => {
      const text = body.trim();
      const room = get().room;
      if (!text || !room) return;
      const me = identity();
      const msg: RoomMessage = { id: uid(), ...me, body: text, createdAt: Date.now() };
      // Optimistic append; the subscription de-dupes by id.
      set((s) => ({ messages: [...s.messages, msg] }));
      try {
        await transport.sendMessage(room.id, msg);
      } catch {
        set({ error: "Message failed to send." });
      }
    },

    startTimer: () => {
      const room = get().room;
      if (!room) return;
      const t = room.timer;
      const remaining = t.state === "paused" ? t.remaining : t.remaining || t.duration;
      pushTimer({ ...t, state: "running", endsAt: Date.now() + remaining * 1000, remaining });
    },

    pauseTimer: () => {
      const room = get().room;
      if (!room || room.timer.state !== "running") return;
      const remaining = Math.max(0, Math.round(((room.timer.endsAt ?? Date.now()) - Date.now()) / 1000));
      pushTimer({ ...room.timer, state: "paused", endsAt: null, remaining });
    },

    resetTimer: () => {
      const room = get().room;
      if (!room) return;
      pushTimer({ ...room.timer, state: "idle", endsAt: null, remaining: room.timer.duration });
    },

    setTimerDuration: (minutes) => {
      const room = get().room;
      if (!room || room.timer.state === "running") return;
      const duration = Math.max(60, minutes * 60);
      pushTimer({ state: "idle", endsAt: null, remaining: duration, duration });
    },

    completeTimer: () => {
      const room = get().room;
      if (!room || room.timer.state !== "running") return;
      // Award the focused minutes to *this* participant, then reset the shared timer.
      const minutes = Math.round(room.timer.duration / 60);
      if (minutes > 0) useStore.getState().completeFocusSession(minutes);
      pushTimer({ ...room.timer, state: "idle", endsAt: null, remaining: room.timer.duration });
    },
  };
});

function errMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) {
    if (/not configured/i.test(e.message)) return fallback;
    return e.message;
  }
  return fallback;
}

// Re-export the code generator for any UI that wants a preview.
export { generateCode };
