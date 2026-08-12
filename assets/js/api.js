/**
 * Varnis — API client
 * ------------------------------------------------------------
 * Every screen talks to the backend ONLY through window.VarnisAPI.
 * No page ever calls fetch() directly — that keeps one seam to
 * update when the real backend comes online, instead of dozens.
 *
 * Today, with VarnisConfig.USE_MOCKS = true, every method resolves
 * with data from mock-data.js (plus a tiny artificial delay) so the
 * whole site works with no backend at all.
 *
 * To go live:
 *   1. Set VarnisConfig.USE_MOCKS = false (config.js), or run with
 *      ?live=1 in the URL.
 *   2. Point VarnisConfig.API_BASE_URL at the real API.
 *   3. Implement the REST endpoints listed in README.md ("API contract") with the
 *      same JSON shapes used in mock-data.js — nothing else in the
 *      frontend needs to change.
 *
 * Every method returns a Promise and never throws synchronously;
 * network/HTTP errors reject with an Error whose `.status` is set
 * when available, so callers can branch on it.
 */
(function () {
  "use strict";

  function cfg() {
    return window.VarnisConfig || { API_BASE_URL: "/api/v1", USE_MOCKS: true, MOCK_LATENCY_MS: 250 };
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /** Resolve a path against the REST base or the AI base. */
  function resolveUrl(path, useAiBase) {
    if (/^https?:\/\//.test(path)) return path;
    var base = (useAiBase ? cfg().aiBase && cfg().aiBase() : cfg().API_BASE_URL) || "/api/v1";
    return String(base).replace(/\/$/, "") + path;
  }

  /** ------------------------------------------------------------------
   * BACKEND ADAPTER
   * ------------------------------------------------------------------
   * This frontend was originally written against a slightly different
   * API shape than the live Django backend. Rather than rewrite every
   * call site across every page, every request funnels through here
   * first. This block does three things:
   *
   *   1. PATH_MAP   — rewrites old paths -> the real Django routes
   *                    (and adjusts method/body where the shapes differ).
   *   2. unwrapEnvelope — the backend wraps every response as
   *                    { success, message, data }; this unwraps it so
   *                    the rest of api.js keeps working unmodified.
   *   3. NOT_ON_BACKEND — endpoints the frontend calls that the backend
   *                    (as of the current OpenAPI spec) does not
   *                    implement yet. These are forced to mock data
   *                    even in live mode, with a clear console warning,
   *                    instead of failing silently or 404ing.
   *
   * See API_INTEGRATION_MAP.md for the full endpoint-by-endpoint audit
   * this table was generated from, including notes on payload shape
   * mismatches that still need backend or frontend work.
   * ------------------------------------------------------------------ */

  // Rules are tried in order; first match wins. `test` matches against
  // "METHOD pathname" (no query string). `rewrite` returns the new
  // { path, options } — `path` may include its own query string.
  var PATH_MAP = [
    // ---- Auth ----
    { test: /^POST \/auth\/login$/, rewrite: function (path, options) {
        var b = options.body || {};
        return { path: "/auth/login/", options: Object.assign({}, options, { body: { email: b.identifier, password: b.password } }) };
      } },
    { test: /^POST \/auth\/register$/, rewrite: function (path, options) {
        return { path: "/auth/register/", options: options };
      } },
    { test: /^POST \/auth\/otp\/verify$/, rewrite: function (path, options) { return { path: "/auth/otp/verify/", options: options }; } },
    { test: /^POST \/auth\/otp\/resend$/, rewrite: function (path, options) { return { path: "/auth/otp/resend/", options: options }; } },
    { test: /^POST \/auth\/refresh$/, rewrite: function (path, options) {
        var b = options.body || {};
        return { path: "/auth/refresh/", options: Object.assign({}, options, { body: { refresh: b.refreshToken } }) };
      } },
    { test: /^GET \/users\/me$/, rewrite: function (path, options) { return { path: "/auth/me/", options: options }; } },
    { test: /^PATCH \/users\/me$/, rewrite: function (path, options) { return { path: "/auth/me/", options: options }; } },

    // ---- Incidents (frontend calls them "reports") ----
    { test: /^GET \/reports\/[^/?]+$/, rewrite: function (path, options) {
        return { path: path.replace(/^\/reports\//, "/incidents/") + "/", options: options };
      } },
    { test: /^GET \/reports(\?.*)?$/, rewrite: function (path, options) {
        return { path: path.replace(/^\/reports/, "/incidents/"), options: options };
      } },
    { test: /^POST \/reports$/, rewrite: function (path, options) {
        // NOTE: field shapes differ (category->category_id, no `title`/`district`
        // fields on the backend). Passing body through as-is will likely need
        // the caller-side payload adjusted too — see API_INTEGRATION_MAP.md.
        return { path: "/incidents/", options: options };
      } },
    { test: /^PATCH \/reports\/[^/?]+$/, rewrite: function (path, options) {
        return { path: path.replace(/^\/reports\//, "/incidents/").replace(/$/, "/") + "moderate/", options: options };
      } },

    // ---- Leaderboard (one endpoint -> three, split by scope) ----
    { test: /^GET \/leaderboard\?scope=/, rewrite: function (path, options) {
        var scope = decodeURIComponent((path.split("scope=")[1] || "national").split("&")[0]);
        var map = { national: "/leaderboard/national", regional: "/leaderboard/regional/", institutional: "/leaderboard/institution/" };
        return { path: (map[scope] || map.national), options: options };
      } },

    // ---- Monitor -> Dashboard ----
    { test: /^GET \/monitor\/stats$/, rewrite: function (path, options) { return { path: "/dashboard/", options: options }; } },

    // ---- Certificates ----
    { test: /^GET \/certificates$/, rewrite: function (path, options) { return { path: "/certificates/mine", options: options }; } },
    { test: /^GET \/certificates\/verify\//, rewrite: function (path, options) {
        return { path: path.replace("/certificates/verify/", "/certificates/verify/"), options: options };
      } },

    // ---- Community ----
    { test: /^GET \/community\/posts/, rewrite: function (path, options) { return { path: "/community/feed", options: options }; } },
    { test: /^POST \/community\/posts$/, rewrite: function (path, options) { return { path: "/community/tips", options: options }; } },

    // ---- KYC ----
    { test: /^GET \/kyc\/me$/, rewrite: function (path, options) { return { path: "/kyc/me/", options: options }; } },
    { test: /^GET \/kyc\/submissions/, rewrite: function (path, options) { return { path: "/kyc/admin/submissions/", options: options }; } },
  ];

  // Endpoints the frontend calls that the current backend does NOT
  // implement (per Varnis_API__v1_.yaml). Forced to mock in live mode
  // so pages degrade gracefully instead of 404ing, and so it's obvious
  // (via console) exactly what's still outstanding on the backend.
  var NOT_ON_BACKEND = [
    /^POST \/auth\/logout$/,
    /^GET \/notifications/,
    /^PATCH \/notifications\//,
    /^POST \/notifications\/read-all$/,
    /^GET \/alerts$/,
    /^POST \/alerts$/,
    /^GET \/challenges\/today$/,
    /^GET \/search/,
    /^POST \/support\/chat$/,
    /^GET \/support\/channels$/,
    /^POST \/support\/tickets\/[^/]+\/messages$/,
    /^PATCH \/support\/tickets\//,
    /^GET \/users(\?|$)/,
    /^PATCH \/users\/[^/]+$/,
    /^PATCH \/community\/posts\//,
    /^GET \/recovery\//,
    /^POST \/recovery\//,
    /^GET \/kyc\/document-types$/,
    /^PUT \/kyc\/me\/draft$/,
    /^POST \/kyc\/me\/submit$/,
    /^PATCH \/kyc\/submissions\//,
    /^GET \/learning\/courses\/[^/]+\/quiz$/,
    /^POST \/learning\/courses\/[^/]+\/quiz$/,
  ];

  /** Look up and apply a PATH_MAP rule; returns { path, options } (possibly unchanged). */
  function mapRequest(method, path, options) {
    var pathname = path.split("?")[0];
    var key = method + " " + pathname + (path.indexOf("?") !== -1 ? path.slice(path.indexOf("?")) : "");
    var keyNoQuery = method + " " + pathname;
    for (var i = 0; i < PATH_MAP.length; i++) {
      var rule = PATH_MAP[i];
      if (rule.test.test(key) || rule.test.test(keyNoQuery)) {
        return rule.rewrite(path, options || {});
      }
    }
    return { path: path, options: options || {} };
  }

  /** True if this exact call is known-unimplemented on the current backend. */
  function isNotOnBackend(method, path) {
    var pathname = path.split("?")[0];
    var key = method + " " + pathname + (path.indexOf("?") !== -1 ? path.slice(path.indexOf("?")) : "");
    var keyNoQuery = method + " " + pathname;
    return NOT_ON_BACKEND.some(function (re) { return re.test(key) || re.test(keyNoQuery); });
  }

  /** The backend wraps every response as { success, message, data }.
   *  Unwrap it so the rest of api.js sees the same shape it always has.
   *  Auth errors ({success:false}) are left alone for callers that check .success. */
  function unwrapEnvelope(payload) {
    if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
      return payload.data;
    }
    return payload;
  }

  function authToken() {
    if (window.VarnisStore) return window.VarnisStore.getToken();
    try { return window.localStorage.getItem(cfg().AUTH_TOKEN_KEY || "varnis_token"); } catch (e) { return null; }
  }

  /** Low-level fetch wrapper: auth header, JSON, timeout, error shape, and
   *  one automatic token refresh on 401 when configured. */
  async function request(path, options) {
    return requestOnce(path, options, true);
  }

  async function requestOnce(path, options, allowRefresh) {
    options = options || {};
    // Apply the backend adapter: rewrite legacy paths/bodies to the real
    // Django routes before anything else touches this request.
    var mapped = mapRequest((options.method || "GET").toUpperCase(), path, options);
    path = mapped.path;
    options = mapped.options;
    var url = resolveUrl(path, options.aiBase);
    var token = authToken();

    var headers = Object.assign(
      { "Content-Type": "application/json", Accept: "application/json" },
      token ? { Authorization: "Bearer " + token } : {},
      options.headers || {}
    );

    // Timeout via AbortController.
    var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timeoutMs = cfg().REQUEST_TIMEOUT_MS || 20000;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

    var res;
    try {
      res = await fetch(url, {
        method: options.method || "GET",
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller ? controller.signal : undefined,
      });
    } catch (networkErr) {
      if (timer) clearTimeout(timer);
      var offlineErr = new Error(
        (networkErr && networkErr.name === "AbortError")
          ? "Request timed out contacting " + url
          : "Network error contacting " + url
      );
      offlineErr.cause = networkErr;
      offlineErr.offline = true;
      throw offlineErr;
    }
    if (timer) clearTimeout(timer);

    // 401 → try one refresh, then retry the original request.
    if (res.status === 401 && allowRefresh && cfg().TOKEN_AUTO_REFRESH) {
      var refreshed = await tryRefresh();
      if (refreshed) return requestOnce(path, options, false);
    }

    var payload = null;
    try { payload = await res.json(); } catch (e) { /* empty body is fine */ }

    if (!res.ok) {
      // Unrecoverable 401 on a protected route = the session is stale or
      // expired (e.g. an old mock-token left over from before the backend,
      // or a token signed with a rotated key). Rather than dead-end every
      // page on "Could not load…", clear the dead session and bounce to
      // login so the user can get a fresh, valid token. Auth endpoints are
      // excluded (a wrong password is a real 401 the login page must show).
      if (res.status === 401 && !/^\/auth\//.test(path)) {
        handleAuthFailure();
      }
      var err = new Error((payload && payload.message) || ("Request failed with status " + res.status));
      err.status = res.status;
      err.body = payload;
      throw err;
    }
    return unwrapEnvelope(payload);
  }

  /** Clear a dead session and send the user to sign in (once). Safe to call
   *  repeatedly — it no-ops on auth/public pages and after the first redirect. */
  var _authFailureHandled = false;
  function handleAuthFailure() {
    if (_authFailureHandled) return;
    if (typeof window === "undefined" || !window.location) return;

    var page = (window.location.pathname.split("/").pop() || "index.html")
      .toLowerCase().replace(/\.html$/, "") || "index";
    var PUBLIC = ["landing", "login", "register", "otp", "certificate-verify"];
    if (PUBLIC.indexOf(page) !== -1) return; // already unauthenticated context

    _authFailureHandled = true;
    try { if (window.VarnisStore) window.VarnisStore.clearAuth(); } catch (e) { /* ignore */ }
    try { sessionStorage.setItem("varnis_post_login_redirect", window.location.pathname + window.location.search); } catch (e) { /* ignore */ }

    var inAdmin = window.location.pathname.toLowerCase().indexOf("/admin/") !== -1;
    var loginUrl = inAdmin ? "../public/login.html?expired=1" : "login.html?expired=1";
    try { window.location.replace(loginUrl); } catch (e) { window.location.href = loginUrl; }
  }

  /** POST the refresh token; on success store the new access token. */
  async function tryRefresh() {
    var refresh = window.VarnisStore ? window.VarnisStore.getRefreshToken() : null;
    if (!refresh) return false;
    try {
      // NOTE: the real refresh route is /auth/refresh/ and wants { refresh },
      // not { refreshToken } — mapRequest() would normally do this rewrite,
      // but this low-level path bypasses endpoint()/requestOnce() by design
      // (it must not itself trigger another refresh), so it's handled here too.
      var url = resolveUrl("/auth/refresh/", false);
      var res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh: refresh }),
      });
      if (!res.ok) return false;
      var raw = await res.json();
      var data = unwrapEnvelope(raw) || {};
      // Field names inside `data` aren't pinned down in the OpenAPI spec
      // (drf-spectacular couldn't infer them) — try the SimpleJWT-standard
      // names first, then fall back to the frontend's original names.
      var access = data.access || data.token;
      var newRefresh = data.refresh || data.refreshToken;
      if (access && window.VarnisStore) {
        window.VarnisStore.setToken(access);
        if (newRefresh) window.VarnisStore.setRefreshToken(newRefresh);
        return true;
      }
    } catch (e) { /* fall through */ }
    return false;
  }

  /** Wraps a mock resolver + a real request() call behind one switch.
   *  In live mode, if the backend is unreachable (network error/timeout)
   *  and AUTO_FALLBACK isn't disabled, we fall back to the mock resolver
   *  so a demo never dead-ends on a dropped server. HTTP errors (400/401/
   *  404…) still reject normally — those are real answers. */
  function endpoint(mockFn, path, options) {
    if (cfg().USE_MOCKS) {
      return delay(cfg().MOCK_LATENCY_MS || 0).then(mockFn);
    }
    // Backend doesn't implement this endpoint yet (see API_INTEGRATION_MAP.md) —
    // serve mock data and say so loudly, rather than let the page 404 silently.
    var method = (options && options.method || "GET").toUpperCase();
    if (isNotOnBackend(method, path)) {
      console.warn("[VarnisAPI] " + method + " " + path + " is not implemented on the backend yet — serving mock data.");
      return delay(cfg().MOCK_LATENCY_MS || 0).then(mockFn);
    }
    return request(path, options).catch(function (err) {
      if (err && err.offline && cfg().AUTO_FALLBACK !== false && typeof mockFn === "function") {
        console.warn("[VarnisAPI] Backend unreachable for " + path + " — serving local mock data.", err.message);
        return mockFn();
      }
      throw err;
    });
  }

  var DB = window.VarnisMockData || {};

  /** Build "?a=1&b=2" from an object, skipping empty values. */
  function qs(params) {
    var parts = [];
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      if (v === undefined || v === null || v === "") return;
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
    });
    return parts.length ? "?" + parts.join("&") : "";
  }

  /* ---- Mutable mock state --------------------------------------------
     KYC, recovery cases and support tickets are the only datasets a user
     WRITES to from the UI, so in mock mode they're mirrored into
     VarnisStore. That makes the demo flows real: submit KYC and the status
     page reflects it; file a recovery case and it appears in the Recovery
     Center on the next page load. Live mode never touches these — the
     backend owns the state. Clear with VarnisAPI.resetMockState(). */
  function stateGet(key, seed) {
    if (!window.VarnisStore) return clone(seed);
    var saved = window.VarnisStore.get("mock." + key, null);
    if (saved) return saved;
    var fresh = clone(seed);
    window.VarnisStore.set("mock." + key, fresh);
    return fresh;
  }
  function stateSet(key, value) {
    if (window.VarnisStore) window.VarnisStore.set("mock." + key, value);
  }

  function mockKyc()   { return stateGet("kyc", DB.kyc || { status: "draft" }); }
  function saveKyc(v)  { stateSet("kyc", v); }
  function mockCases() { return stateGet("recoveryCases", DB.recoveryCases || []); }
  function saveCases(v){ stateSet("recoveryCases", v); }
  function mockTickets()  { return stateGet("supportTickets", DB.supportTickets || []); }
  function saveTickets(v) { stateSet("supportTickets", v); }

  window.VarnisAPI = {
    /** Wipe locally-persisted mock writes (KYC draft, recovery cases,
     *  tickets) and fall back to the seed data. Demo/QA helper only. */
    resetMockState: function () {
      ["kyc", "recoveryCases", "supportTickets"].forEach(function (k) {
        if (window.VarnisStore) window.VarnisStore.remove("mock." + k);
      });
      return Promise.resolve({ ok: true });
    },

    /* ---------------- Reports ---------------- */
    reports: {
      // GET /api/v1/reports?status=&district=
      list: function (filters) {
        return endpoint(
          function () {
            var items = clone(DB.reports || []);
            if (filters && filters.status) items = items.filter(function (r) { return r.status === filters.status; });
            if (filters && filters.district) items = items.filter(function (r) { return r.district === filters.district; });
            return { items: items, total: items.length };
          },
          "/reports" + (filters ? "?" + new URLSearchParams(filters).toString() : "")
        );
      },
      // GET /api/v1/reports?mine=1  → only the signed-in user's own reports
      // (used by the citizen "My Reports" page). Falls back to matching the
      // cached user id in mock mode.
      mine: function (filters) {
        var params = Object.assign({ mine: "1" }, filters || {});
        return endpoint(
          function () {
            var me = window.VarnisStore && window.VarnisStore.getUser && window.VarnisStore.getUser();
            var myId = (me && me.id) || (DB.currentUser && DB.currentUser.id);
            var items = clone(DB.reports || []).filter(function (r) {
              return r.reporterId === myId || r.reporterName === (me && me.name);
            });
            if (filters && filters.status) items = items.filter(function (r) { return r.status === filters.status; });
            return { items: items, total: items.length };
          },
          "/reports?" + new URLSearchParams(params).toString()
        );
      },
      // GET /api/v1/reports/:id
      get: function (id) {
        return endpoint(
          function () {
            var found = (DB.reports || []).find(function (r) { return r.id === id; });
            if (!found) { var e = new Error("Report not found"); e.status = 404; throw e; }
            return clone(found);
          },
          "/reports/" + id
        );
      },
      // POST /api/v1/reports  { category, title, description, district, location }
      create: function (payload) {
        payload = payload || {};
        if (window.VarnisValidation) {
          var v = window.VarnisValidation.validateReport(payload);
          if (!v.valid) {
            var err = new Error("Validation failed: " + v.errors.join(" • "));
            err.status = 400;
            err.validationErrors = v.errors;
            return Promise.reject(err);
          }
          payload = v.sanitized;
        }
        return endpoint(
          function () {
            var newReport = Object.assign(
              {
                id: "r-" + Math.random().toString(36).slice(2, 8),
                trackingId: "VAR-" + Math.floor(Math.random() * 900 + 100) + "-" + Math.floor(Math.random() * 90 + 10) + "X",
                status: "pending",
                createdAt: new Date().toISOString(),
              },
              payload
            );
            (DB.reports || (DB.reports = [])).unshift(newReport);
            return clone(newReport);
          },
          "/reports",
          { method: "POST", body: payload }
        );
      },
      // PATCH /api/v1/reports/:id  { status }
      updateStatus: function (id, status) {
        return endpoint(
          function () {
            var found = (DB.reports || []).find(function (r) { return r.id === id; });
            if (found) found.status = status;
            return clone(found);
          },
          "/reports/" + id,
          { method: "PATCH", body: { status: status } }
        );
      },
    },

    /* ---------------- Alerts ---------------- */
    alerts: {
      // GET /api/v1/alerts
      list: function () {
        return endpoint(function () { return { items: clone(DB.alerts || []) }; }, "/alerts");
      },
      // POST /api/v1/alerts  { severity, category, title, message, region }
      create: function (payload) {
        payload = payload || {};
        if (window.VarnisValidation) {
          var v = window.VarnisValidation.validateAlert(payload);
          if (!v.valid) {
            var err = new Error("Validation failed: " + v.errors.join(" • "));
            err.status = 400;
            err.validationErrors = v.errors;
            return Promise.reject(err);
          }
          payload = v.sanitized;
        }
        return endpoint(
          function () {
            var alert = Object.assign(
              { id: "a-" + Math.random().toString(36).slice(2, 8), active: true, issuedAt: new Date().toISOString() },
              payload
            );
            (DB.alerts || (DB.alerts = [])).unshift(alert);
            return clone(alert);
          },
          "/alerts",
          { method: "POST", body: payload }
        );
      },
    },

    /* ---------------- Users (admin) ---------------- */
    users: {
      // GET /api/v1/users?role=&status=
      list: function (filters) {
        return endpoint(
          function () {
            var items = clone(DB.users || []);
            if (filters && filters.role) items = items.filter(function (u) { return u.role === filters.role; });
            if (filters && filters.status) items = items.filter(function (u) { return u.status === filters.status; });
            return { items: items, total: items.length };
          },
          "/users" + (filters ? "?" + new URLSearchParams(filters).toString() : "")
        );
      },
      // PATCH /api/v1/users/:id  { status } — suspend / reinstate / approve
      updateStatus: function (id, status) {
        return endpoint(
          function () {
            var found = (DB.users || []).find(function (u) { return u.id === id; });
            if (found) found.status = status;
            return clone(found);
          },
          "/users/" + id,
          { method: "PATCH", body: { status: status } }
        );
      },
      // PATCH /api/v1/users/:id  { role }
      updateRole: function (id, role) {
        return endpoint(
          function () {
            var found = (DB.users || []).find(function (u) { return u.id === id; });
            if (found) found.role = role;
            return clone(found);
          },
          "/users/" + id,
          { method: "PATCH", body: { role: role } }
        );
      },
      // GET /api/v1/users/me
      me: function () {
        return endpoint(function () { return clone(DB.currentUser || {}); }, "/users/me");
      },
      // PATCH /api/v1/users/me  { name, email, phone, district }
      updateProfile: function (payload) {
        payload = payload || {};
        if (window.VarnisValidation) {
          var v = window.VarnisValidation.validateProfileUpdate(payload);
          if (!v.valid) {
            var err = new Error("Profile validation failed: " + v.errors.join(" • "));
            err.status = 400;
            err.validationErrors = v.errors;
            return Promise.reject(err);
          }
          payload = v.sanitized;
        }
        return endpoint(
          function () {
            DB.currentUser = Object.assign({}, DB.currentUser, payload);
            return clone(DB.currentUser);
          },
          "/users/me",
          { method: "PATCH", body: payload }
        );
      },
    },

    /* ---------------- Community ---------------- */
    community: {
      // GET /api/v1/community/posts?status=
      list: function (filters) {
        return endpoint(
          function () {
            var items = clone(DB.communityPosts || []);
            if (filters && filters.status) items = items.filter(function (p) { return p.status === filters.status; });
            return { items: items, total: items.length };
          },
          "/community/posts" + (filters ? "?" + new URLSearchParams(filters).toString() : "")
        );
      },
      // POST /api/v1/community/posts  { title, body, category }
      create: function (payload) {
        payload = payload || {};
        if (window.VarnisValidation) {
          var v = window.VarnisValidation.validateCommunityPost(payload);
          if (!v.valid) {
            var err = new Error("Validation failed: " + v.errors.join(" • "));
            err.status = 400;
            err.validationErrors = v.errors;
            return Promise.reject(err);
          }
          payload = v.sanitized;
        }
        return endpoint(
          function () {
            var post = Object.assign(
              { id: "c-" + Math.random().toString(36).slice(2, 8), upvotes: 0, comments: 0, status: "pending", createdAt: new Date().toISOString() },
              payload
            );
            (DB.communityPosts || (DB.communityPosts = [])).unshift(post);
            return clone(post);
          },
          "/community/posts",
          { method: "POST", body: payload }
        );
      },
      // PATCH /api/v1/community/posts/:id  { status } — approve / flag / remove
      moderate: function (id, status) {
        return endpoint(
          function () {
            var found = (DB.communityPosts || []).find(function (p) { return p.id === id; });
            if (found) found.status = status;
            return clone(found);
          },
          "/community/posts/" + id,
          { method: "PATCH", body: { status: status } }
        );
      },
    },

    /* ---------------- Learning ---------------- */
    learning: {
      // GET /api/v1/learning/courses
      courses: function () {
        return endpoint(function () { return { items: clone(DB.courses || []) }; }, "/learning/courses");
      },
      // GET /api/v1/learning/courses/:id/quiz -> { title, passPct, xpPerCorrect, questions[] }
      quiz: function (id) {
        return endpoint(
          function () {
            var q = (DB.quizzes || {})[id];
            if (!q) { var e = new Error("Quiz not found"); e.status = 404; throw e; }
            return clone(q);
          },
          "/learning/courses/" + id + "/quiz"
        );
      },
      // POST /api/v1/learning/courses/:id/quiz  { score, total, xp, passed } -> { ok, xp, level }
      submitQuiz: function (id, result) {
        return endpoint(
          function () {
            // Mock: bank the XP on the current user.
            if (DB.currentUser && result && result.xp) DB.currentUser.xp = (DB.currentUser.xp || 0) + result.xp;
            return { ok: true, xp: (DB.currentUser && DB.currentUser.xp) || 0, level: (DB.currentUser && DB.currentUser.level) || "Novice" };
          },
          "/learning/courses/" + id + "/quiz",
          { method: "POST", body: result || {} }
        );
      },

      /* ---------------- Lessons (admin JSON authoring + publish/draft) ----
       * Backed by /learning/lessons on the live server. In pure-static mock
       * mode these operate on an in-memory list (DB.lessons) so the admin
       * editor still works offline — but note persistence needs the backend. */
      lessons: {
        // GET /learning/lessons[?status=]
        list: function (status) {
          var qs = status ? ("?status=" + encodeURIComponent(status)) : "";
          return endpoint(function () {
            var items = clone(DB.lessons || []);
            if (status) items = items.filter(function (l) { return l.status === status; });
            return { items: items, total: items.length };
          }, "/learning/lessons" + qs);
        },
        // GET /learning/lessons/:id
        get: function (id) {
          return endpoint(function () {
            var l = (DB.lessons || []).find(function (x) { return x.id === id || x.slug === id; });
            if (!l) { var e = new Error("Lesson not found"); e.status = 404; throw e; }
            return clone(l);
          }, "/learning/lessons/" + encodeURIComponent(id));
        },
        // POST /learning/lessons  (admin)
        create: function (lesson) {
          return endpoint(function () {
            var l = clone(lesson || {});
            l.id = l.id || ("lesson-" + Date.now());
            l.status = l.status || "draft";
            l.createdAt = l.updatedAt = new Date().toISOString();
            (DB.lessons = DB.lessons || []).unshift(l);
            return clone(l);
          }, "/learning/lessons", { method: "POST", body: lesson || {} });
        },
        // PATCH /learning/lessons/:id  (admin)
        update: function (id, lesson) {
          return endpoint(function () {
            var l = (DB.lessons || []).find(function (x) { return x.id === id || x.slug === id; });
            if (!l) { var e = new Error("Lesson not found"); e.status = 404; throw e; }
            Object.assign(l, lesson || {}, { updatedAt: new Date().toISOString() });
            return clone(l);
          }, "/learning/lessons/" + encodeURIComponent(id), { method: "PATCH", body: lesson || {} });
        },
        // PATCH /learning/lessons/:id/status  { status }  (admin)
        setStatus: function (id, status) {
          return endpoint(function () {
            var l = (DB.lessons || []).find(function (x) { return x.id === id || x.slug === id; });
            if (!l) { var e = new Error("Lesson not found"); e.status = 404; throw e; }
            l.status = status; l.updatedAt = new Date().toISOString();
            return clone(l);
          }, "/learning/lessons/" + encodeURIComponent(id) + "/status", { method: "PATCH", body: { status: status } });
        },
        // DELETE /learning/lessons/:id  (admin)
        remove: function (id) {
          return endpoint(function () {
            var list = DB.lessons || [];
            var i = list.findIndex(function (x) { return x.id === id || x.slug === id; });
            if (i >= 0) list.splice(i, 1);
            return { ok: true, id: id };
          }, "/learning/lessons/" + encodeURIComponent(id), { method: "DELETE" });
        },
      },
    },

    /* ---------------- Leaderboard ---------------- */
    leaderboard: {
      // GET /api/v1/leaderboard?scope=national|regional|institutional
      get: function (scope) {
        scope = scope || "national";
        return endpoint(
          function () {
            var lb = DB.leaderboard || {};
            return { scope: scope, items: clone(lb[scope] || []) };
          },
          "/leaderboard?scope=" + encodeURIComponent(scope)
        );
      },
    },

    /* ---------------- National threat monitor ---------------- */
    monitor: {
      // GET /api/v1/monitor/stats
      stats: function () {
        return endpoint(
          function () { return clone(DB.monitor || {}); },
          "/monitor/stats"
        );
      },
    },

    /* ---------------- Certificates ---------------- */
    certificates: {
      // GET /api/v1/certificates
      list: function () {
        return endpoint(
          function () { return { items: clone(DB.certificates || []) }; },
          "/certificates"
        );
      },
      // GET /api/v1/certificates/verify/:id  (public QR verification)
      verify: function (id) {
        return endpoint(
          function () {
            var found = (DB.certificates || []).find(function (c) { return c.id === id; });
            if (!found) { var e = new Error("Certificate not found"); e.status = 404; throw e; }
            return clone(found);
          },
          "/certificates/verify/" + encodeURIComponent(id)
        );
      },
    },

    /* ---------------- Daily challenge ---------------- */
    challenge: {
      // GET /api/v1/challenges/today
      today: function () {
        return endpoint(
          function () { return clone(DB.dailyChallenge || null); },
          "/challenges/today"
        );
      },
    },

    /* ---------------- Notifications ---------------- */
    notifications: {
      // GET /api/v1/notifications -> { items, unread }
      list: function () {
        return endpoint(
          function () {
            var items = clone(DB.notifications || []);
            return { items: items, unread: items.filter(function (n) { return !n.read; }).length };
          },
          "/notifications"
        );
      },
      // GET /api/v1/notifications/unread-count -> { unread }
      unreadCount: function () {
        return endpoint(
          function () { return { unread: (DB.notifications || []).filter(function (n) { return !n.read; }).length }; },
          "/notifications/unread-count"
        );
      },
      // PATCH /api/v1/notifications/:id  { read: true } -> Notification
      markRead: function (id, read) {
        if (read === undefined) read = true;
        return endpoint(
          function () {
            var found = (DB.notifications || []).find(function (n) { return n.id === id; });
            if (found) found.read = read;
            return clone(found || null);
          },
          "/notifications/" + encodeURIComponent(id),
          { method: "PATCH", body: { read: read } }
        );
      },
      // POST /api/v1/notifications/read-all -> { ok, updated }
      markAllRead: function () {
        return endpoint(
          function () {
            var items = DB.notifications || [];
            items.forEach(function (n) { n.read = true; });
            return { ok: true, updated: items.length };
          },
          "/notifications/read-all",
          { method: "POST", body: {} }
        );
      },
    },

    /* ---------------- Support chat ---------------- */
    support: {
      // POST /api/v1/support/chat  { message } -> { reply, link? }
      // Mock: keyword-routed canned agent replies. The real backend can
      // return the same shape from a human agent queue or an AI assistant.
      sendMessage: function (message) {
        message = String(message == null ? "" : message);
        if (window.VarnisValidation) {
          var mal = window.VarnisValidation.detectMaliciousInput
            ? window.VarnisValidation.detectMaliciousInput(message)
            : { isMalicious: false };
          if (mal.isMalicious) {
            var err = new Error("Message contains content we can't process. Please rephrase.");
            err.status = 400;
            return Promise.reject(err);
          }
        }
        return endpoint(
          function () {
            var m = message.toLowerCase();
            function r(reply, link) { return { reply: reply, link: link || null, agent: "VARNIS Support", at: new Date().toISOString() }; }
            if (/status|my report|tracking/.test(m)) {
              return r("Every report gets a tracking ID (like VAR-942-01A). You can follow its status — Pending, In Review, Approved or Resolved — from My Reports.", { href: "my-reports.html", label: "Open My Reports" });
            }
            if (/\breport\b|incident|scam(mer)?\b|fraud/.test(m)) {
              return r("You can file a report in under two minutes — choose the category, describe what happened, and attach any evidence. An analyst reviews every submission.", { href: "report-incident.html", label: "Report an incident" });
            }
            if (/certificat|verify|qr/.test(m)) {
              return r("Certificates are QR-verifiable. Anyone can confirm authenticity using the certificate ID on the public verification page.", { href: "certificates.html", label: "View my certificates" });
            }
            if (/momo|mobile money|pin\b|orange money|mtn/.test(m)) {
              return r("Important: MTN, Orange and banks NEVER ask for your PIN or OTP by phone or SMS. If someone did, end contact and report the number — it helps protect others.", { href: "report-incident.html?category=momo_fraud", label: "Report MoMo fraud" });
            }
            if (/phish|email|sms|link/.test(m)) {
              return r("Good instinct to check. Don't click the link — our Phishing Awareness lessons show you exactly how to inspect senders and URLs safely.", { href: "lesson-phishing.html", label: "Open the phishing lesson" });
            }
            if (/password|account|hack|login|otp/.test(m)) {
              return r("If you suspect account compromise: change the password from a safe device, enable two-step verification, and report the incident so we can track the campaign.", { href: "report-incident.html?category=hacking", label: "Report account hacking" });
            }
            if (/lesson|learn|course|xp|streak|challenge/.test(m)) {
              return r("Your learning dashboard tracks XP, streaks and zone progress. The daily challenge gives bonus XP and keeps your streak alive.", { href: "learn.html", label: "Go to Learn" });
            }
            if (/agent|human|person|call/.test(m)) {
              return r("I've flagged this conversation for a human agent — expected wait is under 3 minutes during business hours (08:00–18:00 WAT). You can also email support@varnis.cm.");
            }
            if (/hello|hi\b|bonjour|good (morning|afternoon|evening)/.test(m)) {
              return r("Hello! I'm here to help with reports, learning, certificates or account questions. What's going on?");
            }
            return r("Thanks — I've noted that. Could you tell me a bit more? If it's about a suspicious message, a payment, or your account, say so and I'll point you to the fastest fix. For anything urgent, a human agent is one message away — just ask.");
          },
          "/support/chat",
          { method: "POST", body: { message: message } }
        );
      },

      /* ---- Contact channels shown on support.html (phone, email, SLAs) ---- */
      // GET /support/channels -> { phone, phoneHours, email, emailSla, chatSla }
      channels: function () {
        return endpoint(function () { return clone(DB.supportChannels || {}); }, "/support/channels");
      },

      /* ---- Support tickets — Open → Pending → Resolved → Closed ---- */
      tickets: {
        // GET /support/tickets?status=&category= -> { items: [...] }
        list: function (filters) {
          filters = filters || {};
          return endpoint(
            function () {
              var items = mockTickets().slice();
              if (filters.status) items = items.filter(function (t) { return t.status === filters.status; });
              if (filters.category) items = items.filter(function (t) { return t.category === filters.category; });
              items.sort(function (a, b) { return new Date(b.updatedAt) - new Date(a.updatedAt); });
              return { items: items };
            },
            "/support/tickets" + qs(filters)
          );
        },

        // GET /support/tickets/:id -> ticket
        get: function (id) {
          return endpoint(
            function () {
              var t = mockTickets().find(function (x) { return x.id === id || x.reference === id; });
              if (!t) { var e = new Error("Ticket not found"); e.status = 404; throw e; }
              return clone(t);
            },
            "/support/tickets/" + encodeURIComponent(id)
          );
        },

        // POST /support/tickets
        //   { subject, category, priority, description, channel,
        //     attachments: [{ fileName, mimeType, size, data }] } -> ticket
        create: function (payload) {
          payload = payload || {};
          return endpoint(
            function () {
              var all = mockTickets();
              var n = 1043 + all.length;
              var now = new Date().toISOString();
              var ticket = {
                id: "t-" + n,
                reference: "SUP-" + n,
                subject: payload.subject,
                category: payload.category || "other",
                priority: payload.priority || "normal",
                status: "open",
                channel: payload.channel || "form",
                createdAt: now,
                updatedAt: now,
                agent: null,
                attachments: (payload.attachments || []).map(function (a) { return { name: a.fileName, uploadedAt: now }; }),
                messages: [{ from: "user", author: "You", body: payload.description || "", at: now }],
              };
              all.unshift(ticket);
              saveTickets(all);
              return clone(ticket);
            },
            "/support/tickets",
            { method: "POST", body: payload }
          );
        },

        // POST /support/tickets/:id/messages  { body } -> ticket
        reply: function (id, body) {
          return endpoint(
            function () {
              var all = mockTickets();
              var t = all.find(function (x) { return x.id === id || x.reference === id; });
              if (!t) { var e = new Error("Ticket not found"); e.status = 404; throw e; }
              var now = new Date().toISOString();
              t.messages.push({ from: "user", author: "You", body: String(body || ""), at: now });
              t.updatedAt = now;
              if (t.status === "resolved" || t.status === "closed") t.status = "open";
              saveTickets(all);
              return clone(t);
            },
            "/support/tickets/" + encodeURIComponent(id) + "/messages",
            { method: "POST", body: { body: body } }
          );
        },

        // PATCH /support/tickets/:id  { status } -> ticket
        setStatus: function (id, status) {
          return endpoint(
            function () {
              var all = mockTickets();
              var t = all.find(function (x) { return x.id === id || x.reference === id; });
              if (!t) { var e = new Error("Ticket not found"); e.status = 404; throw e; }
              t.status = status;
              t.updatedAt = new Date().toISOString();
              saveTickets(all);
              return clone(t);
            },
            "/support/tickets/" + encodeURIComponent(id),
            { method: "PATCH", body: { status: status } }
          );
        },
      },
    },

    /* ---------------- KYC (identity verification) ----------------
       States: draft → submitted → under_review → approved → rejected → expired
       KYC approval gates incident reporting, the academy, certification
       and device recovery (see assets/js/kyc-guard.js). */
    kyc: {
      // GET /kyc/document-types -> { items: [{ id, name, hint }] }
      documentTypes: function () {
        return endpoint(function () { return { items: clone(DB.kycDocumentTypes || []) }; }, "/kyc/document-types");
      },

      // GET /kyc/me -> kyc record (status = "draft" when never started)
      get: function () {
        return endpoint(function () { return clone(mockKyc()); }, "/kyc/me");
      },

      // PUT /kyc/me/draft  { personal, document, selfie } -> kyc record
      // Saves progress without submitting. Status stays "draft".
      saveDraft: function (data) {
        return endpoint(
          function () {
            var rec = mockKyc();
            Object.assign(rec, data || {});
            rec.status = "draft";
            saveKyc(rec);
            return clone(rec);
          },
          "/kyc/me/draft",
          { method: "PUT", body: data }
        );
      },

      // POST /kyc/me/submit  { personal, document, selfie } -> kyc record
      // Documents travel as base64 data URLs, same convention as
      // /auth/register's idCard. Status becomes "submitted".
      submit: function (data) {
        return endpoint(
          function () {
            var rec = mockKyc();
            Object.assign(rec, data || {});
            var now = new Date().toISOString();
            rec.status = "submitted";
            rec.submittedAt = now;
            rec.rejectionReason = null;
            rec.history = (rec.history || []).concat([{ at: now, status: "submitted", note: "Submitted for review." }]);
            saveKyc(rec);
            return clone(rec);
          },
          "/kyc/me/submit",
          { method: "POST", body: data }
        );
      },

      // ---- Moderator / admin ----
      // GET /kyc/submissions?status= -> { items: [...] }
      queue: function (filters) {
        filters = filters || {};
        return endpoint(
          function () {
            var items = clone(DB.kycSubmissions || []);
            if (filters.status) items = items.filter(function (s) { return s.status === filters.status; });
            return { items: items };
          },
          "/kyc/submissions" + qs(filters)
        );
      },

      // PATCH /kyc/submissions/:id  { decision: "approve"|"reject", reason? }
      review: function (id, decision, reason) {
        return endpoint(
          function () { return { id: id, status: decision === "approve" ? "approved" : "rejected", reason: reason || null }; },
          "/kyc/submissions/" + encodeURIComponent(id),
          { method: "PATCH", body: { decision: decision, reason: reason || null } }
        );
      },
    },

    /* ---------------- Device & vehicle recovery ----------------
       Recovery Center → ownership verification → asset details →
       ownership document → tracking fee → mobile-money payment →
       approval → authority processing → tracking timeline → closed. */
    recovery: {
      // GET /recovery/fees -> { currency, electronics: { amount, label }, vehicle: {...}, note }
      fees: function () {
        return endpoint(function () { return clone(DB.recoveryFees || {}); }, "/recovery/fees");
      },

      // GET /recovery/catalog -> dropdown sources for the asset forms
      catalog: function () {
        return endpoint(
          function () {
            return {
              deviceTypes: clone(DB.deviceTypes || []),
              deviceBrands: clone(DB.deviceBrands || []),
              vehicleTypes: clone(DB.vehicleTypes || []),
              vehicleManufacturers: clone(DB.vehicleManufacturers || []),
              stages: clone(DB.recoveryStages || []),
            };
          },
          "/recovery/catalog"
        );
      },

      // POST /recovery/ownership/verify  { fullName, phone, password }
      //   -> { verified, matched: [fields], matchCount, required: 2 }
      // RULE: any TWO of the three fields must match the owner's VARNIS
      // account. This lets another verified user file on the owner's behalf
      // when the owner's phone, SIM or email is unreachable.
      // The mock compares against the demo account; the real backend MUST do
      // this server-side and must never reveal which field failed beyond the
      // count, to avoid turning the endpoint into an account oracle.
      verifyOwnership: function (payload) {
        payload = payload || {};
        return endpoint(
          function () {
            var u = DB.currentUser || {};
            var matched = [];
            var norm = function (s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, " "); };
            var digits = function (s) { return String(s || "").replace(/\D/g, ""); };
            if (norm(payload.fullName) && norm(payload.fullName) === norm(u.name)) matched.push("fullName");
            if (digits(payload.phone).length >= 8 && digits(payload.phone).slice(-9) === digits(u.phone).slice(-9)) matched.push("phone");
            if (String(payload.password || "").length >= 8) matched.push("password");
            return { verified: matched.length >= 2, matched: matched, matchCount: matched.length, required: 2 };
          },
          "/recovery/ownership/verify",
          { method: "POST", body: payload }
        );
      },

      // GET /recovery/cases?state= -> { items: [...] }
      list: function (filters) {
        filters = filters || {};
        return endpoint(
          function () {
            var items = mockCases().slice();
            if (filters.state) items = items.filter(function (c) { return c.state === filters.state; });
            if (filters.assetType) items = items.filter(function (c) { return c.assetType === filters.assetType; });
            items.sort(function (a, b) { return new Date(b.updatedAt) - new Date(a.updatedAt); });
            return { items: items };
          },
          "/recovery/cases" + qs(filters)
        );
      },

      // GET /recovery/cases/:id -> case
      get: function (id) {
        return endpoint(
          function () {
            var c = mockCases().find(function (x) { return x.id === id || x.trackingId === id; });
            if (!c) { var e = new Error("Recovery case not found"); e.status = 404; throw e; }
            return clone(c);
          },
          "/recovery/cases/" + encodeURIComponent(id)
        );
      },

      // POST /recovery/cases
      //   { assetType, asset, onBehalf, owner: { name, phone },
      //     ownership: { verified, matched },
      //     ownershipDocument: { fileName, mimeType, size, data },
      //     incidentDate, lastSeen,
      //     payment: { method, amount, reference,
      //                proof: { fileName, mimeType, size, data } } }
      //   -> case
      create: function (payload) {
        payload = payload || {};
        return endpoint(
          function () {
            var all = mockCases();
            var now = new Date().toISOString();
            var seq = 456 + all.length;
            var a = payload.asset || {};
            var label = payload.assetType === "vehicle"
              ? [a.manufacturer, a.model, a.year].filter(Boolean).join(" ") + (a.plate ? " · " + a.plate : "")
              : [a.brand, a.model].filter(Boolean).join(" ") + (a.color ? " · " + a.color : "");
            var c = {
              id: "rc-" + seq,
              trackingId: "REC-2026-0" + seq,
              assetType: payload.assetType,
              assetLabel: label || "Asset",
              asset: a,
              stage: payload.payment ? "payment_submitted" : "ownership_verified",
              state: "active",
              onBehalf: !!payload.onBehalf,
              owner: payload.owner || {},
              submittedBy: (DB.currentUser || {}).name || "You",
              incidentDate: payload.incidentDate || "",
              lastSeen: payload.lastSeen || "",
              payment: payload.payment ? {
                method: payload.payment.method,
                amount: payload.payment.amount,
                reference: payload.payment.reference,
                status: "pending",
                proofFileName: (payload.payment.proof || {}).fileName || "",
                submittedAt: now,
                reviewedAt: null,
              } : null,
              caseFile: null,
              eta: null,
              location: null,
              createdAt: now,
              updatedAt: now,
              timeline: [{ stage: "ownership_verified", at: now, note: payload.onBehalf
                ? "Filed on behalf of the owner — two of three ownership fields matched the owner's VARNIS account."
                : "Two of three ownership fields matched the VARNIS account on file.", actor: "VARNIS" }],
              evidenceRequests: [],
              documents: [],
            };
            if (payload.ownershipDocument && payload.ownershipDocument.fileName) {
              c.documents.push({ name: payload.ownershipDocument.fileName, kind: "Ownership document", uploadedAt: now });
            }
            if (c.payment) {
              c.timeline.push({ stage: "payment_submitted", at: now, note: c.payment.method + " · " + c.payment.amount + " FCFA · awaiting confirmation.", actor: c.submittedBy });
              if (c.payment.proofFileName) c.documents.push({ name: c.payment.proofFileName, kind: "Proof of payment", uploadedAt: now });
            }
            all.unshift(c);
            saveCases(all);
            return clone(c);
          },
          "/recovery/cases",
          { method: "POST", body: payload }
        );
      },

      // POST /recovery/cases/:id/payment
      //   { method, amount, reference, proof: { fileName, mimeType, size, data } }
      submitPayment: function (id, payload) {
        return endpoint(
          function () {
            var all = mockCases();
            var c = all.find(function (x) { return x.id === id || x.trackingId === id; });
            if (!c) { var e = new Error("Recovery case not found"); e.status = 404; throw e; }
            var now = new Date().toISOString();
            c.payment = {
              method: payload.method, amount: payload.amount, reference: payload.reference,
              status: "pending", proofFileName: (payload.proof || {}).fileName || "",
              submittedAt: now, reviewedAt: null,
            };
            c.stage = "payment_submitted";
            c.updatedAt = now;
            c.timeline.push({ stage: "payment_submitted", at: now, note: payload.method + " · awaiting confirmation.", actor: "You" });
            saveCases(all);
            return clone(c);
          },
          "/recovery/cases/" + encodeURIComponent(id) + "/payment",
          { method: "POST", body: payload }
        );
      },

      // POST /recovery/cases/:id/evidence
      //   { requestId, note, files: [{ fileName, mimeType, size, data }] }
      // Answers an authority's request for more documents WITHOUT opening a
      // new case — the files attach to the existing one.
      submitEvidence: function (id, payload) {
        payload = payload || {};
        return endpoint(
          function () {
            var all = mockCases();
            var c = all.find(function (x) { return x.id === id || x.trackingId === id; });
            if (!c) { var e = new Error("Recovery case not found"); e.status = 404; throw e; }
            var now = new Date().toISOString();
            var req = (c.evidenceRequests || []).find(function (r) { return r.id === payload.requestId; });
            var files = (payload.files || []).map(function (f) { return { name: f.fileName, uploadedAt: now }; });
            if (req) { req.status = "submitted"; req.files = (req.files || []).concat(files); }
            c.documents = (c.documents || []).concat(files.map(function (f) { return { name: f.name, kind: "Additional evidence", uploadedAt: now }; }));
            c.updatedAt = now;
            c.timeline.push({ stage: "under_investigation", at: now, note: "Additional evidence supplied (" + files.length + " file" + (files.length === 1 ? "" : "s") + ").", actor: "You" });
            saveCases(all);
            return clone(c);
          },
          "/recovery/cases/" + encodeURIComponent(id) + "/evidence",
          { method: "POST", body: payload }
        );
      },

      // ---- Moderator / admin ----
      // PATCH /recovery/cases/:id/payment  { decision: "approve"|"reject", note? }
      reviewPayment: function (id, decision, note) {
        return endpoint(
          function () {
            var all = mockCases();
            var c = all.find(function (x) { return x.id === id || x.trackingId === id; });
            if (!c) { var e = new Error("Recovery case not found"); e.status = 404; throw e; }
            var now = new Date().toISOString();
            c.payment.status = decision === "approve" ? "approved" : "rejected";
            c.payment.reviewedAt = now;
            c.updatedAt = now;
            if (decision === "approve") {
              c.stage = "payment_approved";
              c.timeline.push({ stage: "payment_approved", at: now, note: note || "Payment reference confirmed.", actor: "VARNIS Finance" });
            } else {
              c.timeline.push({ stage: "payment_submitted", at: now, note: note || "Payment could not be confirmed. Re-upload the proof.", actor: "VARNIS Finance" });
            }
            saveCases(all);
            return clone(c);
          },
          "/recovery/cases/" + encodeURIComponent(id) + "/payment",
          { method: "PATCH", body: { decision: decision, note: note || null } }
        );
      },

      // PATCH /recovery/cases/:id/stage  { stage, note }
      advance: function (id, stage, note) {
        return endpoint(
          function () {
            var all = mockCases();
            var c = all.find(function (x) { return x.id === id || x.trackingId === id; });
            if (!c) { var e = new Error("Recovery case not found"); e.status = 404; throw e; }
            var now = new Date().toISOString();
            c.stage = stage;
            c.updatedAt = now;
            if (stage === "closed") c.state = "closed";
            c.timeline.push({ stage: stage, at: now, note: note || "", actor: "VARNIS" });
            saveCases(all);
            return clone(c);
          },
          "/recovery/cases/" + encodeURIComponent(id) + "/stage",
          { method: "PATCH", body: { stage: stage, note: note || null } }
        );
      },

      // POST /recovery/cases/:id/evidence-requests  { message, dueAt }
      requestEvidence: function (id, payload) {
        payload = payload || {};
        return endpoint(
          function () {
            var all = mockCases();
            var c = all.find(function (x) { return x.id === id || x.trackingId === id; });
            if (!c) { var e = new Error("Recovery case not found"); e.status = 404; throw e; }
            var now = new Date().toISOString();
            c.evidenceRequests = (c.evidenceRequests || []).concat([{
              id: "ev-" + Date.now(), requestedAt: now, requestedBy: payload.requestedBy || "VARNIS",
              message: payload.message || "", dueAt: payload.dueAt || null, status: "pending", files: [],
            }]);
            c.stage = "evidence_requested";
            c.updatedAt = now;
            c.timeline.push({ stage: "evidence_requested", at: now, note: payload.message || "", actor: payload.requestedBy || "VARNIS" });
            saveCases(all);
            return clone(c);
          },
          "/recovery/cases/" + encodeURIComponent(id) + "/evidence-requests",
          { method: "POST", body: payload }
        );
      },
    },

    /* ---------------- Global search (topbar) ---------------- */
    // GET /search?q=<query>  -> { results: [{ type, id, title, subtitle, href? }] }
    // Powers the search bar on every page. `type` is one of:
    //   report | alert | course | lesson | community | user | page
    // When `href` is present the frontend navigates to it directly; otherwise
    // the destination is derived from `type` + `id` (e.g. report ->
    // report-detail.html?id=<id>). Backends may search whatever collections
    // the signed-in role is allowed to see (e.g. `user` results are
    // moderator/admin only).
    search: {
      global: function (q) {
        q = String(q == null ? "" : q).trim();
        if (!q) return Promise.resolve({ results: [] });
        if (window.VarnisValidation) q = window.VarnisValidation.sanitizeInput(q, 120);
        return endpoint(
          function () {
            var needle = q.toLowerCase();
            function hit(text) { return String(text || "").toLowerCase().indexOf(needle) !== -1; }
            var out = [];
            (DB.reports || []).forEach(function (r) {
              if (hit(r.title) || hit(r.trackingId) || hit(r.category) || hit(r.district)) {
                out.push({ type: "report", id: r.id, title: r.title, subtitle: (r.trackingId || r.id) + " · " + String(r.status || "").replace(/_/g, " ") });
              }
            });
            (DB.alerts || []).forEach(function (a) {
              if (hit(a.title) || hit(a.category) || hit(a.message)) {
                out.push({ type: "alert", id: a.id, title: a.title, subtitle: (a.severity ? a.severity + " · " : "") + (a.category || "Alert") });
              }
            });
            (DB.courses || []).forEach(function (c) {
              if (hit(c.title) || hit(c.description)) {
                out.push({ type: "course", id: c.id, title: c.title, subtitle: "Course" + (typeof c.progressPct === "number" ? " · " + c.progressPct + "%" : "") });
              }
            });
            (DB.lessons || []).forEach(function (l) {
              if ((l.status || "published") === "published" && (hit(l.title) || hit(l.topic) || hit(l.summary))) {
                out.push({ type: "lesson", id: l.id, title: l.title, subtitle: "Lesson" + (l.level ? " · " + l.level : "") });
              }
            });
            (DB.communityPosts || []).forEach(function (p) {
              if (hit(p.title) || hit(p.body) || hit(p.author)) {
                out.push({ type: "community", id: p.id, title: p.title, subtitle: "Community" + (p.author ? " · " + p.author : "") });
              }
            });
            return { results: out.slice(0, 12) };
          },
          "/search?q=" + encodeURIComponent(q)
        );
      },
    },

    /* ---------------- Auth ---------------- */
    auth: {
      // POST /auth/login  { identifier, password } -> { token, refreshToken, user }
      login: function (email, password) {
        if (window.VarnisValidation) {
          var v = window.VarnisValidation.validateLogin(email, password);
          if (!v.valid) {
            var err = new Error("Login validation failed: " + v.errors.join(" • "));
            err.status = 400;
            err.validationErrors = v.errors;
            return Promise.reject(err);
          }
          email = v.sanitized.identifier;
          password = v.sanitized.password;
        }
        return endpoint(
          function () {
            return { token: "mock-token-" + Date.now(), refreshToken: "mock-refresh-" + Date.now(), user: clone(DB.currentUser || {}) };
          },
          "/auth/login",
          { method: "POST", body: { identifier: email, password: password } }
        ).then(persistAuth);
      },

      // POST /auth/register
      //   { name, email, phone, password, otpChannel: "email"|"phone",
      //     idCard: { fileName, mimeType, size, data (base64 data URL) } }
      //   -> { token, user, otpRequired }
      // The ID card is captured at registration for identity verification;
      // the backend should persist it and (optionally) gate account approval
      // on manual/automated review.
      // otpChannel: set by register.html — "email" whenever the user gave
      // one, "phone" only when they didn't. No SMS gateway exists yet, so
      // until one is wired up the backend should send the verification code
      // by email regardless of this value if it ever receives "phone" for a
      // user who also has an email on file (belt-and-suspenders — the
      // frontend already defaults to email, this just guards the API layer
      // against a stale client doing the wrong thing).
      register: function (payload) {
        payload = payload || {};
        return endpoint(
          function () {
            return { otpRequired: true, pendingId: "mock-pending-" + Date.now(), user: { name: payload.name, email: payload.email, phone: payload.phone } };
          },
          "/auth/register",
          { method: "POST", body: payload }
        );
      },

// POST /auth/otp/verify  { pendingId, code } -> { access, refresh, user }
      verifyOtp: function (pendingId, code) {
        return endpoint(
          function () {
            return { token: "mock-token-" + Date.now(), refreshToken: "mock-refresh-" + Date.now(), user: clone(DB.currentUser || {}) };
          },
          "/auth/otp/verify",
          { method: "POST", body: { pendingId: pendingId, code: code } }
        ).then(persistAuth);
      },
      // POST /auth/otp/resend  { pendingId } -> { ok }
      resendOtp: function (pendingId, identifier) {
        return endpoint(function () { return { ok: true }; }, "/auth/otp/resend", { method: "POST", body: { pendingId: pendingId } });
      },

      // OAuth 2.0 (Google, SRS FR-02). The backend owns the handshake; the
      // frontend hands off to it and the backend redirects back with a token.
      googleStartUrl: function () {
        var base = (cfg().API_BASE_URL || "/api/v1").replace(/\/$/, "");
        var path = cfg().GOOGLE_OAUTH_START_PATH || "/auth/google";
        var redirect = encodeURIComponent(location.origin + location.pathname.replace(/[^/]+$/, "") + "index.html");
        return base + path + "?redirect_uri=" + redirect;
      },
      google: function () {
        if (cfg().USE_MOCKS) {
          // Demo: emulate a successful OAuth round-trip.
          return delay(cfg().MOCK_LATENCY_MS || 0).then(function () {
            return persistAuth({ token: "mock-oauth-" + Date.now(), refreshToken: "mock-refresh-" + Date.now(), user: clone(DB.currentUser || {}) });
          });
        }
        location.href = API.auth.googleStartUrl();
        return Promise.resolve({ redirecting: true });
      },

      // POST /auth/refresh  { refreshToken } -> { token, refreshToken }
      refresh: function () {
        var refresh = window.VarnisStore ? window.VarnisStore.getRefreshToken() : null;
        return endpoint(
          function () { return { token: "mock-token-" + Date.now(), refreshToken: refresh || "mock-refresh" }; },
          cfg().AUTH_REFRESH_PATH || "/auth/refresh",
          { method: "POST", body: { refreshToken: refresh } }
        ).then(function (res) {
          if (res && res.token && window.VarnisStore) {
            window.VarnisStore.setToken(res.token);
            if (res.refreshToken) window.VarnisStore.setRefreshToken(res.refreshToken);
          }
          return res;
        });
      },

      logout: function () {
        var done = function () {
          if (window.VarnisStore) window.VarnisStore.clearAuth();
          else { try { window.localStorage.removeItem(cfg().AUTH_TOKEN_KEY || "varnis_token"); } catch (e) {} }
          return { ok: true };
        };
        if (cfg().USE_MOCKS) return Promise.resolve(done());
        // Best-effort server logout, then always clear locally.
        return request("/auth/logout", { method: "POST" }).then(done, done);
      },
    },

    // ---- User preferences (settings + AI personalization) ----------------
    // GET  /users/me/preferences -> preferences JSON
    // PUT  /users/me/preferences  { ...preferences } -> preferences JSON
    preferences: {
      get: function () {
        return endpoint(
          function () { return window.VarnisStore ? window.VarnisStore.getPreferences() : {}; },
          "/users/me/preferences"
        );
      },
      update: function (prefs) {
        return endpoint(
          function () {
            var next = window.VarnisStore ? window.VarnisStore.mergePreferences(prefs) : prefs;
            return next;
          },
          "/users/me/preferences",
          { method: "PUT", body: prefs }
        ).then(function (saved) {
          if (window.VarnisStore && saved) window.VarnisStore.setPreferences(saved);
          return saved;
        });
      },
    },

    // ---- AI services (lesson generation + recommendations) ---------------
    // These route to AI_BASE_URL when set, otherwise the REST API base.
    ai: {
      // POST /ai/ask
      //   { question, history: [{ role: "user"|"assistant", content }], language }
      //   -> { answer, suggestions?: [string] }
      // The in-app assistant (assistant.html). `history` carries the last few
      // turns so the backend can answer with conversational context.
      ask: function (question, opts) {
        opts = opts || {};
        if (!(cfg().AI && cfg().AI.ENABLED && cfg().AI.ASSISTANT !== false)) {
          return Promise.reject(new Error("The AI assistant is disabled."));
        }
        question = String(question == null ? "" : question).trim();
        if (!question) return Promise.reject(new Error("Please type a question."));
        if (window.VarnisValidation) {
          var malQ = window.VarnisValidation.detectMaliciousInput(question);
          if (malQ.isMalicious) return Promise.reject(new Error("Your question contains suspicious patterns. Please rephrase it."));
          question = window.VarnisValidation.sanitizeInput(question, 2000);
        }
        var lang = opts.language || (window.getCurrentLanguage ? window.getCurrentLanguage() : "en");
        var history = (opts.history || []).slice(-10);
        return endpoint(
          function () {
            var m = question.toLowerCase();
            function a(answer, suggestions) { return { answer: answer, suggestions: suggestions || [] }; }
            if (/phish|hameçonnage|suspicious (link|email|sms)|lien suspect/.test(m)) {
              return a("Phishing messages imitate a bank, MTN/Orange, or an official service to make you click a link or share a code. Check the sender address carefully, hover the link to see the real destination, and never enter a password or OTP from a link you didn't request. If you received one, report it from Report Incident so analysts can track the campaign.", ["How do I report a phishing message?", "What is smishing?", "How do I check if a link is safe?"]);
            }
            if (/momo|mobile money|orange money|mtn|pin\b/.test(m)) {
              return a("MTN, Orange and banks NEVER ask for your PIN or OTP by call or SMS. A caller creating urgency ('your account will be blocked') is the classic sign of MoMo fraud. Hang up, dial the operator's official number yourself, and report the fraudulent number on VARNIS — every report helps protect others.", ["Report MoMo fraud", "What if I already shared my PIN?", "How do scammers spoof numbers?"]);
            }
            if (/password|mot de passe|2fa|two.?factor|double authentification/.test(m)) {
              return a("Use a long passphrase (4+ random words), a different one per account, and turn on two-step verification wherever it's offered — it blocks most account-takeover attempts even if your password leaks. A password manager makes this practical.", ["Is SMS 2FA safe?", "How often should I change passwords?", "What is a password manager?"]);
            }
            if (/hack|hacked|piraté|compromis|account (stolen|taken)/.test(m)) {
              return a("If you suspect your account is compromised: from a safe device, change the password immediately, enable two-step verification, sign out all sessions, and check recovery email/phone for changes. Then file a report on VARNIS so the incident is tracked.", ["Report account hacking", "How do I secure my email first?", "Signs my phone is compromised"]);
            }
            if (/report|signaler|incident|tracking|suivi/.test(m)) {
              return a("You can file a report in under two minutes from Report Incident: pick the category, describe what happened, and attach evidence (screenshots help a lot). You'll get a tracking ID like VAR-942-01A and can follow its status — Pending, In Review, Approved or Resolved — in My Reports.", ["What happens after I submit?", "Can I report anonymously?", "What counts as evidence?"]);
            }
            if (/certificat|badge|qr/.test(m)) {
              return a("Certificates are earned by completing a course and passing its quiz. Each one is QR-verifiable: anyone can confirm authenticity on the public verification page using the certificate ID — useful for employers and schools.", ["How do I earn my first certificate?", "Where is the verification page?"]);
            }
            if (/wifi|wi-fi|public network|vpn|cyber ?café/.test(m)) {
              return a("On public Wi-Fi (cybercafés, hotels), avoid logging into banking or MoMo apps, prefer mobile data for sensitive actions, and make sure sites use https. A reputable VPN adds a layer of protection, but the safest habit is simply not doing sensitive transactions on shared networks.", ["Is my home Wi-Fi safe?", "How do I spot a fake hotspot?"]);
            }
            if (/lesson|learn|course|apprendre|cours|xp|streak/.test(m)) {
              return a("The Learn section has short, localised lessons with quizzes — phishing, MoMo fraud, safe browsing and more. Daily challenges give bonus XP and keep your streak alive, and finished courses earn QR-verifiable certificates.", ["Recommend a lesson for me", "What is the daily challenge?"]);
            }
            if (/hello|hi\b|bonjour|salut|good (morning|afternoon|evening)/.test(m)) {
              return a("Hello! I'm the VARNIS assistant. Ask me anything about online scams, protecting your accounts, or how to use the platform — reporting incidents, lessons, certificates and more.", ["How do I spot a phishing message?", "Someone asked for my MoMo PIN", "How do I report an incident?"]);
            }
            return a("Here's what I can help with: recognising scams (phishing, MoMo fraud, fake calls), securing your accounts and devices, and using VARNIS — reporting incidents, tracking reports, lessons and certificates. Could you tell me a bit more about your situation?", ["How do I spot a phishing message?", "Secure my accounts", "How does reporting work?"]);
          },
          "/ai/ask",
          { method: "POST", aiBase: true, body: { question: question, history: history, language: lang } }
        );
      },

      // POST /ai/lessons/generate  { topic, level, language, interests } -> lesson JSON
      generateLesson: function (opts) {
        opts = opts || {};
        if (!(cfg().AI && cfg().AI.ENABLED && cfg().AI.LESSON_GENERATION)) {
          return Promise.reject(new Error("AI lesson generation is disabled."));
        }
        var lang = opts.language || (cfg().AI && cfg().AI.DEFAULT_LANGUAGE) || "en";
        if (lang === "auto") lang = window.getCurrentLanguage ? window.getCurrentLanguage() : "en";
        return endpoint(
          function () {
            var topic = opts.topic || "Cyber Safety Basics";
            return {
              id: "ai-lesson-" + Date.now(),
              generated: true,
              topic: topic,
              level: opts.level || "beginner",
              language: lang,
              title: topic,
              summary: "An AI-generated lesson tailored to your level and interests.",
              sections: [
                { heading: "Why this matters", body: "A short, localised explanation of the threat and who it targets in Cameroon." },
                { heading: "How to spot it", body: "Concrete red flags and real examples." },
                { heading: "What to do", body: "Step-by-step actions, including how to report on VARNIS." }
              ],
              quiz: [
                { q: "Sample question generated for " + topic + "?", options: ["Yes", "No"], answer: 0 }
              ],
              model: (cfg().AI && cfg().AI.DEFAULT_MODEL) || "auto"
            };
          },
          "/ai/lessons/generate",
          { method: "POST", aiBase: true, body: { topic: opts.topic, level: opts.level, language: lang, interests: opts.interests || [] } }
        );
      },

      // POST /ai/lessons/recommend  { userId?, interests?, history? } -> { items: [...] }
      recommendLessons: function (opts) {
        opts = opts || {};
        if (!(cfg().AI && cfg().AI.ENABLED && cfg().AI.RECOMMENDATIONS)) {
          return Promise.resolve({ items: [] });
        }
        return endpoint(
          function () {
            var courses = clone(DB.courses || []);
            return { items: courses.slice(0, 3).map(function (c) { return { id: c.id, title: c.title, reason: "Recommended based on your recent activity." }; }) };
          },
          "/ai/lessons/recommend",
          { method: "POST", aiBase: true, body: { interests: opts.interests || [], history: opts.history || [] } }
        );
      },

      // GET  /ai/preferences -> AI personalization JSON
      // PUT  /ai/preferences  { ... } -> AI personalization JSON
      getPersonalization: function () {
        return endpoint(
          function () { var p = window.VarnisStore ? window.VarnisStore.getPreferences() : {}; return p.ai || {}; },
          "/ai/preferences",
          { aiBase: true }
        );
      },
      setPersonalization: function (ai) {
        return endpoint(
          function () { return window.VarnisStore ? window.VarnisStore.mergePreferences({ ai: ai }).ai : ai; },
          "/ai/preferences",
          { method: "PUT", aiBase: true, body: ai }
        );
      },
    },

    // ---- Translation (real machine-translation service) ------------------
    // Curated UI strings stay in i18n.js; this translates DYNAMIC content
    // via a real API (LibreTranslate by default, or your backend proxy).
    // Results are cached as JSON in VarnisStore so repeated strings are free.
    i18n: {
      // translate(text, { from, to }) -> Promise<string>
      translate: function (text, opts) {
        opts = opts || {};
        var to = opts.to || (window.getCurrentLanguage ? window.getCurrentLanguage() : "en");
        var from = opts.from || "auto";
        text = String(text == null ? "" : text);
        if (!text.trim()) return Promise.resolve(text);

        var tcfg = cfg().TRANSLATION || {};
        if (!tcfg.ENABLED) return Promise.resolve(text);

        var cacheKey = "tr:" + to + ":" + from + ":" + text;
        if (tcfg.CACHE && window.VarnisStore) {
          var hit = window.VarnisStore.get(cacheKey, null);
          if (hit != null) return Promise.resolve(hit);
        }

        var p;
        if (tcfg.PROVIDER === "backend") {
          p = request(tcfg.BACKEND_PATH || "/i18n/translate", {
            method: "POST", body: { q: text, source: from, target: to },
          }).then(function (r) { return (r && (r.translatedText || r.text)) || text; });
        } else {
          var base = (tcfg.LIBRETRANSLATE_URL || "https://libretranslate.com").replace(/\/$/, "");
          var body = { q: text, source: from, target: to, format: "text" };
          if (tcfg.LIBRETRANSLATE_API_KEY) body.api_key = tcfg.LIBRETRANSLATE_API_KEY;
          p = fetch(base + "/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(body),
          }).then(function (res) {
            if (!res.ok) throw new Error("translate failed " + res.status);
            return res.json();
          }).then(function (data) { return (data && data.translatedText) || text; });
        }

        return p.then(function (translated) {
          if (tcfg.CACHE && window.VarnisStore) window.VarnisStore.set(cacheKey, translated);
          return translated;
        }).catch(function () { return text; });
      },

      // translateBatch(texts[], { from, to }) -> Promise<string[]>
      translateBatch: function (texts, opts) {
        return Promise.all((texts || []).map(function (t) { return window.VarnisAPI.i18n.translate(t, opts); }));
      },

      // languages() -> supported language list
      languages: function () {
        var tcfg = cfg().TRANSLATION || {};
        var base = (tcfg.LIBRETRANSLATE_URL || "https://libretranslate.com").replace(/\/$/, "");
        return fetch(base + "/languages").then(function (r) { return r.json(); }).catch(function () { return []; });
      },
    },
  };

  /** Persist an auth response ({ token, refreshToken, user }) via the store. */
  function persistAuth(res) {
    // TODO verify against a real login response: the OpenAPI spec's
    // AuthSuccessResponse.data is untyped (additionalProperties: {}), so the
    // exact key names inside it aren't pinned down. This accepts either the
    // SimpleJWT-standard names (access/refresh) or the frontend's original
    // names (token/refreshToken) — check the actual network response in
    // devtools once /auth/login/ is live and simplify this once confirmed.
    if (res && window.VarnisStore) {
      var access = res.access || res.token;
      var refresh = res.refresh || res.refreshToken;
      if (access) window.VarnisStore.setToken(access);
      if (refresh) window.VarnisStore.setRefreshToken(refresh);
      if (res.user) window.VarnisStore.setUser(res.user);
    }
    return res;
  }
})();
