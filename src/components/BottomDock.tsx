"use client";

import { useState } from "react";
import Icon from "./Icon";
import { nowPlaying, demoUser } from "@/lib/demoData";

export default function BottomDock() {
  return (
    <div className="flex items-stretch gap-5 px-1">
      <MusicPlayer />
      <LevelProgress />
    </div>
  );
}

function MusicPlayer() {
  const [playing, setPlaying] = useState(nowPlaying.isPlaying);

  return (
    <div className="glass-strong flex flex-1 items-center gap-4 rounded-3xl p-3.5">
      {/* album art */}
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#3a2f6e] to-[#1a1440]">
        <div className="relative text-2xl">🌙</div>
      </div>

      <div className="min-w-0 leading-tight">
        <div className="truncate text-[16px] font-semibold">
          {nowPlaying.title}
        </div>
        <div className="truncate text-[12px] text-[var(--text-faint)]">
          {nowPlaying.subtitle}
        </div>
      </div>

      {/* controls */}
      <div className="ml-2 flex items-center gap-2">
        <button className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] hover:text-white">
          <Icon name="skip-back" size={18} />
        </button>
        <button
          onClick={() => setPlaying((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-full text-white"
          style={{
            background: "linear-gradient(135deg, #8a7bf0, #6355e6)",
            boxShadow: "0 8px 22px -6px rgba(124,108,245,0.8)",
          }}
        >
          <Icon name={playing ? "pause" : "play"} size={20} />
        </button>
        <button className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] hover:text-white">
          <Icon name="skip-forward" size={18} />
        </button>
      </div>

      {/* equalizer */}
      <div className="ml-2 hidden items-end gap-[3px] sm:flex" style={{ height: 34 }}>
        {Array.from({ length: 26 }).map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{
              height: "100%",
              transformOrigin: "bottom",
              background:
                "linear-gradient(180deg, #b3a9ff, #7c6cf5)",
              animation: playing
                ? `eq ${0.7 + (i % 5) * 0.18}s ease-in-out ${i * 0.05}s infinite`
                : "none",
              transform: playing ? undefined : "scaleY(0.2)",
              opacity: 0.9,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function LevelProgress() {
  const xpRemaining = demoUser.xpToNext - demoUser.xp;
  const pct = Math.round((demoUser.xp / demoUser.xpToNext) * 100);

  return (
    <div className="glass-strong flex w-[420px] shrink-0 items-center gap-4 rounded-3xl p-4">
      <div className="relative grid h-14 w-14 shrink-0 place-items-center">
        <svg viewBox="0 0 24 24" className="absolute h-14 w-14">
          <defs>
            <linearGradient id="lvl-hex" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9a8bff" />
              <stop offset="100%" stopColor="#5f4fd6" />
            </linearGradient>
          </defs>
          <path
            d="M12 2.5 20 7v10l-8 4.5L4 17V7z"
            fill="url(#lvl-hex)"
            stroke="#c9c2ff"
            strokeWidth={0.6}
          />
        </svg>
        <span className="relative text-xl font-bold text-white">
          {demoUser.level}
        </span>
      </div>

      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[17px] font-bold">Level {demoUser.level}</span>
        </div>
        <div className="mb-2 text-[12px] text-[var(--text-faint)]">
          Next Level in {xpRemaining} XP
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #9a8bff, #6f5fe0)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
