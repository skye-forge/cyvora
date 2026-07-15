/**
 * Cyvora Service Worker — v2
 * ------------------------------------------------------------
 * Strategy:
 *   - API requests (anything under /api/)  → network only, never cached
 *   - Page navigations                     → network-first, cache fallback,
 *                                            then offline page
 *   - Static assets (same-origin + fonts)  → stale-while-revalidate
 *
 * All precache paths are RELATIVE to this file's location, so the app
 * keeps working when deployed under a subpath (e.g. /cyvora/).
 * Only GET requests are ever cached (Cache API throws on POST).
 */

const VERSION = "v2";
const STATIC_CACHE = "cyvora-static-" + VERSION;
const RUNTIME_CACHE = "cyvora-runtime-" + VERSION;

// Resolved against sw.js location → subpath-safe.
const PRECACHE_URLS = [
  "public/index.html",
  "public/landing.html",
  "public/login.html",
  "public/register.html",
  "public/report-incident.html",
  "public/my-reports.html",
  "public/report-detail.html",
  "public/settings.html",
  "public/quiz.html",
  "admin/index.html",
  "admin/reports.html",
  "admin/settings.html",
  "admin/community.html",
  "admin/alerts.html",
  "admin/learning.html",
  "admin/users.html",
  "assets/css/tailwind-output.css",
  "assets/css/site.css",
  "assets/js/config.js",
  "assets/js/storage.js",
  "assets/js/auth-guard.js",
  "assets/js/mock-data.js",
  "assets/js/api.js",
  "assets/js/validation.js",
  "assets/js/i18n.js",
  "assets/js/templates.js",
  "assets/js/app.js",
  "assets/js/site.js",
].map((p) => new URL(p, self.location).toString());

// Cross-origin hosts whose responses are safe/useful to cache (fonts).
const CACHEABLE_CROSS_ORIGIN = ["fonts.googleapis.com", "fonts.gstatic.com"];

const OFFLINE_FALLBACK_URL = new URL("public/index.html", self.location).toString();

/* ---------------- Install: precache core shell ---------------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        // Tolerant precache: one failed URL must not abort the install
        // (cache.addAll is all-or-nothing, so add individually).
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

/* ---------------- Activate: drop old cache versions ---------------- */
self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

/* ---------------- Fetch routing ---------------- */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Never intercept non-GET requests (and never cache them).
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API traffic: network only. Stale civic-safety data is worse than
  // an error, and auth-dependent responses must never be shared/cached.
  if (url.origin === self.location.origin && url.pathname.includes("/api/")) {
    return; // let the browser handle it normally
  }

  // Page navigations: network-first so users always get fresh HTML.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static assets: same-origin, or approved font CDNs.
  const isSameOrigin = url.origin === self.location.origin;
  const isCacheableCrossOrigin = CACHEABLE_CROSS_ORIGIN.includes(url.hostname);
  if (isSameOrigin || isCacheableCrossOrigin) {
    event.respondWith(staleWhileRevalidate(request));
  }
  // Anything else: fall through to the network untouched.
});

/* ---------------- Strategies ---------------- */

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const shell = await caches.match(OFFLINE_FALLBACK_URL);
    if (shell) return shell;

    return new Response(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Offline — Cyvora</title></head>" +
        "<body style='font-family: system-ui; padding: 2rem; text-align: center;'>" +
        "<h1>You are offline</h1>" +
        "<p>Please check your internet connection and try again.</p>" +
        "<button onclick='location.reload()' style='margin-top:1rem;padding:0.5rem 1rem;" +
        "background:#0b3d91;color:#fff;border:none;border-radius:6px;cursor:pointer;'>Retry</button>" +
        "</body></html>",
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      // Cache successful basic/cors responses; opaque font responses too.
      if (response && (response.ok || response.type === "opaque")) {
        caches
          .open(RUNTIME_CACHE)
          .then((cache) => cache.put(request, response.clone()))
          .catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Serve instantly, refresh in the background.
    networkFetch.catch(() => {});
    return cached;
  }

  const response = await networkFetch;
  if (response) return response;

  return new Response("", { status: 504, statusText: "Offline and not cached" });
}
