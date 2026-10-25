import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import AccessPendingPage from "./pages/AccessPendingPage";
import AccessRejectedPage from "./pages/AccessRejectedPage";
import WorkspaceLayout from "./components/WorkspaceLayout";
import VocabularyPage from "./pages/VocabularyPage";
import GrammarPage from "./pages/GrammarPage";
import UploadStudyPage from "./pages/UploadStudyPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProfilePage from "./pages/ProfilePage";

import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

// Protected Route Guard
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-plum font-semibold animate-pulse">
          Validating Hardware Key...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "admin" && role !== "admin") {
    return <Navigate to="/workspace/vocab" replace />;
  }

  if (
    requiredRole === "advance" &&
    role !== "advance" &&
    role !== "admin"
  ) {
    return <Navigate to="/workspace/vocab" replace />;
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
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Access status screens */}
          <Route path="/access/pending" element={<AccessPendingPage />} />
          <Route path="/access/rejected" element={<AccessRejectedPage />} />

          {/* Authenticated Workspace Shell */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <WorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="vocab" replace />} />
            <Route path="vocab" element={<VocabularyPage />} />
            <Route path="grammar" element={<GrammarPage />} />
            <Route
              path="upload"
              element={
                <ProtectedRoute requiredRole="advance">
                  <UploadStudyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
