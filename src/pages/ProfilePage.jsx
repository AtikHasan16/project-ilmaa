import { useAuth } from "../context/AuthContext";
import {
  HiUser,
  HiIdentification,
  HiShieldCheck,
  HiDevicePhoneMobile,
  HiArrowRightOnRectangle,
} from "react-icons/hi2";
import { useNavigate } from "react-router";
import { getDeviceToken } from "../utils/deviceToken";

import { showConfirmModal } from "../utils/sweetalert";

export default function ProfilePage() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const deviceToken = getDeviceToken();

  const handleLogout = async () => {
    const res = await showConfirmModal({
      title: "Sign Out & Lock Session?",
      text: "Are you sure you want to end your authorized session and return to the login portal?",
      confirmButtonText: "Sign Out",
      cancelButtonText: "Stay Logged In",
      isDanger: true,
      icon: "warning",
    });

    if (res.isConfirmed) {
      logout();
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col space-y-8 animate-slide-up">
      {/* Page Title */}
      <div className="pb-4 border-b border-plum/15">
        <h1 className="text-3xl font-black text-body-dark tracking-tight">
          Candidate Profile
        </h1>
        <p className="text-base text-muted-label mt-1">
          Academic credential overview and bound hardware device details.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="imlaa-card p-8 sm:p-10 flex flex-col space-y-8 border border-plum/20">
        {/* Header with Avatar & Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-plum/15">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-plum/10 border border-plum/25 flex items-center justify-center text-plum font-black text-3xl select-none uppercase shadow-xs">
              {(user?.name || "U").charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-body-dark">
                  {user?.name || "Candidate"}
                </h2>
                <span className="imlaa-badge text-base py-0.5 px-3 uppercase font-semibold">
                  {role || "General"}
                </span>
              </div>
              <div className="text-base text-muted-label mt-1">
                Linguistic Orthography & Syntax Workspace
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-base font-semibold self-start sm:self-auto">
            <HiShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Authorized Session</span>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 10-Digit Access ID */}
          <div className="p-5 rounded-xl border border-plum/20 bg-plum/5 flex flex-col justify-between space-y-3">
            <div className="flex items-center space-x-2 text-plum">
              <HiIdentification className="w-6 h-6" />
              <span className="text-base font-bold uppercase tracking-wider">
                10-Digit Access ID
              </span>
            </div>
            <div className="text-3xl font-mono font-black text-plum tracking-widest">
              {user?.accessId || "—"}
            </div>
            <div className="text-base text-muted-label">
              Permanent candidate key bound to your account.
            </div>
          </div>

          {/* User Name */}
          <div className="p-5 rounded-xl border border-plum/20 bg-plum/5 flex flex-col justify-between space-y-3">
            <div className="flex items-center space-x-2 text-plum">
              <HiUser className="w-6 h-6" />
              <span className="text-base font-bold uppercase tracking-wider">
                Registered Name
              </span>
            </div>
            <div className="text-2xl font-bold text-body-dark truncate">
              {user?.name || "—"}
            </div>
            <div className="text-base text-muted-label">
              Primary enrollment identification.
            </div>
          </div>
        </div>

        {/* Bound Hardware & Device Info */}
        <div className="p-5 rounded-xl border border-plum/20 bg-white space-y-3">
          <div className="flex items-center space-x-2 text-plum">
            <HiDevicePhoneMobile className="w-5 h-5" />
            <span className="text-base font-bold uppercase tracking-wider text-body-dark">
              Hardware Device Binding
            </span>
          </div>
          <div className="font-mono text-base text-body-dark bg-plum/5 p-3 rounded-lg border border-plum/15 break-all">
            {deviceToken || "No device token bound"}
          </div>
          <p className="text-base text-muted-label leading-relaxed">
            Your Access ID is locked to this browser's cryptographic token. Re-authentication from other machines requires admin clearance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/workspace/vocab")}
            className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base"
          >
            Return to Vocabulary
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="imlaa-btn-primary w-full sm:w-auto py-3 px-6 text-base space-x-2 bg-rose-700 hover:bg-rose-800"
          >
            <HiArrowRightOnRectangle className="w-5 h-5" />
            <span>Sign Out & Lock Device</span>
          </button>
        </div>
      </div>
    </div>
  );
}
