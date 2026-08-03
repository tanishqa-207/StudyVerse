"use client";

import { create } from "zustand";
import { storage } from "./storage";
import { getItem, setItem, removeItem, keys } from "./idb";

interface Rich {
  sub?: boolean;
  shimmer?: boolean;
  noise?: "rain" | "air";
  delaySec?: number;
  wet?: number;
  spread?: number;
}

export interface Track {
  isLocal?: boolean;
  file?: File;
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  premium: boolean;
  chord?: number[];
  wave?: OscillatorType;
  cutoff?: number;
  rich?: Rich;
}

export const TRACKS: Track[] = [
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
  shuffle: boolean;
  repeat: boolean;
}

// ---------------------------------------------------------------------------
// Ambient audio engine + HTML5 Audio element for local tracks
// ---------------------------------------------------------------------------
class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private dryBus: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private delay: DelayNode | null = null;
  private feedback: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private nodes: AudioNode[] = [];
  private noiseBuffer: AudioBuffer | null = null;
  private volume = 0.6;
  
  // HTML5 audio for local tracks
  private audioEl: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  public onTimeUpdate?: (t: number, dur: number) => void;
  public onEnded?: () => void;

  private ensure() {
    if (typeof window === "undefined") return;
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    this.dryBus = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 800;
    this.filter.Q.value = 0.7;
    this.dryBus.connect(this.filter);
    this.filter.connect(this.master);

    this.delay = this.ctx.createDelay(2);
    this.delay.delayTime.value = 0.35;
    this.feedback = this.ctx.createGain();
    this.feedback.gain.value = 0.35;
    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0;
    this.dryBus.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.wetGain);
    this.wetGain.connect(this.master);

    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = 0.07;
    lfoGain.gain.value = 120;
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();
    
    this.audioEl = new Audio();
    this.audioEl.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) this.onTimeUpdate(this.audioEl?.currentTime || 0, this.audioEl?.duration || 0);
    });
    this.audioEl.addEventListener('ended', () => {
      if (this.onEnded) this.onEnded();
    });
  }

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
      try {
        const g = (n as unknown as { __g?: GainNode }).__g;
        if (g) {
          g.gain.cancelScheduledValues(now);
          g.gain.setTargetAtTime(0, now, 0.08);
        }
      } catch {}
      try { if (typeof src.stop === "function") src.stop(now + 0.3); } catch {}
      setTimeout(() => { try { n.disconnect(); } catch {} }, 340);
    });
    this.nodes = [];
    
    if (this.audioEl) {
      this.audioEl.pause();
    }
  }

  setTrack(track: Track) {
    this.ensure();
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.teardown(now);

    if (track.isLocal && track.file && this.audioEl) {
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = URL.createObjectURL(track.file);
      this.audioEl.src = this.objectUrl;
      this.audioEl.volume = this.volume;
      this.audioEl.load();
      return;
    }

    if (!this.filter || !this.dryBus || !this.wetGain || !track.chord) return;
    
    const chord = track.chord;
    const rich = track.rich ?? {};
    this.filter.frequency.setTargetAtTime(track.cutoff || 800, now, 0.3);
    this.wetGain.gain.setTargetAtTime(rich.wet ?? 0, now, 0.4);
    if (this.delay) this.delay.delayTime.setTargetAtTime(rich.delaySec ?? 0.35, now, 0.4);

    const voiceGain = 1 / (chord.length + (rich.sub ? 2 : 1));
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
      (osc as unknown as { __g?: GainNode }).__g = g;
      osc.start();
      this.nodes.push(osc);
      return osc;
    };

    chord.forEach((freq, i) => {
      const pan = ((i / Math.max(1, chord.length - 1)) * 2 - 1) * 0.6;
      const osc = addOsc(freq, track.wave || "sine", voiceGain, pan);
      osc.detune.value = (i - 1) * spread;
    });

    if (rich.sub) addOsc(chord[0] / 2, "sine", voiceGain * 1.1, 0);
    if (rich.shimmer) {
      const top = chord[chord.length - 1] * 2;
      const s = addOsc(top, "sine", voiceGain * 0.4, 0.2);
      s.detune.value = 6;
    }

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

  async play(isLocal: boolean) {
    this.ensure();
    if (isLocal && this.audioEl) {
      this.audioEl.play().catch(() => {});
    } else {
      if (!this.ctx || !this.master) return;
      if (this.ctx.state === "suspended") await this.ctx.resume();
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.gainTarget(), now, 0.6);
    }
  }

  pause(isLocal: boolean) {
    if (isLocal && this.audioEl) {
      this.audioEl.pause();
    } else {
      if (!this.ctx || !this.master) return;
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0, now, 0.3);
    }
  }

  setVolume(v: number, playing: boolean, isLocal: boolean) {
    this.volume = v;
    if (this.audioEl) this.audioEl.volume = v;
    if (!this.master || !this.ctx) return;
    if (playing && !isLocal) {
      const now = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.gainTarget(), now, 0.1);
    }
  }
  
  seek(time: number) {
    if (this.audioEl) this.audioEl.currentTime = time;
  }

  private gainTarget() {
    return this.volume * 0.18;
  }
}

