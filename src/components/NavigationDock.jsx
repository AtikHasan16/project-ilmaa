import { NavLink, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  HiSquares2X2,
  HiBookOpen,
  HiPencilSquare,
  HiAcademicCap,
  HiCloudArrowUp,
  HiCog6Tooth,
  HiFolder,
  HiArrowRightOnRectangle,
  HiBeaker,
} from "react-icons/hi2";
import { showConfirmModal } from "../utils/sweetalert";
import { getAvatarColor, getInitials } from "../utils/avatarColors";

/**
 * Universal Floating Navigation Dock
 * - Desktop/Tablet: Left-side floating vertical dock with active module indicator
 * - Mobile: Bottom floating navigation bar
 * - Strict plum palette: Active items use `#6D4E56` with subtle pulse
 * - Role-gated items: Upload to Study and Admin Dashboard (Admin only)
 * - Deterministic color-hashed avatar initials
 */

export default function NavigationDock() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const res = await showConfirmModal({
      title: "Exit Workspace?",
      text: "Are you sure you want to log out and close your active study session?",
      confirmButtonText: "Exit Workspace",
      cancelButtonText: "Stay",
      isDanger: false,
      icon: "question",
    });

    if (res.isConfirmed) {
      logout();
      navigate("/", { replace: true });
    }
  };

  const navItems = [
    {
      to: "/workspace/dashboard",
      label: "Dashboard",
      icon: HiSquares2X2,
      show: true,
    },
    {
      to: "/workspace/flashcard",
      label: "Flashcards",
      icon: HiBookOpen,
      show: true,
    },
    {
      to: "/workspace/spelling",
      label: "Spelling",
      icon: HiPencilSquare,
      show: true,
    },
    {
      to: "/workspace/grammar",
      label: "Grammar",
      icon: HiAcademicCap,
      show: true,
    },
    {
      to: "/workspace/upload",
      label: "Upload Study",
      icon: HiCloudArrowUp,
      show: true,
    },
    {
      to: "/workspace/vocab-monitor",
      label: "Vocab Monitor",
      icon: HiFolder,
      show: isAdmin,
    },
    {
      to: "/workspace/admin",
      label: "Admin",
      icon: HiCog6Tooth,
      show: isAdmin,
    },
    {
      to: "/workspace/contribute",
      label: "Contribute",
      icon: HiBeaker,
      show: true,
    },
  ];

  // Active module lookup for the badge header
  const activeItem =
    navItems.find((item) => location.pathname.startsWith(item.to)) ||
    (location.pathname.includes("profile") ? { label: "Profile" } : { label: "Imlaa" });

  const avatarColor = getAvatarColor(user?.name);
  const initials = getInitials(user?.name);

  return (
    <>
      {/* ==================================================== */}
      {/* Desktop / Tablet: Floating Left Vertical Dock       */}
      {/* ==================================================== */}
      <aside
        aria-label="Workspace Navigation"
        className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-50 flex-col items-center select-none pointer-events-auto"
      >
        {/* Active Module Indicator Badge */}
        <div
          role="status"
          aria-live="polite"
          className="mb-2 px-3 py-1 rounded-lg bg-plum text-white text-[11px] font-bold tracking-wider uppercase shadow-xs text-center border border-plum/30 max-w-[110px] truncate"
        >
          {activeItem.label}
        </div>

        <div className="imlaa-card p-3 flex flex-col items-center space-y-3 shadow-lg border border-plum/20 bg-white rounded-2xl">
          {/* Brand Mark (Mini) */}
          <div className="w-12 h-12 rounded-xl bg-plum/10 border border-plum/20 flex items-center justify-center text-plum font-bold text-sm select-none">
            Imlaa<span className="text-plum">.</span>
          </div>

          <div className="w-8 h-px bg-plum/15 my-1" />

          {/* Navigation Items */}
          <nav className="flex flex-col space-y-2">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    aria-label={item.label}
                    title={item.label}
                    className={({ isActive }) =>
                      `relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer min-h-11 min-w-11 focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none ${
                        isActive
                          ? "bg-plum text-white shadow-xs ring-2 ring-plum/30"
                          : "text-muted-label hover:text-body-dark hover:bg-plum/10 active:scale-95"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="w-6 h-6" />
                        {/* Hover Tooltip */}
                        <span className="absolute left-16 px-3 py-1.5 rounded-lg bg-body-dark text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md z-50">
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="absolute -left-3.5 w-1.5 h-6 rounded-r-full bg-plum" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
          </nav>

          {/* User Profile Avatar Link */}
          <NavLink
            to="/workspace/profile"
            aria-label={`Candidate Profile: ${user?.name || "Candidate"}`}
            title={`Candidate Profile: ${user?.name || "Candidate"}`}
            className={({ isActive }) =>
              `relative group w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-150 cursor-pointer uppercase min-h-11 min-w-11 focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none overflow-hidden ${
                isActive
                  ? "ring-2 ring-plum shadow-xs scale-105"
                  : "hover:ring-2 hover:ring-plum/30 active:scale-95"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "Candidate"}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: avatarColor.bg }}
                  >
                    {initials}
                  </div>
                )}
                {/* Hover Tooltip */}
                <span className="absolute left-16 px-3 py-1.5 rounded-lg bg-body-dark text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md z-50">
                  Profile ({user?.name || "Candidate"})
                </span>
                {isActive && (
                  <span className="absolute -left-3.5 w-1.5 h-6 rounded-r-full bg-plum" />
                )}
              </>
            )}
          </NavLink>

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Disconnect & Exit Workspace"
            title="Disconnect & Exit Workspace"
            className="w-12 h-12 rounded-xl text-muted-label hover:text-plum hover:bg-plum/10 flex items-center justify-center transition duration-150 cursor-pointer min-h-11 min-w-11 active:scale-95 focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none"
          >
            <HiArrowRightOnRectangle className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* Mobile: Floating Bottom Navigation Dock             */}
      {/* ==================================================== */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-2 left-2 right-2 z-50 pointer-events-auto"
      >
        <div className="imlaa-card px-2 py-1.5 flex items-center justify-around shadow-xl bg-white/95 backdrop-blur-md border border-plum/20 rounded-2xl overflow-x-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    `min-w-11 min-h-11 flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-150 shrink-0 ${
                      isActive
                        ? "text-plum font-bold bg-plum/10"
                        : "text-muted-label hover:text-body-dark active:scale-95"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] leading-tight mt-0.5 max-w-13.5 truncate text-center">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}

          <NavLink
            to="/workspace/profile"
            aria-label="Candidate Profile"
            className={({ isActive }) =>
              `min-w-11 min-h-11 flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-150 shrink-0 ${
                isActive
                  ? "text-plum font-bold bg-plum/10"
                  : "text-muted-label hover:text-body-dark active:scale-95"
              }`
            }
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "User"}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full text-white font-bold flex items-center justify-center text-[10px]"
                style={{ backgroundColor: avatarColor.bg }}
              >
                {initials.charAt(0)}
              </div>
            )}
            <span className="text-[10px] leading-tight mt-0.5">Profile</span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Exit Workspace"
            title="Exit Workspace"
            className="min-w-11 min-h-11 flex flex-col items-center justify-center p-1 rounded-xl text-muted-label hover:text-plum active:scale-95 transition-all duration-150 shrink-0 cursor-pointer"
          >
            <HiArrowRightOnRectangle className="w-5 h-5" />
            <span className="text-[10px] leading-tight mt-0.5">Exit</span>
          </button>
        </div>
      </nav>
    </>
  );
}
