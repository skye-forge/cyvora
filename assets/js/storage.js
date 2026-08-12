/**
 * VARNIS — client storage (JSON)
 * ------------------------------------------------------------
 * One place for all browser persistence. Everything is stored as JSON so
 * client state maps 1:1 to what the backend sends/receives — no ad-hoc
 * string keys scattered across the app.
 *
 * Usage:
 *   VarnisStore.set("settings", { lang: "fr", ... });   // JSON-serialized
 *   VarnisStore.get("settings", {});                      // parsed, with default
 *   VarnisStore.remove("settings");
 *   VarnisStore.setToken(tok) / getToken() / clearAuth();
 *   VarnisStore.getPreferences() / setPreferences(obj);   // AI/user prefs
 *
 * All methods are safe when storage is unavailable (private mode, file://):
 * reads return the default, writes are no-ops.
 */
(function () {
  "use strict";

  var NS = "varnis:"; // namespace so keys are easy to find/clear

  function cfg() { return window.VarnisConfig || {}; }
  function raw() { try { return window.localStorage; } catch (e) { return null; } }

  function usable() {
    var ls = raw();
    if (!ls) return false;
    try { ls.setItem(NS + "__probe__", "1"); ls.removeItem(NS + "__probe__"); return true; }
    catch (e) { return false; }
  }

  /** Namespaced JSON get with a default. */
  function get(key, dflt) {
    var ls = raw();
    if (!ls) return dflt;
    try {
      var v = ls.getItem(NS + key);
      if (v == null) return dflt;
      return JSON.parse(v);
    } catch (e) { return dflt; }
  }

  /** Namespaced JSON set. Returns true on success. */
  function set(key, value) {
    var ls = raw();
    if (!ls) return false;
    try { ls.setItem(NS + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function remove(key) {
    var ls = raw();
    if (!ls) return;
    try { ls.removeItem(NS + key); } catch (e) { /* ignore */ }
  }

  /** Clear only VARNIS-namespaced keys. */
  function clearAll() {
    var ls = raw();
    if (!ls) return;
    try {
      var toRemove = [];
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && (k.indexOf(NS) === 0 || k.indexOf("varnis_") === 0)) toRemove.push(k);
      }
      toRemove.forEach(function (k) { ls.removeItem(k); });
    } catch (e) { /* ignore */ }
  }

  // ---- Auth tokens (kept under the config-defined keys so api.js and
  //      auth-guard.js can read them directly) -----------------------------
  function getToken() {
    var ls = raw(); if (!ls) return null;
    try { return ls.getItem(cfg().AUTH_TOKEN_KEY || "varnis_token"); } catch (e) { return null; }
  }
  function setToken(tok) {
    var ls = raw(); if (!ls) return;
    try { ls.setItem(cfg().AUTH_TOKEN_KEY || "varnis_token", tok); } catch (e) { /* ignore */ }
  }
  function getRefreshToken() {
    var ls = raw(); if (!ls) return null;
    try { return ls.getItem(cfg().REFRESH_TOKEN_KEY || "varnis_refresh"); } catch (e) { return null; }
  }
  function setRefreshToken(tok) {
    var ls = raw(); if (!ls || !tok) return;
    try { ls.setItem(cfg().REFRESH_TOKEN_KEY || "varnis_refresh", tok); } catch (e) { /* ignore */ }
  }
  function getUser() {
    var ls = raw(); if (!ls) return null;
    try { return JSON.parse(ls.getItem(cfg().USER_KEY || "varnis_user") || "null"); } catch (e) { return null; }
  }
  function setUser(user) {
    var ls = raw(); if (!ls) return;
    try { ls.setItem(cfg().USER_KEY || "varnis_user", JSON.stringify(user || null)); } catch (e) { /* ignore */ }
  }
  function clearAuth() {
    var ls = raw(); if (!ls) return;
    try {
      ls.removeItem(cfg().AUTH_TOKEN_KEY || "varnis_token");
      ls.removeItem(cfg().REFRESH_TOKEN_KEY || "varnis_refresh");
      ls.removeItem(cfg().USER_KEY || "varnis_user");
    } catch (e) { /* ignore */ }
  }

  // ---- User preferences (AI personalization + settings, SRS FR-05/FR-37) --
  // Cached locally as JSON; the source of truth is the backend
  // (GET/PUT /ai/preferences). VarnisAPI.preferences syncs these.
  var PREFS_KEY = "preferences";
  function getPreferences() {
    return get(PREFS_KEY, {
      language: (window.getCurrentLanguage ? window.getCurrentLanguage() : "en"),
      notifications: { alerts: true, reports: true, learning: true, community: false },
      subscriptions: { weekly: true, monthly: false, quarterly: false, email: "" },
      privacy: { leaderboard: true, anonymousReports: false },
      ai: { recommendations: true, difficulty: "adaptive", interests: [] },
    });
  }
  function setPreferences(prefs) { return set(PREFS_KEY, prefs || {}); }
  function mergePreferences(patch) {
    var cur = getPreferences();
    var next = Object.assign({}, cur, patch || {});
    setPreferences(next);
    return next;
  }

  window.VarnisStore = {
    usable: usable,
    get: get, set: set, remove: remove, clearAll: clearAll,
    getToken: getToken, setToken: setToken,
    getRefreshToken: getRefreshToken, setRefreshToken: setRefreshToken,
    getUser: getUser, setUser: setUser, clearAuth: clearAuth,
    getPreferences: getPreferences, setPreferences: setPreferences, mergePreferences: mergePreferences,
  };
})();
