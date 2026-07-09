"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icon";
import { todaysProgress } from "@/lib/demoData";
import { useProgress, useStore } from "@/lib/store";

function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TodaysProgress() {
  const p = useProgress();
  const xpPct = Math.min(100, Math.round((p.xp / p.xpToNext) * 100));

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
          value={fmt(p.studyMinutesToday)}
        />
        <div className="h-px bg-white/8" />
        <DailyGoalRow goalMinutes={p.dailyGoalMinutes} />
      </div>

      {/* motivational quote */}
      <div className="glass relative mt-auto overflow-hidden rounded-2xl p-4">
        <p className="text-[15px] font-medium leading-snug text-[var(--text-dim)]">
          {todaysProgress.quote}
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

// Editable Daily Goal — click the pencil to adjust in 5-minute steps; the value
// is saved to the store (local storage) and best-effort synced to Supabase.
function DailyGoalRow({ goalMinutes }: { goalMinutes: number }) {
  const setDailyGoal = useStore((s) => s.setDailyGoal);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goalMinutes);

  const open = () => {
    setDraft(goalMinutes);
    setEditing(true);
  };
  const step = (delta: number) =>
    setDraft((v) => Math.max(15, Math.min(720, v + delta)));
  const save = () => {
    setDailyGoal(draft);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ background: "#48d38a22", color: "#48d38a" }}
        >
          <Icon name="target" size={20} />
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold">Daily Goal</div>
          <div className="text-[12px] text-[var(--text-faint)]">Goal</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[15px] font-semibold">{fmt(goalMinutes)}</span>
          <button
            onClick={editing ? () => setEditing(false) : open}
            aria-label={editing ? "Close goal editor" : "Edit daily goal"}
            className="grid h-7 w-7 place-items-center rounded-lg bg-white/8 text-[var(--text-dim)] transition hover:text-white"
          >
            <Icon name={editing ? "close" : "pencil"} size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => step(-15)}
                aria-label="Decrease goal"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8 text-white transition hover:bg-white/15"
              >
                <Icon name="minus" size={16} />
              </button>
              <div className="flex-1 rounded-xl bg-white/8 py-2 text-center text-[15px] font-semibold tabular-nums">
                {fmt(draft)}
              </div>
              <button
                onClick={() => step(15)}
                aria-label="Increase goal"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8 text-white transition hover:bg-white/15"
              >
                <Icon name="plus" size={16} />
              </button>
              <button
                onClick={save}
                className="shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white transition"
                style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
