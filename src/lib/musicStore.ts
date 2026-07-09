"use client";

// Focus-music player for StudyVerse.
//
// Rather than shipping/streaming audio files, playback is synthesised in the
// browser with the Web Audio API. This makes play/pause, next/previous and the
// volume slider genuinely audible and controllable with zero network
// dependency, and playback persists across the app because the engine + store
// are module-level singletons (the dashboard is a single page, so the player
// never unmounts).
//
// Exactly 4 tracks: 1 free + 3 premium (locked). Premium tracks are built with
// a deliberately richer signal chain — sub-bass, shimmer layers, a shaped noise
// bed and a feedback-delay "space" — so they sound noticeably fuller and more
// immersive than the free track. Selecting a locked track is a no-op (the UI
// shows a lock + upsell toast instead).

import { create } from "zustand";
import { storage } from "./storage";

/** Per-track richness — only premium tracks set these for a fuller sound. */
interface Rich {
  sub?: boolean; // octave-below layer for depth/warmth
  shimmer?: boolean; // detuned octave-above sparkle
  noise?: "rain" | "air"; // shaped noise bed for immersion
  delaySec?: number; // feedback-delay time → sense of space
  wet?: number; // 0..1 amount sent to the delay/space bus
  spread?: number; // stereo spread (cents) across the chord
}

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
  rich?: Rich;
}

