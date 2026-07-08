// Stacked-layer "level up" emblem used in the logo and level badges.

interface EmblemProps {
  size?: number;
  glow?: boolean;
}

export default function Emblem({ size = 40, glow = false }: EmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={
        glow
          ? { filter: "drop-shadow(0 0 12px rgba(122,108,245,0.9))" }
          : undefined
      }
    >
      <defs>
        <linearGradient id="em-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b3a9ff" />
          <stop offset="100%" stopColor="#7c6cf5" />
        </linearGradient>
        <linearGradient id="em-mid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a7bf0" />
          <stop offset="100%" stopColor="#5f4fd6" />
        </linearGradient>
        <linearGradient id="em-bot" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6a5ce0" />
          <stop offset="100%" stopColor="#453ab0" />
        </linearGradient>
      </defs>
      {/* bottom slab */}
      <path d="M24 26 42 35 24 44 6 35z" fill="url(#em-bot)" />
      {/* middle slab */}
      <path d="M24 17 40 25 24 33 8 25z" fill="url(#em-mid)" />
      {/* top slab */}
      <path d="M24 6 38 13 24 20 10 13z" fill="url(#em-top)" />
      <path
        d="M24 6 38 13 24 20 10 13z"
        fill="#fff"
        opacity="0.18"
        transform="translate(0,-0.5)"
      />
    </svg>
  );
}
