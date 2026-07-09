"use client";

import IsoScene from "./IsoScene";
import LocationCard from "./LocationCard";
import Cloud from "./Cloud";
import { mapLocations } from "@/lib/demoData";

export default function IsometricMap() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* No boxed frame or own sky — the city floats directly on the app-wide
          twilight backdrop (see SkyBackdrop / body). */}

      {/* volumetric purple fog — large, soft, slow-drifting light pools that
          nestle the floating island in a bank of cloud */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {FOG.map((f, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              width: `${f.w}vw`,
              height: `${f.w}vw`,
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, ${f.color} 0%, transparent 68%)`,
              filter: "blur(26px)",
              animation: `fog-drift ${f.d}s ease-in-out ${f.delay}s infinite`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* background clouds — volumetric cumulus banks nesting the floating city,
          with only a gentle vertical breathe (no sliding). */}
      {[
        { x: 8, y: 9, s: 0.8, o: 0.7, d: 58 },
        { x: 62, y: 4, s: 1.15, o: 0.8, d: 66 },
        { x: 84, y: 22, s: 0.72, o: 0.62, d: 60 },
        { x: 34, y: 3, s: 0.95, o: 0.7, d: 70 },
        { x: 90, y: 10, s: 0.85, o: 0.66, d: 62 },
      ].map((c, i) => (
        <div
          key={i}
          className="pointer-events-none absolute"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            animation: `float-cloud ${c.d}s ease-in-out ${i * 1.4}s infinite`,
            willChange: "transform",
          }}
        >
          <Cloud scale={c.s} opacity={c.o} />
        </div>
      ))}

      {/* isometric city */}
      <div className="absolute inset-0">
        <IsoScene />
      </div>

      {/* soft low cloud bank the island nests into — a couple of large, faint,
          STATIC volumetric clouds wrapping the base (no drift, so the dashboard
          stays stable). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { x: 2, y: 70, s: 1.25, o: 0.28 },
          { x: 74, y: 76, s: 1.35, o: 0.26 },
          { x: -4, y: 40, s: 0.9, o: 0.22 },
          { x: 84, y: 44, s: 0.95, o: 0.22 },
          { x: 40, y: 88, s: 1.3, o: 0.24 },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
          >
            <Cloud scale={c.s} opacity={c.o} tint="#ecdcff" />
          </div>
        ))}
      </div>

      {/* ambient lighting — soft warm central bloom with sunset orange/purple tones */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 46% at 50% 52%, rgba(200,160,240,0.22), transparent 68%)," +
            "radial-gradient(42% 34% at 50% 56%, rgba(160,200,255,0.16), transparent 72%)," +
            "radial-gradient(38% 32% at 45% 58%, rgba(255,140,100,0.12), transparent 70%)",
        }}
      />

      {/* drifting ambient particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              bottom: `${p.y}%`,
              width: p.s,
              height: p.s,
              background: "rgba(201,239,255,0.8)",
              boxShadow: "0 0 6px rgba(143,212,255,0.8)",
              animation: `particle-rise ${p.d}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* interactive location cards */}
      {mapLocations.map((loc, i) => (
        <LocationCard key={loc.key} loc={loc} index={i} />
      ))}
    </div>
  );
}

// deterministic particle field (no Math.random → stable SSR/CSR)
const PARTICLES = Array.from({ length: 28 }).map((_, i) => ({
  x: (i * 41) % 100,
  y: (i * 17) % 46,
  s: 2 + (i % 3),
  d: 10 + (i % 6) * 2,
  delay: (i % 8) * 1.5,
}));

// Volumetric fog pools — tinted violet/blue/pink/orange for sunset, positioned mostly around the
// edges so the floating city reads as suspended inside a bank of purple/orange cloud.
const FOG = [
  { x: 8, y: 20, w: 46, color: "rgba(139,110,220,0.58)", d: 30, delay: 0 },
  { x: 92, y: 26, w: 42, color: "rgba(120,150,240,0.45)", d: 34, delay: 3 },
  { x: 20, y: 92, w: 50, color: "rgba(200,140,180,0.52)", d: 32, delay: 1.5 },
  { x: 84, y: 90, w: 46, color: "rgba(240,150,120,0.42)", d: 36, delay: 4 },
  { x: 50, y: 100, w: 60, color: "rgba(180,140,240,0.48)", d: 38, delay: 2 },
  { x: 62, y: 10, w: 34, color: "rgba(220,160,200,0.38)", d: 28, delay: 5 },
  { x: 12, y: 60, w: 50, color: "rgba(255,160,100,0.35)", d: 32, delay: 2.5 },
];

