"use client";

// Focus-music player for StudyVerse.
//
// Rather than shipping/streaming audio files, playback is synthesised in the
// browser with the Web Audio API — a soft ambient chord pad per track. This
// makes play/pause, next/previous and the volume slider genuinely audible and
// controllable with zero network dependency, and playback persists across the
// app because the engine + store are module-level singletons (the dashboard is
// a single page, so the player never unmounts).
//
// 4 free tracks + 3 premium (locked) tracks. Selecting a locked track is a
// no-op (the UI shows a lock + upsell toast instead).

import { create } from "zustand";
import { storage } from "./storage";

export interface Track {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  premium: boolean;
  /** Chord (Hz) rendered as the ambient pad. */
  chord: number[];
  wave: OscillatorType;
  /** Low-pass cutoff (Hz) — lower = warmer/darker. */
  cutoff: number;
}

export const TRACKS: Track[] = [
  // --- Free ---
  { id: "lofi", title: "Lo-fi Focus", subtitle: "Chill & Concentrate", emoji: "🌙", premium: false, chord: [220, 261.63, 329.63], wave: "sine", cutoff: 900 },
  { id: "deep", title: "Deep Work", subtitle: "Ambient Drift", emoji: "🌌", premium: false, chord: [146.83, 220, 277.18], wave: "triangle", cutoff: 700 },
  { id: "rain", title: "Rainy Study", subtitle: "Soft Rain & Piano", emoji: "🌧️", premium: false, chord: [196, 246.94, 293.66], wave: "sine", cutoff: 800 },
  { id: "forest", title: "Forest Calm", subtitle: "Nature & Focus", emoji: "🍃", premium: false, chord: [174.61, 261.63, 349.23], wave: "triangle", cutoff: 1000 },
  // --- Premium (locked) ---
  { id: "night", title: "Night Coder", subtitle: "Synth Focus", emoji: "🎧", premium: true, chord: [130.81, 196, 261.63], wave: "sawtooth", cutoff: 650 },
  { id: "cosmic", title: "Cosmic Drift", subtitle: "Deep Space Pad", emoji: "✨", premium: true, chord: [110, 164.81, 220], wave: "sine", cutoff: 600 },
  { id: "zen", title: "Zen Garden", subtitle: "Meditative Bells", emoji: "🪷", premium: true, chord: [261.63, 329.63, 392], wave: "triangle", cutoff: 1100 },
];

const MUSIC_KEY = "music";
interface MusicPersist {
  trackId: string;
  volume: number;
  muted: boolean;
}

// ---------------------------------------------------------------------------
// Ambient audio engine (Web Audio API) — module singleton.
// ---------------------------------------------------------------------------
class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private voices: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private volume = 0.6;

  private ensure() {
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 800;
    this.filter.Q.value = 0.7;
    this.filter.connect(this.master);
    this.master.connect(this.ctx.destination);

    // Slow LFO gently modulates the filter cutoff for a "breathing" pad.
    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = 0.08;
    lfoGain.gain.value = 120;
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();
  }

  /** (Re)build the oscillator voices for a track. */
  setTrack(track: Track) {
    this.ensure();
    if (!this.ctx || !this.filter) return;
    const now = this.ctx.currentTime;
    // Stop old voices with a short fade to avoid clicks.
    this.voices.forEach((v) => {
      try {
        v.stop(now + 0.05);
      } catch {
        /* already stopped */
      }
    });
    this.voices = [];
    this.filter.frequency.setTargetAtTime(track.cutoff, now, 0.3);

    track.chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = track.wave;
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 4; // slight spread for warmth
      const g = this.ctx!.createGain();
      g.gain.value = 1 / (track.chord.length + 1);
      osc.connect(g);
      g.connect(this.filter!);
      osc.start();
      this.voices.push(osc);
    });
  }

  async play() {
    this.ensure();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.gainTarget(), now, 0.4);
  }

  pause() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.3);
  }

  setVolume(v: number, playing: boolean) {
    this.volume = v;
    if (!this.master || !this.ctx) return;
    if (playing) {
      const now = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.gainTarget(), now, 0.1);
    }
  }

  private gainTarget() {
    // Keep the ambient pad gentle: map 0..1 → 0..0.18.
    return this.volume * 0.18;
  }
}

