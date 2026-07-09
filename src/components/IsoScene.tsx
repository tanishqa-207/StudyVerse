// Premium hand-built isometric city, rendered as SVG with a deterministic
// isometric projection and painter's-algorithm depth sorting for static objects.
//
// Design contract:
//  - Roads form a 3×3 grid with real intersections, curbs, sidewalks and
//    crosswalks. Buildings are inset well inside each city block, never over a
//    road corridor.
//  - Traffic runs on CLOSED-LOOP road circuits (SVG <animateMotion> along a
//    closed path). Because every circuit traces road centre-lanes only, a
//    vehicle physically cannot leave the road or enter a building — it turns at
//    each corner and loops forever. Adjacent block-loops ride opposite lanes of
//    the shared road, so they never overlap; vehicles on one loop are phase-
//    offset by an equal fraction of the duration, keeping constant spacing.

// ---- isometric projection ----
const ISO_W = 30;
const ISO_H = 15;
const ISO_Z = 24;

type P = [number, number];
const proj = (x: number, y: number, z = 0): P => [
  (x - y) * ISO_W,
  (x + y) * ISO_H - z * ISO_Z,
];
const pts = (arr: P[]) => arr.map((p) => p.join(",")).join(" ");
const depth = (x: number, y: number) => x + y;

// ---- road network (grid units) ----
const H_ROADS = [5, 13, 21]; // horizontal road centre-lines (constant y)
const V_ROADS = [5, 13, 21]; // vertical road centre-lines (constant x)
const ROAD_HW = 1.25; // road half-width
const WALK = 0.6; // sidewalk width
const LANE = 0.55; // lane centre offset from road centre-line
const GRID_MIN = -4;
const GRID_MAX = 30;

function gridPath(wp: P[], close = false): string {
  const d = wp
    .map((p, i) => `${i === 0 ? "M" : "L"} ${proj(p[0], p[1]).join(" ")}`)
    .join(" ");
  return close ? `${d} Z` : d;
}

interface Palette {
  top: string;
  right: string;
  left: string;
  window: string;
}

const PALETTES: Palette[] = [
  { top: "#9cc3f5", right: "#5f86d8", left: "#3a54a8", window: "#ffe9a8" },
  { top: "#8fb4ea", right: "#557fd0", left: "#33509e", window: "#bfe4ff" },
  { top: "#a89bf0", right: "#6f5fd6", left: "#463a98", window: "#ffe9a8" },
  { top: "#7fd8cf", right: "#3f9e93", left: "#256b63", window: "#d6fff8" },
  { top: "#f0a6c8", right: "#d16a97", left: "#9a3f68", window: "#ffe3f0" },
  { top: "#8890c4", right: "#5a63a6", left: "#3c4176", window: "#ffdf9e" },
];

// ---------------------------------------------------------------------------
// Building — tiered, with lit windows, rooftop props and a ground shadow.
// ---------------------------------------------------------------------------
function box(x: number, y: number, w: number, d: number, z0: number, z1: number) {
  const top: P[] = [
    proj(x, y, z1),
    proj(x + w, y, z1),
    proj(x + w, y + d, z1),
    proj(x, y + d, z1),
  ];
  const right: P[] = [
    proj(x + w, y, z1),
    proj(x + w, y + d, z1),
    proj(x + w, y + d, z0),
    proj(x + w, y, z0),
  ];
  const left: P[] = [
    proj(x, y + d, z1),
    proj(x + w, y + d, z1),
    proj(x + w, y + d, z0),
    proj(x, y + d, z0),
  ];
  return { top, right, left };
}

