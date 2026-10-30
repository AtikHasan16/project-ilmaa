import { useState, useEffect } from "react";
import { HiExclamationTriangle, HiArrowPath } from "react-icons/hi2";
import apiClient from "../services/apiClient";

const MAX_CONCURRENT_USERS = 500;

export default function CapacityGuardModal() {
  const [isOverCapacity, setIsOverCapacity] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function checkCapacity() {
      try {
        const res = await apiClient.get("/admin/users-audit");
        if (mounted && res.data?.success) {
          const count = res.data.activeNowCount || 0;
          setActiveCount(count);
          if (count > MAX_CONCURRENT_USERS) {
            setIsOverCapacity(true);
          }
        }
      } catch {
        // Silently continue if stats unavailable
      }
    }

    checkCapacity();
    const interval = setInterval(checkCapacity, 30000); // Check every 30 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!isOverCapacity) return null;

  return (
    <div className="fixed inset-0 z-500 bg-plum/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="imlaa-card w-full max-w-lg p-8 sm:p-10 bg-white border border-plum/30 shadow-2xl text-center space-y-6 animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <HiExclamationTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-body-dark">
            Server at Peak Capacity
          </h2>
          <p className="text-base text-muted-label leading-relaxed">
            Imlaa is currently experiencing peak traffic ({activeCount} / {MAX_CONCURRENT_USERS} maximum concurrent users).
            To ensure optimal performance and smooth voice synthesis, access is momentarily throttled.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 text-sm text-plum font-semibold">
          Please wait a moment and reload the page to continue your practice session.
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="imlaa-btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center space-x-2"
        >
          <HiArrowPath className="w-5 h-5" />
          <span>Reload Page & Try Again</span>
        </button>
      </div>
    </div>
  );
}
