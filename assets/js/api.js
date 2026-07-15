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

  /** Low-level fetch wrapper: auth header, JSON parsing, error shape. */
  async function request(path, options) {
    options = options || {};
    var base = cfg().API_BASE_URL.replace(/\/$/, "");
    var url = /^https?:\/\//.test(path) ? path : base + path;
    var token = null;
    try { token = window.localStorage.getItem(cfg().AUTH_TOKEN_KEY || "cyvora_token"); } catch (e) { /* storage unavailable */ }

    var headers = Object.assign(
      { "Content-Type": "application/json", Accept: "application/json" },
      token ? { Authorization: "Bearer " + token } : {},
      options.headers || {}
    );

    var res;
    try {
      res = await fetch(url, {
        method: options.method || "GET",
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (networkErr) {
      var offlineErr = new Error("Network error contacting " + url);
      offlineErr.cause = networkErr;
      throw offlineErr;
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
      // PATCH /api/v1/learning/courses/:id  { progressPct }
      updateProgress: function (id, progressPct) {
        return endpoint(
          function () {
            var found = (DB.courses || []).find(function (c) { return c.id === id; });
            if (found) {
              found.progressPct = progressPct;
              found.status = progressPct >= 100 ? "completed" : "in_progress";
            }
            return clone(found);
          },
          "/learning/courses/" + id,
          { method: "PATCH", body: { progressPct: progressPct } }
        );
      },
    },

    /* ---------------- Auth ---------------- */
    auth: {
      // POST /api/v1/auth/login  { email, password } -> { token, user }
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
            return { token: "mock-token-" + Date.now(), user: clone(DB.currentUser || {}) };
          },
          "/auth/login",
          { method: "POST", body: { email: email, password: password } }
        );
      },
      logout: function () {
        try { window.localStorage.removeItem(cfg().AUTH_TOKEN_KEY || "cyvora_token"); } catch (e) {}
        return Promise.resolve({ ok: true });
      },
    },
  };
})();
