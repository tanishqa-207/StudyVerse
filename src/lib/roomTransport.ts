"use client";

// Transport layer for private Study Rooms.
//
// Two interchangeable implementations behind one interface:
//   • SupabaseTransport — real cross-device rooms + realtime (chat,
//     participants, shared Pomodoro) via Supabase Realtime. Active whenever
//     NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set.
//   • LocalTransport — a same-browser fallback using localStorage +
//     BroadcastChannel so rooms still work (and sync live across browser tabs)
//     with zero configuration. Not cross-device.
//
// The rest of the app talks only to the RoomTransport interface, so the room
// store never needs to know which backend is live.

import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface RoomTimer {
  state: "idle" | "running" | "paused";
  endsAt: number | null; // epoch ms when a running timer completes
  remaining: number; // seconds left (authoritative when idle/paused)
  duration: number; // selected session length (seconds)
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostName: string;
  timer: RoomTimer;
  createdAt: number;
}

export interface Participant {
  clientId: string;
  name: string;
  avatarId: number;
  joinedAt: number;
}

export interface RoomMessage {
  id: string;
  clientId: string;
  name: string;
  avatarId: number;
  body: string;
  createdAt: number;
}

export interface RoomHandlers {
  onParticipants: (list: Participant[]) => void;
  onMessage: (msg: RoomMessage) => void;
  onRoom: (room: Room) => void;
}

export interface RoomTransport {
  readonly kind: "supabase" | "local";
  createRoom(input: { name: string; hostName: string; duration: number }): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | null>;
  join(roomId: string, p: Participant): Promise<void>;
  leave(roomId: string, clientId: string): Promise<void>;
  listParticipants(roomId: string): Promise<Participant[]>;
  listMessages(roomId: string): Promise<RoomMessage[]>;
  sendMessage(roomId: string, msg: RoomMessage): Promise<void>;
  updateTimer(roomId: string, timer: RoomTimer): Promise<void>;
  subscribe(roomId: string, handlers: RoomHandlers): () => void;
}

