"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icon";
import { dailyQuote } from "@/lib/demoData";
import { useProgress, useStore } from "@/lib/store";
import { useUI } from "@/lib/uiStore";

function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TodaysProgress() {
  const p = useProgress();
  const openModal = useUI((s) => s.openModal);
  const xpPct = Math.min(100, Math.round((p.xp / p.xpToNext) * 100));

  return (
    <div className="glass-strong scroll-slim flex min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-[28px] p-5 xl:h-fit xl:w-[352px] xl:shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-[21px] font-bold tracking-tight">Today&apos;s Progress</h2>
        <div className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[12px] font-semibold text-[var(--text-dim)]">
          <Icon name="hexagon" size={15} className="text-[var(--violet-bright)]" />
          Lvl {p.level}
        </div>
      </div>

      {/* XP progress */}
      <div
        className="glass rounded-2xl p-4"
        style={{ boxShadow: "inset 0 0 0 1px rgba(154,139,255,0.1), 0 0 24px -14px var(--glow-violet)" }}
      >
        <div className="mb-3 flex items-center justify-between text-[13px] font-medium text-[var(--text-dim)]">
          <span>XP Progress</span>
          <span className="tabular-nums text-[var(--text-faint)]">{xpPct}%</span>
        </div>
        <div className="flex items-center gap-3">
          <LevelHex level={p.level} size={44} />
          <div className="text-[23px] font-bold tabular-nums leading-none">
            {p.xp}
            <span className="text-[15px] font-semibold text-[var(--text-faint)]"> / {p.xpToNext} XP</span>
          </div>
        </div>
        <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--violet-bright), var(--violet))",
              boxShadow: "0 0 12px -1px var(--glow-violet)",
            }}
          />
        </div>
      </div>

      {/* coins + gems — the Coins tile opens the Shop (coins have real value) */}
      <div className="grid grid-cols-2 gap-4">
        <StatTile
          icon="coin"
          label="Coins"
          value={p.coins}
          color="#f5b74a"
          onClick={() => openModal("shop")}
          hint="Shop"
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

      {/* motivational quote — changes automatically every calendar day. */}
      <div className="glass relative flex flex-col overflow-hidden rounded-2xl p-4 pr-10">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          Quote of the day
        </div>
        <p className="text-[15px] font-medium leading-snug text-[var(--text-dim)] flex items-center">
          {dailyQuote()}
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
  onClick,
  hint,
}: {
  icon: "coin" | "gem";
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  hint?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`glass hover-lift group relative rounded-2xl p-4 text-left ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[var(--text-dim)]">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{ background: `${color}22`, color, boxShadow: `0 0 14px -6px ${color}` }}
        >
          <Icon name={icon} size={16} />
        </span>
        {label}
      </div>
      <div className="text-[26px] font-bold tabular-nums leading-none">{value.toLocaleString()}</div>
      {hint && (
        <span
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-dim)] opacity-0 transition group-hover:opacity-100"
        >
          <Icon name="bag" size={11} /> {hint}
        </span>
      )}
    </Tag>
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
