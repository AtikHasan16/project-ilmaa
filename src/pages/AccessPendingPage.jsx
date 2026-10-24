import { Link } from "react-router";

export default function AccessPendingPage() {
  return (
    <div className="min-h-screen bg-white text-body-dark flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full imlaa-card p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-plum/10 text-plum flex items-center justify-center mx-auto mb-5 font-bold text-2xl">
          ⏳
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-body-dark mb-3">
          Access Request Pending
        </h2>
        <p className="text-base text-muted-label leading-relaxed mb-6">
          Your device login request has been recorded and submitted to the
          ingress queue. An administrator must approve your device before you
          can enter the workspace.
        </p>

        <div className="p-4 rounded-xl border border-plum/20 bg-plum/5 text-base text-body-dark text-left mb-6 space-y-2">
          <div className="font-semibold text-plum text-lg">Next Steps:</div>
          <div>1. Notify your instructor or admin to approve your request.</div>
          <div>2. Once approved, revisit this URL from this exact browser.</div>
        </div>

        <Link
          to="/"
          className="imlaa-btn-primary w-full py-3.5 text-base"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
