"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { useStore } from "@/lib/store";
import { useUI } from "@/lib/uiStore";

const PRESETS = [15, 25, 50];

export default function FocusSessionModal() {
  const open = useUI((s) => s.modal === "focus");
  const closeModal = useUI((s) => s.closeModal);
  const showToast = useUI((s) => s.showToast);
  const completeFocusSession = useStore((s) => s.completeFocusSession);

  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // reset when reopened
  useEffect(() => {
    if (open) {
      setRunning(false);
      setLeft(minutes * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setLeft((v) => Math.max(0, v - 1));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  // completion — fires once when the countdown reaches zero
  useEffect(() => {
    if (running && left === 0) finish(minutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running]);

  const finish = (mins: number) => {
    setRunning(false);
    completeFocusSession(mins);
    showToast(`Focus complete · +${mins * 10} XP · +${mins * 4} coins`);
    closeModal();
  };

  const pick = (m: number) => {
    if (running) return;
    setMinutes(m);
    setLeft(m * 60);
  };

  const endEarly = () => {
    const elapsed = Math.round((minutes * 60 - left) / 60);
    if (elapsed >= 1) finish(elapsed);
    else {
      setRunning(false);
      closeModal();
    }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = 1 - left / (minutes * 60);
  const R = 74;
  const C = 2 * Math.PI * R;

  return (
    <Modal
      open={open}
      onClose={() => {
        setRunning(false);
        closeModal();
      }}
      title="Focus Session"
      subtitle="Earn 10 XP and 4 coins per minute focused."
      width={420}
    >
      <div className="flex flex-col items-center">
        {/* ring timer */}
        <div className="relative my-2 grid h-[190px] w-[190px] place-items-center">
          <svg viewBox="0 0 180 180" className="absolute h-full w-full -rotate-90">
            <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke="url(#focus-grad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            <defs>
              <linearGradient id="focus-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#9a8bff" />
                <stop offset="100%" stopColor="#56b6f5" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <div className="font-mono text-[40px] font-bold tabular-nums">
              {mm}:{ss}
            </div>
            <div className="text-[12px] text-[var(--text-faint)]">
              {running ? "focusing…" : "ready"}
            </div>
          </div>
        </div>

        {/* presets */}
        <div className="mb-5 mt-2 flex gap-2">
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => pick(m)}
              disabled={running}
              className="rounded-xl px-4 py-2 text-[14px] font-semibold transition disabled:opacity-40"
              style={{
                background: minutes === m ? "linear-gradient(135deg,#8a7bf0,#6355e6)" : "rgba(255,255,255,0.08)",
                color: minutes === m ? "#fff" : "var(--text-dim)",
              }}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* controls */}
        <div className="flex w-full gap-3">
          <button
            onClick={() => setRunning((v) => !v)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #8a7bf0, #6355e6)",
              boxShadow: "0 12px 30px -10px rgba(124,108,245,0.85)",
            }}
          >
            <Icon name={running ? "pause" : "play"} size={18} />
            {running ? "Pause" : left === minutes * 60 ? "Start Focus" : "Resume"}
          </button>
          <button
            onClick={endEarly}
            className="rounded-2xl bg-white/8 px-5 py-3.5 text-[15px] font-semibold text-[var(--text-dim)] transition hover:text-white"
          >
            {left < minutes * 60 ? "End & Claim" : "Cancel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
