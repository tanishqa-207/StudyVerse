"use client";

// One-time onboarding — no authentication. The user picks a username and one of
// 12 default avatars; the choice is persisted locally so this screen is skipped
// on every future launch.

import { useState } from "react";
import { motion } from "framer-motion";
import Avatar from "./Avatar";
import Emblem from "./Emblem";
import Icon from "./Icon";
import { AVATAR_COUNT } from "@/lib/demoData";
import { useStore } from "@/lib/store";

export default function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [username, setUsername] = useState("");
  const [avatarId, setAvatarId] = useState(0);
  const [touched, setTouched] = useState(false);

  const valid = username.trim().length >= 2;

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    completeOnboarding(username, avatarId);
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[var(--bg-0)] px-4">
      {/* ambient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, #5b62c9 0%, #2a2f6e 45%, #0a0e2a 100%)",
        }}
      />
      {[...Array(28)].map((_, i) => (
        <span
          key={i}
          className="absolute h-[3px] w-[3px] rounded-full bg-white"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            animation: `twinkle ${2 + (i % 3)}s ease-in-out ${(i % 5) * 0.3}s infinite`,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="glass-strong relative z-10 w-full max-w-[540px] rounded-[32px] p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Emblem size={64} glow />
          <h1 className="mt-4 text-[28px] font-bold tracking-tight">
            Welcome to StudyVerse
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-dim)]">
            Pick a name and an avatar to start leveling up.
          </p>
        </div>

        {/* username */}
        <label className="mb-2 block text-[13px] font-medium text-[var(--text-dim)]">
          Username
        </label>
        <div
          className={`glass mb-1 flex h-13 items-center gap-3 rounded-2xl px-4 py-3 transition ${
            touched && !valid ? "ring-1 ring-[#ff7a7a]" : ""
          }`}
        >
          <Icon name="sparkle" size={18} className="text-[var(--violet-bright)]" />
          <input
            autoFocus
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Nova"
            className="w-full bg-transparent text-[16px] text-white placeholder:text-[var(--text-faint)] focus:outline-none"
          />
        </div>
        <div className="mb-5 h-4 text-[12px] text-[#ff9a9a]">
          {touched && !valid ? "Please enter at least 2 characters." : ""}
        </div>

        {/* avatar grid */}
        <label className="mb-3 block text-[13px] font-medium text-[var(--text-dim)]">
          Choose your avatar
        </label>
        <div className="mb-7 grid grid-cols-6 gap-3">
          {Array.from({ length: AVATAR_COUNT }).map((_, i) => {
            const selected = i === avatarId;
            return (
              <button
                key={i}
                onClick={() => setAvatarId(i)}
                aria-pressed={selected}
                className="relative grid place-items-center rounded-2xl p-1 transition"
                style={{
                  background: selected ? "rgba(124,108,245,0.28)" : "transparent",
                  boxShadow: selected
                    ? "0 0 0 2px var(--violet-bright), 0 10px 24px -10px rgba(124,108,245,0.9)"
                    : "0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >
                <Avatar variant={i} size={52} ring={false} />
                {selected && (
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--violet)] text-white ring-2 ring-[#0b1030]">
                    <Icon name="chevron-right" size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={submit}
          disabled={!valid}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[16px] font-semibold text-white transition disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #8a7bf0, #6355e6)",
            boxShadow: "0 16px 40px -12px rgba(124,108,245,0.85)",
          }}
        >
          Enter StudyVerse
          <Icon name="chevron-right" size={18} />
        </button>
      </motion.div>
    </div>
  );
}
