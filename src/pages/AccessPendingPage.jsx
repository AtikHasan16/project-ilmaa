import { Link } from "react-router";

export default function AccessPendingPage() {
  return (
    <div className="min-h-screen bg-white text-body-dark flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full border border-plum/20 rounded-xl p-8 text-center bg-white shadow-sm">
        <div className="w-12 h-12 rounded-full bg-plum/10 text-plum flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          ⏳
        </div>
        <h2 className="text-xl font-bold text-body-dark mb-2">
          Access Request Pending
        </h2>
        <p className="text-xs text-muted-label leading-relaxed mb-6">
          Your device login request has been recorded and submitted to the
          ingress queue. An administrator must approve your device before you
          can enter the workspace.
        </p>

        <div className="p-3.5 rounded-lg border border-plum/20 bg-plum/5 text-xs text-body-dark text-left mb-6 space-y-1">
          <div className="font-semibold text-plum">Next Steps:</div>
          <div>1. Notify your instructor or admin to approve your request.</div>
          <div>2. Once approved, revisit this URL from this exact browser.</div>
        </div>

        <Link
          to="/"
          className="inline-block w-full py-2.5 px-4 rounded-lg bg-plum hover:bg-plum-hover text-white text-xs font-semibold transition"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
