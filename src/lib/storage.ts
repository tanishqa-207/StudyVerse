// StudyVerse local storage layer.
// A tiny, SSR-safe wrapper around window.localStorage. All persistence in the
// app (profile, onboarding flag, progress) flows through here so there is a
// single, testable boundary between the app and the browser.

const PREFIX = "studyverse:";

function available(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!available()) return fallback;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (!available()) return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* quota / private-mode — silently ignore */
    }
  },

  remove(key: string): void {
    if (!available()) return;
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};

// Named keys used across the app — keep them here to avoid typos.
export const KEYS = {
  profiles: "profiles", // { profiles: Profile[]; activeId: string | null }
} as const;
