// Hand-built isometric city rendered as SVG (deterministic projection).
// Buildings are extruded boxes (top + two lit walls); trees and cars are
// depth-placed billboards. Traffic is animated with SVG <animateMotion>.

const ISO_W = 30;
const ISO_H = 15;
const ISO_Z = 22;

type P = [number, number];
const proj = (x: number, y: number, z = 0): P => [
  (x - y) * ISO_W,
  (x + y) * ISO_H - z * ISO_Z,
];
const pts = (arr: P[]) => arr.map((p) => p.join(",")).join(" ");

interface Palette {
  top: string;
  right: string;
  left: string;
  window?: string;
}

const PALETTES: Record<string, Palette> = {
  study: { top: "#8fb8f0", right: "#5f86d8", left: "#3f5cb0", window: "#ffe9a8" },
  block: { top: "#7d84d8", right: "#5a5fbe", left: "#3f4396", window: "#ffdf9e" },
  block2: { top: "#8a7fe0", right: "#6355c6", left: "#453a9a", window: "#c9e6ff" },
  quest: { top: "#9a8bef", right: "#6f5fd6", left: "#4d3fa8", window: "#ffe9a8" },
};

function Building({
  x,
  y,
  w,
  d,
  h,
  palette,
  windows = true,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  palette: Palette;
  windows?: boolean;
}) {
  const top: P[] = [
    proj(x, y, h),
    proj(x + w, y, h),
    proj(x + w, y + d, h),
    proj(x, y + d, h),
  ];
  const rightWall: P[] = [
    proj(x + w, y, h),
    proj(x + w, y + d, h),
    proj(x + w, y + d, 0),
    proj(x + w, y, 0),
  ];
  const leftWall: P[] = [
    proj(x, y + d, h),
    proj(x + w, y + d, h),
    proj(x + w, y + d, 0),
    proj(x, y + d, 0),
  ];

  // window grid on each wall
  const winEls: React.ReactNode[] = [];
  if (windows && palette.window) {
    const cols = Math.max(1, Math.round(d));
    const cols2 = Math.max(1, Math.round(w));
    const rows = Math.max(1, Math.round(h));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v0 = (c + 0.28) / cols;
        const v1 = (c + 0.72) / cols;
        const u0 = (r + 0.3) / rows;
        const u1 = (r + 0.72) / rows;
        winEls.push(
          <polygon
            key={`r${r}-${c}`}
            points={pts([
              proj(x + w, y + v0 * d, u1 * h),
              proj(x + w, y + v1 * d, u1 * h),
              proj(x + w, y + v1 * d, u0 * h),
              proj(x + w, y + v0 * d, u0 * h),
            ])}
            fill={palette.window}
            opacity={0.85}
          />,
        );
      }
      for (let c = 0; c < cols2; c++) {
        const v0 = (c + 0.28) / cols2;
        const v1 = (c + 0.72) / cols2;
        const u0 = (r + 0.3) / rows;
        const u1 = (r + 0.72) / rows;
        winEls.push(
          <polygon
            key={`l${r}-${c}`}
            points={pts([
              proj(x + v0 * w, y + d, u1 * h),
              proj(x + v1 * w, y + d, u1 * h),
              proj(x + v1 * w, y + d, u0 * h),
              proj(x + v0 * w, y + d, u0 * h),
            ])}
            fill={palette.window}
            opacity={0.6}
          />,
        );
      }
    }
  }

  return (
    <g>
      <polygon points={pts(leftWall)} fill={palette.left} />
      <polygon points={pts(rightWall)} fill={palette.right} />
      {winEls}
      <polygon points={pts(top)} fill={palette.top} />
    </g>
  );
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
  const topFace: P[] = [
    proj(x, y, h),
    proj(x + w, y, h),
    proj(x + w, y + d, h),
    proj(x, y + d, h),
  ];
  const right: P[] = [
    proj(x + w, y, h),
    proj(x + w, y + d, h),
    proj(x + w, y + d, 0),
    proj(x + w, y, 0),
  ];
  const left: P[] = [
    proj(x, y + d, h),
    proj(x + w, y + d, h),
    proj(x + w, y + d, 0),
    proj(x, y + d, 0),
  ];
  return (
    <g>
      <polygon points={pts(left)} fill={side} opacity={0.85} />
      <polygon points={pts(right)} fill={side} />
      <polygon points={pts(topFace)} fill={top} />
    </g>
  );
}

function Tree({ x, y, z = 0, scale = 1 }: { x: number; y: number; z?: number; scale?: number }) {
  const [sx, sy] = proj(x, y, z);
  const s = scale;
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse cx="0" cy="2" rx={10 * s} ry={4 * s} fill="#0c1233" opacity="0.45" />
      <rect x={-2 * s} y={-14 * s} width={4 * s} height={16 * s} rx={2 * s} fill="#2a2050" />
      <polygon points={`0,${-46 * s} ${-14 * s},${-18 * s} ${14 * s},${-18 * s}`} fill="#2f7d8f" />
      <polygon points={`0,${-58 * s} ${-11 * s},${-32 * s} ${11 * s},${-32 * s}`} fill="#3a97a8" />
      <polygon points={`0,${-68 * s} ${-8 * s},${-46 * s} ${8 * s},${-46 * s}`} fill="#49b4c4" />
      <circle cx={-4 * s} cy={-40 * s} r={1.6 * s} fill="#9ff0ff" />
      <circle cx={5 * s} cy={-30 * s} r={1.4 * s} fill="#9ff0ff" />
      <circle cx={0} cy={-52 * s} r={1.4 * s} fill="#d6fbff" />
    </g>
  );
}

