// Service Worker for Imlaa Linguistic Mastery Platform
// Scoped caching: Cache-first for audio TTS and immutable hashed assets.
// Never caches Supabase/API requests containing sensitive user/auth data.

const CACHE_NAME = "imlaa-offline-cache-v2";
const AUDIO_CACHE_NAME = "imlaa-audio-cache-v2";
const MAX_AUDIO_CACHE_ENTRIES = 150;

const STATIC_SHELL_ASSETS = ["/favicon.svg"];

// Helper to trim cache size
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

// Install: pre-cache static shell assets (excluding dynamic index.html)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: purge older cache generations
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== AUDIO_CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Strictly disallow non-http/https schemes
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // RULE 1: Never intercept or cache Supabase, ImgBB, or external API calls containing user data
  const isExternalApi =
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("api.imgbb.com") ||
    url.hostname.includes("emailjs.com");

  const isInternalApi =
    url.pathname.startsWith("/api/") && !url.pathname.includes("/api/v1/tts");

  if (isExternalApi || isInternalApi || event.request.method !== "GET") {
    return; // Pass through directly to network
  }

  // RULE 2: Audio TTS Requests (/api/v1/tts)
  // Cache-first strategy with bounded size limits for audio synthesis
  if (url.pathname.includes("/api/v1/tts")) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
            trimCache(AUDIO_CACHE_NAME, MAX_AUDIO_CACHE_ENTRIES).catch(() => {});
          }
          return networkResponse;
        } catch {
          return fetch(event.request);
        }
      })
    );
    return;
  }

  // RULE 3: Immutable Vite Bundled Assets (/assets/*.js, /assets/*.css)
  // Safe to cache because filenames include content hashes
  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        if (response && response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // RULE 4: HTML Navigations: Network-first, never cache index.html indefinitely
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response("Offline", { status: 503, statusText: "Offline" });
      })
    );
  }
});
