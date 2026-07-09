"use client";

import { useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import Avatar from "./Avatar";
import StudyRoom from "./StudyRoom";
import NotesApp from "./NotesApp";
import {
  useStore,
  useProgress,
  useHasUnlock,
  AVATAR_COUNT,
} from "@/lib/store";
import { useUI } from "@/lib/uiStore";
import {
  REWARD_MILESTONES,
  ACCENT_THEMES,
  MEMORY_FOREST_UNLOCK,
  MEMORY_FOREST_COST,
} from "@/lib/demoData";

// ---- Winning — reward milestones unlock at lifetime-point thresholds ----
// Points are earned automatically (every XP earned adds points); each milestone
// can be claimed once the threshold is crossed, paying out real currency.
function WinningModal() {
  const open = useUI((s) => s.modal === "quests");
  const closeModal = useUI((s) => s.closeModal);
  const showToast = useUI((s) => s.showToast);
  const claimReward = useStore((s) => s.claimReward);
  const p = useProgress();

  const claim = (id: string) => {
    const m = REWARD_MILESTONES.find((x) => x.id === id);
    if (!m) return;
    if (claimReward(id)) {
      const bits = [
        m.reward.xp ? `+${m.reward.xp} XP` : null,
        m.reward.coins ? `+${m.reward.coins} coins` : null,
        m.reward.gems ? `+${m.reward.gems} gems` : null,
      ].filter(Boolean);
      showToast(`“${m.title}” claimed · ${bits.join(" · ")}`);
    }
  };

  // Progress toward the next unclaimed milestone.
  const next = REWARD_MILESTONES.find(
    (m) => p.points < m.points || !p.claimedRewards.includes(m.id),
  );

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Winning"
      subtitle="Earn points as you study — claim rewards at every milestone."
      width={480}
    >
      <div className="glass mb-4 flex items-center gap-4 rounded-2xl p-4">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
          style={{ background: "rgba(245,183,74,0.18)", color: "#f5b74a" }}
        >
          <Icon name="trophy" size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[22px] font-bold tabular-nums">
            {p.points.toLocaleString()}{" "}
            <span className="text-[14px] font-medium text-[var(--text-faint)]">points</span>
          </div>
          {next ? (
            <>
              <div className="mb-1.5 text-[12px] text-[var(--text-faint)]">
                {Math.max(0, next.points - p.points).toLocaleString()} pts to “{next.title}”
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((p.points / next.points) * 100))}%`,
                    background: "linear-gradient(90deg,#f5b74a,#f0803f)",
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-[12px] text-[var(--text-faint)]">All milestones claimed 🎉</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {REWARD_MILESTONES.map((m) => {
          const reached = p.points >= m.points;
          const isClaimed = p.claimedRewards.includes(m.id);
          const bits = [
            m.reward.xp ? `+${m.reward.xp} XP` : null,
            m.reward.coins ? `+${m.reward.coins} coins` : null,
            m.reward.gems ? `+${m.reward.gems} gems` : null,
          ].filter(Boolean);
          return (
            <div key={m.id} className="glass flex items-center gap-3 rounded-2xl p-3.5">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{
                  background: reached ? "rgba(245,183,74,0.18)" : "rgba(255,255,255,0.06)",
                  color: reached ? "#f5b74a" : "var(--text-faint)",
                }}
              >
                <Icon name={isClaimed ? "check" : reached ? "trophy" : "lock"} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{m.title}</div>
                <div className="text-[12px] text-[var(--text-faint)]">
                  {m.points.toLocaleString()} pts · {bits.join(" · ")}
                </div>
              </div>
              <button
                onClick={() => claim(m.id)}
                disabled={!reached || isClaimed}
                className="shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition disabled:opacity-40"
                style={{
                  background:
                    reached && !isClaimed
                      ? "linear-gradient(135deg,#8a7bf0,#6355e6)"
                      : "rgba(255,255,255,0.08)",
                }}
              >
                {isClaimed ? "Claimed" : reached ? "Claim" : "Locked"}
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// ---- Memory Forest — a premium SECTION (level + currency gated) ----
// Once unlocked it becomes a genuinely functional rich-text notebook (NotesApp).
function ForestModal() {
  const open = useUI((s) => s.modal === "memory-forest");
  const closeModal = useUI((s) => s.closeModal);
  const showToast = useUI((s) => s.showToast);
  const openModal = useUI((s) => s.openModal);
  const purchaseUnlock = useStore((s) => s.purchaseUnlock);
  const owned = useHasUnlock(MEMORY_FOREST_UNLOCK);
  const p = useProgress();

  const cost = MEMORY_FOREST_COST;
  const meetsLevel = p.level >= (cost.minLevel ?? 0);
  const affordable = p.coins >= cost.coins && p.gems >= (cost.gems ?? 0);
  const canUnlock = meetsLevel && affordable;

  const unlock = () => {
    if (purchaseUnlock(MEMORY_FOREST_UNLOCK, cost)) {
      showToast("Memory Forest unlocked 🌳 — start taking notes!");
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Memory Forest"
      subtitle={
        owned
          ? "Your private, auto-saving notebook."
          : "A premium writing studio — plant your knowledge."
      }
      width={owned ? 760 : 620}
    >
      {owned ? (
        <div className="relative">
          <NotesApp />
        </div>
      ) : (
        <ForestLocked
          cost={cost}
          meetsLevel={meetsLevel}
          affordable={affordable}
          canUnlock={canUnlock}
          onUnlock={unlock}
          onShop={() => openModal("shop")}
        />
      )}
    </Modal>
  );
}

// The rich-text features a member gets once the Forest is unlocked. Shown as a
// disabled preview behind a lock overlay so the value is visible but gated.
const FOREST_FEATURES: { label: string; kind: "chip" | "toggle" | "card"; glyph?: string }[] = [
  { label: "Fonts", kind: "chip" },
  { label: "Font Size", kind: "chip" },
  { label: "Bold", kind: "toggle", glyph: "B" },
  { label: "Italic", kind: "toggle", glyph: "I" },
  { label: "Underline", kind: "toggle", glyph: "U" },
  { label: "Templates", kind: "card" },
  { label: "Writing Styles", kind: "card" },
  { label: "Themes", kind: "card" },
  { label: "Color Presets", kind: "card" },
];

function ForestLocked({
  cost,
  meetsLevel,
  affordable,
  canUnlock,
  onUnlock,
  onShop,
}: {
  cost: typeof MEMORY_FOREST_COST;
  meetsLevel: boolean;
  affordable: boolean;
  canUnlock: boolean;
  onUnlock: () => void;
  onShop: () => void;
}) {
  const chips = FOREST_FEATURES.filter((f) => f.kind === "chip");
  const toggles = FOREST_FEATURES.filter((f) => f.kind === "toggle");
  const cards = FOREST_FEATURES.filter((f) => f.kind === "card");

  return (
    <div className="relative min-h-[420px]">
      {/* --- disabled feature preview (everything visible, nothing usable) --- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none space-y-4 overflow-hidden opacity-55 blur-[1.5px]"
      >
        {/* formatting toolbar mock */}
        <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">
          {chips.map((c) => (
            <span
              key={c.label}
              className="flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-[13px] font-medium text-[var(--text-dim)]"
            >
              {c.label}
              <Icon name="chevron-down" size={13} className="text-[var(--text-faint)]" />
            </span>
          ))}
          <span className="mx-1 h-6 w-px bg-white/12" />
          {toggles.map((t) => (
            <span
              key={t.label}
              title={t.label}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-[15px] text-[var(--text-dim)]"
              style={{
                fontStyle: t.glyph === "I" ? "italic" : undefined,
                fontWeight: 700,
                textDecoration: t.glyph === "U" ? "underline" : undefined,
              }}
            >
              {t.glyph}
            </span>
          ))}
        </div>

        {/* template / theme cards */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="glass flex items-center gap-3 rounded-2xl p-3.5">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ background: "rgba(154,139,255,0.16)", color: "var(--violet-bright)" }}
              >
                <Icon
                  name={c.label === "Color Presets" || c.label === "Themes" ? "palette" : "copy"}
                  size={19}
                />
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold">{c.label}</div>
                <div className="text-[11.5px] text-[var(--text-faint)]">Premium</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- lock overlay --- */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0b0b26]/45 px-5 text-center backdrop-blur-[2px]">
        <span
          className="grid h-16 w-16 place-items-center rounded-3xl"
          style={{
            background: "rgba(154,139,255,0.16)",
            color: "var(--violet-bright)",
            boxShadow: "0 0 34px -6px var(--glow-violet)",
          }}
        >
          <Icon name="lock" size={30} />
        </span>
        <h3 className="mt-4 text-[19px] font-bold text-white">
          🔒 Unlock Memory Forest at Level 10
        </h3>
        <p className="mt-1.5 max-w-[360px] text-[13px] text-[var(--text-dim)]">
          Unlock a full writing studio — fonts, formatting, colour themes and
          ready-made note & writing templates that auto-save per profile.
        </p>

        <div className="glass-strong mt-5 flex items-center justify-center gap-4 rounded-2xl px-5 py-3 text-[13px]">
          <span className={`flex items-center gap-1.5 font-semibold ${meetsLevel ? "text-[var(--text-dim)]" : "text-[#ff8a8a]"}`}>
            <Icon name="hexagon" size={15} className="text-[var(--violet-bright)]" /> Lvl {cost.minLevel}
          </span>
          <span className="text-[var(--text-faint)]">·</span>
          <span className={`flex items-center gap-1.5 font-semibold tabular-nums ${affordable ? "text-[var(--text-dim)]" : "text-[#ff8a8a]"}`}>
            <Icon name="coin" size={15} className="text-[var(--amber)]" /> {cost.coins.toLocaleString()}
          </span>
          {cost.gems ? (
            <>
              <span className="text-[var(--text-faint)]">·</span>
              <span className={`flex items-center gap-1.5 font-semibold tabular-nums ${affordable ? "text-[var(--text-dim)]" : "text-[#ff8a8a]"}`}>
                <Icon name="gem" size={15} className="text-[var(--blue)]" /> {cost.gems}
              </span>
            </>
          ) : null}
        </div>

        <button
          onClick={onUnlock}
          disabled={!canUnlock}
          className="mt-5 w-full max-w-[360px] rounded-2xl px-5 py-3 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            background: "linear-gradient(135deg, var(--violet-bright), var(--violet-dark))",
            boxShadow: canUnlock ? "0 14px 36px -12px var(--glow-violet)" : undefined,
          }}
        >
          {!meetsLevel
            ? `Reach level ${cost.minLevel} to unlock`
            : !affordable
              ? "Not enough coins / gems"
              : "Unlock Memory Forest"}
        </button>
        <button
          onClick={onShop}
          className="mt-2 text-[12px] font-semibold text-[var(--text-faint)] transition hover:text-white"
        >
          View in Shop →
        </button>
      </div>
    </div>
  );
}

// ---- Shop — spend coins/gems on real unlocks (section + cosmetics) ----
function ShopModal() {
  const open = useUI((s) => s.modal === "shop");
  const closeModal = useUI((s) => s.closeModal);
  const showToast = useUI((s) => s.showToast);
  const purchaseUnlock = useStore((s) => s.purchaseUnlock);
  const setAccent = useStore((s) => s.setAccent);
  const forestOwned = useHasUnlock(MEMORY_FOREST_UNLOCK);
  const p = useProgress();

  const buyForest = () => {
    if (purchaseUnlock(MEMORY_FOREST_UNLOCK, MEMORY_FOREST_COST)) {
      showToast("Memory Forest unlocked 🌳");
    }
  };

  const buyAccent = (id: string, price: number, name: string) => {
    if (purchaseUnlock(`accent:${id}`, { coins: price })) {
      setAccent(id);
      showToast(`“${name}” theme unlocked & applied`);
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Shop"
      subtitle="Spend your coins & gems on sections and themes."
      width={520}
    >
      {/* balance */}
      <div className="glass mb-5 flex items-center justify-center gap-6 rounded-2xl p-3 text-[15px] font-bold">
        <span className="flex items-center gap-2 tabular-nums">
          <Icon name="coin" size={18} className="text-[var(--amber)]" /> {p.coins.toLocaleString()}
        </span>
        <span className="flex items-center gap-2 tabular-nums">
          <Icon name="gem" size={18} className="text-[var(--blue)]" /> {p.gems.toLocaleString()}
        </span>
      </div>

      {/* sections */}
      <h3 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
        Sections
      </h3>
      <div className="glass mb-6 flex items-center gap-3 rounded-2xl p-3.5">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{ background: "rgba(72,211,138,0.16)", color: "#48d38a" }}
        >
          <Icon name="leaf" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">Memory Forest</div>
          <div className="text-[12px] text-[var(--text-faint)]">
            Lvl {MEMORY_FOREST_COST.minLevel} · {MEMORY_FOREST_COST.coins.toLocaleString()} coins
            {MEMORY_FOREST_COST.gems ? ` · ${MEMORY_FOREST_COST.gems} gems` : ""}
          </div>
        </div>
        <button
          onClick={buyForest}
          disabled={
            forestOwned ||
            p.level < (MEMORY_FOREST_COST.minLevel ?? 0) ||
            p.coins < MEMORY_FOREST_COST.coins ||
            p.gems < (MEMORY_FOREST_COST.gems ?? 0)
          }
          className="shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition disabled:opacity-40"
          style={{ background: forestOwned ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#2fa06a,#1e7a4e)" }}
        >
          {forestOwned ? "Owned" : "Unlock"}
        </button>
      </div>

      {/* accent themes */}
      <h3 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
        Accent Themes
      </h3>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {ACCENT_THEMES.map((t) => (
          <AccentCard key={t.id} theme={t} onBuy={buyAccent} onEquip={setAccent} />
        ))}
      </div>
    </Modal>
  );
}

function AccentCard({
  theme,
  onBuy,
  onEquip,
}: {
  theme: (typeof ACCENT_THEMES)[number];
  onBuy: (id: string, price: number, name: string) => void;
  onEquip: (id: string) => void;
}) {
  const p = useProgress();
  const unlocked = useHasUnlock(`accent:${theme.id}`);
  // "default" is free/always owned; others require the accent:<id> unlock.
  const owned = theme.price === 0 || unlocked;
  const equipped = p.accent === theme.id;

  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-3">
      <span
        className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/20"
        style={{ background: theme.swatch }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold">{theme.name}</div>
        <div className="text-[11px] text-[var(--text-faint)]">
          {owned ? "Owned" : `${theme.price.toLocaleString()} coins`}
        </div>
      </div>
      {equipped ? (
        <span className="shrink-0 rounded-xl bg-white/8 px-3 py-1.5 text-[12px] font-semibold text-[var(--violet-bright)]">
          Active
        </span>
      ) : owned ? (
        <button
          onClick={() => onEquip(theme.id)}
          className="shrink-0 rounded-xl bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-white/20"
        >
          Equip
        </button>
      ) : (
        <button
          onClick={() => onBuy(theme.id, theme.price, theme.name)}
          disabled={p.coins < theme.price}
          className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-white transition disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
        >
          Buy
        </button>
      )}
    </div>
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
  const setPreference = useStore((s) => s.setPreference);

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

          <div className="mt-4 border-t border-white/10 pt-5">
            <h3 className="mb-3 text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">
              Preferences (Active Profile)
            </h3>
            <div className="glass flex items-center justify-between rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <Icon name="volume" size={18} className="text-[var(--text-dim)]" />
                <span className="text-[14px] font-semibold text-white">Sound Effects</span>
              </div>
              <button
                onClick={() => {
                  const p = profiles.find((x) => x.id === activeId);
                  if (p) setPreference("soundOn", !p.preferences.soundOn);
                }}
                className={`relative h-[22px] w-[38px] rounded-full transition-colors ${
                  profiles.find((x) => x.id === activeId)?.preferences?.soundOn !== false
                    ? "bg-[var(--violet)]"
                    : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-transform ${
                    profiles.find((x) => x.id === activeId)?.preferences?.soundOn !== false
                      ? "translate-x-[19px]"
                      : "translate-x-[3px]"
                  }`}
                />
              </button>
            </div>
          </div>
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
      <WinningModal />
      <StudyRoom />
      <ForestModal />
      <ShopModal />
      <StreakModal />
      <ManageProfilesModal />
    </>
  );
}