function Car({
  from,
  to,
  color,
  dur,
  delay = 0,
}: {
  from: P;
  to: P;
  color: string;
  dur: number;
  delay?: number;
}) {
  const path = `M ${from[0]},${from[1]} L ${to[0]},${to[1]}`;
  return (
    <g>
      <g>
        <rect x={-9} y={-5} width={18} height={10} rx={3} fill={color} />
        <rect x={-5} y={-4} width={9} height={5} rx={2} fill="#ffffff" opacity={0.7} />
        <circle cx={9} cy={2} r={2.4} fill="#fff59a" opacity={0.9} />
        <animateMotion
          dur={`${dur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          path={path}
          rotate="auto"
        />
      </g>
    </g>
  );
}

export default function IsoScene() {
  // road bands
  const roadColor = "#20264f";
  const hRoad: P[] = [proj(-1, 9), proj(21, 9), proj(21, 11), proj(-1, 11)];
  const vRoad: P[] = [proj(9, -1), proj(11, -1), proj(11, 21), proj(9, 21)];

  const roundaboutCenter = proj(10, 13);

  return (
    <svg
      viewBox="-620 -210 1240 860"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      <defs>
        <radialGradient id="ground-grad" cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#3b4290" />
          <stop offset="100%" stopColor="#232a63" />
        </radialGradient>
        <radialGradient id="fountain-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8fd4ff" />
          <stop offset="100%" stopColor="#8fd4ff00" />
        </radialGradient>
      </defs>

      {/* ground diamond */}
      <polygon
        points={pts([proj(-2, -2), proj(22, -2), proj(22, 22), proj(-2, 22)])}
        fill="url(#ground-grad)"
      />

      {/* roads */}
      <polygon points={pts(hRoad)} fill={roadColor} />
      <polygon points={pts(vRoad)} fill={roadColor} />
      {/* lane dashes */}
      <line
        {...lineProps(proj(-1, 10), proj(21, 10))}
        stroke="#93a0e0"
        strokeWidth={1.5}
        strokeDasharray="10 12"
        opacity={0.5}
      />
      <line
        {...lineProps(proj(10, -1), proj(10, 21))}
        stroke="#93a0e0"
        strokeWidth={1.5}
        strokeDasharray="10 12"
        opacity={0.5}
      />

      {/* roundabout */}
      <g transform={`translate(${roundaboutCenter[0]},${roundaboutCenter[1]})`}>
        <ellipse rx={78} ry={40} fill={roadColor} />
        <ellipse rx={44} ry={22} fill="#2c3470" />
        <ellipse rx={120} ry={62} fill="url(#fountain-glow)" opacity={0.5}>
          <animate
            attributeName="opacity"
            values="0.35;0.7;0.35"
            dur="3s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse rx={16} ry={8} fill="#7fd0ff" />
        <ellipse rx={16} ry={8} cy={-4} fill="#c9efff" />
      </g>

      {/* Forest platform (top-left) */}
      <Platform x={1} y={1} w={6} d={6} h={0.6} top="#2f6f5c" side="#1e4a3e" />
      {forestTrees()}

      {/* buildings — drawn far → near */}
      <Building x={12} y={2} w={5} d={5} h={4} palette={PALETTES.study} />
      <Building x={2.5} y={12} w={4} d={4} h={3} palette={PALETTES.quest} />
      <Building x={14} y={13} w={3} d={3} h={2.5} palette={PALETTES.block2} />
      <Building x={15.5} y={8} w={2} d={2} h={2} palette={PALETTES.block} />
      <Building x={4} y={17} w={2.5} d={2} h={2.5} palette={PALETTES.block} />
      <Building x={16} y={16.5} w={2} d={2} h={3} palette={PALETTES.block2} />
      <Building x={0.5} y={9} w={1.6} d={1.6} h={1.6} palette={PALETTES.block} />

      {/* street trees */}
      <Tree x={8} y={6.4} scale={0.7} />
      <Tree x={12} y={11.6} scale={0.7} />
      <Tree x={7.4} y={12} scale={0.7} />
      <Tree x={13.4} y={17} scale={0.7} />
      <Tree x={17.6} y={12} scale={0.7} />

      {/* animated traffic */}
      <Car from={proj(-1, 10)} to={proj(21, 10)} color="#f5c451" dur={9} />
      <Car from={proj(21, 10)} to={proj(-1, 10)} color="#e46a8b" dur={11} delay={2} />
      <Car from={proj(10, -1)} to={proj(10, 21)} color="#5fc1f5" dur={10} delay={1} />
      <Car from={proj(10, 21)} to={proj(10, -1)} color="#a99bff" dur={12} delay={3.5} />
      <Car from={proj(-1, 10)} to={proj(21, 10)} color="#7fe0c0" dur={13} delay={5} />
    </svg>
  );
}

function lineProps(a: P, b: P) {
  return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
}

function forestTrees() {
  const spots: P[] = [
    [2, 2],
    [4, 2.5],
    [6, 2],
    [2.5, 4],
    [5, 4],
    [3.5, 5.5],
    [6, 5],
    [4.5, 3.2],
  ];
  return (
    <g>
      {spots
        .sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
        .map(([x, y], i) => (
          <Tree key={i} x={x} y={y} z={0.6} scale={0.85} />
        ))}
    </g>
  );
}
