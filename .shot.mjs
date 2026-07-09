import { chromium } from "playwright-core";

const profile = {
  id: "p_demo",
  username: "Nova",
  avatarId: 0,
  progress: {
    level: 8, xp: 480, xpToNext: 1000, coins: 240, gems: 20,
    streakDays: 12, studyMinutesToday: 105, dailyGoalMinutes: 180,
    lastStudyDate: null, points: 900, unlocks: [], claimedRewards: [],
    accent: "default",
  },
  preferences: { soundOn: true, musicOn: true, reducedMotion: false },
};
const seed = JSON.stringify({ profiles: [profile], activeId: "p_demo" });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await page.evaluate((s) => localStorage.setItem("studyverse:profiles", s), seed);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: ".shot-before.png" });
await browser.close();
console.log("done");
