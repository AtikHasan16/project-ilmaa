import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import CapacityGuardModal from "./components/CapacityGuardModal";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const WorkspaceLayout = lazy(() => import("./components/WorkspaceLayout"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const FlashcardPage = lazy(() => import("./pages/FlashcardPage"));
const SpellingPage = lazy(() => import("./pages/SpellingPage"));
const GrammarPage = lazy(() => import("./pages/GrammarPage"));
const UploadStudyPage = lazy(() => import("./pages/UploadStudyPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const VocabMonitorPage = lazy(() => import("./pages/VocabMonitorPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ContributePage = lazy(() => import("./pages/ContributePage"));
const SupportUsPage = lazy(() => import("./pages/SupportUsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

function PageRoute({ component: Page }) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-lg font-semibold text-plum animate-pulse">
              Loading page...
            </div>
          </div>
        }
      >
        <Page />
      </Suspense>
    </ErrorBoundary>
  );
}

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
          <Route path="/" element={<PageRoute component={LandingPage} />} />
          <Route path="/about" element={<PageRoute component={AboutPage} />} />
          <Route path="/contact" element={<PageRoute component={ContactPage} />} />
          <Route path="/contribute" element={<PageRoute component={ContributePage} />} />
          <Route path="/support-us" element={<PageRoute component={SupportUsPage} />} />
          <Route path="/reset-password" element={<PageRoute component={ResetPasswordPage} />} />

          {/* Preserve old access-status URLs as redirects after retiring those pages. */}
          <Route path="/access/pending" element={<Navigate to="/" replace />} />
          <Route path="/access/rejected" element={<Navigate to="/" replace />} />

          {/* Authenticated Workspace Shell */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <PageRoute component={WorkspaceLayout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PageRoute component={DashboardPage} />} />
            <Route path="flashcard" element={<PageRoute component={FlashcardPage} />} />
            <Route path="spelling" element={<PageRoute component={SpellingPage} />} />
            <Route path="vocab" element={<Navigate to="/workspace/flashcard" replace />} />
            <Route path="grammar" element={<PageRoute component={GrammarPage} />} />
            <Route path="contribute" element={<PageRoute component={ContributePage} />} />
            <Route path="support-us" element={<PageRoute component={SupportUsPage} />} />
            <Route
              path="upload"
              element={
                <ProtectedRoute>
                  <PageRoute component={UploadStudyPage} />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <PageRoute component={AdminDashboardPage} />
                </ProtectedRoute>
              }
            />
            <Route
              path="vocab-monitor"
              element={
                <ProtectedRoute requiredRole="admin">
                  <PageRoute component={VocabMonitorPage} />
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<PageRoute component={ProfilePage} />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<PageRoute component={NotFoundPage} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
