/**
 * VARNIS — environment & endpoint configuration
 * ------------------------------------------------------------
 * This is the ONE file a backend engineer edits to point the whole
 * frontend at a live API. Every other module reads window.CyvoraConfig;
 * nothing hardcodes a URL.
 *
 * TO GO LIVE:
 *   1. Set API_BASE_URL to your REST API origin (e.g. "https://api.varnis.cm/api/v1").
 *   2. Set USE_MOCKS = false.
 *   3. (Optional) Set AI_BASE_URL if the AI service is a separate host.
 *   4. Implement the endpoints documented in BACKEND.md returning the
 *      JSON shapes in assets/data/seed.json.
 * Nothing else in the frontend needs to change.
 *
 * RUNTIME OVERRIDES (no rebuild), via URL query string:
 *   ?api=https://api.varnis.cm/api/v1   → override API_BASE_URL
 *   ?ai=https://ai.varnis.cm            → override AI_BASE_URL
 *   ?live=1                             → force USE_MOCKS = false
 *   ?mock=1                             → force USE_MOCKS = true
 */
window.CyvoraConfig = {
  // ---- Core REST API ----------------------------------------------------
  // Relative "/api/v1" if the frontend is served by the same origin as the
  // backend; a full URL for a separate API host.
  API_BASE_URL: "/api/v1",

  // When true, CyvoraAPI resolves from local seed data instead of the
  // network, so the frontend is fully demoable with no backend. Flip to
  // false (or ?live=1) once real endpoints exist.
  USE_MOCKS: true,

  // ---- Auth -------------------------------------------------------------
  AUTH_TOKEN_KEY: "cyvora_token",          // Bearer access token (localStorage)
  REFRESH_TOKEN_KEY: "cyvora_refresh",     // refresh token (localStorage)
  USER_KEY: "cyvora_user",                 // cached current-user JSON
  // When a request returns 401 and a refresh token exists, CyvoraAPI will
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
  // calls a real machine-translation API through CyvoraAPI.i18n.translate.
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
    CACHE: true,                            // cache results in CyvoraStore (JSON)
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
    if (params.has("api")) window.CyvoraConfig.API_BASE_URL = params.get("api");
    if (params.has("ai")) window.CyvoraConfig.AI_BASE_URL = params.get("ai");
    if (params.get("live") === "1") window.CyvoraConfig.USE_MOCKS = false;
    if (params.get("mock") === "1") window.CyvoraConfig.USE_MOCKS = true;
  } catch (e) { /* URL unavailable */ }
})();

/** Resolve the base URL for AI calls (falls back to the REST API base). */
window.CyvoraConfig.aiBase = function () {
  return window.CyvoraConfig.AI_BASE_URL || window.CyvoraConfig.API_BASE_URL;
};