// Lazily instantiate so importing on the server is safe.
let engine: AmbientEngine | null = null;
function getEngine(): AmbientEngine | null {
  if (typeof window === "undefined") return null;
  if (!engine) engine = new AmbientEngine();
  return engine;
}

interface MusicState {
  trackIndex: number;
  playing: boolean;
  volume: number; // 0..1
  muted: boolean;
  hydrated: boolean;

  hydrate: () => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  selectTrack: (index: number) => boolean; // false when locked (premium)
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

function save(s: Pick<MusicState, "trackIndex" | "volume" | "muted">) {
  storage.set<MusicPersist>(MUSIC_KEY, {
    trackId: TRACKS[s.trackIndex]?.id ?? TRACKS[0].id,
    volume: s.volume,
    muted: s.muted,
  });
}

function effectiveVolume(volume: number, muted: boolean) {
  return muted ? 0 : volume;
}

export const useMusic = create<MusicState>((set, get) => ({
  trackIndex: 0,
  playing: false,
  volume: 0.6,
  muted: false,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const saved = storage.get<MusicPersist>(MUSIC_KEY, {
      trackId: TRACKS[0].id,
      volume: 0.6,
      muted: false,
    });
    const idx = Math.max(0, TRACKS.findIndex((t) => t.id === saved.trackId));
    const trackIndex = idx === -1 ? 0 : idx;
    // Note: we intentionally do NOT touch the audio engine here. Creating an
    // AudioContext before a user gesture is disallowed by browsers (it would
    // start suspended and log a warning). The engine is configured on first
    // play() / track selection, which always happens inside a click handler.
    set({ trackIndex, volume: saved.volume, muted: saved.muted, hydrated: true });
  },

  toggle: () => (get().playing ? get().pause() : get().play()),

  play: () => {
    const eng = getEngine();
    eng?.setTrack(TRACKS[get().trackIndex]);
    eng?.setVolume(effectiveVolume(get().volume, get().muted), true);
    void eng?.play();
    set({ playing: true });
  },

  pause: () => {
    getEngine()?.pause();
    set({ playing: false });
  },

  selectTrack: (index) => {
    const track = TRACKS[index];
    if (!track || track.premium) return false;
    set({ trackIndex: index });
    const eng = getEngine();
    eng?.setTrack(track);
    if (get().playing) {
      eng?.setVolume(effectiveVolume(get().volume, get().muted), true);
      void eng?.play();
    }
    save(get());
    return true;
  },

  // Next/previous skip over locked premium tracks (free-only rotation).
  next: () => {
    const free = TRACKS.map((t, i) => (t.premium ? -1 : i)).filter((i) => i >= 0);
    const pos = free.indexOf(get().trackIndex);
    const nextIdx = free[(pos + 1) % free.length];
    get().selectTrack(nextIdx);
  },
  prev: () => {
    const free = TRACKS.map((t, i) => (t.premium ? -1 : i)).filter((i) => i >= 0);
    const pos = free.indexOf(get().trackIndex);
    const prevIdx = free[(pos - 1 + free.length) % free.length];
    get().selectTrack(prevIdx);
  },

  setVolume: (v) => {
    const volume = Math.max(0, Math.min(1, v));
    const muted = volume === 0 ? get().muted : false;
    set({ volume, muted });
    getEngine()?.setVolume(effectiveVolume(volume, muted), get().playing);
    save({ ...get(), volume, muted });
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    getEngine()?.setVolume(effectiveVolume(get().volume, muted), get().playing);
    save(get());
  },
}));
