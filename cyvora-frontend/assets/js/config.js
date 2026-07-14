/**
 * Cyvora — environment configuration
 * ------------------------------------------------------------
 * This is the ONE file a backend engineer needs to touch to point
 * the whole site at a real API. Everything else reads from
 * `window.CyvoraConfig`, never hardcodes a URL.
 *
 * Swap `API_BASE_URL` (and set `USE_MOCKS = false`) once the
 * backend is live. Until then every screen runs on local mock
 * data from assets/js/mock-data.js, so the frontend stays fully
 * demoable with zero backend.
 */
window.CyvoraConfig = {
  // Base URL for all REST calls made through CyvoraAPI (see api.js).
  // Leave relative ("/api/v1") if the frontend is served by the same
  // origin as the backend; use a full URL for a separate API host.
  API_BASE_URL: "/api/v1",

  // When true, CyvoraAPI returns local mock data instead of calling
  // the network. Flip to false (or override at runtime, see below)
  // once real endpoints exist.
  USE_MOCKS: true,

  // Name of the browser storage key used to hold the auth token
  // returned by POST /api/v1/auth/login. CyvoraAPI attaches it as
  // `Authorization: Bearer <token>` on every request automatically.
  AUTH_TOKEN_KEY: "cyvora_token",

  // Simulated network latency for mocks, so loading states are
  // visible during frontend development. Set to 0 for instant mocks.
  MOCK_LATENCY_MS: 300,
};

/**
 * Runtime override, no rebuild required:
 *   http://localhost:8000/index.html?api=https://api.cyvora.gov&live=1
 * `live=1` disables mocks; `api=` overrides the base URL.
 */
(function applyRuntimeOverrides() {
  var params = new URLSearchParams(window.location.search);
  if (params.has("api")) {
    window.CyvoraConfig.API_BASE_URL = params.get("api");
  }
  if (params.get("live") === "1") {
    window.CyvoraConfig.USE_MOCKS = false;
  }
})();
