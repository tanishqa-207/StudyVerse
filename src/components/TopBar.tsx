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
  const sendToAssistant = useAssistant((s) => s.send);
  const [query, setQuery] = useState("");

  const ask = () => {
    if (!query.trim()) return;
    sendToAssistant(query.trim());
    setQuery("");
  };

  return (
    <header className="flex items-center gap-4 px-7 pt-6">
      {/* search — expanded to fill the row; Enter asks the AI assistant */}
      <div className="glass flex h-12 flex-1 items-center gap-3 rounded-2xl px-5 text-[var(--text-dim)]">
        <Icon name="search" size={20} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          className="w-full bg-transparent text-[15px] text-white placeholder:text-[var(--text-faint)] focus:outline-none"
          placeholder="Ask anything — topics, notes, weather, code, science…"
        />
        <button
          onClick={ask}
          disabled={!query.trim()}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-white transition disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
        >
          <Icon name="sparkle" size={14} />
          Ask AI
        </button>
      </div>

      {/* day streak */}
      <button
        onClick={() => openModal("streak")}
        className="flex shrink-0 items-center gap-2.5 rounded-2xl px-2 py-1 transition hover:bg-white/5"
      >
        <span className="text-2xl" style={{ filter: "drop-shadow(0 0 8px rgba(245,150,60,0.6))" }}>
          🔥
        </span>
        <div className="text-left leading-tight">
          <div className="text-lg font-bold">{progress.streakDays}</div>
          <div className="text-[11px] text-[var(--text-faint)]">Day Streak</div>
        </div>
      </button>

      {/* profile pill → opens Manage Profiles */}
      <button
        onClick={() => openModal("profile")}
        className="glass-strong flex h-12 shrink-0 items-center gap-3 rounded-2xl py-1 pl-1.5 pr-4 transition hover:brightness-110"
      >
        <div className="relative">
          <Avatar size={38} variant={avatarId} />
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--amber)] text-[9px] font-bold text-[#3a2600] ring-2 ring-[#20265f]">
            {progress.level}
          </span>
        </div>
        <div className="text-left leading-tight">
          <div className="text-[14px] font-semibold">{username}</div>
          <div className="text-[11px] text-[var(--text-faint)]">Level {progress.level}</div>
        </div>
        <Icon name="chevron-down" size={16} className="text-[var(--text-faint)]" />
      </button>
    </header>
  );
}
