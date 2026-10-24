import { useState, useEffect } from "react";
import { AuthContext } from "./authContextInstance";
import apiClient from "../services/apiClient";
import { getDeviceToken, getStoredAccessId, setStoredAccessId } from "../utils/deviceToken";

export { useAuth } from "./useAuth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'general' | 'advance' | 'admin'
  const [status, setStatus] = useState("idle"); // 'idle' | 'checking' | 'approved' | 'pending' | 'rejected'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate session on app mount
  useEffect(() => {
    async function validateSession() {
      const storedAccessId = getStoredAccessId();
      const deviceToken = getDeviceToken();

      if (!storedAccessId) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.post("/auth/validate-device", {
          accessId: storedAccessId,
          deviceToken,
        });

        if (res.data?.success && res.data.status === "approved") {
          setUser(res.data.user);
          setRole(res.data.role);
          setStatus("approved");
        } else {
          setStoredAccessId(null);
          setStatus("idle");
        }
      } catch (err) {
        console.warn("Session check returned error:", err.response?.data?.message || err.message);
        setStoredAccessId(null);
        setStatus("idle");
      } finally {
        setLoading(false);
      }
    }

    validateSession();
  }, []);

  // Login request function
  const login = async (name, accessId) => {
    setError(null);
    const cleanId = String(accessId).trim();
    const cleanName = String(name).trim();
    const deviceToken = getDeviceToken();

    try {
      const res = await apiClient.post("/auth/login-request", {
        name: cleanName,
        accessId: cleanId,
        deviceToken,
      });

      const data = res.data;
      if (data.status === "approved") {
        setStoredAccessId(cleanId);
        setUser(data.user);
        setRole(data.role);
        setStatus("approved");
        return { success: true, status: "approved" };
      } else if (data.status === "pending_approval") {
        setStoredAccessId(cleanId);
        setStatus("pending");
        return { success: true, status: "pending" };
      } else {
        setStatus("rejected");
        return { success: false, status: "rejected", message: data.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit login request.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setStoredAccessId(null);
    setUser(null);
    setRole(null);
    setStatus("idle");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        status,
        loading,
        error,
        login,
        logout,
        isAuthenticated: status === "approved" && !!user,
        isAdmin: role === "admin",
        isAdvanceOrAdmin: role === "advance" || role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
