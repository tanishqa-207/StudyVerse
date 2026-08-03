"use client";

import { useState } from "react";
import Icon from "./Icon";
import { useProgress } from "@/lib/store";

export default function Analytics() {
  const [filter, setFilter] = useState<"week" | "month" | "year">("week");
  const p = useProgress();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-white">Your Progress</h2>
          <p className="text-[13px] text-[var(--text-dim)]">Track your study sessions and XP</p>
        </div>
        <div className="flex bg-white/10 rounded-lg p-1">
          {(["week", "month", "year"] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-[12px] font-semibold rounded-md transition ${filter === f ? 'bg-[var(--violet)] text-white' : 'text-[var(--text-faint)] hover:text-white'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass flex flex-col p-4 rounded-2xl">
          <span className="text-[13px] text-[var(--text-dim)] font-medium mb-1 flex items-center gap-2"><Icon name="flame" size={14} className="text-[var(--amber)]" /> Current Streak</span>
          <span className="text-[24px] font-bold text-white">{p.streakDays} Days</span>
        </div>
        <div className="glass flex flex-col p-4 rounded-2xl">
          <span className="text-[13px] text-[var(--text-dim)] font-medium mb-1 flex items-center gap-2"><Icon name="star" size={14} className="text-[var(--violet-bright)]" /> Total XP Earned</span>
          <span className="text-[24px] font-bold text-white">{p.points.toLocaleString()}</span>
        </div>
        <div className="glass flex flex-col p-4 rounded-2xl">
          <span className="text-[13px] text-[var(--text-dim)] font-medium mb-1 flex items-center gap-2"><Icon name="clock" size={14} className="text-[var(--blue)]" /> Study Time Today</span>
          <span className="text-[24px] font-bold text-white">{Math.floor(p.studyMinutesToday / 60)}h {p.studyMinutesToday % 60}m</span>
        </div>
        <div className="glass flex flex-col p-4 rounded-2xl">
          <span className="text-[13px] text-[var(--text-dim)] font-medium mb-1 flex items-center gap-2"><Icon name="check" size={14} className="text-[var(--green)]" /> Goals Completed</span>
          <span className="text-[24px] font-bold text-white">{Math.floor(p.streakDays * 1.5)}</span>
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl p-4 flex flex-col">
        <span className="text-[14px] font-semibold mb-4">Study Trends</span>
        <div className="flex-1 flex items-end justify-between gap-2 border-b border-l border-white/10 pb-2 pl-2">
          {/* Mock Bar Chart */}
          {Array.from({ length: filter === "week" ? 7 : filter === "month" ? 14 : 12 }).map((_, i) => {
            const height = 20 + Math.random() * 80;
            return (
              <div key={i} className="flex flex-col items-center gap-2 w-full">
                <div 
                  className="w-full max-w-[24px] rounded-t-md bg-[var(--violet)] transition-all"
                  style={{ height: `${height}%`, opacity: 0.6 + (height / 100) * 0.4 }}
                />
                <span className="text-[9px] text-[var(--text-faint)]">{filter === "week" ? ['M','T','W','T','F','S','S'][i] : i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
