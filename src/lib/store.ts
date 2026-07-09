"use client";

// Central client-side state for StudyVerse, backed by the local storage layer.
// Supports MULTIPLE independent profiles — each carries its own username,
// avatar, progress (XP/level/coins/gems/streak/study time/goals) and
// preferences. Switching profiles swaps the entire active dataset; no data from
// one profile is ever visible under another.

import { create } from "zustand";
import { storage, KEYS } from "./storage";
import { AVATAR_COUNT, defaultProgress } from "./demoData";
import { getSupabase } from "./supabase";

export interface Progress {
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  gems: number;
  streakDays: number;
  studyMinutesToday: number;
  dailyGoalMinutes: number;
  /** Local date (YYYY-MM-DD) of the last completed session; null until the first. */
  lastStudyDate: string | null;
}

// ---- Day / streak helpers (local time) ----
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days between two YYYY-MM-DD strings (b - a), using local midnight. */
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ta = new Date(ay, am - 1, ad).getTime();
  const tb = new Date(by, bm - 1, bd).getTime();
  return Math.round((tb - ta) / 86_400_000);
}

/**
 * Reconcile day-scoped fields against "today": a missed day breaks the streak
 * and stale study minutes reset. Pure — returns a new Progress when anything
 * changed, otherwise the original reference.
 */
function reconcileDay(p: Progress): Progress {
  const today = todayStr();
  if (p.lastStudyDate === today) return p; // already current

  const gap = p.lastStudyDate ? dayDiff(p.lastStudyDate, today) : Infinity;
  // A gap of exactly 1 (studied yesterday) keeps the streak alive for today;
  // any larger gap — or never having studied — means the streak is broken.
  const streakDays = gap === 1 ? p.streakDays : 0;
  const studyMinutesToday = 0; // it's a new day relative to lastStudyDate
  if (streakDays === p.streakDays && studyMinutesToday === p.studyMinutesToday) return p;
  return { ...p, streakDays, studyMinutesToday };
}

export interface Preferences {
  soundOn: boolean;
  notifications: boolean;
}

export interface Profile {
  id: string;
  username: string;
  avatarId: number; // 0..AVATAR_COUNT-1
  progress: Progress;
  preferences: Preferences;
}

interface PersistShape {
  profiles: Profile[];
  activeId: string | null;
}

const defaultPreferences: Preferences = { soundOn: true, notifications: true };

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function makeProfile(username: string, avatarId: number): Profile {
  return {
    id: newId(),
    username: username.trim() || "Explorer",
    avatarId,
    progress: { ...defaultProgress },
    preferences: { ...defaultPreferences },
  };
}

function applyXp(progress: Progress, xp: number, coins: number): Progress {
  let { level, xpToNext } = progress;
  let total = progress.xp + xp;
  while (total >= xpToNext) {
    total -= xpToNext;
    level += 1;
    xpToNext = Math.round(xpToNext * 1.15); // gently rising curve
  }
  return { ...progress, level, xp: total, xpToNext, coins: progress.coins + coins };
}

interface AppState extends PersistShape {
  hydrated: boolean;

  hydrate: () => void;
  /** First-run onboarding: create the initial profile and make it active. */
  completeOnboarding: (username: string, avatarId: number) => void;
  /** Add a new, independent profile and switch to it. */
  addProfile: (username: string, avatarId: number) => void;
  switchProfile: (id: string) => void;
  editProfile: (id: string, patch: { username?: string; avatarId?: number }) => void;
  deleteProfile: (id: string) => void;

