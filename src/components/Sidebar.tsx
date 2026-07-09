"use client";

import { motion } from "framer-motion";
import Icon, { IconName } from "./Icon";
import Emblem from "./Emblem";
import MusicPlayer from "./MusicPlayer";
import { navItems, type NavKey } from "@/lib/demoData";
import { useUI, type View, type Modal } from "@/lib/uiStore";
import { useStore } from "@/lib/store";
import { playClick } from "@/lib/sound";

// Each nav item maps to a view + (optionally) a modal panel so every entry is
// functional. "Study" opens the focus session; the rest open their panel.
const NAV_MODAL: Record<NavKey, Modal> = {
  home: null,
  study: "focus",
  rooms: "rooms",
  quests: "quests",
  "memory-forest": "memory-forest",
  streak: "streak",
};

// Reverse map: which nav item a given open modal belongs to. Used to derive the
// active highlight from the *current* modal so that dismissing a panel (e.g.
// cancelling out of a Study Room) snaps the active tab back to Home — the
// underlying route — instead of leaving a stale tab highlighted.
const MODAL_NAV: Partial<Record<NonNullable<Modal>, NavKey>> = {
  focus: "study",
  rooms: "rooms",
  quests: "quests",
  "memory-forest": "memory-forest",
  streak: "streak",
};

export default function Sidebar() {
  const setView = useUI((s) => s.setView);
  const modal = useUI((s) => s.modal);
  const openModal = useUI((s) => s.openModal);
  const closeModal = useUI((s) => s.closeModal);

  // The active tab always reflects reality: whatever panel is open, else Home.
  const activeKey: NavKey = (modal && MODAL_NAV[modal]) || "home";

  const handleNav = (key: NavKey) => {
    playClick();
    setView(key as View);
    let target = NAV_MODAL[key];
    const state = useStore.getState();
    const profile = state.profiles.find((p) => p.id === state.activeId);
    if (key === "memory-forest" && !(profile?.progress.unlocks.includes("section:memory-forest"))) {
      target = "memory-forest-premium";
    }
    if (target) openModal(target);
    else closeModal();
  };

  return (
    <aside className="scroll-slim relative flex h-full w-[248px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#0d0b2e]/72 px-5 py-6 backdrop-blur-2xl">
      {/* brand */}
      <div className="mb-9 flex items-center gap-3 px-1">
        <Emblem size={42} />
        <div className="leading-tight">
          <div className="text-[19px] font-bold tracking-tight">StudyVerse</div>
          <div className="text-[11px] text-[var(--text-faint)]">
            Level Up Together.
          </div>
        </div>
      </div>

      {/* nav */}
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className="relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-left transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(100deg, #7c6cf5, #6355e6)",
                    boxShadow: "0 10px 26px -8px rgba(124,108,245,0.75)",
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={`relative z-10 ${
                  isActive ? "text-white" : "text-[var(--text-dim)]"
                }`}
              >
                <Icon name={item.icon as IconName} size={21} />
              </span>
              <span
                className={`relative z-10 text-[15px] font-medium ${
                  isActive ? "text-white" : "text-[var(--text-dim)]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* footer: floating emblem + the focus-music player (bottom-left) */}
      <div className="mt-auto flex flex-col gap-3 pt-6">
        {/* Decorative figure — never intercepts clicks so the player below it
            stays fully interactive (pointer-events-none on the whole block). */}
        <div className="pointer-events-none relative flex h-[128px] items-center justify-center">
          <StarField />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <Emblem size={78} glow />
          </motion.div>
          {/* glowing platform */}
          <div
            className="absolute bottom-3 h-4 w-28 rounded-[50%]"
            style={{
              background:
                "radial-gradient(50% 100% at 50% 50%, rgba(124,108,245,0.9), rgba(124,108,245,0))",
              filter: "blur(2px)",
            }}
          />
        </div>

        {/* z-20 keeps the player and its popover above the decorative figure. */}
        <MusicPlayer className="relative z-20" />
      </div>
    </aside>
  );
}

function StarField() {
  const stars = [
    [20, 30],
    [80, 20],
    [60, 60],
    [30, 75],
    [88, 70],
    [12, 55],
    [50, 15],
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {stars.map(([x, y], i) => (
        <span
          key={i}
          className="absolute h-[3px] w-[3px] rounded-full bg-white"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animation: `twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