// ---- shared helpers ----
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
export function generateCode(len = 6): string {
  let out = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(len);
    crypto.getRandomValues(buf);
    for (let i = 0; i < len; i++) out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length];
  } else {
    for (let i = 0; i < len; i++)
      out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

const DEFAULT_DURATION = 25 * 60;

// ===========================================================================
// Supabase transport
// ===========================================================================
class SupabaseTransport implements RoomTransport {
  readonly kind = "supabase" as const;

  private sb() {
    const c = getSupabase();
    if (!c) throw new Error("Supabase not configured");
    return c;
  }

  private mapRoom(r: Record<string, unknown>): Room {
    return {
      id: r.id as string,
      code: r.code as string,
      name: r.name as string,
      hostName: r.host_name as string,
      createdAt: new Date(r.created_at as string).getTime(),
      timer: {
        state: (r.timer_state as RoomTimer["state"]) ?? "idle",
        endsAt: r.timer_ends_at ? new Date(r.timer_ends_at as string).getTime() : null,
        remaining: (r.timer_remaining as number) ?? DEFAULT_DURATION,
        duration: (r.timer_duration as number) ?? DEFAULT_DURATION,
      },
    };
  }

  private mapParticipant(p: Record<string, unknown>): Participant {
    return {
      clientId: p.client_id as string,
      name: p.name as string,
      avatarId: (p.avatar_id as number) ?? 0,
      joinedAt: new Date(p.joined_at as string).getTime(),
    };
  }

  private mapMessage(m: Record<string, unknown>): RoomMessage {
    return {
      id: m.id as string,
      clientId: m.client_id as string,
      name: m.name as string,
      avatarId: (m.avatar_id as number) ?? 0,
      body: m.body as string,
      createdAt: new Date(m.created_at as string).getTime(),
    };
  }

  async createRoom(input: { name: string; hostName: string; duration: number }): Promise<Room> {
    // Retry a couple of times on the (astronomically unlikely) code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { data, error } = await this.sb()
        .from("rooms")
        .insert({
          code,
          name: input.name,
          host_name: input.hostName,
          timer_state: "idle",
          timer_remaining: input.duration,
          timer_duration: input.duration,
        })
        .select()
        .single();
      if (!error && data) return this.mapRoom(data);
      if (error && !/duplicate|unique/i.test(error.message)) throw error;
    }
    throw new Error("Could not create a unique room code. Please try again.");
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const { data, error } = await this.sb()
      .from("rooms")
      .select()
      .eq("code", code.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapRoom(data) : null;
  }

  async join(roomId: string, p: Participant): Promise<void> {
    await this.sb()
      .from("room_participants")
      .upsert(
        {
          room_id: roomId,
          client_id: p.clientId,
          name: p.name,
          avatar_id: p.avatarId,
        },
        { onConflict: "room_id,client_id" },
      );
  }

  async leave(roomId: string, clientId: string): Promise<void> {
    await this.sb()
      .from("room_participants")
      .delete()
      .eq("room_id", roomId)
      .eq("client_id", clientId);
  }

  async listParticipants(roomId: string): Promise<Participant[]> {
    const { data } = await this.sb()
      .from("room_participants")
      .select()
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });
    return (data ?? []).map((p) => this.mapParticipant(p));
  }

  async listMessages(roomId: string): Promise<RoomMessage[]> {
    const { data } = await this.sb()
      .from("room_messages")
      .select()
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(200);
    return (data ?? []).map((m) => this.mapMessage(m));
  }

  async sendMessage(roomId: string, msg: RoomMessage): Promise<void> {
    // Reuse the optimistic id so the realtime INSERT echo de-dupes against the
    // message we already appended locally (otherwise the sender sees a dupe).
    await this.sb().from("room_messages").insert({
      id: msg.id,
      room_id: roomId,
      client_id: msg.clientId,
      name: msg.name,
      avatar_id: msg.avatarId,
      body: msg.body,
    });
  }

  async updateTimer(roomId: string, timer: RoomTimer): Promise<void> {
    await this.sb()
      .from("rooms")
      .update({
        timer_state: timer.state,
        timer_ends_at: timer.endsAt ? new Date(timer.endsAt).toISOString() : null,
        timer_remaining: timer.remaining,
        timer_duration: timer.duration,
      })
      .eq("id", roomId);
  }

  subscribe(roomId: string, handlers: RoomHandlers): () => void {
    const sb = this.sb();
    const refetchParticipants = () =>
      void this.listParticipants(roomId).then(handlers.onParticipants);

    const channel = sb
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` },
        refetchParticipants,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => handlers.onMessage(this.mapMessage(payload.new as Record<string, unknown>)),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => handlers.onRoom(this.mapRoom(payload.new as Record<string, unknown>)),
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }
}

// ===========================================================================
// Local transport (localStorage + BroadcastChannel)
// ===========================================================================
interface LocalDB {
  rooms: Record<string, Room>; // keyed by room id
  codes: Record<string, string>; // code → room id
  participants: Record<string, Participant[]>;
  messages: Record<string, RoomMessage[]>;
}

const LOCAL_KEY = "studyverse:rooms-db";

function readDB(): LocalDB {
  if (typeof window === "undefined") return { rooms: {}, codes: {}, participants: {}, messages: {} };
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw) as LocalDB;
  } catch {
    /* ignore */
  }
  return { rooms: {}, codes: {}, participants: {}, messages: {} };
}

function writeDB(db: LocalDB) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

class LocalTransport implements RoomTransport {
  readonly kind = "local" as const;

  private channel(roomId: string): BroadcastChannel | null {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
    return new BroadcastChannel(`studyverse-room-${roomId}`);
  }

  private ping(roomId: string, kind: "participants" | "message" | "room", payload?: unknown) {
    const ch = this.channel(roomId);
    if (!ch) return;
    ch.postMessage({ kind, payload });
    ch.close();
  }

  async createRoom(input: { name: string; hostName: string; duration: number }): Promise<Room> {
    const db = readDB();
    let code = generateCode();
    while (db.codes[code]) code = generateCode();
    const room: Room = {
      id: uid(),
      code,
      name: input.name,
      hostName: input.hostName,
      createdAt: Date.now(),
      timer: { state: "idle", endsAt: null, remaining: input.duration, duration: input.duration },
    };
    db.rooms[room.id] = room;
    db.codes[code] = room.id;
    db.participants[room.id] = [];
    db.messages[room.id] = [];
    writeDB(db);
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const db = readDB();
    const id = db.codes[code.toUpperCase()];
    return id ? db.rooms[id] ?? null : null;
  }

  async join(roomId: string, p: Participant): Promise<void> {
    const db = readDB();
    const list = db.participants[roomId] ?? [];
    const next = list.filter((x) => x.clientId !== p.clientId);
    next.push(p);
    db.participants[roomId] = next;
    writeDB(db);
    this.ping(roomId, "participants");
  }

  async leave(roomId: string, clientId: string): Promise<void> {
    const db = readDB();
    db.participants[roomId] = (db.participants[roomId] ?? []).filter((x) => x.clientId !== clientId);
    writeDB(db);
    this.ping(roomId, "participants");
  }

  async listParticipants(roomId: string): Promise<Participant[]> {
    return readDB().participants[roomId] ?? [];
  }

  async listMessages(roomId: string): Promise<RoomMessage[]> {
    return readDB().messages[roomId] ?? [];
  }

  async sendMessage(roomId: string, msg: RoomMessage): Promise<void> {
    const db = readDB();
    const list = db.messages[roomId] ?? [];
    list.push(msg);
    db.messages[roomId] = list.slice(-200);
    writeDB(db);
    this.ping(roomId, "message", msg);
  }

  async updateTimer(roomId: string, timer: RoomTimer): Promise<void> {
    const db = readDB();
    const room = db.rooms[roomId];
    if (!room) return;
    room.timer = timer;
    db.rooms[roomId] = room;
    writeDB(db);
    this.ping(roomId, "room");
  }

  subscribe(roomId: string, handlers: RoomHandlers): () => void {
    const ch = this.channel(roomId);
    // Also react to other-tab localStorage writes as a belt-and-braces signal.
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_KEY) void this.listParticipants(roomId).then(handlers.onParticipants);
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

    if (ch) {
      ch.onmessage = (ev: MessageEvent) => {
        const { kind, payload } = ev.data ?? {};
        if (kind === "participants") void this.listParticipants(roomId).then(handlers.onParticipants);
        else if (kind === "message" && payload) handlers.onMessage(payload as RoomMessage);
        else if (kind === "room") {
          const room = readDB().rooms[roomId];
          if (room) handlers.onRoom(room);
        }
      };
    }

    return () => {
      if (ch) ch.close();
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }
}

// ---- factory ----
let transport: RoomTransport | null = null;
export function getRoomTransport(): RoomTransport {
  if (!transport) {
    transport = isSupabaseConfigured() ? new SupabaseTransport() : new LocalTransport();
  }
  return transport;
}
