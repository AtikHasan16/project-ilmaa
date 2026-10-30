/**
 * Client-Side Telemetry & Observability Service (Phase 3.1)
 *
 * Tracks security anomalies, query latency, RLS permission violations,
 * auth/OTP rejections, quota limits, and TTS failure rates with release tagging.
 */

const APP_VERSION = "1.0.0";
const MAX_BUFFERED_EVENTS = 100;
const eventBuffer = [];

function emitEvent(category, data = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    category,
    ...data,
  };

  eventBuffer.push(event);
  if (eventBuffer.length > MAX_BUFFERED_EVENTS) {
    eventBuffer.shift();
  }

  // Log in development or when critical error
  if (import.meta.env?.DEV || event.level === "error") {
    const logFn = event.level === "error" ? console.error : console.info;
    logFn(`[Telemetry:${category}]`, data);
  }

  return event;
}

export const telemetry = {
  getBufferedEvents() {
    return [...eventBuffer];
  },

  trackAuthFailure(reason, details = {}) {
    return emitEvent("auth_failure", {
      level: "warn",
      reason,
      ...details,
    });
  },

  trackOtpFailure(reason, details = {}) {
    return emitEvent("otp_failure", {
      level: "warn",
      reason,
      ...details,
    });
  },

  trackRlsError(table, error, queryDetails = {}) {
    return emitEvent("rls_violation", {
      level: "error",
      table,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      ...queryDetails,
    });
  },

  trackQuotaRejection(userId, count, limit) {
    return emitEvent("quota_rejection", {
      level: "warn",
      userId,
      count,
      limit,
      message: `User ${userId} reached upload quota (${count}/${limit})`,
    });
  },

  trackTtsPerformance({ durationMs, success, voice, fallbackUsed = false, error = null }) {
    return emitEvent("tts_metric", {
      level: success ? "info" : "warn",
      durationMs,
      success,
      voice,
      fallbackUsed,
      errorMessage: error?.message || null,
    });
  },

  trackQueryMetrics({ domain, durationMs, rowCount = 0, error = null }) {
    return emitEvent("query_metric", {
      level: error ? "error" : "info",
      domain,
      durationMs,
      rowCount,
      errorMessage: error?.message || null,
    });
  },

  captureException(error, context = {}) {
    return emitEvent("unhandled_exception", {
      level: "error",
      name: error?.name || "Error",
      message: error?.message || String(error),
      stack: error?.stack || null,
      context,
    });
  },
};

// Global unhandled error instrumentation for the browser
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    telemetry.captureException(event.error || new Error(event.message), {
      source: "window.onerror",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    telemetry.captureException(
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason)),
      { source: "unhandledrejection" },
    );
  });
}