function windows(
  x: number,
  y: number,
  w: number,
  d: number,
  z0: number,
  z1: number,
  color: string,
) {
  const els: React.ReactNode[] = [];
  const h = z1 - z0;
  const rows = Math.max(1, Math.round(h * 1.1));
  const colsR = Math.max(1, Math.round(d * 1.2));
  const colsL = Math.max(1, Math.round(w * 1.2));
  for (let r = 0; r < rows; r++) {
    const u0 = z0 + ((r + 0.28) / rows) * h;
    const u1 = z0 + ((r + 0.72) / rows) * h;
    for (let c = 0; c < colsR; c++) {
      const v0 = y + ((c + 0.3) / colsR) * d;
      const v1 = y + ((c + 0.7) / colsR) * d;
      const lit = (r + c) % 3 !== 0;
      els.push(
        <polygon
          key={`r${r}-${c}`}
          points={pts([
            proj(x + w, v0, u1),
            proj(x + w, v1, u1),
            proj(x + w, v1, u0),
            proj(x + w, v0, u0),
          ])}
          fill={lit ? color : "#2a3672"}
          opacity={lit ? 0.9 : 0.6}
        />,
      );
    }
    for (let c = 0; c < colsL; c++) {
      const v0 = x + ((c + 0.3) / colsL) * w;
      const v1 = x + ((c + 0.7) / colsL) * w;
      const lit = (r + c) % 3 !== 1;
      els.push(
        <polygon
          key={`l${r}-${c}`}
          points={pts([
            proj(v0, y + d, u1),
            proj(v1, y + d, u1),
            proj(v1, y + d, u0),
            proj(v0, y + d, u0),
          ])}
          fill={lit ? color : "#26315f"}
          opacity={lit ? 0.7 : 0.5}
        />,
      );
    }
  }
  return els;
}

interface BuildingProps {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  palette: Palette;
  tiers?: number;
  roof?: "tank" | "antenna" | "heli" | "none";
}

function Building({ x, y, w, d, h, palette, tiers = 1, roof = "none" }: BuildingProps) {
  const parts: React.ReactNode[] = [];
  const [sx, sy] = proj(x + w / 2, y + d / 2, 0);
  parts.push(
    <ellipse
      key="shadow"
      cx={sx + 26}
      cy={sy + 12}
      rx={(w + d) * 9}
      ry={(w + d) * 4}
      fill="#080c24"
      opacity={0.4}
    />,
  );

  let cx = x,
    cy = y,
    cw = w,
    cd = d,
    z0 = 0;
  const tierH = h / tiers;
  for (let t = 0; t < tiers; t++) {
    const z1 = z0 + tierH;
    const b = box(cx, cy, cw, cd, z0, z1);
    parts.push(
      <g key={`tier${t}`}>
        <polygon points={pts(b.left)} fill={palette.left} />
        <polygon points={pts(b.right)} fill={palette.right} />
        {windows(cx, cy, cw, cd, z0 + tierH * 0.1, z1 - tierH * 0.06, palette.window)}
        <polygon points={pts(b.top)} fill={palette.top} />
        <polygon points={pts(b.top)} fill="none" stroke="#eaf2ff" strokeWidth={0.8} opacity={0.35} />
      </g>,
    );
    const inset = Math.min(cw, cd) * 0.18;
    cx += inset;
    cy += inset;
    cw -= inset * 2;
    cd -= inset * 2;
    z0 = z1;
  }

  const rc = proj(cx + cw / 2, cy + cd / 2, z0);
  if (roof === "antenna") {
    parts.push(
      <g key="roof">
        <line x1={rc[0]} y1={rc[1]} x2={rc[0]} y2={rc[1] - 34} stroke="#cdd7ff" strokeWidth={1.4} />
        <circle cx={rc[0]} cy={rc[1] - 34} r={2.4} fill="#ff7a7a">
          <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </g>,
    );
  } else if (roof === "tank") {
    const tb = box(cx + cw * 0.3, cy + cd * 0.3, cw * 0.4, cd * 0.4, z0, z0 + 0.7);
    parts.push(
      <g key="roof">
        <polygon points={pts(tb.left)} fill="#3c4176" />
        <polygon points={pts(tb.right)} fill="#4a5090" />
        <polygon points={pts(tb.top)} fill="#5a63a6" />
      </g>,
    );
  } else if (roof === "heli") {
    parts.push(
      <g key="roof">
        <ellipse cx={rc[0]} cy={rc[1]} rx={12} ry={6} fill="#2a3672" stroke="#ffd166" strokeWidth={1} opacity={0.9} />
        <text x={rc[0]} y={rc[1] + 3} fontSize={7} fill="#ffd166" textAnchor="middle" fontWeight="bold">H</text>
      </g>,
    );
  }

  return <g>{parts}</g>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
function Tree({ x, y, z = 0, scale = 1, sway = 0 }: { x: number; y: number; z?: number; scale?: number; sway?: number }) {
  const [sx, sy] = proj(x, y, z);
  const s = scale;
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse cx="0" cy="2" rx={11 * s} ry={4.5 * s} fill="#080c24" opacity="0.4" />
      <rect x={-2 * s} y={-15 * s} width={4 * s} height={17 * s} rx={2 * s} fill="#3a2a4e" />
      <g style={{ transformOrigin: "0px -18px", animation: `sway ${4 + sway}s ease-in-out ${sway}s infinite` }}>
        <polygon points={`0,${-50 * s} ${-15 * s},${-19 * s} ${15 * s},${-19 * s}`} fill="#2f7d6f" />
        <polygon points={`0,${-63 * s} ${-12 * s},${-34 * s} ${12 * s},${-34 * s}`} fill="#3a9a86" />
        <polygon points={`0,${-74 * s} ${-9 * s},${-49 * s} ${9 * s},${-49 * s}`} fill="#49b89e" />
        <circle cx={-4 * s} cy={-42 * s} r={1.5 * s} fill="#c9ffe9" opacity={0.8} />
        <circle cx={5 * s} cy={-32 * s} r={1.3 * s} fill="#c9ffe9" opacity={0.7} />
      </g>
    </g>
  );
}

