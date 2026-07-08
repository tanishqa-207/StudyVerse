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
