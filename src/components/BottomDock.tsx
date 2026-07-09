"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useMusic, TRACKS } from "@/lib/musicStore";
import { useProgress } from "@/lib/store";
import { useUI } from "@/lib/uiStore";

export default function BottomDock() {
  return (
    <div className="flex items-stretch gap-5 px-1">
      <MusicPlayer />
      <LevelProgress />
    </div>
  );
}

function MusicPlayer() {
  const {
    trackIndex,
    playing,
    volume,
    muted,
    hydrate,
    toggle,
    next,
    prev,
    selectTrack,
    setVolume,
    toggleMute,
  } = useMusic();
  const showToast = useUI((s) => s.showToast);
  const [listOpen, setListOpen] = useState(false);
  const cur = TRACKS[trackIndex];

  // Load persisted track/volume once; playback stays paused until a user gesture
  // (browser autoplay policy), then persists across the whole app session.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const pickTrack = (i: number) => {
    const ok = selectTrack(i);
    if (!ok) showToast(`“${TRACKS[i].title}” is a premium track 🔒`);
    else setListOpen(false);
  };

  return (
    <div className="glass-strong relative flex flex-1 items-center gap-4 rounded-3xl p-3.5">
      {/* album art → opens the playlist */}
      <button
        onClick={() => setListOpen((v) => !v)}
        aria-label="Choose track"
        className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#3a2f6e] to-[#1a1440] transition hover:brightness-110"
      >
        <div className="text-2xl">{cur.emoji}</div>
      </button>

      <div className="min-w-0 leading-tight">
        <div className="truncate text-[16px] font-semibold">{cur.title}</div>
        <div className="truncate text-[12px] text-[var(--text-faint)]">{cur.subtitle}</div>
      </div>

      {/* transport controls */}
      <div className="ml-2 flex items-center gap-2">
        <button
          onClick={prev}
          aria-label="Previous track"
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] transition hover:text-white"
        >
          <Icon name="skip-back" size={18} />
        </button>
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-11 w-11 place-items-center rounded-full text-white"
          style={{
            background: "linear-gradient(135deg, #8a7bf0, #6355e6)",
            boxShadow: "0 8px 22px -6px rgba(124,108,245,0.8)",
          }}
        >
          <Icon name={playing ? "pause" : "play"} size={20} />
        </button>
        <button
          onClick={next}
          aria-label="Next track"
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] transition hover:text-white"
        >
          <Icon name="skip-forward" size={18} />
        </button>
      </div>

      {/* volume — mute toggle (Music On/Off) + slider */}
      <div className="ml-2 hidden items-center gap-2 md:flex">
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] transition hover:text-white"
        >
          <Icon name={muted || volume === 0 ? "volume-off" : "volume"} size={18} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          aria-label="Volume"
          className="vol-slider w-20"
        />
      </div>

      {/* equalizer — animates only while playing */}
      <div className="ml-auto hidden items-end gap-[3px] lg:flex" style={{ height: 34 }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{
              height: "100%",
              transformOrigin: "bottom",
              background: "linear-gradient(180deg, #b3a9ff, #7c6cf5)",
              animation: playing
                ? `eq ${0.7 + (i % 5) * 0.18}s ease-in-out ${i * 0.05}s infinite`
                : "none",
              transform: playing ? undefined : "scaleY(0.2)",
              opacity: 0.9,
            }}
          />
        ))}
      </div>

      {/* playlist popover */}
      {listOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setListOpen(false)} />
          <div className="glass-strong absolute bottom-[calc(100%+10px)] left-0 z-50 w-[320px] rounded-3xl p-3">
            <div className="mb-2 flex items-center gap-2 px-2 text-[13px] font-semibold text-[var(--text-dim)]">
              <Icon name="music" size={16} /> Focus Playlist
            </div>
            <div className="flex flex-col gap-1">
              {TRACKS.map((t, i) => {
                const active = i === trackIndex;
                return (
                  <button
                    key={t.id}
                    onClick={() => pickTrack(i)}
                    className="flex items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition hover:bg-white/8"
                    style={active ? { background: "rgba(124,108,245,0.22)" } : undefined}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#3a2f6e] to-[#1a1440] text-[17px]">
                      {t.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold">
                        {t.title}
                        {t.premium && (
                          <span className="rounded-full bg-[var(--amber)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[var(--amber)]">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[11.5px] text-[var(--text-faint)]">
                        {t.subtitle}
                      </div>
                    </div>
                    {t.premium ? (
                      <Icon name="lock" size={16} className="shrink-0 text-[var(--text-faint)]" />
                    ) : active && playing ? (
                      <Icon name="pause" size={16} className="shrink-0 text-[var(--violet-bright)]" />
                    ) : (
                      <Icon name="play" size={16} className="shrink-0 text-[var(--text-dim)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LevelProgress() {
  const progress = useProgress();
  const xpRemaining = Math.max(0, progress.xpToNext - progress.xp);
  const pct = Math.min(100, Math.round((progress.xp / progress.xpToNext) * 100));

  return (
    <div className="glass-strong flex w-[420px] shrink-0 items-center gap-4 rounded-3xl p-4">
      <div className="relative grid h-14 w-14 shrink-0 place-items-center">
        <svg viewBox="0 0 24 24" className="absolute h-14 w-14">
          <defs>
            <linearGradient id="lvl-hex" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9a8bff" />
              <stop offset="100%" stopColor="#5f4fd6" />
            </linearGradient>
          </defs>
          <path
            d="M12 2.5 20 7v10l-8 4.5L4 17V7z"
            fill="url(#lvl-hex)"
            stroke="#c9c2ff"
            strokeWidth={0.6}
          />
        </svg>
        <span className="relative text-xl font-bold text-white">{progress.level}</span>
      </div>

      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[17px] font-bold">Level {progress.level}</span>
          <span className="text-[12px] text-[var(--text-faint)]">{pct}%</span>
        </div>
        <div className="mb-2 text-[12px] text-[var(--text-faint)]">
          Next Level in {xpRemaining} XP
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #9a8bff, #6f5fe0)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
