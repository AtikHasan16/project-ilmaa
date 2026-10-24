import { Link } from "react-router";

export default function AccessRejectedPage() {
  return (
    <div className="min-h-screen bg-white text-body-dark flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full imlaa-card p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-plum/10 text-plum flex items-center justify-center mx-auto mb-5 font-bold text-2xl">
          ✕
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-body-dark mb-3">
          Access Request Rejected
        </h2>
        <p className="text-base text-muted-label leading-relaxed mb-6">
          Your access request was rejected or your device key has expired.
          Please contact your workspace administrator or course instructor if
          you believe this is an error.
        </p>

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
