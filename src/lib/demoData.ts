// Central demo data for the StudyVerse MVP.
// No authentication or backend required — everything the UI needs lives here.

export type NavKey =
  | "home"
  | "study"
  | "rooms"
  | "quests"
  | "memory-forest"
  | "streak";

export interface NavItem {
  key: NavKey;
  label: string;
  icon: string; // key resolved by the Icon component
}

export const navItems: NavItem[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "study", label: "Study", icon: "book" },
  { key: "rooms", label: "Rooms", icon: "users" },
  { key: "quests", label: "Quests", icon: "clipboard" },
  { key: "memory-forest", label: "Memory Forest", icon: "leaf" },
  { key: "streak", label: "Streak", icon: "flame" },
];

export interface DemoUser {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  gems: number;
  streakDays: number;
}

export const demoUser: DemoUser = {
  name: "Nova",
  level: 8,
  xp: 480,
  xpToNext: 1000,
  coins: 240,
  gems: 20,
  streakDays: 12,
};

export interface ProgressSummary {
  xp: number;
  xpToNext: number;
  level: number;
  coins: number;
  gems: number;
  studyTimeToday: string;
  dailyGoal: string;
  quote: string;
}

export const todaysProgress: ProgressSummary = {
  xp: demoUser.xp,
  xpToNext: demoUser.xpToNext,
  level: demoUser.level,
  coins: demoUser.coins,
  gems: demoUser.gems,
  studyTimeToday: "1h 45m",
  dailyGoal: "3h 00m",
  quote: "Discipline today, Freedom tomorrow.",
};

export interface MapLocation {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  // Position on the isometric map, as a percentage of the map container.
  x: number;
  y: number;
  accent: "green" | "blue" | "amber" | "violet";
  studyingAvatars?: number;
  isPrimary?: boolean; // e.g. Start Focus Session
}

export const mapLocations: MapLocation[] = [
  {
    key: "memory-forest",
    title: "Memory Forest",
    subtitle: "Level 10",
    icon: "tree",
    x: 24,
    y: 22,
    accent: "green",
  },
  {
    key: "study-room",
    title: "Study Room",
    subtitle: "12 studying",
    icon: "users",
    x: 62,
    y: 30,
    accent: "blue",
    studyingAvatars: 12,
  },
  {
    key: "quest-hub",
    title: "Quest Hub",
    subtitle: "4 Quests",
    icon: "clipboard",
    x: 26,
    y: 66,
    accent: "amber",
  },
  {
    key: "start-focus",
    title: "Start Focus Session",
    subtitle: "",
    icon: "play",
    x: 48,
    y: 72,
    accent: "violet",
    isPrimary: true,
  },
];

export interface NowPlaying {
  title: string;
  subtitle: string;
  isPlaying: boolean;
}

export const nowPlaying: NowPlaying = {
  title: "Lo-fi Focus",
  subtitle: "Chill & Concentrate",
  isPlaying: true,
};

// ---- Music playlist (functional player, no external audio required) ----
export interface Track {
  title: string;
  subtitle: string;
  emoji: string;
}

export const playlist: Track[] = [
  { title: "Lo-fi Focus", subtitle: "Chill & Concentrate", emoji: "🌙" },
  { title: "Deep Work", subtitle: "Ambient Drift", emoji: "🌌" },
  { title: "Rainy Study", subtitle: "Soft Rain & Piano", emoji: "🌧️" },
  { title: "Forest Calm", subtitle: "Nature & Focus", emoji: "🍃" },
  { title: "Night Coder", subtitle: "Synth Focus", emoji: "🎧" },
];

// ---- Default persisted progress (seed for a brand-new profile) ----
// Kept in sync with the Progress shape in store.ts.
export const defaultProgress = {
  level: 1,
  xp: 0,
  xpToNext: 500,
  coins: 40,
  gems: 5,
  streakDays: 0, // starts at 0 — becomes 1 after the first completed session
  studyMinutesToday: 0,
  dailyGoalMinutes: 180, // 3h
  lastStudyDate: null as string | null,
};

// ---- 12 default avatars (parametrised, rendered by <Avatar />) ----
export interface AvatarSpec {
  bg: [string, string]; // radial background stops
  skin: [string, string];
  hair: [string, string];
  shirt: [string, string];
  hairStyle: "short" | "bun" | "curly" | "cap";
}

export const avatars: AvatarSpec[] = [
  { bg: ["#8f8bff", "#4b47b8"], skin: ["#ffd9c2", "#f2b295"], hair: ["#3a2f52", "#1d1730"], shirt: ["#6ec6ff", "#3f8ce0"], hairStyle: "short" },
  { bg: ["#ff9fbf", "#c0417e"], skin: ["#ffe0cf", "#f4bda0"], hair: ["#5a3a2a", "#2e1c12"], shirt: ["#ffd166", "#f0a63f"], hairStyle: "bun" },
  { bg: ["#7be0c0", "#2f9e7e"], skin: ["#f4c9a8", "#d89e78"], hair: ["#1d1730", "#0c0a1a"], shirt: ["#9a8bff", "#5f4fd6"], hairStyle: "curly" },
  { bg: ["#ffce8f", "#e08b3f"], skin: ["#8d5a3c", "#6d422a"], hair: ["#241a12", "#100a06"], shirt: ["#56b6f5", "#2f7fd0"], hairStyle: "short" },
  { bg: ["#a0b4ff", "#4655c0"], skin: ["#ffd9c2", "#eeb08f"], hair: ["#c25a3a", "#8a3a22"], shirt: ["#48d38a", "#2aa066"], hairStyle: "cap" },
  { bg: ["#ffb3a0", "#d1503a"], skin: ["#a56a44", "#7f4e30"], hair: ["#241a12", "#0f0a06"], shirt: ["#f472c9", "#c33f98"], hairStyle: "bun" },
  { bg: ["#8fd4ff", "#3f7fd0"], skin: ["#ffe0cf", "#f0b79a"], hair: ["#e0c060", "#b08f2a"], shirt: ["#7c6cf5", "#5040c0"], hairStyle: "curly" },
  { bg: ["#c4a0ff", "#6f3fd0"], skin: ["#f4c9a8", "#d49e76"], hair: ["#3a2f52", "#1d1730"], shirt: ["#f5b74a", "#d0902a"], hairStyle: "short" },
  { bg: ["#9fffd0", "#2f9e7e"], skin: ["#6d442c", "#4f301d"], hair: ["#100a06", "#000000"], shirt: ["#6ec6ff", "#3f8ce0"], hairStyle: "cap" },
  { bg: ["#ffd0e0", "#c04f7e"], skin: ["#ffd9c2", "#eeb08f"], hair: ["#7a4fd0", "#4f2fa0"], shirt: ["#48d38a", "#2aa066"], hairStyle: "curly" },
  { bg: ["#b0c0ff", "#4046b0"], skin: ["#f4c9a8", "#d49e76"], hair: ["#2a2a2a", "#111111"], shirt: ["#f472c9", "#c33f98"], hairStyle: "bun" },
  { bg: ["#ffe08f", "#d09a2f"], skin: ["#a56a44", "#7f4e30"], hair: ["#241a12", "#0f0a06"], shirt: ["#9a8bff", "#5f4fd6"], hairStyle: "short" },
];

export const AVATAR_COUNT = avatars.length;
