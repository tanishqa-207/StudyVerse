"use client";

import { useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import Avatar from "./Avatar";
import StudyRoom from "./StudyRoom";
import { useStore, useProgress, AVATAR_COUNT } from "@/lib/store";
import { useUI } from "@/lib/uiStore";

// ---- Quest Hub — claimable quests award real XP + coins ----
interface Quest {
  id: string;
  title: string;
  reward: { xp: number; coins: number };
  done: boolean; // eligible to claim
}

const INITIAL_QUESTS: Quest[] = [
  { id: "q1", title: "Complete a 25-min focus session", reward: { xp: 120, coins: 40 }, done: true },
  { id: "q2", title: "Study 3 different subjects today", reward: { xp: 200, coins: 60 }, done: true },
  { id: "q3", title: "Reach a 3-day streak", reward: { xp: 150, coins: 50 }, done: true },
  { id: "q4", title: "Focus for 2 hours total", reward: { xp: 300, coins: 90 }, done: false },
];

function QuestsModal() {
  const open = useUI((s) => s.modal === "quests");
  const closeModal = useUI((s) => s.closeModal);
  const showToast = useUI((s) => s.showToast);
  const awardXp = useStore((s) => s.awardXp);
  const [quests] = useState(INITIAL_QUESTS);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const claim = (q: Quest) => {
    if (claimed.has(q.id) || !q.done) return;
    awardXp(q.reward.xp, q.reward.coins);
    setClaimed((s) => new Set(s).add(q.id));
    showToast(`Quest claimed · +${q.reward.xp} XP · +${q.reward.coins} coins`);
  };

  return (
    <Modal open={open} onClose={closeModal} title="Quest Hub" subtitle="Complete quests to earn rewards." width={480}>
      <div className="flex flex-col gap-3">
        {quests.map((q) => {
          const isClaimed = claimed.has(q.id);
          return (
            <div key={q.id} className="glass flex items-center gap-3 rounded-2xl p-3.5">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ background: q.done ? "rgba(245,183,74,0.18)" : "rgba(255,255,255,0.06)", color: q.done ? "#f5b74a" : "var(--text-faint)" }}
              >
                <Icon name={isClaimed ? "check" : q.done ? "trophy" : "lock"} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{q.title}</div>
                <div className="text-[12px] text-[var(--text-faint)]">
                  +{q.reward.xp} XP · +{q.reward.coins} coins
                </div>
              </div>
              <button
                onClick={() => claim(q)}
                disabled={!q.done || isClaimed}
                className="shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition disabled:opacity-40"
                style={{ background: q.done && !isClaimed ? "linear-gradient(135deg,#8a7bf0,#6355e6)" : "rgba(255,255,255,0.08)" }}
              >
                {isClaimed ? "Claimed" : q.done ? "Claim" : "Locked"}
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// ---- Memory Forest — trees grow with level ----
function ForestModal() {
  const open = useUI((s) => s.modal === "memory-forest");
  const closeModal = useUI((s) => s.closeModal);
  const level = useProgress().level;
  const trees = Math.max(6, level + 3);

  return (
    <Modal open={open} onClose={closeModal} title="Memory Forest" subtitle="Every level plants a new tree in your forest." width={460}>
      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: trees }).map((_, i) => (
          <div
            key={i}
            className="grid aspect-square place-items-center rounded-2xl"
            style={{ background: i < level ? "rgba(72,211,138,0.14)" : "rgba(255,255,255,0.05)" }}
          >
            <span style={{ color: i < level ? "#48d38a" : "var(--text-faint)", opacity: i < level ? 1 : 0.5 }}>
              <Icon name="tree" size={22} />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[13px] text-[var(--text-dim)]">
        {level} of {trees} trees grown — keep focusing to grow your forest.
      </p>
    </Modal>
  );
}

// ---- Streak ----
function StreakModal() {
  const open = useUI((s) => s.modal === "streak");
  const closeModal = useUI((s) => s.closeModal);
  const streak = useProgress().streakDays;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const active = Math.min(streak, 7);

  return (
    <Modal open={open} onClose={closeModal} title="Your Streak" subtitle="Study every day to keep the flame alive." width={420}>
      <div className="mb-6 flex flex-col items-center">
        <span className="text-[56px]" style={{ filter: "drop-shadow(0 0 16px rgba(245,150,60,0.7))" }}>🔥</span>
        <div className="text-[32px] font-bold">{streak} days</div>
        <div className="text-[13px] text-[var(--text-faint)]">Current streak</div>
      </div>
      <div className="flex justify-between gap-2">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="grid h-11 w-full place-items-center rounded-xl"
              style={{ background: i < active ? "linear-gradient(135deg,#f5b74a,#f0803f)" : "rgba(255,255,255,0.06)" }}
            >
              {i < active ? <Icon name="check" size={18} className="text-white" /> : null}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">{d}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ---- Manage Profiles (add / switch / edit / delete) ----
type PMView =
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; id: string }
  | { kind: "delete"; id: string };

function ManageProfilesModal() {
  const open = useUI((s) => s.modal === "profile");
  const closeModal = useUI((s) => s.closeModal);
  const showToast = useUI((s) => s.showToast);
  const profiles = useStore((s) => s.profiles);
  const activeId = useStore((s) => s.activeId);
  const addProfile = useStore((s) => s.addProfile);
  const switchProfile = useStore((s) => s.switchProfile);
  const editProfile = useStore((s) => s.editProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);

  const [view, setView] = useState<PMView>({ kind: "list" });
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);

  const close = () => {
    setView({ kind: "list" });
    closeModal();
  };

  const startAdd = () => {
    setName("");
    setAvatar((profiles.length + 1) % AVATAR_COUNT);
    setView({ kind: "add" });
  };
  const startEdit = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setName(p.username);
    setAvatar(p.avatarId);
    setView({ kind: "edit", id });
  };

  const title =
    view.kind === "add"
      ? "Add Profile"
      : view.kind === "edit"
        ? "Edit Profile"
        : view.kind === "delete"
          ? "Delete Profile"
          : "Manage Profiles";

  return (
    <Modal open={open} onClose={close} title={title} width={460}>
      {view.kind === "list" && (
        <div className="flex flex-col gap-2.5">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="glass flex items-center gap-3 rounded-2xl p-3"
              style={p.id === activeId ? { boxShadow: "0 0 0 2px var(--violet-bright)" } : undefined}
            >
              <Avatar variant={p.avatarId} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[15px] font-semibold">
                  <span className="truncate">{p.username}</span>
                  {p.id === activeId && (
                    <span className="rounded-full bg-[var(--violet)]/30 px-2 py-0.5 text-[10px] font-semibold text-[var(--violet-bright)]">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[var(--text-faint)]">
                  Lvl {p.progress.level} · {p.progress.coins} coins · {p.progress.streakDays}d streak
                </div>
              </div>
              {p.id !== activeId && (
                <button
                  onClick={() => {
                    switchProfile(p.id);
                    showToast(`Switched to ${p.username}`);
                  }}
                  className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
                >
                  Switch
                </button>
              )}
              <button
                onClick={() => startEdit(p.id)}
                aria-label="Edit profile"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/8 text-[var(--text-dim)] transition hover:text-white"
              >
                <Icon name="sparkle" size={15} />
              </button>
              <button
                onClick={() => setView({ kind: "delete", id: p.id })}
                aria-label="Delete profile"
                disabled={profiles.length <= 1}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/8 text-[var(--text-dim)] transition hover:text-[#ff8a8a] disabled:opacity-30"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          ))}

          <button
            onClick={startAdd}
            className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 px-5 py-3 text-[14px] font-semibold text-[var(--text-dim)] transition hover:text-white"
          >
            <Icon name="plus" size={18} /> Add Profile
          </button>
        </div>
      )}

      {(view.kind === "add" || view.kind === "edit") && (
        <ProfileForm
          name={name}
          avatar={avatar}
          onName={setName}
          onAvatar={setAvatar}
          submitLabel={view.kind === "add" ? "Create Profile" : "Save Changes"}
          onCancel={() => setView({ kind: "list" })}
          onSubmit={() => {
            if (name.trim().length < 2) return;
            if (view.kind === "add") {
              addProfile(name, avatar);
              showToast(`Profile “${name.trim()}” created`);
            } else {
              editProfile(view.id, { username: name, avatarId: avatar });
              showToast("Profile updated");
            }
            setView({ kind: "list" });
          }}
        />
      )}

      {view.kind === "delete" && (
        <DeleteConfirm
          username={profiles.find((p) => p.id === view.id)?.username ?? ""}
          onCancel={() => setView({ kind: "list" })}
          onConfirm={() => {
            const p = profiles.find((x) => x.id === view.id);
            deleteProfile(view.id);
            showToast(`Deleted ${p?.username ?? "profile"}`);
            setView({ kind: "list" });
          }}
        />
      )}
    </Modal>
  );
}

function ProfileForm({
  name,
  avatar,
  onName,
  onAvatar,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  name: string;
  avatar: number;
  onName: (v: string) => void;
  onAvatar: (v: number) => void;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const valid = name.trim().length >= 2;
  return (
    <div>
      <label className="mb-2 block text-[13px] font-medium text-[var(--text-dim)]">Username</label>
      <input
        autoFocus
        value={name}
        maxLength={20}
        onChange={(e) => onName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="e.g. Nova"
        className="glass mb-4 w-full rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-[var(--text-faint)] focus:outline-none"
      />
      <label className="mb-3 block text-[13px] font-medium text-[var(--text-dim)]">Avatar</label>
      <div className="mb-6 grid grid-cols-6 gap-2.5">
        {Array.from({ length: AVATAR_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => onAvatar(i)}
            className="grid place-items-center rounded-xl p-1 transition"
            style={{
              background: i === avatar ? "rgba(124,108,245,0.28)" : "transparent",
              boxShadow: i === avatar ? "0 0 0 2px var(--violet-bright)" : "0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            <Avatar variant={i} size={46} ring={false} />
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={!valid}
          className="flex-1 rounded-2xl px-5 py-3 text-[14px] font-semibold text-white transition disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="rounded-2xl bg-white/8 px-5 py-3 text-[14px] font-semibold text-[var(--text-dim)] transition hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({
  username,
  onConfirm,
  onCancel,
}: {
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#ff6a6a]/15 text-[#ff8a8a]">
        <Icon name="close" size={26} />
      </span>
      <p className="mt-4 text-[15px]">
        Delete <span className="font-bold">{username}</span>?
      </p>
      <p className="mt-1 text-[13px] text-[var(--text-faint)]">
        This permanently removes the profile and all its progress. This cannot be undone.
      </p>
      <div className="mt-6 flex w-full gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-2xl px-5 py-3 text-[14px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#f0603f,#c53a2a)" }}
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl bg-white/8 px-5 py-3 text-[14px] font-semibold text-[var(--text-dim)] transition hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function LocationModals() {
  return (
    <>
      <QuestsModal />
      <StudyRoom />
      <ForestModal />
      <StreakModal />
      <ManageProfilesModal />
    </>
  );
}
