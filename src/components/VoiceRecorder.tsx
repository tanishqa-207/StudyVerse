"use client";

import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import AudioPlayer from "./AudioPlayer";
import Icon from "./Icon";

export interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, audioUrl: string, durationSeconds: number) => void;
  onCancel?: () => void;
  className?: string;
}

export default function VoiceRecorder({
  onSend,
  onCancel,
  className = "",
}: VoiceRecorderProps) {
  const {
    recordingState,
    isSupported,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useVoiceRecorder();

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleCancel = () => {
    resetRecording();
    if (onCancel) onCancel();
  };

  const handleSend = () => {
    if (audioBlob && audioUrl) {
      onSend(audioBlob, audioUrl, recordingTime);
      resetRecording();
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-[12.5px] text-[var(--text-faint)] ${className}`}>
        <span>Voice recording is not supported in this browser.</span>
        <button
          type="button"
          onClick={handleCancel}
          className="ml-auto text-xs text-white/60 hover:text-white"
        >
          Close
        </button>
      </div>
    );
  }

  // Idle state
  if (recordingState === "idle") {
    return (
      <div className={`flex items-center gap-3 rounded-2xl bg-white/8 px-3.5 py-2 text-white ${className}`}>
        <button
          type="button"
          onClick={() => startRecording()}
          className="flex items-center gap-2 rounded-xl bg-[var(--violet-bright,#8a7bf0)] px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          <Icon name="mic" size={16} /> Start Voice Note
        </button>
        {error && <span className="text-[12px] text-red-400">{error}</span>}
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="ml-auto rounded-lg px-2 py-1 text-[12px] text-[var(--text-faint)] hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  // Active Recording / Paused State
  if (recordingState === "recording" || recordingState === "paused") {
    const isPaused = recordingState === "paused";
    return (
      <div className={`glass flex items-center justify-between gap-2 sm:gap-3 rounded-2xl px-2.5 sm:px-3.5 py-2 text-white ${className}`}>
        {/* Recording Status & Pulse Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <span
            className={`h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 rounded-full ${
              isPaused
                ? "bg-amber-400"
                : "animate-ping bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
            }`}
          />
          <span className="font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">
            {formatTimer(recordingTime)}
          </span>
          <span className="hidden xs:inline text-[11.5px] sm:text-[12px] text-[var(--text-dim)] truncate">
            {isPaused ? "Paused" : "Recording…"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Pause / Resume */}
          <button
            type="button"
            onClick={isPaused ? resumeRecording : pauseRecording}
            title={isPaused ? "Resume" : "Pause"}
            aria-label={isPaused ? "Resume recording" : "Pause recording"}
            className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
          >
            <Icon name={isPaused ? "play" : "pause"} size={15} />
          </button>

          {/* Stop Recording (triggers preview) */}
          <button
            type="button"
            onClick={stopRecording}
            title="Done recording"
            aria-label="Done recording"
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-white transition hover:bg-emerald-500"
          >
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-sm bg-white" /> Done
          </button>

          {/* Delete / Cancel */}
          <button
            type="button"
            onClick={handleCancel}
            title="Delete recording"
            aria-label="Delete recording"
            className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-xl bg-red-500/20 text-red-300 transition hover:bg-red-500/40 hover:text-white"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Stopped / Preview State
  if (recordingState === "stopped" && audioUrl) {
    return (
      <div className={`glass flex flex-col gap-2 sm:gap-2.5 rounded-2xl p-2 sm:p-2.5 text-white ${className}`}>
        <div className="text-[11px] sm:text-[11.5px] font-semibold tracking-wide text-[var(--text-dim)]">
          Voice Note Preview
        </div>
        <AudioPlayer src={audioUrl} duration={recordingTime} />
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-white/8 px-2.5 sm:px-3 py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            <Icon name="trash" size={14} /> Delete
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-[var(--violet-bright,#8a7bf0)] to-[var(--violet-dark,#6355e6)] px-3 sm:px-4 py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-white transition hover:brightness-110"
          >
            <Icon name="send" size={14} /> Send Voice Note
          </button>
        </div>
      </div>
    );
  }

  return null;
}
