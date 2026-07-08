import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "book"
  | "users"
  | "clipboard"
  | "leaf"
  | "flame"
  | "tree"
  | "play"
  | "search"
  | "menu"
  | "coin"
  | "gem"
  | "clock"
  | "target"
  | "chevron-right"
  | "chevron-down"
  | "hexagon"
  | "skip-back"
  | "skip-forward"
  | "pause"
  | "sparkle"
  | "dots";

const paths: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />,
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6M17 20a5.5 5.5 0 0 0-3-4.9" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M8.5 12.5 11 15l4.5-4.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C10 4 4 9 4 18c0 0 5 0 9-4 3-3 4-6 7-10z" />
      <path d="M4 20c4-8 9-11 14-13" />
    </>
  ),
  flame: (
    <path d="M12 2.5c1.8 3 4.5 4.8 4.5 8.5a4.5 4.5 0 0 1-9 0c0-1 .4-1.9 1-2.6.3 1.1 1 1.8 1.8 1.8-.8-2.6.4-5.4 1.7-7.7z" />
  ),
  tree: (
    <>
      <path d="M12 3 6.5 11h11z" />
      <path d="M12 8 7 15h10z" />
      <path d="M12 15v6" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 10.2c0-1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.7-1.1 1.5-2.5 1.8-2.5.8-2.5 1.8 1.1 1.7 2.5 1.7 2.5-.7 2.5-1.7" />
    </>
  ),
  gem: (
    <>
      <path d="M6 3h12l3 6-9 12L3 9z" />
      <path d="M3 9h18M9 3 6 9l6 12M15 3l3 6-6 12" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  "chevron-right": <path d="m9 5 7 7-7 7" />,
  "chevron-down": <path d="m5 9 7 7 7-7" />,
  hexagon: <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" />,
  "skip-back": (
    <>
      <path d="M18 6 8 12l10 6z" />
      <path d="M6 5v14" />
    </>
  ),
  "skip-forward": (
    <>
      <path d="M6 6l10 6-10 6z" />
      <path d="M18 5v14" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5v14M15 5v14" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export default function Icon({ name, size = 22, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
