"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { useUI } from "@/lib/uiStore";
import { useRoom } from "@/lib/roomStore";
import { useActiveProfile } from "@/lib/store";

const DURATIONS = [15, 25, 50];

export default function StudyRoom() {
  const open = useUI((s) => s.modal === "rooms");
  const closeModal = useUI((s) => s.closeModal);
  const status = useRoom((s) => s.status);
  const inRoom = status === "in-room";

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={inRoom ? "Study Room" : "Study Rooms"}
      subtitle={
        inRoom ? undefined : "Create a private room or join one with an invite code."
      }
      width={inRoom ? 760 : 460}
    >
      {inRoom ? <InRoom /> : <Lobby />}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Lobby — create or join
// ---------------------------------------------------------------------------
function Lobby() {
  const { createRoom, joinByCode, status, error, prefillCode, setPrefillCode, transportKind } =
    useRoom();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(25);
  const [code, setCode] = useState("");
  const busy = status === "busy";

  // Prefill the join code from an invite link (?join=CODE).
  useEffect(() => {
    if (prefillCode) {
      setCode(prefillCode);
      setPrefillCode(null);
    }
  }, [prefillCode, setPrefillCode]);

  return (
    <div className="flex flex-col gap-5">
      {/* Create */}
      <section className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold">
          <Icon name="plus" size={16} className="text-[var(--violet-bright)]" /> Create a room
        </div>
        <input
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="Room name (e.g. Exam Grind)"
          className="mb-3 w-full rounded-xl bg-white/8 px-4 py-2.5 text-[14px] text-white placeholder:text-[var(--text-faint)] focus:outline-none"
        />
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[12px] text-[var(--text-faint)]">Timer</span>
          {DURATIONS.map((m) => (
            <button
              key={m}
              onClick={() => setDuration(m)}
              className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition"
              style={{
                background: duration === m ? "linear-gradient(135deg,#8a7bf0,#6355e6)" : "rgba(255,255,255,0.08)",
                color: duration === m ? "#fff" : "var(--text-dim)",
              }}
            >
              {m}m
            </button>
          ))}
        </div>
        <button
          onClick={() => createRoom(name, duration)}
          disabled={busy}
          className="w-full rounded-xl px-5 py-3 text-[14px] font-semibold text-white transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
        >
          {busy ? "Creating…" : "Create room"}
        </button>
      </section>

      {/* Join */}
      <section className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold">
          <Icon name="link" size={16} className="text-[var(--blue)]" /> Join with a code
        </div>
        <div className="flex gap-2">
          <input
            value={code}
            maxLength={8}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinByCode(code)}
            placeholder="ROOM CODE"
            className="w-full rounded-xl bg-white/8 px-4 py-2.5 text-[15px] font-semibold uppercase tracking-widest text-white placeholder:text-[var(--text-faint)] placeholder:tracking-normal focus:outline-none"
          />
          <button
            onClick={() => joinByCode(code)}
            disabled={busy || code.trim().length < 4}
            className="shrink-0 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#56b6f5,#3f8ce0)" }}
          >
            Join
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-[#ff6a6a]/15 px-3.5 py-2.5 text-[12.5px] text-[#ffb3b3]">
          {error}
        </div>
      )}

      <p className="text-center text-[11.5px] text-[var(--text-faint)]">
        {transportKind === "supabase"
          ? "Live across devices via Supabase Realtime."
          : "Local mode — rooms sync live across tabs in this browser. Add Supabase keys for cross-device rooms."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// In-room — timer + participants + chat + invite/leave
// ---------------------------------------------------------------------------
function InRoom() {
  const room = useRoom((s) => s.room)!;
  const participants = useRoom((s) => s.participants);
  const leaveRoom = useRoom((s) => s.leaveRoom);

  return (
    <div className="flex flex-col gap-4">
      <InviteBar />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SharedTimer />
          <Participants list={participants} hostName={room.hostName} />
        </div>
        <Chat />
      </div>
      <button
        onClick={leaveRoom}
        className="flex items-center justify-center gap-2 rounded-xl bg-white/8 px-5 py-3 text-[14px] font-semibold text-[#ff9a9a] transition hover:bg-[#ff6a6a]/15"
      >
        <Icon name="logout" size={16} /> Leave room
      </button>
    </div>
  );
}

function InviteBar() {
  const room = useRoom((s) => s.room)!;
  const showToast = useUI((s) => s.showToast);
  const [link, setLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLink(`${window.location.origin}${window.location.pathname}?join=${room.code}`);
    }
  }, [room.code]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`);
    } catch {
      showToast("Copy failed — select and copy manually");
    }
  };

  const mailto = useMemo(() => {
    const subject = encodeURIComponent(`Join my StudyVerse room: ${room.name}`);
    const body = encodeURIComponent(
      `Come study with me on StudyVerse!\n\n` +
        `Room: ${room.name}\n` +
        `Invite code: ${room.code}\n` +
        `Join link: ${link}\n\n` +
        `Open the link or enter the code in Study Rooms → Join.`,
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }, [room.name, room.code, link]);

  return (
    <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-bold">{room.name}</div>
        <div className="flex items-center gap-2 text-[12px] text-[var(--text-faint)]">
          Invite code
          <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[13px] font-semibold tracking-widest text-white">
            {room.code}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <IconBtn label="Copy code" icon="copy" onClick={() => copy(room.code, "Code")} />
        <IconBtn label="Copy join link" icon="link" onClick={() => copy(link, "Join link")} />
        <a
          href={mailto}
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-[var(--text-dim)] transition hover:text-white"
          aria-label="Invite by email"
          title="Invite by email"
        >
          <Icon name="mail" size={17} />
        </a>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: "copy" | "link";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-[var(--text-dim)] transition hover:text-white"
    >
      <Icon name={icon} size={17} />
    </button>
  );
}

// Shared Pomodoro — any participant can start/pause/reset; state syncs to all.
function SharedTimer() {
  const room = useRoom((s) => s.room)!;
  const { startTimer, pauseTimer, resetTimer, setTimerDuration, completeTimer } = useRoom();
  const timer = room.timer;
  const [now, setNow] = useState(() => Date.now());
  const completedRef = useRef(false);

  // 1 Hz tick while a timer is running.
  useEffect(() => {
    if (timer.state !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [timer.state]);

  const remaining =
    timer.state === "running"
      ? Math.max(0, Math.round(((timer.endsAt ?? now) - now) / 1000))
      : timer.remaining;

  // Fire completion exactly once per run.
  useEffect(() => {
    if (timer.state === "running" && remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      completeTimer();
    }
    if (timer.state !== "running") completedRef.current = false;
  }, [timer.state, remaining, completeTimer]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = timer.duration ? 1 - remaining / timer.duration : 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  const running = timer.state === "running";

  return (
    <div className="glass flex flex-col items-center rounded-2xl p-4">
      <div className="mb-1 flex items-center gap-2 self-start text-[13px] font-semibold text-[var(--text-dim)]">
        <Icon name="clock" size={15} /> Shared Pomodoro
      </div>
      <div className="relative my-1 grid h-[130px] w-[130px] place-items-center">
        <svg viewBox="0 0 130 130" className="absolute h-full w-full -rotate-90">
          <circle cx="65" cy="65" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="65"
            cy="65"
            r={R}
            fill="none"
            stroke="url(#room-grad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.5s linear" }}
          />
          <defs>
            <linearGradient id="room-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9a8bff" />
              <stop offset="100%" stopColor="#56b6f5" />
            </linearGradient>
          </defs>
        </svg>
        <div className="text-center">
          <div className="font-mono text-[30px] font-bold tabular-nums">
            {mm}:{ss}
          </div>
          <div className="text-[11px] text-[var(--text-faint)]">
            {running ? "focusing…" : timer.state === "paused" ? "paused" : "ready"}
          </div>
        </div>
      </div>

      {!running && (
        <div className="mb-3 flex gap-2">
          {DURATIONS.map((m) => (
            <button
              key={m}
              onClick={() => setTimerDuration(m)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition"
              style={{
                background:
                  timer.duration === m * 60
                    ? "linear-gradient(135deg,#8a7bf0,#6355e6)"
                    : "rgba(255,255,255,0.08)",
                color: timer.duration === m * 60 ? "#fff" : "var(--text-dim)",
              }}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      <div className="flex w-full gap-2">
        <button
          onClick={running ? pauseTimer : startTimer}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
        >
          <Icon name={running ? "pause" : "play"} size={16} />
          {running ? "Pause" : timer.state === "paused" ? "Resume" : "Start"}
        </button>
        <button
          onClick={resetTimer}
          className="rounded-xl bg-white/8 px-4 py-2.5 text-[14px] font-semibold text-[var(--text-dim)] transition hover:text-white"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Participants({
  list,
  hostName,
}: {
  list: { clientId: string; name: string; avatarId: number }[];
  hostName: string;
}) {
  const me = useActiveProfile();
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--text-dim)]">
        <Icon name="users" size={15} /> Participants
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white">
          {list.length}
        </span>
      </div>
      <div className="flex max-h-[140px] flex-col gap-2 overflow-y-auto scroll-slim">
        {list.length === 0 && (
          <div className="text-[12.5px] text-[var(--text-faint)]">Waiting for people to join…</div>
        )}
        {list.map((p) => (
          <div key={p.clientId} className="flex items-center gap-2.5">
            <Avatar variant={p.avatarId} size={30} ring={false} />
            <span className="truncate text-[13.5px] font-medium">{p.name}</span>
            {p.clientId === me?.id && (
              <span className="text-[11px] text-[var(--text-faint)]">(you)</span>
            )}
            {p.name === hostName && (
              <span className="ml-auto rounded-full bg-[var(--amber)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--amber)]">
                Host
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Chat() {
  const messages = useRoom((s) => s.messages);
  const sendChat = useRoom((s) => s.sendChat);
  const me = useActiveProfile();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    if (!text.trim()) return;
    sendChat(text);
    setText("");
  };

  return (
    <div className="glass flex h-full min-h-[300px] flex-col rounded-2xl p-3">
      <div className="mb-2 flex items-center gap-2 px-1 text-[13px] font-semibold text-[var(--text-dim)]">
        <Icon name="send" size={14} /> Chat
      </div>
      <div ref={scrollRef} className="scroll-slim flex-1 space-y-2 overflow-y-auto px-1">
        {messages.length === 0 && (
          <div className="mt-4 text-center text-[12.5px] text-[var(--text-faint)]">
            Say hi to your study buddies 👋
          </div>
        )}
        {messages.map((m) => {
          const mine = m.clientId === me?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%]">
                {!mine && (
                  <div className="mb-0.5 px-1 text-[10.5px] text-[var(--text-faint)]">{m.name}</div>
                )}
                <div
                  className="whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[13px] leading-relaxed"
                  style={
                    mine
                      ? { background: "linear-gradient(135deg,#8a7bf0,#6355e6)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.08)", color: "var(--text)" }
                  }
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Message…"
          className="w-full rounded-xl bg-white/8 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-[var(--text-faint)] focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          aria-label="Send message"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white transition disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
        >
          <Icon name="send" size={17} />
        </button>
      </div>
    </div>
  );
}
