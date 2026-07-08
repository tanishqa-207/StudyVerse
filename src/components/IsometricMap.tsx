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

      {/* interactive location cards */}
      {mapLocations.map((loc, i) => (
        <LocationCard key={loc.key} loc={loc} index={i} />
      ))}
    </div>
  );
}

function Cloud() {
  return (
    <div className="relative opacity-70">
      <div className="h-8 w-24 rounded-full bg-white/40 blur-[6px]" />
      <div className="absolute -top-3 left-6 h-10 w-14 rounded-full bg-white/50 blur-[6px]" />
      <div className="absolute -top-2 left-14 h-8 w-12 rounded-full bg-white/40 blur-[6px]" />
    </div>
  );
}
