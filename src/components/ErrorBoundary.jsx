import { Component } from "react";
import { telemetry } from "../services/telemetryService";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Page render failed:", error, info);
    telemetry.captureException(error, {
      componentStack: info?.componentStack,
      boundary: "RouteErrorBoundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white p-6 text-center"
          role="alert"
        >
          <h1 className="text-2xl font-bold text-body-dark">
            This page could not be displayed.
          </h1>
          <p className="text-muted-label">
            Try reloading the page. If the problem continues, contact support.
          </p>
          <button
            type="button"
            className="imlaa-btn-primary min-h-11 px-5 py-2.5"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
