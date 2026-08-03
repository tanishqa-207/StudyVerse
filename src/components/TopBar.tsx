"use client";

import { useState } from "react";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { useUsername, useAvatarId, useProgress } from "@/lib/store";
import { useUI } from "@/lib/uiStore";
import { useAssistant } from "@/lib/assistantStore";

export default function TopBar() {
  const username = useUsername();
  const avatarId = useAvatarId();
  const progress = useProgress();
  const openModal = useUI((s) => s.openModal);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const sendToAssistant = useAssistant((s) => s.send);
  const [query, setQuery] = useState("");

  const ask = () => {
    if (!query.trim()) return;
    sendToAssistant(query.trim());
    setQuery("");
  };

  return (
    <header className="flex items-center gap-2 sm:gap-4 px-3 sm:px-7 pt-3 sm:pt-6">
      {/* Mobile hamburger menu toggle */}
      <button
        onClick={toggleSidebar}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/8 text-white transition hover:bg-white/15 md:hidden"
        aria-label="Toggle navigation menu"
        title="Menu"
      >
        <Icon name="menu" size={20} />
      </button>

      {/* search — expanded to fill the row; Enter asks the AI assistant */}
      <div className="glass flex h-11 sm:h-12 min-w-0 flex-1 items-center gap-2 sm:gap-3 rounded-2xl px-3 sm:px-5 text-[var(--text-dim)]">
        <Icon name="search" size={18} className="shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          className="w-full bg-transparent text-[13.5px] sm:text-[15px] text-white placeholder:text-[var(--text-faint)] focus:outline-none"
          placeholder="Ask anything — topics, notes, code…"
        />
        <button
          onClick={ask}
          disabled={!query.trim()}
          className="flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-[12px] font-semibold text-white transition disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
        >
          <Icon name="sparkle" size={14} />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>

      {/* day streak */}
      <button
        onClick={() => openModal("streak")}
        className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 rounded-2xl px-1.5 sm:px-2 py-1 transition hover:bg-white/5"
      >
        <span className="text-xl sm:text-2xl" style={{ filter: "drop-shadow(0 0 8px rgba(245,150,60,0.6))" }}>
          🔥
        </span>
        <div className="text-left leading-tight">
          <div className="text-sm sm:text-lg font-bold">{progress.streakDays}</div>
          <div className="hidden sm:block text-[11px] text-[var(--text-faint)]">Day Streak</div>
        </div>
      </button>

      {/* profile pill → opens Manage Profiles */}
      <button
        onClick={() => openModal("profile")}
        className="glass-strong flex h-11 sm:h-12 shrink-0 items-center gap-2 sm:gap-3 rounded-2xl py-1 pl-1 pr-2.5 sm:pl-1.5 sm:pr-4 transition hover:brightness-110"
      >
        <div className="relative">
          <Avatar size={34} variant={avatarId} />
          <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 sm:h-4 sm:w-4 place-items-center rounded-full bg-[var(--amber)] text-[8px] sm:text-[9px] font-bold text-[#3a2600] ring-2 ring-[#20265f]">
            {progress.level}
          </span>
        </div>
        <div className="hidden sm:block text-left leading-tight">
          <div className="text-[14px] font-semibold">{username}</div>
          <div className="text-[11px] text-[var(--text-faint)]">Level {progress.level}</div>
        </div>
        <Icon name="chevron-down" size={15} className="text-[var(--text-faint)]" />
      </button>
    </header>
  );
}
