"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { useStore } from "@/lib/store";
import { useUI } from "@/lib/uiStore";
import { useTimer } from "@/lib/timerStore";
import { useRoom } from "@/lib/roomStore";

const PRESETS = [15, 25, 50];

export default function FocusSessionModal() {
  const open = useUI((s) => s.modal === "focus");
  const closeModal = useUI((s) => s.closeModal);
  const showToast = useUI((s) => s.showToast);
  const completeFocusSession = useStore((s) => s.completeFocusSession);

  const targetEndTime = useTimer((s) => s.targetEndTime);
  const originalDurationMins = useTimer((s) => s.originalDurationMins);
  const startTimer = useTimer((s) => s.startTimer);
  const stopTimer = useTimer((s) => s.stopTimer);
  const roomStatus = useRoom((s) => s.status);
  const leaveRoom = useRoom((s) => s.leaveRoom);

  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) setShowConfirm(false);
  }, [open]);

  useEffect(() => {
    if (originalDurationMins) {
      setMinutes(originalDurationMins);
    }
  }, [originalDurationMins]);

  useEffect(() => {
    if (!targetEndTime) {
      setLeft(minutes * 60);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0 && originalDurationMins) {
        stopTimer();
        completeFocusSession(originalDurationMins);
        showToast(`Focus complete · +${originalDurationMins * 10} XP · +${originalDurationMins * 4} coins`);
        if (open) closeModal();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetEndTime, originalDurationMins, minutes, open, closeModal, completeFocusSession, showToast, stopTimer]); // open added so it closes modal if open

  const pick = (m: number) => {
    if (targetEndTime) return; // running
    setMinutes(m);
    setLeft(m * 60);
  };

  const toggleTimer = () => {
    if (targetEndTime) {
      endEarly();
    } else {
      if (roomStatus === "in-room") {
        setShowConfirm(true);
      } else {
        startTimer(minutes);
      }
    }
  };

  const endEarly = () => {
    if (!targetEndTime) {
      closeModal();
      return;
    }
    const elapsed = Math.round((originalDurationMins! * 60 - left) / 60);
    stopTimer();
    if (elapsed >= 1) {
      completeFocusSession(elapsed);
      showToast(`Focus complete · +${elapsed * 10} XP · +${elapsed * 4} coins`);
    }
    closeModal();
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
        closeModal();
      }}
      title="Focus Session"
      subtitle="Earn 10 XP and 4 coins per minute focused."
      width={420}
    >
      {showConfirm ? (
        <div className="flex flex-col items-center justify-center p-6 text-center gap-6 min-h-[300px]">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--violet-bright)]/20 mb-2">
            <Icon name="users" size={28} className="text-[var(--violet-bright)]" />
          </div>
          <p className="text-[15px] text-[var(--text-dim)] leading-relaxed px-4">
            You are currently in a Study Room. Leave the room and start an Individual Study Session?
          </p>
          <div className="flex w-full gap-3 mt-4">
            <button
              onClick={() => {
                leaveRoom();
                startTimer(minutes);
                setShowConfirm(false);
              }}
              className="flex-1 rounded-2xl px-5 py-3.5 text-[14px] font-semibold text-white transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #8a7bf0, #6355e6)" }}
            >
              Leave Room & Start Session
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 rounded-2xl bg-white/8 px-5 py-3.5 text-[14px] font-semibold text-[var(--text-dim)] transition hover:text-white hover:bg-white/10"
            >
              Stay in Study Room
            </button>
          </div>
        </div>
      ) : (
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
              {targetEndTime ? "focusing…" : "ready"}
            </div>
          </div>
        </div>

        {/* presets */}
        <div className="mb-5 mt-2 flex gap-2">
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => pick(m)}
              disabled={!!targetEndTime}
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
            onClick={toggleTimer}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #8a7bf0, #6355e6)",
              boxShadow: "0 12px 30px -10px rgba(124,108,245,0.85)",
            }}
          >
            <Icon name={targetEndTime ? "close" : "play"} size={18} />
            {targetEndTime ? "Stop Timer" : left === minutes * 60 ? "Start Focus" : "Resume"}
          </button>
          <button
            onClick={endEarly}
            className="rounded-2xl bg-white/8 px-5 py-3.5 text-[15px] font-semibold text-[var(--text-dim)] transition hover:text-white"
          >
            {left < minutes * 60 && !!targetEndTime ? "End & Claim" : "Cancel"}
          </button>
        </div>
        </div>
      )}
    </Modal>
  );
}
