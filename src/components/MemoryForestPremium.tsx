"use client";

import { AnimatePresence, motion } from "framer-motion";
import Icon, { type IconName } from "./Icon";
import { useProgress, useStore } from "@/lib/store";
import { useUI } from "@/lib/uiStore";

export default function MemoryForestPremium() {
  const isOpen = useUI((s) => s.modal === "memory-forest-premium");
  const closeModal = useUI((s) => s.closeModal);
  const showToast = useUI((s) => s.showToast);
  const p = useProgress();
  const canUnlock = p.level >= 10 && p.coins >= 15000 && p.gems >= 20;
  const purchaseUnlock = useStore((s) => s.purchaseUnlock);

  const handleUnlock = () => {
    if (purchaseUnlock("section:memory-forest", { coins: 15000, gems: 20, minLevel: 10 })) {
      showToast("Memory Forest unlocked 🌳 — start taking notes!");
      closeModal();
      useUI.getState().openModal("memory-forest");
    }
  };

  const tools: { name: string; icon: IconName }[] = [
    { name: "Notes Templates", icon: "book" },
    { name: "Font Styles", icon: "type" },
    { name: "Font Size", icon: "maximize" },
    { name: "Bold", icon: "bold" },
    { name: "Italic", icon: "italic" },
    { name: "Underline", icon: "underline" },
    { name: "Color Themes", icon: "palette" },
    { name: "Writing Templates", icon: "layout" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-[90%] max-w-[500px] overflow-hidden rounded-[32px] p-6 sm:p-8"
            style={{ boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), 0 0 60px -12px var(--glow-violet)" }}
          >
            {/* neon top accent */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, var(--violet-bright), transparent)" }}
            />

            {/* close button */}
            <button
              onClick={closeModal}
              aria-label="Close modal"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/8 text-[var(--text-dim)] transition hover:bg-white/15 hover:text-white"
            >
              <Icon name="close" size={16} />
            </button>

            {/* header */}
            <div className="mb-6 text-center">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-[12px] font-semibold text-[var(--violet-bright)]">
                <Icon name="leaf" size={13} />
                Premium Feature
              </div>
              <h2 className="mt-3 text-[28px] font-bold">Memory Forest</h2>
              <p className="mt-1.5 text-[14px] text-[var(--text-dim)]">Advanced note-taking and organization tools</p>
            </div>

            {/* tools grid */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tools.map((tool) => (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="group relative flex flex-col items-center gap-2 rounded-xl bg-white/6 p-3 transition hover:bg-white/10"
                >
                  <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-[var(--text-faint)] transition group-hover:bg-white/15">
                    <Icon name={tool.icon as IconName} size={18} className="opacity-40" />
                    <div className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--violet-dark)] border border-white/10 text-white">
                      <Icon name="lock" size={9} />
                    </div>
                  </div>
                  <span className="text-center text-[11px] font-medium text-[var(--text-dim)]">{tool.name}</span>
                </motion.div>
              ))}
            </div>

            {/* unlock conditions */}
            <div className="rounded-2xl bg-white/6 p-4">
              <div className="mb-3 text-center">
                <div className="text-[13px] font-semibold text-white">Unlock Requirements</div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#9a8bff]/20 text-[#9a8bff]">
                    <Icon name="hexagon" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold">Level 10</div>
                    <div className="text-[11px] text-[var(--text-faint)]">Current: Level {p.level}</div>
                  </div>
                  {p.level >= 10 ? (
                    <div className="text-[#48d38a]">
                      <Icon name="check" size={18} />
                    </div>
                  ) : (
                    <div className="text-[var(--text-faint)]">
                      <Icon name="lock" size={18} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f5b74a]/20 text-[#f5b74a]">
                    <Icon name="coin" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold">15,000 Coins</div>
                    <div className="text-[11px] text-[var(--text-faint)]">You have: {p.coins.toLocaleString()}</div>
                  </div>
                  {p.coins >= 15000 ? (
                    <div className="text-[#48d38a]">
                      <Icon name="check" size={18} />
                    </div>
                  ) : (
                    <div className="text-[var(--text-faint)]">
                      <Icon name="lock" size={18} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#56b6f5]/20 text-[#56b6f5]">
                    <Icon name="gem" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold">20 Gems</div>
                    <div className="text-[11px] text-[var(--text-faint)]">You have: {p.gems.toLocaleString()}</div>
                  </div>
                  {p.gems >= 20 ? (
                    <div className="text-[#48d38a]">
                      <Icon name="check" size={18} />
                    </div>
                  ) : (
                    <div className="text-[var(--text-faint)]">
                      <Icon name="lock" size={18} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* action button */}
            <button
              onClick={handleUnlock}
              disabled={!canUnlock}
              className="mt-5 w-full rounded-xl px-4 py-3 text-[14px] font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={
                canUnlock
                  ? { background: "linear-gradient(135deg, var(--violet-bright), var(--violet-dark))", boxShadow: "0 12px 32px -8px var(--glow-violet)" }
                  : { background: "rgba(255,255,255,0.1)" }
              }
            >
              {canUnlock ? "Unlock Memory Forest" : "Complete Requirements to Unlock"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
