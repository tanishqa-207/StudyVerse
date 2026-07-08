"use client";

import { motion } from "framer-motion";
import Icon, { IconName } from "./Icon";
import type { MapLocation } from "@/lib/demoData";

const accentMap: Record<MapLocation["accent"], string> = {
  green: "#48d38a",
  blue: "#56b6f5",
  amber: "#f5b74a",
  violet: "#9a8bff",
};

export default function LocationCard({
  loc,
  index,
}: {
  loc: MapLocation;
  index: number;
}) {
  const accent = accentMap[loc.accent];

  if (loc.isPrimary) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + index * 0.08 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
      >
        <div
          className="flex w-[150px] flex-col gap-3 rounded-3xl px-5 py-4 text-left"
          style={{
            background: "linear-gradient(150deg, #7c6cf5, #5a4be0)",
            boxShadow:
              "0 22px 50px -14px rgba(124,108,245,0.85), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <span className="text-[22px] font-bold leading-[1.1] text-white">
            Start Focus Session
          </span>
          <span className="grid h-9 w-9 place-items-center self-end rounded-full bg-white/20">
            <Icon name="chevron-right" size={18} className="text-white" />
          </span>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}
      whileHover={{ scale: 1.04, y: -2 }}
      className="glass-strong absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl px-4 py-3"
      style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{
          background: `${accent}26`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}55`,
        }}
      >
        <Icon name={loc.icon as IconName} size={20} />
      </span>

      <div className="text-left leading-tight">
        <div className="text-[15px] font-semibold text-white">{loc.title}</div>
        {loc.studyingAvatars ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-5 w-5 rounded-full ring-2 ring-white/20"
                  style={{
                    background: `linear-gradient(135deg, hsl(${
                      210 + i * 28
                    } 70% 68%), hsl(${250 + i * 20} 60% 55%))`,
                  }}
                />
              ))}
            </div>
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              +8
            </span>
          </div>
        ) : (
          <div className="text-[12px] text-[var(--text-dim)]">
            {loc.subtitle}
          </div>
        )}
      </div>

      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[var(--text-dim)]">
        <Icon name="chevron-right" size={15} />
      </span>
    </motion.button>
  );
}