function Bush({ x, y }: { x: number; y: number }) {
  const [sx, sy] = proj(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse cx="0" cy="1" rx="9" ry="3.5" fill="#080c24" opacity="0.35" />
      <circle cx="-4" cy="-3" r="5" fill="#2f7d6f" />
      <circle cx="4" cy="-3" r="5.5" fill="#358b7b" />
      <circle cx="0" cy="-6" r="5.5" fill="#3f9e8c" />
    </g>
  );
}

function StreetLight({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const [sx, sy] = proj(x, y);
  const dir = flip ? -1 : 1;
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse cx="0" cy="1" rx="5" ry="2" fill="#080c24" opacity="0.4" />
      <rect x={-1} y={-40} width={2} height={40} fill="#5a63a6" />
      <path d={`M0 -40 q ${10 * dir} 0 ${12 * dir} 8`} fill="none" stroke="#5a63a6" strokeWidth={2} />
      <circle cx={12 * dir} cy={-30} r={3.2} fill="#fff2b0">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={12 * dir} cy={-30} r={9} fill="#ffe08f" opacity={0.28}>
        <animate attributeName="opacity" values="0.16;0.36;0.16" dur="3.5s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function Bench({ x, y }: { x: number; y: number }) {
  const [sx, sy] = proj(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse cx="0" cy="1" rx="10" ry="3" fill="#080c24" opacity="0.35" />
      <rect x={-11} y={-6} width={22} height={4} rx={1.5} fill="#a9752f" />
      <rect x={-11} y={-11} width={22} height={3} rx={1.5} fill="#c08a3e" />
      <rect x={-9} y={-4} width={2.5} height={5} fill="#6b4a1e" />
      <rect x={7} y={-4} width={2.5} height={5} fill="#6b4a1e" />
    </g>
  );
}

function Fountain({ x, y }: { x: number; y: number }) {
  const [sx, sy] = proj(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse rx={34} ry={17} fill="#2c3470" />
      <ellipse rx={26} ry={13} fill="#3a63b0" opacity={0.8} />
      <ellipse rx={26} ry={13} fill="#7fd0ff" opacity={0.35}>
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cy={-3} rx={8} ry={4} fill="#c9efff" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Vehicles & pedestrians — bound to a spline via <animateMotion>
// ---------------------------------------------------------------------------
type VType = "car" | "bus" | "moto" | "bike";

function VehicleShape({ type, color }: { type: VType; color: string }) {
  switch (type) {
    case "bus":
      return (
        <g>
          <rect x={-17} y={-6} width={34} height={12} rx={3} fill={color} />
          <rect x={-14} y={-4.5} width={28} height={4} rx={1.5} fill="#bfe4ff" opacity={0.85} />
          <rect x={-16} y={2} width={32} height={2} fill="#00000030" />
          <circle cx={17} cy={3} r={2} fill="#fff59a" />
          <circle cx={-17} cy={3} r={1.6} fill="#ff6a6a" />
        </g>
      );
    case "moto":
      return (
        <g>
          <rect x={-6} y={-2.5} width={12} height={5} rx={2.5} fill={color} />
          <circle cx={0} cy={-4} r={2} fill="#2a2140" />
          <circle cx={7} cy={1} r={1.2} fill="#fff59a" />
        </g>
      );
    case "bike":
      return (
        <g>
          <circle cx={-4} cy={0} r={2.6} fill="none" stroke="#dfe6ff" strokeWidth={1} />
          <circle cx={4} cy={0} r={2.6} fill="none" stroke="#dfe6ff" strokeWidth={1} />
          <path d="M-4 0 L0 -1 L4 0 M0 -1 L1 -5" stroke={color} strokeWidth={1.4} fill="none" />
          <circle cx={1} cy={-6} r={1.8} fill="#2a2140" />
        </g>
      );
    case "car":
    default:
      return (
        <g>
          <rect x={-9} y={-5} width={18} height={10} rx={3} fill={color} />
          <rect x={-4} y={-3.6} width={9} height={7.2} rx={2} fill="#e8f2ff" opacity={0.8} />
          <circle cx={9} cy={-2.4} r={1.5} fill="#fff59a" />
          <circle cx={9} cy={2.4} r={1.5} fill="#fff59a" />
          <circle cx={-9} cy={0} r={1.3} fill="#ff6a6a" />
        </g>
      );
  }
}

// One closed-loop circuit: N vehicles evenly phase-offset (constant spacing,
// never overlap). rotate="auto" turns each vehicle through the corners.
function Circuit({
  path,
  dur,
  vehicles,
}: {
  path: string;
  dur: number;
  vehicles: { type: VType; color: string }[];
}) {
  const n = vehicles.length;
  return (
    <>
      {vehicles.map((v, i) => (
        <g key={i}>
          <VehicleShape type={v.type} color={v.color} />
          <animateMotion
            dur={`${dur}s`}
            begin={`${-(dur * i) / n}s`}
            repeatCount="indefinite"
            path={path}
            rotate="auto"
          />
        </g>
      ))}
    </>
  );
}

function Pedestrian({ path, dur, begin, color }: { path: string; dur: number; begin: number; color: string }) {
  return (
    <g>
      <g>
        <ellipse cx="0" cy="3" rx="3" ry="1.4" fill="#080c24" opacity="0.4" />
        <rect x={-1.6} y={-6} width={3.2} height={7} rx={1.4} fill={color} />
        <circle cx="0" cy={-8} r={2.1} fill="#f2c6a0" />
      </g>
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Scene assembly
// ---------------------------------------------------------------------------
interface SceneItem {
  depth: number;
  el: React.ReactNode;
}

// deterministic pseudo-random from two ints (no Math.random → stable SSR)
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export default function IsoScene() {
  const items: SceneItem[] = [];
  const push = (dx: number, dy: number, el: React.ReactNode) =>
    items.push({ depth: depth(dx, dy), el });

  // ---- block cells (between/around the roads) ----
  const xs = [GRID_MIN, ...V_ROADS, GRID_MAX];
  const ys = [GRID_MIN, ...H_ROADS, GRID_MAX];
  const M = 1.9; // inset from roads (sidewalk + gap) so buildings never touch roads

  // cells to treat as parks/plazas (col,row) — 0-indexed over the 4×4 grid
  const parks = new Set(["0,0", "3,3", "0,3"]);
  const plaza = "1,1"; // central plaza with fountain

  let bIdx = 0;
  for (let ci = 0; ci < xs.length - 1; ci++) {
    for (let ri = 0; ri < ys.length - 1; ri++) {
      const x0 = xs[ci] + M;
      const x1 = xs[ci + 1] - M;
      const y0 = ys[ri] + M;
      const y1 = ys[ri + 1] - M;
      const cw = x1 - x0;
      const cd = y1 - y0;
      if (cw < 1.5 || cd < 1.5) continue;
      const key = `${ci},${ri}`;

      if (key === plaza) {
        push(x0 + 0.4, y0 + 0.4, <Platform key="plaza" x={x0} y={y0} w={cw} d={cd} h={0.35} top="#39407e" side="#2a3068" />);
        push(x0 + cw / 2, y0 + cd / 2, <Fountain key="ftn" x={x0 + cw / 2} y={y0 + cd / 2} />);
        [[x0 + 0.6, y0 + 0.6], [x1 - 0.6, y0 + 0.6], [x0 + 0.6, y1 - 0.6], [x1 - 0.6, y1 - 0.6]].forEach(
          ([tx, ty], i) => push(tx, ty, <Tree key={`pz${i}`} x={tx} y={ty} scale={0.6} sway={i * 0.5} />),
        );
        continue;
      }

      if (parks.has(key)) {
        push(x0 + 0.4, y0 + 0.4, <Platform key={`pk${key}`} x={x0} y={y0} w={cw} d={cd} h={0.4} top="#2f7d5f" side="#1e5140" />);
        const spots: P[] = [];
        const nx = Math.max(2, Math.round(cw / 2));
        const ny = Math.max(2, Math.round(cd / 2));
        for (let a = 0; a < nx; a++)
          for (let b = 0; b < ny; b++)
            spots.push([x0 + 0.7 + (a + hash(a, ri) * 0.4) * (cw / nx), y0 + 0.7 + (b + hash(b, ci) * 0.4) * (cd / ny)]);
        spots
          .sort((p, q) => depth(p[0], p[1]) - depth(q[0], q[1]))
          .forEach(([tx, ty], i) => push(tx, ty, <Tree key={`pt${key}-${i}`} x={tx} y={ty} z={0.4} scale={0.72} sway={(i % 4) * 0.5} />));
        push(x0 + cw / 2, y1 - 0.5, <Bench key={`pb${key}`} x={x0 + cw / 2} y={y1 - 0.6} />);
        continue;
      }

      // regular block → 1 building filling most of the cell, deterministic variety
      const hgt = 3 + hash(ci, ri) * 6.5;
      const tiers = hgt > 6.5 ? 3 : hgt > 4.5 ? 2 : 1;
      const roofs: BuildingProps["roof"][] = ["antenna", "tank", "heli", "none", "tank", "antenna"];
      const pal = PALETTES[bIdx % PALETTES.length];
      const roof = roofs[bIdx % roofs.length];
      // shrink slightly and centre in cell
      const pad = 0.15 * Math.min(cw, cd);
      const bx = x0 + pad,
        by = y0 + pad,
        bw = cw - pad * 2,
        bd = cd - pad * 2;
      push(bx + bw, by + bd, <Building key={`b${key}`} x={bx} y={by} w={bw} d={bd} h={hgt} palette={pal} tiers={tiers} roof={roof} />);
      bIdx++;

      // a bush at the block corner for detail
      push(x1, y0, <Bush key={`bs${key}`} x={x1} y={y0} />);
    }
  }

  // ---- street furniture along sidewalks at intersections ----
  let sli = 0;
  H_ROADS.forEach((cy) =>
    V_ROADS.forEach((cx) => {
      const off = ROAD_HW + WALK * 0.5;
      push(cx + off, cy + off, <StreetLight key={`sl${sli++}`} x={cx + off} y={cy + off} />);
      push(cx - off, cy - off, <StreetLight key={`sl${sli++}`} x={cx - off} y={cy - off} flip />);
    }),
  );

  items.sort((a, b) => a.depth - b.depth);

  return (
    <svg viewBox="-1060 -400 2120 1440" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <radialGradient id="ground-grad" cx="50%" cy="34%" r="90%">
          <stop offset="0%" stopColor="#3b4290" />
          <stop offset="100%" stopColor="#181d4f" />
        </radialGradient>
      </defs>

      <polygon
        points={pts([proj(GRID_MIN, GRID_MIN), proj(GRID_MAX, GRID_MIN), proj(GRID_MAX, GRID_MAX), proj(GRID_MIN, GRID_MAX)])}
        fill="url(#ground-grad)"
      />

      <RoadNetwork />

      {/* static city, painter-sorted far → near */}
      {items.map((it, i) => (
        <g key={i}>{it.el}</g>
      ))}

      {/* traffic — closed-loop circuits over the road grid */}
      <Traffic />

      {/* pedestrians on sidewalks */}
      <Pedestrians />
    </svg>
  );
}

// ---- road + sidewalk + markings ----
function RoadNetwork() {
  const els: React.ReactNode[] = [];
  const sidewalk = "#39407e";
  const road = "#1b2048";

  const band = (horizontal: boolean, c: number, hw: number, fill: string, key: string) => {
    const p: P[] = horizontal
      ? [proj(GRID_MIN, c - hw), proj(GRID_MAX, c - hw), proj(GRID_MAX, c + hw), proj(GRID_MIN, c + hw)]
      : [proj(c - hw, GRID_MIN), proj(c + hw, GRID_MIN), proj(c + hw, GRID_MAX), proj(c - hw, GRID_MAX)];
    els.push(<polygon key={key} points={pts(p)} fill={fill} />);
  };

  H_ROADS.forEach((c, i) => band(true, c, ROAD_HW + WALK, sidewalk, `hw${i}`));
  V_ROADS.forEach((c, i) => band(false, c, ROAD_HW + WALK, sidewalk, `vw${i}`));
  H_ROADS.forEach((c, i) => band(true, c, ROAD_HW, road, `hr${i}`));
  V_ROADS.forEach((c, i) => band(false, c, ROAD_HW, road, `vr${i}`));

  H_ROADS.forEach((c, i) =>
    els.push(
      <path key={`hd${i}`} d={gridPath([[GRID_MIN, c], [GRID_MAX, c]])} stroke="#f0d98a" strokeWidth={1.4} strokeDasharray="9 12" opacity={0.55} fill="none" />,
    ),
  );
  V_ROADS.forEach((c, i) =>
    els.push(
      <path key={`vd${i}`} d={gridPath([[c, GRID_MIN], [c, GRID_MAX]])} stroke="#f0d98a" strokeWidth={1.4} strokeDasharray="9 12" opacity={0.55} fill="none" />,
    ),
  );

  // crosswalks at each intersection
  H_ROADS.forEach((cy) =>
    V_ROADS.forEach((cx, k) => {
      for (let s = 0; s < 5; s++) {
        const t = -ROAD_HW + 0.35 + s * ((ROAD_HW * 2 - 0.7) / 4);
        els.push(
          <line key={`cwx${cx}-${cy}-${k}-${s}`} {...lineProps(proj(cx - ROAD_HW - 0.5, cy + t), proj(cx - ROAD_HW - 0.05, cy + t))} stroke="#dfe6ff" strokeWidth={2} opacity={0.5} />,
        );
        els.push(
          <line key={`cwy${cx}-${cy}-${k}-${s}`} {...lineProps(proj(cx + t, cy - ROAD_HW - 0.5), proj(cx + t, cy - ROAD_HW - 0.05))} stroke="#dfe6ff" strokeWidth={2} opacity={0.5} />,
        );
      }
    }),
  );

  return <g>{els}</g>;
}

const CAR_COLORS = ["#f5c451", "#e46a8b", "#5fc1f5", "#a99bff", "#7fe0c0", "#ffd166", "#f472c9", "#9cc3f5", "#ff8a5f"];

function Traffic() {
  const loops: React.ReactNode[] = [];
  let li = 0;

  // one clockwise circuit per interior block, on the block-facing lane
  for (let i = 0; i < V_ROADS.length - 1; i++) {
    for (let j = 0; j < H_ROADS.length - 1; j++) {
      const x0 = V_ROADS[i] + LANE;
      const x1 = V_ROADS[i + 1] - LANE;
      const y0 = H_ROADS[j] + LANE;
      const y1 = H_ROADS[j + 1] - LANE;
      const path = gridPath([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true);
      const base = li * 3;
      const vehicles = [
        { type: "car" as VType, color: CAR_COLORS[base % CAR_COLORS.length] },
        { type: (li % 2 ? "moto" : "bus") as VType, color: CAR_COLORS[(base + 1) % CAR_COLORS.length] },
        { type: "car" as VType, color: CAR_COLORS[(base + 2) % CAR_COLORS.length] },
        { type: "bike" as VType, color: CAR_COLORS[(base + 4) % CAR_COLORS.length] },
      ];
      loops.push(<Circuit key={`loop${li}`} path={path} dur={16 + li * 2} vehicles={vehicles} />);
      li++;
    }
  }

  // outer perimeter circuit (counter-clockwise, outer lane) — buses
  const px0 = V_ROADS[0] - LANE;
  const px1 = V_ROADS[V_ROADS.length - 1] + LANE;
  const py0 = H_ROADS[0] - LANE;
  const py1 = H_ROADS[H_ROADS.length - 1] + LANE;
  const perimeter = gridPath([[px0, py0], [px0, py1], [px1, py1], [px1, py0]], true);
  loops.push(
    <Circuit
      key="perimeter"
      path={perimeter}
      dur={34}
      vehicles={[
        { type: "bus", color: "#ffb04a" },
        { type: "car", color: "#8fd4ff" },
        { type: "bus", color: "#5fc1f5" },
        { type: "car", color: "#f472c9" },
      ]}
    />,
  );

  return <g>{loops}</g>;
}

function Pedestrians() {
  const walks: React.ReactNode[] = [];
  const off = ROAD_HW + WALK * 0.5;
  // walk loops around a few blocks on the sidewalk
  const blocks: [number, number, number, number][] = [
    [V_ROADS[0], H_ROADS[0], V_ROADS[1], H_ROADS[1]],
    [V_ROADS[1], H_ROADS[1], V_ROADS[2], H_ROADS[2]],
  ];
  blocks.forEach(([ax, ay, bx, by], bi) => {
    const path = gridPath([[ax + off, ay + off], [bx - off, ay + off], [bx - off, by - off], [ax + off, by - off]], true);
    const colors = ["#ff9fbf", "#8fd4ff", "#ffd166"];
    for (let k = 0; k < 3; k++) {
      walks.push(
        <Pedestrian key={`ped${bi}-${k}`} path={path} dur={26 + bi * 4} begin={-(26 * k) / 3} color={colors[k % colors.length]} />,
      );
    }
  });
  return <g>{walks}</g>;
}

function Platform({
  x,
  y,
  w,
  d,
  h,
  top,
  side,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  top: string;
  side: string;
}) {
  const b = box(x, y, w, d, 0, h);
  return (
    <g>
      <polygon points={pts(b.left)} fill={side} opacity={0.85} />
      <polygon points={pts(b.right)} fill={side} />
      <polygon points={pts(b.top)} fill={top} />
    </g>
  );
}

function lineProps(a: P, b: P) {
  return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
}
