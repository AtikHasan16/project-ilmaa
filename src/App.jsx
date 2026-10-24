import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import AccessPendingPage from "./pages/AccessPendingPage";
import AccessRejectedPage from "./pages/AccessRejectedPage";

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-md text-plum font-medium animate-pulse">
          Validating Hardware Key...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />

          {/* Access status screens */}
          <Route path="/access/pending" element={<AccessPendingPage />} />
          <Route path="/access/rejected" element={<AccessRejectedPage />} />

          {/* Placeholder for workspace routes (next step) */}
          <Route
            path="/workspace/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-white p-8">
                  <h1 className="text-2xl font-bold text-body-dark">
                    Workspace Ready
                  </h1>
                  <p className="text-md text-muted-label">
                    Next step: Floating navigation dock and vocabulary cards.
                  </p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
