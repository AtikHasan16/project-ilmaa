import { Outlet } from "react-router";
import NavigationDock from "../components/NavigationDock";

/**
 * Universal Workspace Layout Shell
 * - No top header/navbar as mandated by the PRD
 * - Desktop/Tablet: Left padding to account for the floating dock
 * - Mobile: Bottom padding to account for the mobile dock
 * - Strict plum and white palette with centered workspace canvas
 */
export default function WorkspaceLayout() {
  return (
    <div className="min-h-screen w-full bg-white text-body-dark relative flex flex-col">
      {/* Floating Navigation Dock */}
      <NavigationDock />

      {/* Main Workspace Canvas */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 md:pl-28 md:pr-8 mb-20 md:mb-8 flex flex-col justify-center">
        <Outlet />
      </main>
    </div>
  );
}
