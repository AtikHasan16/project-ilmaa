import { Link } from "react-router";

export default function AccessRejectedPage() {
  return (
    <div className="min-h-screen bg-white text-body-dark flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full border border-plum/20 rounded-xl p-8 text-center bg-white shadow-sm">
        <div className="w-12 h-12 rounded-full bg-plum/10 text-plum flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          ✕
        </div>
        <h2 className="text-xl font-bold text-body-dark mb-2">
          Access Request Rejected
        </h2>
        <p className="text-xs text-muted-label leading-relaxed mb-6">
          Your access request was rejected or your device key has expired.
          Please contact your workspace administrator or course instructor if
          you believe this is an error.
        </p>

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