export const TRACKS: Track[] = [
  // --- Free (1) — a warm, relaxing lo-fi ambient pad. A soft Fmaj7 voicing
  // with a sub-bass foundation, gentle shimmer, an airy noise bed and a touch
  // of space (feedback delay) so it sounds full and immersive, not thin. ---
  {
    id: "lofi",
    title: "Midnight Lo-fi",
    subtitle: "Warm Ambient Waves",
    emoji: "🌌",
    premium: false,
    chord: [138.59, 174.61, 207.65, 261.63, 311.13],
    wave: "sine",
    cutoff: 750,
    rich: { sub: true, shimmer: true, noise: "rain", delaySec: 0.6, wet: 0.35, spread: 8 },
  },
  // --- Premium (3) — richer, layered, immersive ---
  {
    id: "deep",
    title: "Deep Focus",
    subtitle: "Cinematic Ambient",
    emoji: "🎧",
    premium: true,
    chord: [130.81, 196, 261.63],
    wave: "triangle",
    cutoff: 820,
    rich: { sub: true, shimmer: true, delaySec: 0.42, wet: 0.32, spread: 9 },
  },
  {
    id: "rain",
    title: "Rain & Piano",
    subtitle: "Storm Study Room",
    emoji: "🌧️",
    premium: true,
    chord: [196, 246.94, 293.66, 392],
    wave: "sine",
    cutoff: 1050,
    rich: { noise: "rain", shimmer: true, delaySec: 0.3, wet: 0.28, spread: 7 },
  },
  {
    id: "zen",
    title: "Zen Garden",
    subtitle: "Meditative Bells",
    emoji: "🪷",
    premium: true,
    chord: [261.63, 329.63, 392, 523.25],
    wave: "triangle",
    cutoff: 1300,
    rich: { shimmer: true, sub: true, noise: "air", delaySec: 0.55, wet: 0.4, spread: 12 },
  },
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
  private master: GainNode | null = null; // final output level (volume)
  private filter: BiquadFilterNode | null = null; // dry tone shaping
  private dryBus: GainNode | null = null; // sum of voices (pre-filter)
  private wetGain: GainNode | null = null; // amount of "space" (delay) bus
  private delay: DelayNode | null = null;
  private feedback: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private nodes: AudioNode[] = []; // live per-track sources to tear down
  private noiseBuffer: AudioBuffer | null = null;
  private volume = 0.6;

  private ensure() {
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    // Dry path: voices → dryBus → lowpass filter → master.
    this.dryBus = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 800;
    this.filter.Q.value = 0.7;
    this.dryBus.connect(this.filter);
    this.filter.connect(this.master);

    // Wet path (pseudo-reverb): a feedback delay gives premium tracks a real
    // sense of space. wetGain controls how much of it we hear (0 for free).
    this.delay = this.ctx.createDelay(2);
    this.delay.delayTime.value = 0.35;
    this.feedback = this.ctx.createGain();
    this.feedback.gain.value = 0.35;
    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0;
    this.dryBus.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay); // feedback loop
    this.delay.connect(this.wetGain);
    this.wetGain.connect(this.master);

    // Slow LFO gently modulates the filter cutoff for a "breathing" pad.
    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = 0.07;
    lfoGain.gain.value = 120;
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();
  }

  /** A 2-second looping white-noise buffer, generated once. */
  private noise(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return buf;
  }

  private teardown(now: number) {
    this.nodes.forEach((n) => {
      const src = n as OscillatorNode & AudioBufferSourceNode;
      // Fade the voice out over ~0.25s before stopping so track switches
      // crossfade smoothly instead of clicking.
      try {
        const g = (n as unknown as { __g?: GainNode }).__g;
        if (g) {
          g.gain.cancelScheduledValues(now);
          g.gain.setTargetAtTime(0, now, 0.08);
        }
      } catch {
        /* ignore */
      }
      try {
        if (typeof src.stop === "function") src.stop(now + 0.3);
      } catch {
        /* already stopped */
      }
      try {
        setTimeout(() => {
          try {
            n.disconnect();
          } catch {
            /* ignore */
          }
        }, 340);
      } catch {
        /* ignore */
      }
    });
    this.nodes = [];
  }

  /** (Re)build the oscillator/noise voices for a track. */
  setTrack(track: Track) {
    this.ensure();
    if (!this.ctx || !this.filter || !this.dryBus || !this.wetGain) return;
    const now = this.ctx.currentTime;
    this.teardown(now);

    const rich = track.rich ?? {};
    this.filter.frequency.setTargetAtTime(track.cutoff, now, 0.3);
    this.wetGain.gain.setTargetAtTime(rich.wet ?? 0, now, 0.4);
    if (this.delay) this.delay.delayTime.setTargetAtTime(rich.delaySec ?? 0.35, now, 0.4);

    const voiceGain = 1 / (track.chord.length + (rich.sub ? 2 : 1));
    const spread = rich.spread ?? 4;

    const addOsc = (freq: number, type: OscillatorType, gain: number, pan: number) => {
      const osc = this.ctx!.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.value = gain;
      const panner = this.ctx!.createStereoPanner();
      panner.pan.value = pan;
      osc.connect(g);
      g.connect(panner);
      panner.connect(this.dryBus!);
      // Stash the voice's gain so teardown can fade it out (smooth switches).
      (osc as unknown as { __g?: GainNode }).__g = g;
      osc.start();
      this.nodes.push(osc);
      return osc;
    };

    track.chord.forEach((freq, i) => {
      const pan = ((i / Math.max(1, track.chord.length - 1)) * 2 - 1) * 0.6;
      const osc = addOsc(freq, track.wave, voiceGain, pan);
      osc.detune.value = (i - 1) * spread; // slight spread for warmth/width
    });

    // Sub-bass layer (an octave below the root) — depth for premium tracks.
    if (rich.sub) addOsc(track.chord[0] / 2, "sine", voiceGain * 1.1, 0);

    // Shimmer layer (a detuned octave above the top note) — air/sparkle.
    if (rich.shimmer) {
      const top = track.chord[track.chord.length - 1] * 2;
      const s = addOsc(top, "sine", voiceGain * 0.4, 0.2);
      s.detune.value = 6;
    }

    // Shaped noise bed — rain (bright, bandpassed) or air (soft, low).
    if (rich.noise) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise();
      src.loop = true;
      const nf = this.ctx.createBiquadFilter();
      const ng = this.ctx.createGain();
      if (rich.noise === "rain") {
        nf.type = "bandpass";
        nf.frequency.value = 4200;
        nf.Q.value = 0.6;
        ng.gain.value = 0.06;
      } else {
        nf.type = "lowpass";
        nf.frequency.value = 900;
        ng.gain.value = 0.035;
      }
      src.connect(nf);
      nf.connect(ng);
      ng.connect(this.dryBus);
      (src as unknown as { __g?: GainNode }).__g = ng;
      src.start();
      this.nodes.push(src);
    }
  }

  async play() {
    this.ensure();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    // Gentle fade-in for a smooth, relaxing entrance.
    this.master.gain.setTargetAtTime(this.gainTarget(), now, 0.6);
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
    const idx = TRACKS.findIndex((t) => t.id === saved.trackId);
    // Never resume onto a locked track (e.g. a stale saved premium id).
    const trackIndex = idx >= 0 && !TRACKS[idx].premium ? idx : 0;
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
