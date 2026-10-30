import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Register Service Worker for offline resilience & audio caching
if (
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  import.meta.env?.PROD
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Graceful fallback if SW cannot register in the current origin
      if (import.meta.env?.DEV) {
        console.warn("[Imlaa SW] Registration error:", err);
      }
    });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