let engine: AmbientEngine | null = null;
function getEngine(): AmbientEngine | null {
  if (typeof window === "undefined") return null;
  if (!engine) engine = new AmbientEngine();
  return engine;
}

interface MusicState {
  trackId: string;
  playing: boolean;
  volume: number; // 0..1
  muted: boolean;
  hydrated: boolean;
  
  localTracks: Track[];
  shuffle: boolean;
  repeat: boolean;
  currentTime: number;
  duration: number;

  hydrate: () => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  selectTrack: (id: string) => boolean; 
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  seek: (t: number) => void;
  addLocalTrack: (file: File) => Promise<void>;
  removeLocalTrack: (id: string) => Promise<void>;
  
  // engine callbacks
  _updateTime: (cur: number, dur: number) => void;
  _onEnded: () => void;
}

function save(s: Pick<MusicState, "trackId" | "volume" | "muted" | "shuffle" | "repeat">) {
  storage.set<MusicPersist>(MUSIC_KEY, {
    trackId: s.trackId,
    volume: s.volume,
    muted: s.muted,
    shuffle: s.shuffle,
    repeat: s.repeat
  });
}

function effectiveVolume(volume: number, muted: boolean) {
  return muted ? 0 : volume;
}

export const useMusic = create<MusicState>((set, get) => ({
  trackId: TRACKS[0].id,
  playing: false,
  volume: 0.6,
  muted: false,
  hydrated: false,
  
  localTracks: [],
  shuffle: false,
  repeat: false,
  currentTime: 0,
  duration: 0,

  hydrate: async () => {
    if (get().hydrated) return;
    
    // Load local tracks from IndexedDB
    const idbKeys = await keys();
    const loadedLocal: Track[] = [];
    for (const k of idbKeys) {
      if (k.startsWith("audio_")) {
        const file = await getItem<File>(k);
        if (file) {
          loadedLocal.push({
            id: k,
            title: file.name.replace(/\.[^/.]+$/, ""),
            subtitle: "Local Audio",
            emoji: "🎵",
            premium: false,
            isLocal: true,
            file
          });
        }
      }
    }
    
    const saved = storage.get<MusicPersist>(MUSIC_KEY, {
      trackId: TRACKS[0].id,
      volume: 0.6,
      muted: false,
      shuffle: false,
      repeat: false
    });
    
    const all = [...TRACKS, ...loadedLocal];
    const exists = all.find((t) => t.id === saved.trackId);
    // Never resume onto a locked track
    const trackId = exists && !exists.premium ? exists.id : TRACKS[0].id;
    
    const eng = getEngine();
    if (eng) {
      eng.onTimeUpdate = (c, d) => get()._updateTime(c, d);
      eng.onEnded = () => get()._onEnded();
    }

    set({ 
      localTracks: loadedLocal, 
      trackId, 
      volume: saved.volume, 
      muted: saved.muted, 
      shuffle: saved.shuffle,
      repeat: saved.repeat,
      hydrated: true 
    });
  },

  toggle: () => (get().playing ? get().pause() : get().play()),

  play: () => {
    const all = [...TRACKS, ...get().localTracks];
    const cur = all.find(t => t.id === get().trackId) || TRACKS[0];
    const eng = getEngine();
    eng?.setTrack(cur);
    eng?.setVolume(effectiveVolume(get().volume, get().muted), true, !!cur.isLocal);
    void eng?.play(!!cur.isLocal);
    set({ playing: true });
  },

  pause: () => {
    const all = [...TRACKS, ...get().localTracks];
    const cur = all.find(t => t.id === get().trackId) || TRACKS[0];
    getEngine()?.pause(!!cur.isLocal);
    set({ playing: false });
  },

  selectTrack: (id: string) => {
    const all = [...TRACKS, ...get().localTracks];
    const track = all.find(t => t.id === id);
    if (!track || track.premium) return false;
    set({ trackId: id, currentTime: 0, duration: 0 });
    const eng = getEngine();
    eng?.setTrack(track);
    if (get().playing) {
      eng?.setVolume(effectiveVolume(get().volume, get().muted), true, !!track.isLocal);
      void eng?.play(!!track.isLocal);
    }
    save(get());
    return true;
  },

  next: () => {
    const all = [...TRACKS, ...get().localTracks];
    const free = all.filter(t => !t.premium);
    if (free.length === 0) return;
    if (get().shuffle) {
      const nextIdx = Math.floor(Math.random() * free.length);
      get().selectTrack(free[nextIdx].id);
      return;
    }
    const pos = free.findIndex(t => t.id === get().trackId);
    const nextIdx = (pos + 1) % free.length;
    get().selectTrack(free[nextIdx].id);
  },
  
  prev: () => {
    const all = [...TRACKS, ...get().localTracks];
    const free = all.filter(t => !t.premium);
    if (free.length === 0) return;
    if (get().currentTime > 3) {
      get().seek(0);
      return;
    }
    const pos = free.findIndex(t => t.id === get().trackId);
    const prevIdx = (pos - 1 + free.length) % free.length;
    get().selectTrack(free[prevIdx].id);
  },

  setVolume: (v) => {
    const volume = Math.max(0, Math.min(1, v));
    const muted = volume === 0 ? get().muted : false;
    set({ volume, muted });
    const all = [...TRACKS, ...get().localTracks];
    const cur = all.find(t => t.id === get().trackId) || TRACKS[0];
    getEngine()?.setVolume(effectiveVolume(volume, muted), get().playing, !!cur.isLocal);
    save({ ...get(), volume, muted });
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    const all = [...TRACKS, ...get().localTracks];
    const cur = all.find(t => t.id === get().trackId) || TRACKS[0];
    getEngine()?.setVolume(effectiveVolume(get().volume, muted), get().playing, !!cur.isLocal);
    save(get());
  },
  
  toggleShuffle: () => {
    set({ shuffle: !get().shuffle });
    save(get());
  },
  
  toggleRepeat: () => {
    set({ repeat: !get().repeat });
    save(get());
  },
  
  seek: (t: number) => {
    set({ currentTime: t });
    getEngine()?.seek(t);
  },
  
  addLocalTrack: async (file: File) => {
    const id = "audio_" + Date.now();
    await setItem(id, file);
    const newTrack: Track = {
      id,
      title: file.name.replace(/\.[^/.]+$/, ""),
      subtitle: "Local Audio",
      emoji: "🎵",
      premium: false,
      isLocal: true,
      file
    };
    set((s) => ({ localTracks: [...s.localTracks, newTrack] }));
    get().selectTrack(id);
    get().play();
  },
  
  removeLocalTrack: async (id: string) => {
    await removeItem(id);
    set((s) => ({ localTracks: s.localTracks.filter(t => t.id !== id) }));
    if (get().trackId === id) {
      get().next();
    }
  },
  
  _updateTime: (cur: number, dur: number) => {
    set({ currentTime: cur, duration: dur });
  },
  
  _onEnded: () => {
    if (get().repeat) {
      get().seek(0);
      get().play();
    } else {
      get().next();
    }
  }
}));
