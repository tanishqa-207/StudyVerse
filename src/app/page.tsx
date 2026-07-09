import AppShell from "@/components/AppShell";

// StudyVerse home. On first launch the user completes a one-time, no-auth
// onboarding (username + avatar), persisted locally. Subsequent launches go
// straight to the dashboard. AppShell handles hydration + gating on the client.
export default function Home() {
  return <AppShell />;
}