  completeFocusSession: (minutes: number) => void;
  awardXp: (xp: number, coins?: number) => void;
  setDailyGoal: (minutes: number) => void;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

function persist(profiles: Profile[], activeId: string | null) {
  storage.set<PersistShape>(KEYS.profiles, { profiles, activeId });
}

/**
 * Best-effort push of the active profile's progress to Supabase (table
 * `study_profiles`). No-ops when Supabase is unconfigured — local storage
 * remains the source of truth, so the daily goal is always saved either way.
 */
async function syncProgress(get: () => AppState) {
  const sb = getSupabase();
  if (!sb) return;
  const active = activeOf(get());
  if (!active) return;
  const p = active.progress;
  try {
    await sb.from("study_profiles").upsert(
      {
        id: active.id,
        username: active.username,
        avatar_id: active.avatarId,
        level: p.level,
        xp: p.xp,
        coins: p.coins,
        gems: p.gems,
        streak_days: p.streakDays,
        study_minutes_today: p.studyMinutesToday,
        daily_goal_minutes: p.dailyGoalMinutes,
        last_study_date: p.lastStudyDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch {
    /* offline / not configured — local storage already holds the truth */
  }
}

/** Mutate the active profile's progress and persist. */
function mutateActive(
  state: AppState,
  fn: (p: Progress) => Progress,
): Partial<AppState> {
  const profiles = state.profiles.map((p) =>
    p.id === state.activeId ? { ...p, progress: fn(p.progress) } : p,
  );
  persist(profiles, state.activeId);
  return { profiles };
}

export const useStore = create<AppState>((set, get) => ({
  profiles: [],
  activeId: null,
  hydrated: false,

  hydrate: () => {
    const saved = storage.get<PersistShape>(KEYS.profiles, { profiles: [], activeId: null });
    // ensure activeId points at a real profile
    const activeId =
      saved.profiles.find((p) => p.id === saved.activeId)?.id ??
      saved.profiles[0]?.id ??
      null;
    // Migrate older saved profiles (no lastStudyDate) and reconcile the day so a
    // missed day breaks the streak and stale "today" minutes reset on load.
    const profiles = saved.profiles.map((p) => ({
      ...p,
      progress: reconcileDay({ ...defaultProgress, ...p.progress }),
    }));
    if (profiles.length) persist(profiles, activeId);
    set({ profiles, activeId, hydrated: true });
  },

  completeOnboarding: (username, avatarId) => {
    const profile = makeProfile(username, avatarId);
    const profiles = [profile];
    persist(profiles, profile.id);
    set({ profiles, activeId: profile.id });
  },

  addProfile: (username, avatarId) => {
    const profile = makeProfile(username, avatarId);
    const profiles = [...get().profiles, profile];
    persist(profiles, profile.id);
    set({ profiles, activeId: profile.id });
  },

  switchProfile: (id) => {
    if (!get().profiles.some((p) => p.id === id)) return;
    persist(get().profiles, id);
    set({ activeId: id });
  },

  editProfile: (id, patch) => {
    const profiles = get().profiles.map((p) =>
      p.id === id
        ? {
            ...p,
            username: patch.username?.trim() ? patch.username.trim() : p.username,
            avatarId: patch.avatarId ?? p.avatarId,
          }
        : p,
    );
    persist(profiles, get().activeId);
    set({ profiles });
  },

  deleteProfile: (id) => {
    const profiles = get().profiles.filter((p) => p.id !== id);
    let activeId = get().activeId;
    if (activeId === id) activeId = profiles[0]?.id ?? null;
    persist(profiles, activeId);
    set({ profiles, activeId });
  },

  completeFocusSession: (minutes) => {
    const xp = Math.round(minutes * 10);
    const coins = Math.round(minutes * 4);
    set((s) =>
      mutateActive(s, (raw) => {
        // Reconcile first so a stale day doesn't leak yesterday's minutes/streak.
        const p = reconcileDay(raw);
        const today = todayStr();
        // Advance the streak once per day: first-ever session → 1, a same-day
        // repeat leaves it unchanged, a fresh day (streak still alive) → +1.
        const streakDays =
          p.lastStudyDate === today ? p.streakDays : Math.max(1, p.streakDays + 1);
        const next: Progress = {
          ...p,
          streakDays,
          lastStudyDate: today,
          studyMinutesToday: p.studyMinutesToday + minutes,
        };
        return applyXp(next, xp, coins);
      }),
    );
    void syncProgress(get);
  },

  awardXp: (xp, coins = 0) => {
    set((s) => mutateActive(s, (p) => applyXp(p, xp, coins)));
    void syncProgress(get);
  },

  setDailyGoal: (minutes) => {
    // Clamp to a sane range (15 min – 12 h) in 5-min steps.
    const clamped = Math.max(15, Math.min(720, Math.round(minutes / 5) * 5));
    set((s) => mutateActive(s, (p) => ({ ...p, dailyGoalMinutes: clamped })));
    void syncProgress(get);
  },

  setPreference: (key, value) => {
    set((s) => {
      const profiles = s.profiles.map((p) =>
        p.id === s.activeId ? { ...p, preferences: { ...p.preferences, [key]: value } } : p,
      );
      persist(profiles, s.activeId);
      return { profiles };
    });
  },
}));

// ---- convenience selectors (stable references) ----
const activeOf = (s: AppState) => s.profiles.find((p) => p.id === s.activeId);

export const useActiveProfile = () => useStore((s) => activeOf(s) ?? null);
export const useProgress = () => useStore((s) => activeOf(s)?.progress ?? defaultProgress);
export const useUsername = () => useStore((s) => activeOf(s)?.username ?? "");
export const useAvatarId = () => useStore((s) => activeOf(s)?.avatarId ?? 0);
export const useHasProfile = () => useStore((s) => s.activeId != null);

export { AVATAR_COUNT };
