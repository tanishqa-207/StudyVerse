"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import IsometricMap from "./IsometricMap";
import TodaysProgress from "./TodaysProgress";
import BottomDock from "./BottomDock";
import Onboarding from "./Onboarding";
import FocusSessionModal from "./FocusSessionModal";
import LocationModals from "./LocationModals";
import AssistantPanel from "./AssistantPanel";
import { useStore, useHasProfile } from "@/lib/store";
import { useUI } from "@/lib/uiStore";
import { useRoom } from "@/lib/roomStore";

export default function AppShell() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);
  const hasProfile = useHasProfile();
  const openModal = useUI((s) => s.openModal);
  const setPrefillCode = useRoom((s) => s.setPrefillCode);

  // load persisted profiles once on the client
  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-0)]">
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* subtle animated clouds filling the empty space behind the top bar */}
        <TopClouds />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <TopBar />

          <div className="flex min-h-0 flex-1 gap-5 px-7 pt-5">
            <div className="min-w-0 flex-1">
              <IsometricMap />
            </div>
            <TodaysProgress />
          </div>

          <div className="px-7 py-5">
            <BottomDock />
          </div>
        </div>
      </div>

      {/* app-wide overlays: modals and the study coach */}
      <FocusSessionModal />
      <LocationModals />
      <AssistantPanel />
      <Toast />
    </div>
  );
}

// Soft, slow-drifting clouds occupying the empty band at the top of the
// dashboard. Purely decorative (pointer-events-none) and tuned to the twilight
// palette so it blends with the isometric sky below.
function TopClouds() {
  const clouds = [
    { x: 4, y: 8, s: 1.1, o: 0.1, d: 26 },
    { x: 30, y: 22, s: 0.8, o: 0.08, d: 32 },
    { x: 52, y: 6, s: 1.3, o: 0.11, d: 30 },
    { x: 74, y: 20, s: 0.9, o: 0.09, d: 28 },
    { x: 90, y: 10, s: 1.15, o: 0.1, d: 34 },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-40 overflow-hidden">
      {clouds.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: `scale(${c.s})`,
            opacity: c.o,
            animation: `float-cloud ${c.d}s ease-in-out ${i * 1.4}s infinite`,
          }}
        >
          <div className="relative">
            <div className="h-9 w-28 rounded-full bg-white blur-[10px]" />
            <div className="absolute -top-4 left-7 h-12 w-16 rounded-full bg-white blur-[10px]" />
            <div className="absolute -top-2 left-16 h-9 w-14 rounded-full bg-white blur-[10px]" />
          </div>
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
