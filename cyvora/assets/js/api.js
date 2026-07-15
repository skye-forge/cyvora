/**
 * Cyvora — API client
 * ------------------------------------------------------------
 * Every screen talks to the backend ONLY through window.CyvoraAPI.
 * No page ever calls fetch() directly — that keeps one seam to
 * update when the real backend comes online, instead of dozens.
 *
 * Today, with CyvoraConfig.USE_MOCKS = true, every method resolves
 * with data from mock-data.js (plus a tiny artificial delay) so the
 * whole site works with no backend at all.
 *
 * To go live:
 *   1. Set CyvoraConfig.USE_MOCKS = false (config.js), or run with
 *      ?live=1 in the URL.
 *   2. Point CyvoraConfig.API_BASE_URL at the real API.
 *   3. Implement the REST endpoints listed in BACKEND.md with the
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
    return window.CyvoraConfig || { API_BASE_URL: "/api/v1", USE_MOCKS: true, MOCK_LATENCY_MS: 250 };
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

  function authToken() {
    if (window.CyvoraStore) return window.CyvoraStore.getToken();
    try { return window.localStorage.getItem(cfg().AUTH_TOKEN_KEY || "cyvora_token"); } catch (e) { return null; }
  }

  /** Low-level fetch wrapper: auth header, JSON, timeout, error shape, and
   *  one automatic token refresh on 401 when configured. */
  async function request(path, options) {
    return requestOnce(path, options, true);
  }

  async function requestOnce(path, options, allowRefresh) {
    options = options || {};
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
      var err = new Error((payload && payload.message) || ("Request failed with status " + res.status));
      err.status = res.status;
      err.body = payload;
      throw err;
    }
    return payload;
  }

  /** POST the refresh token; on success store the new access token. */
  async function tryRefresh() {
    var refresh = window.CyvoraStore ? window.CyvoraStore.getRefreshToken() : null;
    if (!refresh) return false;
    try {
      var url = resolveUrl(cfg().AUTH_REFRESH_PATH || "/auth/refresh", false);
      var res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      var data = await res.json();
      if (data && data.token && window.CyvoraStore) {
        window.CyvoraStore.setToken(data.token);
        if (data.refreshToken) window.CyvoraStore.setRefreshToken(data.refreshToken);
        return true;
      }
    } catch (e) { /* fall through */ }
    return false;
  }

  /** Wraps a mock resolver + a real request() call behind one switch. */
  function endpoint(mockFn, path, options) {
    if (cfg().USE_MOCKS) {
      return delay(cfg().MOCK_LATENCY_MS || 0).then(mockFn);
    }
    return request(path, options);
  }

  var DB = window.CyvoraMockData || {};

  window.CyvoraAPI = {
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
        if (window.CyvoraValidation) {
          var v = window.CyvoraValidation.validateReport(payload);
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
                trackingId: "CYV-" + Math.floor(Math.random() * 900 + 100) + "-" + Math.floor(Math.random() * 90 + 10) + "X",
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
        if (window.CyvoraValidation) {
          var v = window.CyvoraValidation.validateAlert(payload);
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
        if (window.CyvoraValidation) {
          var v = window.CyvoraValidation.validateProfileUpdate(payload);
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
        if (window.CyvoraValidation) {
          var v = window.CyvoraValidation.validateCommunityPost(payload);
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
      // GET /api/v1/notifications
      list: function () {
        return endpoint(
          function () { return { items: clone(DB.notifications || []) }; },
          "/notifications"
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
        if (window.CyvoraValidation) {
          var mal = window.CyvoraValidation.detectMaliciousInput
            ? window.CyvoraValidation.detectMaliciousInput(message)
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
              return r("Every report gets a tracking ID (like CYV-942-01A). You can follow its status — Pending, In Review, Approved or Resolved — from My Reports.", { href: "my-reports.html", label: "Open My Reports" });
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
              return r("I've flagged this conversation for a human agent — expected wait is under 3 minutes during business hours (08:00–18:00 WAT). You can also email support@cyvora.cm.");
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
    },

    /* ---------------- Auth ---------------- */
    auth: {
      // POST /auth/login  { identifier, password } -> { token, refreshToken, user }
      login: function (email, password) {
        if (window.CyvoraValidation) {
          var v = window.CyvoraValidation.validateLogin(email, password);
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

      // POST /auth/register  { name, email, phone, password } -> { token, user, otpRequired }
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

      // POST /auth/otp/verify  { pendingId|identifier, code } -> { token, refreshToken, user }
      verifyOtp: function (identifier, code) {
        return endpoint(
          function () {
            return { token: "mock-token-" + Date.now(), refreshToken: "mock-refresh-" + Date.now(), user: clone(DB.currentUser || {}) };
          },
          "/auth/otp/verify",
          { method: "POST", body: { identifier: identifier, code: code } }
        ).then(persistAuth);
      },

      // POST /auth/otp/resend  { identifier } -> { ok }
      resendOtp: function (identifier) {
        return endpoint(function () { return { ok: true }; }, "/auth/otp/resend", { method: "POST", body: { identifier: identifier } });
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
        var refresh = window.CyvoraStore ? window.CyvoraStore.getRefreshToken() : null;
        return endpoint(
          function () { return { token: "mock-token-" + Date.now(), refreshToken: refresh || "mock-refresh" }; },
          cfg().AUTH_REFRESH_PATH || "/auth/refresh",
          { method: "POST", body: { refreshToken: refresh } }
        ).then(function (res) {
          if (res && res.token && window.CyvoraStore) {
            window.CyvoraStore.setToken(res.token);
            if (res.refreshToken) window.CyvoraStore.setRefreshToken(res.refreshToken);
          }
          return res;
        });
      },

      logout: function () {
        var done = function () {
          if (window.CyvoraStore) window.CyvoraStore.clearAuth();
          else { try { window.localStorage.removeItem(cfg().AUTH_TOKEN_KEY || "cyvora_token"); } catch (e) {} }
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
          function () { return window.CyvoraStore ? window.CyvoraStore.getPreferences() : {}; },
          "/users/me/preferences"
        );
      },
      update: function (prefs) {
        return endpoint(
          function () {
            var next = window.CyvoraStore ? window.CyvoraStore.mergePreferences(prefs) : prefs;
            return next;
          },
          "/users/me/preferences",
          { method: "PUT", body: prefs }
        ).then(function (saved) {
          if (window.CyvoraStore && saved) window.CyvoraStore.setPreferences(saved);
          return saved;
        });
      },
    },

    // ---- AI services (lesson generation + recommendations) ---------------
    // These route to AI_BASE_URL when set, otherwise the REST API base.
    ai: {
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
          function () { var p = window.CyvoraStore ? window.CyvoraStore.getPreferences() : {}; return p.ai || {}; },
          "/ai/preferences",
          { aiBase: true }
        );
      },
      setPersonalization: function (ai) {
        return endpoint(
          function () { return window.CyvoraStore ? window.CyvoraStore.mergePreferences({ ai: ai }).ai : ai; },
          "/ai/preferences",
          { method: "PUT", aiBase: true, body: ai }
        );
      },
    },

    // ---- Translation (real machine-translation service) ------------------
    // Curated UI strings stay in i18n.js; this translates DYNAMIC content
    // via a real API (LibreTranslate by default, or your backend proxy).
    // Results are cached as JSON in CyvoraStore so repeated strings are free.
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
        if (tcfg.CACHE && window.CyvoraStore) {
          var hit = window.CyvoraStore.get(cacheKey, null);
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
          if (tcfg.CACHE && window.CyvoraStore) window.CyvoraStore.set(cacheKey, translated);
          return translated;
        }).catch(function () { return text; });
      },

      // translateBatch(texts[], { from, to }) -> Promise<string[]>
      translateBatch: function (texts, opts) {
        return Promise.all((texts || []).map(function (t) { return window.CyvoraAPI.i18n.translate(t, opts); }));
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
    if (res && window.CyvoraStore) {
      if (res.token) window.CyvoraStore.setToken(res.token);
      if (res.refreshToken) window.CyvoraStore.setRefreshToken(res.refreshToken);
      if (res.user) window.CyvoraStore.setUser(res.user);
    }
    return res;
  }
})();
