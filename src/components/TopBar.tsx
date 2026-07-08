"use client";

import Icon from "./Icon";
import Avatar from "./Avatar";
import { demoUser } from "@/lib/demoData";

export default function TopBar() {
  return (
    <header className="flex items-center gap-4 px-7 pt-6">
      <button className="glass grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[var(--text-dim)] transition-colors hover:text-white">
        <Icon name="menu" size={22} />
      </button>

      {/* search */}
      <div className="glass flex h-12 flex-1 items-center gap-3 rounded-2xl px-5 text-[var(--text-dim)]">
        <Icon name="search" size={20} />
        <input
          className="w-full bg-transparent text-[15px] text-white placeholder:text-[var(--text-faint)] focus:outline-none"
          placeholder="Search for topics, notes, questions..."
        />
        <kbd className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-[var(--text-faint)]">
          ⌘K
        </kbd>
      </div>

      {/* day streak */}
      <div className="flex shrink-0 items-center gap-2.5 px-1">
        <span className="text-2xl" style={{ filter: "drop-shadow(0 0 8px rgba(245,150,60,0.6))" }}>
          🔥
        </span>
        <div className="leading-tight">
          <div className="text-lg font-bold">{demoUser.streakDays}</div>
          <div className="text-[11px] text-[var(--text-faint)]">Day Streak</div>
        </div>
      </div>

      {/* profile pill (display only — no auth/profile page) */}
      <div className="glass-strong flex h-12 shrink-0 items-center gap-3 rounded-2xl py-1 pl-1.5 pr-4">
        <div className="relative">
          <Avatar size={38} />
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--amber)] text-[9px] font-bold text-[#3a2600] ring-2 ring-[#20265f]">
            {demoUser.level}
          </span>
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold">{demoUser.name}</div>
          <div className="text-[11px] text-[var(--text-faint)]">
            Level {demoUser.level}
          </div>
        </div>
        <Icon name="chevron-down" size={16} className="text-[var(--text-faint)]" />
      </div>
    </header>
  );
}
