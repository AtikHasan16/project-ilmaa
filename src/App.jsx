import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import WorkspaceLayout from "./components/WorkspaceLayout";
import FlashcardPage from "./pages/FlashcardPage";
import SpellingPage from "./pages/SpellingPage";
import GrammarPage from "./pages/GrammarPage";
import UploadStudyPage from "./pages/UploadStudyPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import VocabMonitorPage from "./pages/VocabMonitorPage";
import ProfilePage from "./pages/ProfilePage";
import ContributePage from "./pages/ContributePage";

import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CapacityGuardModal from "./components/CapacityGuardModal";

// Protected Route Guard
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-plum font-semibold animate-pulse">
          Authenticating...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "admin" && role !== "admin") {
    return <Navigate to="/workspace/flashcard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CapacityGuardModal />
        <Routes>
          {/* Public Landing & Information */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/contribute" element={<ContributePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Access status legacy redirects */}
          <Route path="/access/pending" element={<Navigate to="/" replace />} />
          <Route path="/access/rejected" element={<Navigate to="/" replace />} />

          {/* Authenticated Workspace Shell */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <WorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="flashcard" replace />} />
            <Route path="flashcard" element={<FlashcardPage />} />
            <Route path="spelling" element={<SpellingPage />} />
            <Route path="vocab" element={<Navigate to="/workspace/flashcard" replace />} />
            <Route path="grammar" element={<GrammarPage />} />
            <Route path="contribute" element={<ContributePage />} />
            <Route
              path="upload"
              element={
                <ProtectedRoute requiredRole="admin">
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
            <Route
              path="vocab-monitor"
              element={
                <ProtectedRoute requiredRole="admin">
                  <VocabMonitorPage />
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
