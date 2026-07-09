"use client";

// Premium volumetric cloud — a lumpy cumulus built from individually-shaded "puff"
// spheres (lit top-left, shaded lower edge) with multiple depth layers, soft shadows,
// and sunset lighting (purple/orange tints). Each puff is a realistic sphere with
// realistic self-shadow and depth. Rendered with CSS gradients for 60fps performance.

// puff layout inside the 220×130 box: [width, height, left, top]
const PUFFS: [number, number, number, number][] = [
  [118, 118, 46, 8], // tall central crown
  [92, 92, 4, 42], // left shoulder
  [98, 98, 100, 40], // right shoulder
  [72, 72, 152, 54], // right tail
  [66, 66, -10, 58], // left tail
  [80, 80, 66, 36], // fill between crown + shoulders
];

// Additional back-layer puffs for depth
const BACK_PUFFS: [number, number, number, number][] = [
  [140, 100, 26, 18],
  [110, 110, 80, 32],
  [120, 95, 120, 24],
];

export default function Cloud({
  scale = 1,
  opacity = 0.9,
  tint = "#f4eeff",
}: {
  scale?: number;
  opacity?: number;
  tint?: string;
}) {
  return (
    <div
      className="vcloud"
      style={{
        transform: `scale(${scale})`,
        opacity,
        ["--cloud-tint" as string]: tint,
      }}
    >
      {/* far-back volumetric layer — softer, darker (depth) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          filter: "blur(3.5px)",
        }}
      >
        {BACK_PUFFS.map(([w, h, l, t], i) => (
          <div
            key={`back${i}`}
            className="puff"
            style={{
              width: w,
              height: h,
              left: l,
              top: t,
              opacity: 0.5,
              background: `radial-gradient(
                118% 118% at 34% 24%,
                rgba(255,255,255,0.04),
                var(--cloud-tint, #f4eeff) 42%,
                rgba(140, 110, 180, 0.3) 68%,
                rgba(100, 80, 150, 0) 85%
              )`,
            }}
          />
        ))}
      </div>

      {/* main soft deep shadow — casts across a wider area for depth */}
      <div
        className="puff-shadow"
        style={{
          position: "absolute",
          left: 12,
          top: 92,
          width: 200,
          height: 42,
          borderRadius: "50%",
          background: `radial-gradient(
            50% 100% at 50% 0%,
            rgba(40, 20, 80, 0.6),
            rgba(40, 20, 80, 0.2) 65%,
            rgba(40, 20, 80, 0) 85%
          )`,
          filter: "blur(8px)",
        }}
      />

      {/* flat shaded base merges the puffs into one silhouette — now with stronger gradient */}
      <div
        className="puff puff-base"
        style={{
          position: "absolute",
          left: 6,
          top: 64,
          width: 208,
          height: 52,
          background: `radial-gradient(
            62% 120% at 50% 22%,
            #efe8fb 0%,
            var(--cloud-tint, #f4eeff) 38%,
            rgba(150, 130, 200, 0.5) 65%,
            rgba(120, 100, 160, 0) 82%
          )`,
        }}
      />

      {/* front-layer puffs — crisp and bright */}
      {PUFFS.map(([w, h, l, t], i) => (
        <div key={i} className="puff" style={{ width: w, height: h, left: l, top: t }} />
      ))}

      {/* subtle rim highlight on the front-left (incoming light) */}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 12,
          width: 120,
          height: 80,
          borderRadius: "50% 40% 50% 50%",
          background: `radial-gradient(
            circle at 30% 25%,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 200, 100, 0.08) 25%,
            transparent 60%
          )`,
          filter: "blur(1.5px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
