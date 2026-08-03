"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "paused" | "stopped";

export function useVoiceRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMediaDevices = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      const hasMediaRecorder = typeof MediaRecorder !== "undefined";
      setIsSupported(hasMediaDevices && hasMediaRecorder);
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  const pauseTimer = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  // Clean active stream tracks
  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Reset state and revoke Object URL
  const resetRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    cleanupStream();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    chunksRef.current = [];
    mediaRecorderRef.current = null;
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setRecordingState("idle");
    setError(null);
  }, [audioUrl, cleanupStream, stopTimer]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      stopTimer();
      cleanupStream();

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      setRecordingTime(0);
      setError(null);

      // Request explicit audio constraints for optimal microphone capture
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Ensure audio tracks are enabled
      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });

      mediaStreamRef.current = stream;
      chunksRef.current = [];

      // Determine best supported mimeType for Chrome/Edge
      let mimeType = "";
      const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/aac",
      ];
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      console.log(`[useVoiceRecorder] Selected mimeType: "${mimeType}"`);

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log(`[useVoiceRecorder] Captured chunk size: ${e.data.size} bytes`);
        }
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        console.log(
          `[useVoiceRecorder] Recording stopped. Chunks count: ${chunksRef.current.length}, Blob size: ${blob.size} bytes, MIME type: ${type}`
        );
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingState("stopped");
        stopTimer();
        cleanupStream();
      };

      recorder.onerror = (e: Event) => {
        const errEvent = e as unknown as { error?: { message?: string } };
        console.error("[useVoiceRecorder] Recorder error:", errEvent);
        setError(errEvent.error?.message || "Recording error occurred.");
        stopTimer();
        cleanupStream();
        setRecordingState("idle");
      };

      recorder.start(100); // 100ms timeslice to ensure frequent chunk emission
      setRecordingState("recording");
      startTimer();
    } catch (err) {
      console.error("[useVoiceRecorder] getUserMedia error:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Microphone access denied or error.";
      setError(errorMsg);
      setRecordingState("idle");
      cleanupStream();
    }
  }, [audioUrl, cleanupStream, startTimer, stopTimer]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("[useVoiceRecorder] Stop error:", err);
        setError("Failed to stop recording.");
      }
    }
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording" &&
      typeof mediaRecorderRef.current.pause === "function"
    ) {
      try {
        mediaRecorderRef.current.pause();
        setRecordingState("paused");
        pauseTimer();
      } catch {
        // ignore
      }
    }
  }, [pauseTimer]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused" &&
      typeof mediaRecorderRef.current.resume === "function"
    ) {
      try {
        mediaRecorderRef.current.resume();
        setRecordingState("recording");
        startTimer();
      } catch {
        // ignore
      }
    }
  }, [startTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      cleanupStream();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, cleanupStream, stopTimer]);

  return {
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
  };
}
