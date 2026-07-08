"use client";

import { motion } from "framer-motion";
import Icon from "./Icon";
import { todaysProgress } from "@/lib/demoData";

export default function TodaysProgress() {
  const p = todaysProgress;
  const xpPct = Math.round((p.xp / p.xpToNext) * 100);

  return (
    <div className="glass-strong flex h-full w-[340px] shrink-0 flex-col gap-4 rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Today&apos;s Progress</h2>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-[var(--text-dim)]">
          <Icon name="dots" size={18} />
        </button>
      </div>

      {/* XP progress */}
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 text-[13px] text-[var(--text-dim)]">XP Progress</div>
        <div className="flex items-center gap-3">
          <LevelHex level={p.level} size={40} />
          <div className="text-[22px] font-bold">
            {p.xp}
            <span className="text-[var(--text-faint)]"> / {p.xpToNext} XP</span>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #9a8bff, #6f5fe0)" }}
          />
        </div>
      </div>

      {/* coins + gems */}
      <div className="grid grid-cols-2 gap-4">
        <StatTile
          icon="coin"
          label="Coins"
          value={p.coins}
          color="#f5b74a"
        />
        <StatTile icon="gem" label="Gems" value={p.gems} color="#56b6f5" />
      </div>

      {/* study time + daily goal */}
      <div className="glass flex flex-col gap-4 rounded-2xl p-4">
        <Row
          icon="clock"
          color="#9a8bff"
          label="Study Time"
          sub="Today"
          value={p.studyTimeToday}
        />
        <div className="h-px bg-white/8" />
        <Row
          icon="target"
          color="#48d38a"
          label="Daily Goal"
          sub="Goal"
          value={p.dailyGoal}
        />
      </div>

      {/* motivational quote */}
      <div className="glass relative mt-auto overflow-hidden rounded-2xl p-4">
        <p className="text-[15px] font-medium leading-snug text-[var(--text-dim)]">
          {p.quote}
        </p>
        <span className="absolute right-3 top-3 text-[var(--violet-bright)]">
          <Icon name="sparkle" size={18} />
        </span>
      </div>
    </div>
  );
}

function LevelHex({ level, size = 40 }: { level: number; size?: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className="absolute">
        <defs>
          <linearGradient id="hex-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9a8bff" />
            <stop offset="100%" stopColor="#6355d6" />
          </linearGradient>
        </defs>
        <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" fill="url(#hex-g)" />
      </svg>
      <span className="relative text-[15px] font-bold text-white">{level}</span>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: "coin" | "gem";
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center gap-2 text-[13px] text-[var(--text-dim)]">
        <span style={{ color }}>
          <Icon name={icon} size={18} />
        </span>
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Row({
  icon,
  color,
  label,
  sub,
  value,
}: {
  icon: "clock" | "target";
  color: string;
  label: string;
  sub: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="grid h-10 w-10 place-items-center rounded-xl"
        style={{ background: `${color}22`, color }}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold">{label}</div>
        <div className="text-[12px] text-[var(--text-faint)]">{sub}</div>
      </div>
      <div className="ml-auto text-[15px] font-semibold">{value}</div>
    </div>
  );
}
