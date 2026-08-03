"use client";

import { motion } from "framer-motion";
import Icon, { type IconName } from "./Icon";
import { dailyQuote, REWARD_MILESTONES } from "@/lib/demoData";
import { useProgress } from "@/lib/store";
import { useUI, type Modal } from "@/lib/uiStore";
import { playClick } from "@/lib/sound";
import { DailyGoalRow } from "./TodaysProgress";

function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function MobileDashboard() {
  const p = useProgress();
  const openModal = useUI((s) => s.openModal);
  const xpPct = Math.min(100, Math.round((p.xp / p.xpToNext) * 100));

  const isMemoryForestLocked = !p.unlocks.includes("section:memory-forest");
  const claimable = REWARD_MILESTONES.filter(
    (m) => p.points >= m.points && !p.claimedRewards.includes(m.id)
  ).length;

  const handleOpen = (target: Modal | "memory-forest-premium") => {
    playClick();
    openModal(target as Modal);
  };

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5 pb-8 overflow-x-hidden md:hidden w-full max-w-full">
      
      {/* 1. Study Room */}
      <DashboardLocationCard
        title="STUDY ROOM"
        subtitle="Join others"
        icon="users"
        accent="#a58bff"
        onClick={() => handleOpen("rooms")}
      />

      {/* 2. Winning (Quests/Rewards) */}
      <DashboardLocationCard
        title="WINNING"
        subtitle={`${p.points.toLocaleString()} pts`}
        icon="trophy"
        accent="#3fe08a"
        badge={claimable > 0 ? claimable : undefined}
        onClick={() => handleOpen("quests")}
      />

      {/* 3. Today's Progress header */}
      <div className="mt-2 flex items-center justify-between">
        <h2 className="text-[20px] font-bold tracking-tight">Today&apos;s Progress</h2>
        <div className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[12px] font-semibold text-[var(--text-dim)]">
          <Icon name="hexagon" size={15} className="text-[var(--violet-bright)]" />
          Lvl {p.level}
        </div>
      </div>

      {/* 4. Coins & XP Grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button 
          onClick={() => { playClick(); openModal("shop"); }}
          className="glass flex w-full flex-col gap-1 rounded-2xl p-4 text-left transition hover:brightness-110 active:scale-95"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-dim)]">
            <Icon name="coin" size={16} style={{ color: "#f5b74a" }} />
            <span>Coins</span>
          </div>
          <div className="text-[22px] font-bold tabular-nums text-white">
            {p.coins.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-faint)] mt-1">Shop</div>
        </button>

        <div className="glass flex w-full flex-col gap-1 rounded-2xl p-4 text-left">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-dim)]">
            <Icon name="star" size={16} className="text-[var(--violet-bright)]" />
            <span>XP</span>
          </div>
          <div className="text-[22px] font-bold tabular-nums text-white">
            {xpPct}%
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
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
      </div>

      {/* 5. Daily Goal / Study Time */}
      <div className="glass flex w-full flex-col gap-4 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-[#9a8bff]">
              <Icon name="clock" size={20} />
            </span>
            <div>
              <div className="text-[14px] font-semibold">Study Time</div>
              <div className="text-[12px] text-[var(--text-faint)]">Today</div>
            </div>
          </div>
          <div className="text-[18px] font-bold tabular-nums">{fmt(p.studyMinutesToday)}</div>
        </div>
        <div className="h-px w-full bg-white/8" />
        <DailyGoalRow goalMinutes={p.dailyGoalMinutes} />
      </div>

      {/* 6. Focus Time */}
      <DashboardLocationCard
        title="FOCUS TIME"
        subtitle="Earn XP & coins"
        icon="play"
        accent="#4fc3ff"
        onClick={() => handleOpen("focus")}
      />

      {/* 7. Memory Forest */}
      <DashboardLocationCard
        title="MEMORY FOREST"
        subtitle={isMemoryForestLocked ? `Lvl ${p.level}/10 to unlock` : "Your notes"}
        icon="leaf"
        accent="#ff5fd0"
        locked={isMemoryForestLocked}
        onClick={() => handleOpen(isMemoryForestLocked ? "memory-forest-premium" : "memory-forest")}
      />

      {/* 7. Quote */}
      <div className="glass relative flex w-full flex-col overflow-hidden rounded-2xl p-4 pr-10">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          Quote of the day
        </div>
        <p className="text-[14px] font-medium leading-snug text-[var(--text-dim)] flex items-center">
          {dailyQuote()}
        </p>
        <span className="absolute right-3 top-3 text-[var(--violet-bright)]">
          <Icon name="sparkle" size={18} />
        </span>
      </div>
    </div>
  );
}

function DashboardLocationCard({ 
  title, subtitle, icon, accent, locked, badge, onClick 
}: { 
  title: string; subtitle: string; icon: IconName; accent: string; locked?: boolean; badge?: number; onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="glass relative flex w-full items-center gap-4 rounded-2xl p-4 text-left transition hover:brightness-110 active:scale-95 overflow-hidden"
      style={{ opacity: locked ? 0.75 : 1 }}
    >
      <div 
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: `linear-gradient(to top, ${accent}22, transparent)` }}
      />
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl relative z-10"
        style={{ background: `${accent}33`, color: accent, boxShadow: `0 0 16px -4px ${accent}66` }}
      >
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0 flex-1 relative z-10">
        <div className="text-[16px] font-bold tracking-wide" style={{ textShadow: `0 0 12px ${accent}66` }}>
          {title}
        </div>
        <div className="text-[13px] text-[var(--text-faint)]">
          {subtitle}
        </div>
      </div>
      {badge ? (
        <span className="relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--amber)] text-[12px] font-bold text-[#3a2600]">
          {badge}
        </span>
      ) : (
        <Icon name="chevron-right" size={20} className="text-[var(--text-faint)] relative z-10" />
      )}
    </button>
  );
}
