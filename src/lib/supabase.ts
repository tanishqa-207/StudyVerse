"use client";

// Supabase browser client for StudyVerse.
//
// The whole app is designed to work WITHOUT Supabase configured (local-only
// fallback). When the two public env vars below are present, real cross-device
// persistence + realtime (Study Rooms) light up automatically. When they are
// absent, `getSupabase()` returns null and callers fall back to a local
// BroadcastChannel-based transport so nothing breaks.
//
// Required env (see .env.example):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both public Supabase env vars are set. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

/**
 * Returns a memoised Supabase client, or null when Supabase is not configured.
 * Safe to call on the server (returns null) and the client.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (typeof window === "undefined") return null; // client-only in this app
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}
