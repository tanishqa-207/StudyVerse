// A predefined, stylized 3D-render-style avatar rendered entirely in SVG.
// One of 12 default variants (see `avatars` in demoData). No photo upload flow
// exists — the user picks a variant during onboarding.

import { avatars } from "@/lib/demoData";

interface AvatarProps {
  size?: number;
  ring?: boolean;
  /** 0..11 — which of the 12 default avatars to render. */
  variant?: number;
}

export default function Avatar({ size = 44, ring = true, variant = 0 }: AvatarProps) {
  const spec = avatars[((variant % avatars.length) + avatars.length) % avatars.length];
  const uid = `av${variant}`; // unique gradient namespace per variant

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Avatar ${variant + 1}`}
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
          <radialGradient id={`${uid}-bg`} cx="35%" cy="25%" r="90%">
            <stop offset="0%" stopColor={spec.bg[0]} />
            <stop offset="100%" stopColor={spec.bg[1]} />
          </radialGradient>
          <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={spec.skin[0]} />
            <stop offset="100%" stopColor={spec.skin[1]} />
          </linearGradient>
          <linearGradient id={`${uid}-hair`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={spec.hair[0]} />
            <stop offset="100%" stopColor={spec.hair[1]} />
          </linearGradient>
          <linearGradient id={`${uid}-shirt`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={spec.shirt[0]} />
            <stop offset="100%" stopColor={spec.shirt[1]} />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <circle cx="50" cy="50" r="50" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${uid}-clip)`}>
          <circle cx="50" cy="50" r="50" fill={`url(#${uid}-bg)`} />
          {/* shoulders / shirt */}
          <path d="M18 100c0-18 14-30 32-30s32 12 32 30z" fill={`url(#${uid}-shirt)`} />
          {/* neck */}
          <rect x="42" y="58" width="16" height="18" rx="7" fill={spec.skin[1]} />
          {/* head */}
          <ellipse cx="50" cy="46" rx="20" ry="22" fill={`url(#${uid}-skin)`} />
          {/* cheek blush */}
          <ellipse cx="39" cy="52" rx="4" ry="2.6" fill="#ffb3a0" opacity="0.5" />
          <ellipse cx="61" cy="52" rx="4" ry="2.6" fill="#ffb3a0" opacity="0.5" />
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
          <Hair uid={uid} style={spec.hairStyle} />
        </g>
      </svg>
    </div>
  );
}

function Hair({ uid, style }: { uid: string; style: AvatarSpecStyle }) {
  const fill = `url(#${uid}-hair)`;
  switch (style) {
    case "bun":
      return (
        <>
          <circle cx="50" cy="18" r="9" fill={fill} />
          <path
            d="M28 48c-2-18 9-29 22-29s24 11 22 29c-1-9-5-13-5-13-2 6-9 8-17 8s-15-2-17-8c0 0-4 4-5 13z"
            fill={fill}
          />
        </>
      );
    case "curly":
      return (
        <>
          <circle cx="32" cy="34" r="9" fill={fill} />
          <circle cx="50" cy="24" r="11" fill={fill} />
          <circle cx="68" cy="34" r="9" fill={fill} />
          <circle cx="30" cy="46" r="7" fill={fill} />
          <circle cx="70" cy="46" r="7" fill={fill} />
          <path d="M30 44c2-14 9-22 20-22s18 8 20 22c-3-6-9-9-20-9s-17 3-20 9z" fill={fill} />
        </>
      );
    case "cap":
      return (
        <path
          d="M27 42c0-16 10-25 23-25s23 9 23 25c-3-4-6-6-6-6H22s3 2 5 6z M22 40h56v6H22z"
          fill={fill}
        />
      );
    case "short":
    default:
      return (
        <path
          d="M28 46c-2-16 9-27 22-27s24 11 22 27c-1-8-5-12-5-12-2 6-9 8-17 8s-15-2-17-8c0 0-4 4-5 12z"
          fill={fill}
        />
      );
  }
}

type AvatarSpecStyle = "short" | "bun" | "curly" | "cap";
