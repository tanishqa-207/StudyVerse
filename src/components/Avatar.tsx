// A predefined, stylized 3D-render-style avatar rendered entirely in SVG.
// Replaces any uploaded profile picture — no upload flow exists in the MVP.

interface AvatarProps {
  size?: number;
  ring?: boolean;
}

export default function Avatar({ size = 44, ring = true }: AvatarProps) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label="Nova avatar"
      role="img"
    >
      {ring && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 210deg, #9a8bff, #56b6f5, #7c6cf5, #9a8bff)",
            padding: 2,
          }}
        >
          <div className="h-full w-full rounded-full bg-[#20265f]" />
        </div>
      )}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-[3px]"
        style={{ width: size - 6, height: size - 6 }}
      >
        <defs>
          <radialGradient id="av-bg" cx="35%" cy="25%" r="90%">
            <stop offset="0%" stopColor="#8f8bff" />
            <stop offset="100%" stopColor="#4b47b8" />
          </radialGradient>
          <linearGradient id="av-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd9c2" />
            <stop offset="100%" stopColor="#f2b295" />
          </linearGradient>
          <linearGradient id="av-hair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3a2f52" />
            <stop offset="100%" stopColor="#1d1730" />
          </linearGradient>
          <linearGradient id="av-shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ec6ff" />
            <stop offset="100%" stopColor="#3f8ce0" />
          </linearGradient>
          <clipPath id="av-clip">
            <circle cx="50" cy="50" r="50" />
          </clipPath>
        </defs>

        <g clipPath="url(#av-clip)">
          <circle cx="50" cy="50" r="50" fill="url(#av-bg)" />
          {/* shoulders / shirt */}
          <path
            d="M18 100c0-18 14-30 32-30s32 12 32 30z"
            fill="url(#av-shirt)"
          />
          {/* neck */}
          <rect x="42" y="58" width="16" height="18" rx="7" fill="#eaa988" />
          {/* head */}
          <ellipse cx="50" cy="46" rx="20" ry="22" fill="url(#av-skin)" />
          {/* cheek blush */}
          <ellipse cx="39" cy="52" rx="4" ry="2.6" fill="#ffb3a0" opacity="0.6" />
          <ellipse cx="61" cy="52" rx="4" ry="2.6" fill="#ffb3a0" opacity="0.6" />
          {/* eyes */}
          <ellipse cx="43" cy="45" rx="3" ry="3.6" fill="#2a2140" />
          <ellipse cx="57" cy="45" rx="3" ry="3.6" fill="#2a2140" />
          <circle cx="44.1" cy="43.7" r="1" fill="#fff" />
          <circle cx="58.1" cy="43.7" r="1" fill="#fff" />
          {/* smile */}
          <path
            d="M44 55c2.4 2.6 9.6 2.6 12 0"
            fill="none"
            stroke="#c9735a"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* hair */}
          <path
            d="M28 46c-2-16 9-27 22-27s24 11 22 27c-1-8-5-12-5-12-2 6-9 8-17 8s-15-2-17-8c0 0-4 4-5 12z"
            fill="url(#av-hair)"
          />
          <path
            d="M30 44c0-14 9-23 20-23 4 0 7 1 7 1-10 1-18 9-20 22z"
            fill="#fff"
            opacity="0.08"
          />
        </g>
      </svg>
    </div>
  );
}
