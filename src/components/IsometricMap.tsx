"use client";

import IsoScene from "./IsoScene";
import LocationCard from "./LocationCard";
import { mapLocations } from "@/lib/demoData";

export default function IsometricMap() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px]">
      {/* twilight sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #5b62c9 0%, #6f6fd6 42%, #8a86e0 100%)",
        }}
      />

      {/* clouds */}
      {[
        { x: 12, y: 14, s: 1, d: 18 },
        { x: 68, y: 8, s: 1.3, d: 24 },
        { x: 82, y: 30, s: 0.8, d: 20 },
        { x: 40, y: 6, s: 0.9, d: 26 },
        { x: 24, y: 4, s: 0.7, d: 30 },
        { x: 90, y: 16, s: 1.1, d: 22 },
        { x: 55, y: 20, s: 0.65, d: 28 },
      ].map((c, i) => (
        <div
          key={i}
          className="pointer-events-none absolute"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: `scale(${c.s})`,
            animation: `float-cloud ${c.d}s ease-in-out ${i}s infinite`,
          }}
        >
          <Cloud />
        </div>
      ))}

      {/* isometric city */}
      <div className="absolute inset-0">
        <IsoScene />
      </div>

      {/* ambient lighting — soft central glow + top vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 62%, rgba(143,212,255,0.10), transparent 70%)," +
            "radial-gradient(120% 80% at 50% -10%, rgba(11,16,48,0.35), transparent 55%)",
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
const PARTICLES = Array.from({ length: 24 }).map((_, i) => ({
  x: (i * 41) % 100,
  y: (i * 17) % 40,
  s: 2 + (i % 3),
  d: 10 + (i % 6) * 2,
  delay: (i % 8) * 1.5,
}));

function Cloud() {
  return (
    <div className="relative opacity-70">
      <div className="h-8 w-24 rounded-full bg-white/40 blur-[6px]" />
      <div className="absolute -top-3 left-6 h-10 w-14 rounded-full bg-white/50 blur-[6px]" />
      <div className="absolute -top-2 left-14 h-8 w-12 rounded-full bg-white/40 blur-[6px]" />
    </div>
  );
}
