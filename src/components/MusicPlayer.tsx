"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icon";
import { useMusic, TRACKS } from "@/lib/musicStore";
import { playClick } from "@/lib/sound";
import { useUI } from "@/lib/uiStore";

// Bottom-left focus-music player (see reference). Glass surface, animated
// equalizer, and fully working transport + volume. Playback is synthesised in
// the browser (see musicStore) so every control is genuinely audible with no
// network dependency. Lives at the bottom of the left column.
export default function MusicPlayer({ className = "" }: { className?: string }) {
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
    <div className={`glass-strong relative rounded-[24px] p-3.5 ${className}`}>
      {/* top row: album art + track meta + equalizer */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setListOpen((v) => !v)}
          aria-label="Choose track"
          className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl text-[20px] transition hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #3a2f6e, #1a1440)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 0 18px -6px var(--glow-violet)",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              animation: playing ? "spin 4s linear infinite" : "none",
              transformOrigin: "center",
            }}
          >
            {cur.emoji}
          </span>
        </button>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold">
            <span className="truncate">{cur.title}</span>
            {cur.premium && (
              <span className="rounded-full bg-[var(--amber)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[var(--amber)]">
                PRO
              </span>
            )}
          </div>
          <div className="truncate text-[11.5px] text-[var(--text-faint)]">{cur.subtitle}</div>
        </div>

        {/* equalizer — animates only while playing */}
        <div className="flex shrink-0 items-end gap-[2px]" style={{ height: 24 }} aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full"
              style={{
                height: "100%",
                transformOrigin: "bottom",
                background: "linear-gradient(180deg, var(--violet-bright), var(--violet))",
                animation: playing
                  ? `eq ${0.7 + (i % 5) * 0.16}s ease-in-out ${i * 0.06}s infinite`
                  : "none",
                transform: playing ? undefined : "scaleY(0.18)",
                opacity: 0.92,
              }}
            />
          ))}
        </div>
      </div>

      {/* bottom row: transport + volume */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={prev}
          aria-label="Previous track"
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="skip-back" size={17} />
        </button>
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:brightness-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--violet-bright), var(--violet))",
            boxShadow: "0 8px 22px -6px var(--glow-violet)",
          }}
        >
          <Icon name={playing ? "pause" : "play"} size={19} />
        </button>
        <button
          onClick={next}
          aria-label="Next track"
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="skip-forward" size={17} />
        </button>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--text-dim)] transition hover:text-white"
          >
            <Icon name={muted || volume === 0 ? "volume-off" : "volume"} size={17} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume"
            className="vol-slider w-full max-w-[92px]"
          />
        </div>
      </div>

      {/* playlist popover */}
      <AnimatePresence>
        {listOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => {
                playClick();
                setListOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-strong absolute bottom-[calc(100%+10px)] left-0 z-50 w-full rounded-3xl p-3"
            >
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
                      className="group flex items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition hover:bg-white/10"
                      style={active ? { background: "rgba(124,108,245,0.22)" } : undefined}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#3a2f6e] to-[#1a1440] text-[17px] transition group-hover:scale-105">
                        <span style={{
                          display: "inline-block",
                          animation: active && playing ? "spin 4s linear infinite" : "none",
                          transformOrigin: "center",
                        }}>
                          {t.emoji}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold">
                          <span className="truncate">{t.title}</span>
                          {t.premium && (
                            <span className="rounded-full bg-[var(--amber)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[var(--amber)] shrink-0">
                              PRO
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11.5px] text-[var(--text-faint)]">
                          {t.subtitle}
                        </div>
                      </div>
                      {t.premium ? (
                        <Icon name="lock" size={16} className="shrink-0 text-[var(--text-faint)] group-hover:text-[var(--text-dim)] transition-colors" />
                      ) : active && playing ? (
                        <Icon name="pause" size={16} className="shrink-0 text-[var(--violet-bright)]" />
                      ) : (
                        <Icon name="play" size={16} className="shrink-0 text-[var(--text-dim)] group-hover:text-white transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
