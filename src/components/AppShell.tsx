"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import IsometricMap from "./IsometricMap";
import TodaysProgress from "./TodaysProgress";
import Onboarding from "./Onboarding";
import FocusSessionModal from "./FocusSessionModal";
import LocationModals from "./LocationModals";
import MemoryForestPremium from "./MemoryForestPremium";
import AssistantPanel from "./AssistantPanel";
import Cloud from "./Cloud";
import { useStore, useHasProfile, useProgress } from "@/lib/store";
import { useUI } from "@/lib/uiStore";
import { useRoom } from "@/lib/roomStore";
import { ACCENT_THEMES } from "@/lib/demoData";

export default function AppShell() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);
  const hasProfile = useHasProfile();
  const openModal = useUI((s) => s.openModal);
  const setPrefillCode = useRoom((s) => s.setPrefillCode);
  const accent = useProgress().accent;

  // load persisted profiles once on the client
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Apply the active cosmetic accent theme by overriding the accent CSS
  // variables live. Falls back to the default theme for unknown/legacy ids.
  useEffect(() => {
    const theme =
      ACCENT_THEMES.find((t) => t.id === accent) ?? ACCENT_THEMES[0];
    const root = document.documentElement;
    root.style.setProperty("--violet", theme.violet);
    root.style.setProperty("--violet-bright", theme.bright);
  }, [accent]);

  // Invite deep-link: /?join=CODE opens Study Rooms with the code prefilled,
  // then cleans the URL so a refresh doesn't reopen it.
  useEffect(() => {
    if (!hydrated || !hasProfile) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join");
    if (code) {
      setPrefillCode(code.toUpperCase());
      openModal("rooms");
      params.delete("join");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
    }
  }, [hydrated, hasProfile, openModal, setPrefillCode]);

  // Avoid SSR/client mismatch: render nothing until local storage is read.
  if (!hydrated) {
    return <div className="h-screen w-screen bg-[var(--bg-0)]" />;
  }

  if (!hasProfile) {
    return <Onboarding />;
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      {/* full-viewport twilight sky: drifting warm clouds + volumetric fog */}
      <SkyBackdrop />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <TopBar />

            <div className="scroll-slim flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 pt-5 xl:flex-row xl:overflow-visible xl:px-7">
              <div className="min-h-[420px] min-w-0 flex-1 xl:min-h-0">
                <IsometricMap />
              </div>
              <TodaysProgress />
            </div>
          </div>
        </div>
      </div>

      {/* app-wide overlays: modals and the study coach */}
      <FocusSessionModal />
      <LocationModals />
      <MemoryForestPremium />
      <AssistantPanel />
      <Toast />
    </div>
  );
}

// Full-viewport twilight atmosphere behind the whole app: big soft warm-tinted
// clouds drifting across a violet→peach sky, plus a couple of volumetric fog
// pools. Purely decorative (pointer-events-none). The sky gradient itself lives
// on <body> so it also covers onboarding.
function SkyBackdrop() {
  // fluffy clouds — position (%), scale, opacity, tint, drift duration
  const clouds = [
    { x: 6, y: 6, s: 1.3, o: 0.5, d: 46, tint: "#ffe6d8" },
    { x: 34, y: 3, s: 1.0, o: 0.4, d: 52, tint: "#f2ddff" },
    { x: 58, y: 8, s: 1.5, o: 0.46, d: 48, tint: "#ffe0ec" },
    { x: 82, y: 4, s: 1.15, o: 0.42, d: 54, tint: "#e8ddff" },
    { x: 14, y: 78, s: 1.6, o: 0.4, d: 58, tint: "#ffd9e0" },
    { x: 68, y: 84, s: 1.7, o: 0.42, d: 60, tint: "#f0d8ff" },
    { x: 44, y: 92, s: 1.9, o: 0.38, d: 64, tint: "#ffe0d0" },
    { x: 92, y: 62, s: 1.2, o: 0.36, d: 50, tint: "#ffdcea" },
  ];
  const fog = [
    { x: 18, y: 46, w: 44, d: 40, delay: 0, c: "rgba(180,120,210,0.34)" },
    { x: 74, y: 40, w: 40, d: 46, delay: 4, c: "rgba(255,170,150,0.28)" },
    { x: 50, y: 96, w: 60, d: 50, delay: 2, c: "rgba(170,130,225,0.32)" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {fog.map((f, i) => (
        <div
          key={`f${i}`}
          className="absolute rounded-full"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: `${f.w}vw`,
            height: `${f.w}vw`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${f.c} 0%, transparent 70%)`,
            filter: "blur(30px)",
            animation: `fog-drift ${f.d}s ease-in-out ${f.delay}s infinite`,
            willChange: "transform, opacity",
          }}
        />
      ))}
      {clouds.map((c, i) => (
        <div
          key={`c${i}`}
          className="absolute"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            animation: `float-cloud ${c.d}s ease-in-out ${i * 1.6}s infinite`,
            willChange: "transform",
          }}
        >
          <Cloud scale={c.s} opacity={c.o} tint={c.tint} />
        </div>
      ))}
    </div>
  );
}

function Toast() {
  const toast = useUI((s) => s.toast);
  const clearToast = useUI((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2600);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="glass-strong fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-6 py-3 text-[14px] font-semibold text-white"
          style={{ boxShadow: "0 16px 40px -12px rgba(0,0,0,0.6)" }}
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
