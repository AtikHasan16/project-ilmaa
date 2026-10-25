// Service Worker for Imlaa Linguistic Mastery Platform
// Provides client-side cache-first strategy for audio files (Microsoft Neural TTS) and static assets

const CACHE_NAME = "imlaa-offline-cache-v1";
const AUDIO_CACHE_NAME = "imlaa-audio-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
];

// Install: pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== AUDIO_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: intercept requests and serve from cache when applicable
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignore non-http/https requests (e.g., chrome-extension://, moz-extension://, data:)
  // Browser Cache API strictly disallows non-http/https schemes
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // 1. Audio TTS Requests (/api/v1/tts)
  // Use Cache-First strategy: If audio for this word is already cached in browser, serve instantly with 0ms latency.
  if (url.pathname.includes("/api/v1/tts")) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            // Clone response before caching
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // If offline and not in cache, fallback gracefully
          return new Response(new Uint8Array(0), {
            status: 503,
            statusText: "Audio unavailable offline",
            headers: { "Content-Type": "audio/mpeg" },
          });
        }
      })
    );
    return;
  }

  // 2. Non-API navigation or asset requests: Network first, cache fallback
  if (event.request.method === "GET" && !url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
  }
});
