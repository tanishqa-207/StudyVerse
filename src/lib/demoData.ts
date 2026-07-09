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
  { key: "quests", label: "Winning", icon: "trophy" },
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
  accent: "green" | "blue" | "amber" | "violet" | "pink";
  studyingAvatars?: number;
  isPrimary?: boolean; // e.g. Start Focus Session
}

// Interactive nodes shown on the isometric city (see LocationCard). These are
// the four "buildings" from the reference: Study Room, Winning, Focus Time
// (primary) and Memory Forest. The music player lives at the bottom-left (see
// MusicPlayer, mounted in the Sidebar).
export const mapLocations: MapLocation[] = [
  // Positions are balanced across the whole city (two upper corners, a lower
  // node and a central primary) so no node reads as isolated.
  {
    key: "study-room",
    title: "Study Room",
    subtitle: "12 studying",
    icon: "users",
    x: 42,
    y: 28,
    accent: "violet",
    studyingAvatars: 12,
  },
  {
    key: "winning",
    title: "Winning",
    subtitle: "0 pts",
    icon: "trophy",
    x: 22,
    y: 35,
    accent: "green",
  },
  {
    key: "start-focus",
    title: "Focus Time",
    subtitle: "Earn XP & coins",
    icon: "play",
    x: 50,
    y: 55,
    accent: "blue",
    isPrimary: true,
  },
  {
    key: "memory-forest",
    title: "Memory Forest",
    subtitle: "Lvl 10 to unlock",
    icon: "leaf",
    x: 80,
    y: 10,
    accent: "pink",
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
  { title: "Midnight Lo-fi", subtitle: "Warm Ambient Waves", emoji: "🌌" },
  { title: "Deep Work", subtitle: "Ambient Drift", emoji: "🎧" },
  { title: "Rainy Study", subtitle: "Soft Rain & Piano", emoji: "🌧️" },
  { title: "Forest Calm", subtitle: "Nature & Focus", emoji: "🍃" },
  { title: "Zen Garden", subtitle: "Meditative Bells", emoji: "🪷" },
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
  // Lifetime "winning points" — total XP ever earned. Drives reward milestones.
  points: 0,
  // Purchased/earned unlock ids (sections, cosmetics). Gives coins real value.
  unlocks: [] as string[],
  // Reward-milestone ids already claimed (one claim each).
  claimedRewards: [] as string[],
  // Active cosmetic accent theme id ("default" until changed in the Shop).
  accent: "default",
};

// ---- Winning system — rewards unlock at lifetime-point milestones ----
// Rewards are NOT freely claimable; each unlocks only once the player crosses a
// predefined points threshold, then can be claimed once for real currency.
export interface RewardMilestone {
  id: string;
  title: string;
  points: number; // required lifetime points
  reward: { xp: number; coins: number; gems: number };
}

export const REWARD_MILESTONES: RewardMilestone[] = [
  { id: "m1", title: "First Steps", points: 250, reward: { xp: 0, coins: 80, gems: 1 } },
  { id: "m2", title: "Getting Serious", points: 750, reward: { xp: 0, coins: 160, gems: 2 } },
  { id: "m3", title: "Focused Mind", points: 1500, reward: { xp: 0, coins: 300, gems: 4 } },
  { id: "m4", title: "Scholar", points: 3000, reward: { xp: 0, coins: 550, gems: 6 } },
  { id: "m5", title: "Study Legend", points: 6000, reward: { xp: 0, coins: 1000, gems: 12 } },
];

// ---- Economy — coins/gems buy real unlocks (sections + cosmetics) ----
export interface UnlockCost {
  coins: number;
  gems?: number;
  minLevel?: number;
}

// The Memory Forest is a premium SECTION, gated by level AND currency.
export const MEMORY_FOREST_UNLOCK = "section:memory-forest";
export const MEMORY_FOREST_COST: UnlockCost = { coins: 15000, gems: 20, minLevel: 10 };

// Cosmetic accent themes — recolour the whole app's accent live. "default" is
// always owned; the rest are bought with coins in the Shop.
export interface AccentTheme {
  id: string;
  name: string;
  price: number; // coins (0 = free / owned by default)
  violet: string; // maps to --violet
  bright: string; // maps to --violet-bright
  swatch: string; // preview gradient
}

export const ACCENT_THEMES: AccentTheme[] = [
  { id: "default", name: "Nebula Violet", price: 0, violet: "#7c6cf5", bright: "#9a8bff", swatch: "linear-gradient(135deg,#9a8bff,#6355e6)" },
  { id: "aurora", name: "Aurora Teal", price: 600, violet: "#26b8a6", bright: "#4fe0cc", swatch: "linear-gradient(135deg,#4fe0cc,#1f9488)" },
  { id: "sunset", name: "Sunset Amber", price: 900, violet: "#f0803f", bright: "#ffb04a", swatch: "linear-gradient(135deg,#ffb04a,#e0632a)" },
  { id: "rose", name: "Rose Quartz", price: 1200, violet: "#e0518f", bright: "#ff8ac0", swatch: "linear-gradient(135deg,#ff8ac0,#c33f78)" },
  { id: "emerald", name: "Emerald Grove", price: 1500, violet: "#2fa06a", bright: "#4fd38a", swatch: "linear-gradient(135deg,#4fd38a,#1e7a4e)" },
];

// ---- Daily quote — one deterministic quote per calendar day ----
export const QUOTES: string[] = [
  "Discipline today, freedom tomorrow.",
  "Small daily wins compound into mastery.",
  "The secret of getting ahead is getting started.",
  "Focus is a muscle — train it a little every day.",
  "You don't have to be great to start, but you have to start to be great.",
  "Study while others sleep; live while others dream.",
  "Progress, not perfection.",
  "A little progress each day adds up to big results.",
  "The expert in anything was once a beginner.",
  "Your future is created by what you do today.",
  "Deep work now, deep rest later.",
  "Consistency beats intensity every single time.",
  "Learning is a treasure that follows its owner everywhere.",
  "Don't watch the clock; do what it does — keep going.",
  "Dreams don't work unless you do.",
  "One page a day is 365 pages a year.",
  "Concentration is the root of all higher abilities.",
  "Success is the sum of small efforts repeated daily.",
  "The mind grows by what it feeds on — feed it well.",
  "Fall in love with the process and the results will come.",
  "Great things are done by a series of small things brought together.",
  "Study now — brag later.",
  "The best time to plant a tree was 20 years ago; the second best is now.",
  "Knowledge is power, but practice is the key.",
  "Wake up with determination, go to bed with satisfaction.",
];

/** Deterministic quote for a given date — same all day, different each day. */
export function dailyQuote(date: Date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

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
