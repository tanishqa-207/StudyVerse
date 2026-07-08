import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import IsometricMap from "@/components/IsometricMap";
import TodaysProgress from "@/components/TodaysProgress";
import BottomDock from "@/components/BottomDock";

// StudyVerse Home dashboard — launches directly into the dashboard with demo
// data. No authentication, signup, or profile upload in the MVP.
export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-0)]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        {/* main content: map + progress column */}
        <div className="flex min-h-0 flex-1 gap-5 px-7 pt-5">
          <div className="min-w-0 flex-1">
            <IsometricMap />
          </div>
          <TodaysProgress />
        </div>

        {/* bottom dock */}
        <div className="px-7 py-5">
          <BottomDock />
        </div>
      </div>
    </div>
  );
}
