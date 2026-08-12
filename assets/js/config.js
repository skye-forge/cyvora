/**
 * VARNIS — environment & endpoint configuration
 * ------------------------------------------------------------
 * This is the ONE file a backend engineer edits to point the whole
 * frontend at a live API. Every other module reads window.VarnisConfig;
 * nothing hardcodes a URL.
 *
 * This bundle is FRONTEND-ONLY. No backend ships with it — the app runs
 * on local mock data until you attach yours.
 *
 * TO CONNECT YOUR BACKEND:
 *   1. Set API_BASE_URL to your REST API origin (e.g. "https://api.varnis.cm/api/v1"),
 *      or keep "/api/v1" if your backend serves this frontend from the same origin.
 *   2. Set USE_MOCKS = false.
 *   3. (Optional) Set AI_BASE_URL if the AI service is a separate host.
 *   4. Implement the endpoints documented in README.md ("API contract"),
 *      returning the JSON shapes in assets/data/seed.json.
 * Nothing else in the frontend needs to change.
 *
 * RUNTIME OVERRIDES (no rebuild), via URL query string:
 *   ?api=https://api.varnis.cm/api/v1   → override API_BASE_URL
 *   ?ai=https://ai.varnis.cm            → override AI_BASE_URL
 *   ?live=1                             → force USE_MOCKS = false
 *   ?mock=1                             → force USE_MOCKS = true
 */
window.VarnisConfig = {
  // ---- Core REST API ----------------------------------------------------
  // Relative "/api/v1" if the frontend is served by the same origin as the
  // backend; a full URL for a separate API host (e.g. a Django server on
  // another domain/port during local dev).
  // NOTE: the live Django backend requires trailing slashes on most routes
  // (DRF default). api.js's PATH_MAP adapter adds them automatically for
  // every endpoint it knows about — see API_INTEGRATION_MAP.md for the
  // full list and for anything still unmapped.
  API_BASE_URL: "https://varnis.up.railway.app/api/v1",

  // When true, VarnisAPI resolves from local seed data instead of the
  // network. Set to false once API_BASE_URL points at your live backend.
  // Override at runtime anytime with ?live=1 (force network) or ?mock=1
  // (force mocks) — handy for testing one page against the real API
  // without flipping this for the whole site.
  USE_MOCKS: false,

  // In live mode: if the backend becomes unreachable (network error or
  // timeout — NOT HTTP errors), VarnisAPI transparently serves the local
  // mock data so a demo never dead-ends. Set to false to surface outages.
  AUTO_FALLBACK: true,

  // ---- Auth -------------------------------------------------------------
  AUTH_TOKEN_KEY: "varnis_token",          // Bearer access token (localStorage)
  REFRESH_TOKEN_KEY: "varnis_refresh",     // refresh token (localStorage)
  USER_KEY: "varnis_user",                 // cached current-user JSON
  // When a request returns 401 and a refresh token exists, VarnisAPI will
  // POST it to AUTH_REFRESH_PATH once and retry the original request.
  AUTH_REFRESH_PATH: "/auth/refresh",
  TOKEN_AUTO_REFRESH: true,

  // OAuth 2.0 (Google) — the backend owns the flow; the frontend just
  // redirects here and expects a token back at the redirect URI (SRS FR-02).
  GOOGLE_OAUTH_START_PATH: "/auth/google",

  // ---- AI services (SRS: lesson generation + personalised preferences) --
  // The AI layer may live behind the same API or a dedicated service.
  // Leave AI_BASE_URL null to route AI calls through API_BASE_URL.
  AI_BASE_URL: null,
  AI: {
    ENABLED: true,
    ASSISTANT: true,           // POST /ai/ask — in-app Q&A assistant (assistant.html)
    LESSON_GENERATION: true,   // POST /ai/lessons/generate
    RECOMMENDATIONS: true,     // POST /ai/lessons/recommend
    PERSONALIZATION: true,     // GET/PUT /ai/preferences
    // Model hints the backend may honour (advisory only).
    DEFAULT_MODEL: "auto",
    DEFAULT_LANGUAGE: "auto",  // "auto" → follow the user's UI language
  },

  // ---- Translation service (real language API) --------------------------
  // The curated dictionary in i18n.js handles UI chrome instantly and free.
  // For DYNAMIC content (report text, AI lessons, community posts) VARNIS
  // calls a real machine-translation API through VarnisAPI.i18n.translate.
  //
  // PROVIDER options:
  //   "libretranslate" → open-source LibreTranslate (self-host or libretranslate.com)
  //   "backend"        → your API proxies translation (recommended for prod:
  //                       keeps any provider key server-side). Calls
  //                       TRANSLATION.BACKEND_PATH on API_BASE_URL.
  TRANSLATION: {
    ENABLED: true,
    PROVIDER: "libretranslate",
    // LibreTranslate instance. Public demo is rate-limited; self-host for prod.
    LIBRETRANSLATE_URL: "https://libretranslate.com",
    LIBRETRANSLATE_API_KEY: "",            // set if your instance requires one
    BACKEND_PATH: "/i18n/translate",       // used when PROVIDER = "backend"
    CACHE: true,                            // cache results in VarnisStore (JSON)
  },

  // ---- Networking -------------------------------------------------------
  REQUEST_TIMEOUT_MS: 20000,   // abort a request after this long
  MOCK_LATENCY_MS: 300,        // simulated latency for mocks (0 = instant)

  // ---- Feature flags ----------------------------------------------------
  FEATURES: {
    OFFLINE_MODE: true,
    SERVICE_WORKER: true,
  },
};

/** Apply runtime overrides from the URL query string. */
(function applyRuntimeOverrides() {
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.has("api")) window.VarnisConfig.API_BASE_URL = params.get("api");
    if (params.has("ai")) window.VarnisConfig.AI_BASE_URL = params.get("ai");
    if (params.get("live") === "1") window.VarnisConfig.USE_MOCKS = false;
    if (params.get("mock") === "1") window.VarnisConfig.USE_MOCKS = true;
  } catch (e) { /* URL unavailable */ }
})();

/** Resolve the base URL for AI calls (falls back to the REST API base). */
window.VarnisConfig.aiBase = function () {
  return window.VarnisConfig.AI_BASE_URL || window.VarnisConfig.API_BASE_URL;
};
