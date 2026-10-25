import { Link } from "react-router";
import { HiArrowLeft, HiAcademicCap, HiHome } from "react-icons/hi2";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-plum/20 selection:text-plum">
      {/* Header */}
      <header className="border-b border-plum/15 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold transition text-base"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Return to Imlaa</span>
          </Link>
          <div className="text-xl font-black text-plum tracking-tight">Imlaa</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-plum/10 text-plum flex items-center justify-center">
          <HiAcademicCap className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="text-6xl sm:text-7xl font-black font-mono text-plum tracking-tight">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-body-dark">
            Page Not Found
          </h1>
          <p className="text-base sm:text-lg text-muted-label leading-relaxed max-w-md mx-auto">
            The orthographic resource or study path you are seeking does not exist or may have been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            to="/workspace/vocab"
            className="imlaa-btn-primary w-full sm:w-auto py-3 px-6 text-base flex items-center justify-center space-x-2 shadow-sm"
          >
            <HiAcademicCap className="w-5 h-5" />
            <span>Return to Study Workspace</span>
          </Link>
          <Link
            to="/"
            className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base flex items-center justify-center space-x-2 hover:border-plum"
          >
            <HiHome className="w-5 h-5" />
            <span>Home Page</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-plum/15 py-8 text-center text-sm text-muted-label">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Imlaa IELTS Workspace. All rights reserved.</div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-plum transition">Home</Link>
            <Link to="/about" className="hover:text-plum transition">About</Link>
            <Link to="/contact" className="hover:text-plum transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
