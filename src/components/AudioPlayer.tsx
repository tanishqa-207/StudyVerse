"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface AudioPlayerProps {
  src: string;
  duration?: number;
  className?: string;
  compact?: boolean;
}

export default function AudioPlayer({
  src,
  duration: durationProp,
  className = "",
  compact = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationProp || 0);

  useEffect(() => {
    if (durationProp && !isNaN(durationProp) && durationProp > 0) {
      setDuration(durationProp);
    }
  }, [durationProp]);

  // Reload audio metadata and reset playback state whenever src changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && src) {
      audio.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [src]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (isFinite(d) && d > 0) {
        setDuration(d);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = 1.0;
      audio.muted = false;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("[AudioPlayer] Playback failed:", err);
          setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  const handleReplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.volume = 1.0;
    audio.muted = false;
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.error("[AudioPlayer] Replay failed:", err);
        setIsPlaying(false);
      });
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl bg-white/10 p-2.5 text-white backdrop-blur-md ${className}`}
      style={{ background: "rgba(255, 255, 255, 0.07)" }}
    >
      <audio
        key={src}
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Play / Pause Toggle */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white transition hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Replay Button */}
      <button
        type="button"
        onClick={handleReplay}
        aria-label="Replay audio"
        title="Replay"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/8 text-[var(--text-dim,#a0a0b0)] transition hover:bg-white/15 hover:text-white"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      {/* Seek bar & timestamps */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/15 focus:outline-none"
            style={{
              background: `linear-gradient(to right, var(--violet-bright, #8a7bf0) 0%, var(--violet-bright, #8a7bf0) ${progressPct}%, rgba(255,255,255,0.15) ${progressPct}%, rgba(255,255,255,0.15) 100%)`,
            }}
          />
        </div>
        {!compact && (
          <div className="flex justify-between font-mono text-[10.5px] text-[var(--text-faint,#808090)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
