import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  HiBookOpen,
  HiAcademicCap,
  HiCloudArrowUp,
  HiCog6Tooth,
  HiArrowRightOnRectangle,
} from "react-icons/hi2";

/**
 * Universal Floating Navigation Dock
 * - Desktop/Tablet: Left-side floating vertical dock
 * - Mobile: Bottom floating navigation bar
 * - Strict plum palette: Active items use `#6D4E56`, inactive use muted tones
 * - Role-gated items: Upload to Study (Advance/Admin) and Admin Dashboard (Admin only)
 */
import { showConfirmModal } from "../utils/sweetalert";

export default function NavigationDock() {
  const { user, logout, isAdmin, isAdvanceOrAdmin } = useAuth();
  const navigate = useNavigate();

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
      to: "/workspace/vocab",
      label: "Vocabulary",
      icon: HiBookOpen,
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
      show: isAdvanceOrAdmin,
    },
    {
      to: "/workspace/admin",
      label: "Admin",
      icon: HiCog6Tooth,
      show: isAdmin,
    },
  ];

  return (
    <>
      {/* ==================================================== */}
      {/* Desktop / Tablet: Floating Left Vertical Dock       */}
      {/* ==================================================== */}
      <aside className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-50 flex-col items-center select-none pointer-events-auto">
        <div className="imlaa-card p-3 flex flex-col items-center space-y-3 shadow-lg border border-plum/20 bg-white">
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
                    title={item.label}
                    className={({ isActive }) =>
                      `relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-plum text-white shadow-xs"
                          : "text-muted-label hover:text-body-dark hover:bg-plum/10"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="w-6 h-6" />
                        {/* Hover Tooltip */}
                        <span className="absolute left-16 px-3 py-1.5 rounded-lg bg-body-dark text-white text-base font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md">
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
            title={`Candidate Profile: ${user?.name || "Candidate"}`}
            className={({ isActive }) =>
              `relative group w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-150 cursor-pointer uppercase ${
                isActive
                  ? "bg-plum text-white shadow-xs"
                  : "bg-plum/5 text-plum border border-plum/20 hover:bg-plum hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span>{(user?.name || "U").charAt(0)}</span>
                {/* Hover Tooltip */}
                <span className="absolute left-16 px-3 py-1.5 rounded-lg bg-body-dark text-white text-base font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md">
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
            title="Disconnect & Exit Workspace"
            className="w-12 h-12 rounded-xl text-muted-label hover:text-plum hover:bg-plum/10 flex items-center justify-center transition duration-150 cursor-pointer"
          >
            <HiArrowRightOnRectangle className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* Mobile: Floating Bottom Navigation Dock             */}
      {/* ==================================================== */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="imlaa-card px-4 py-2 flex items-center justify-around shadow-lg">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors duration-150 ${
                      isActive
                        ? "text-plum font-semibold"
                        : "text-muted-label hover:text-body-dark"
                    }`
                  }
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-base mt-1">{item.label}</span>
                </NavLink>
              );
            })}

          <NavLink
            to="/workspace/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors duration-150 ${
                isActive
                  ? "text-plum font-semibold"
                  : "text-muted-label hover:text-body-dark"
              }`
            }
          >
            <div className="w-6 h-6 rounded-full bg-plum/10 text-plum font-bold flex items-center justify-center text-xs">
              {(user?.name || "U").charAt(0)}
            </div>
            <span className="text-base mt-1">Profile</span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            title="Exit Workspace"
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-muted-label hover:text-plum transition-colors duration-150"
          >
            <HiArrowRightOnRectangle className="w-6 h-6" />
            <span className="text-base mt-1">Exit</span>
          </button>
        </div>
      </nav>
    </>
  );
}
