"use client";

import { motion } from "framer-motion";
import Icon, { IconName } from "./Icon";
import type { MapLocation } from "@/lib/demoData";
import { REWARD_MILESTONES } from "@/lib/demoData";
import { useProgress } from "@/lib/store";
import { useUI, type Modal } from "@/lib/uiStore";
import { playClick } from "@/lib/sound";

// Neon accent per section, matching the reference billboards:
// Study Room = purple, Focus Time = cyan, Winning = green, Memory Forest = magenta.
const accentMap: Record<MapLocation["accent"], string> = {
  green: "#3fe08a",
  blue: "#4fc3ff",
  amber: "#f5b74a",
  violet: "#a58bff",
  pink: "#ff5fd0",
};

// Map each location key to the modal it opens.
const LOC_MODAL: Record<string, Modal> = {
  "memory-forest": "memory-forest",
  "study-room": "rooms",
  winning: "quests",
  "quest-hub": "quests",
  "start-focus": "focus",
};

export default function LocationCard({
  loc,
  index,
}: {
  loc: MapLocation;
  index: number;
}) {
  const neon = accentMap[loc.accent];
  const openModal = useUI((s) => s.openModal);
  const p = useProgress();
  const open = () => {
    playClick();
    if (isMemoryForestLocked) {
      openModal("memory-forest-premium");
    } else {
      openModal(LOC_MODAL[loc.key] ?? null);
    }
  };

  // Check if Memory Forest is locked
  const isMemoryForestLocked = loc.key === "memory-forest" && !p.unlocks.includes("section:memory-forest");

  // Live data for the Winning node: current points + how many rewards are ready.
  const claimable =
    loc.key === "winning"
      ? REWARD_MILESTONES.filter(
          (m) => p.points >= m.points && !p.claimedRewards.includes(m.id),
        ).length
      : 0;
  const subtitle =
    loc.key === "winning" ? `${p.points.toLocaleString()} pts` :
    isMemoryForestLocked ? `Lvl ${p.level}/10` :
    loc.subtitle;

  // Title split into stacked words (STUDY / ROOM) as in the reference.
  const words = loc.title.toUpperCase().split(" ");

  return (
    <motion.button
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15 + index * 0.09, type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ scale: 1.06, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={open}
      aria-label={`Open ${loc.title}`}
      className="billboard hover-lift absolute z-20 flex w-[132px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2.5 rounded-[24px] px-4 py-4 text-center sm:w-[144px]"
      style={{
        left: `${loc.x}%`,
        top: `${loc.y}%`,
        ["--neon" as string]: neon,
        opacity: isMemoryForestLocked ? 0.65 : 1,
        cursor: "pointer",
      }}
    >
      {/* stacked neon title */}
      <div
        className="font-extrabold uppercase leading-[1.02] tracking-[0.06em] text-white"
        style={{ fontSize: words.length > 1 ? 19 : 17, textShadow: `0 0 14px ${neon}, 0 1px 2px rgba(0,0,0,0.5)` }}
      >
        {words.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      {/* per-section content */}
      {loc.isPrimary ? (
        // Focus Time — glowing play button (same billboard footprint as the rest)
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="mt-0.5 grid h-11 w-11 place-items-center rounded-full text-white"
          style={{
            background: `radial-gradient(circle at 40% 35%, ${neon}, ${neon}bb)`,
            boxShadow: `0 0 18px -2px ${neon}, inset 0 1px 0 rgba(255,255,255,0.5)`,
          }}
        >
          <Icon name="play" size={20} />
        </motion.span>
      ) : loc.studyingAvatars ? (
        // Study Room — live avatars + count
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/12" style={{ color: neon }}>
            <Icon name={loc.icon as IconName} size={18} />
          </span>
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-5 w-5 rounded-full ring-2 ring-black/25"
                style={{ background: `linear-gradient(135deg, hsl(${210 + i * 26} 78% 70%), hsl(${255 + i * 18} 62% 56%))` }}
              />
            ))}
          </div>
          <span
            className="rounded-full px-1.5 py-0.5 text-[11px] font-bold text-white"
            style={{ background: `${neon}44`, boxShadow: `inset 0 0 0 1px ${neon}88` }}
          >
            +8
          </span>
        </div>
      ) : (
        // Winning / Memory Forest — icon chip + subtitle
        <div className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-xl"
            style={{ background: `${neon}26`, color: neon, boxShadow: `inset 0 0 0 1px ${neon}66` }}
          >
            <Icon name={loc.icon as IconName} size={18} />
          </span>
          <span className="text-[12.5px] font-semibold text-white/85">{subtitle}</span>
        </div>
      )}

      {claimable > 0 && (
        <span
          className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg,#f5b74a,#f0803f)",
            boxShadow: "0 6px 16px -4px rgba(240,128,63,0.9)",
          }}
        >
          {claimable}
        </span>
      )}

      {isMemoryForestLocked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-[24px] bg-black/30 backdrop-blur-[6px]"
          style={{
            background: "radial-gradient(circle at center, rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Icon name="lock" size={20} className="mb-1 text-white/90" />
          <span className="text-[10px] font-bold text-white/85">LVL 10</span>
        </div>
      )}
    </motion.button>
  );
}
