/**
 * Varnis — client-side auth guard
 * ------------------------------------------------------------
 * Redirects unauthenticated visitors to the login page before the
 * protected page renders. Include this script in the <head> of every
 * protected page (all of public/ except the auth pages, plus admin/).
 *
 * IMPORTANT — this is a UX guard, not a security boundary.
 * Anyone can bypass client-side checks. Real enforcement MUST happen
 * server-side: every API endpoint behind auth must validate the
 * Bearer token, and admin endpoints must additionally verify the
 * user's role. See README.md.
 *
 * Pages that never require auth:
 *   login.html, register.html, otp.html, certificate-verify.html
 * (certificate-verify is the public QR verification page.)
 *
 * On redirect, the originally requested URL is stashed in
 * sessionStorage under "varnis_post_login_redirect" so login.html can
 * send returning users straight back after a successful sign-in.
 */
(function () {
  "use strict";

  var PUBLIC_PAGES = ["landing", "login", "register", "otp", "certificate-verify"];

  var page = (location.pathname.split("/").pop() || "index.html")
    .toLowerCase()
    .replace(/\.html$/, "") || "index";

  if (PUBLIC_PAGES.indexOf(page) !== -1) return;

  // ------------------------------------------------------------------
  // Storage availability probe.
  // Under file:// (double-clicked HTML) many browsers block or partition
  // localStorage per file, so a token written on login.html reads back
  // empty here — which would bounce the user to login forever. Rather
  // than loop, we detect an unusable store and RENDER the page with a
  // one-time notice. This is a UX guard, not security; real enforcement
  // is server-side (see README.md).
  // ------------------------------------------------------------------
  function storageUsable() {
    try {
      var k = "__cyv_probe__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  var key = (window.VarnisConfig && window.VarnisConfig.AUTH_TOKEN_KEY) || "varnis_token";

  if (!storageUsable()) {
    // Can't persist a session — most likely opened via file://. Don't loop.
    if (location.protocol === "file:") {
      window.addEventListener("DOMContentLoaded", function () {
        if (document.getElementById("cyv-file-warning")) return;
        var bar = document.createElement("div");
        bar.id = "cyv-file-warning";
        bar.setAttribute("role", "alert");
        bar.style.cssText =
          "position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:10px 16px;" +
          "background:#ba1a1a;color:#fff;font:600 13px/1.4 'Work Sans',system-ui,sans-serif;text-align:center;";
        bar.textContent =
          "Heads up: you're opening this from a file, so sign-in can't be saved. " +
          "Run  python3 -m http.server  in the varnis folder and open http://localhost:8000/public/ instead.";
        document.body.appendChild(bar);
      });
    }
    return; // render the page anyway — looping would be worse
  }

  var token = null;
  try { token = window.localStorage.getItem(key); } catch (e) { /* handled above */ }

  if (token) {
    // Admin role gate. The backend now returns roles and enforces them on
    // every /admin API route (requireAdmin/requireModerator). This is the
    // matching UX guard: non-admins are bounced out of /admin/ pages before
    // render. Real enforcement is still server-side — this is convenience.
    var ENFORCE_ADMIN_ROLE = true;
    if (ENFORCE_ADMIN_ROLE && location.pathname.toLowerCase().indexOf("/admin/") !== -1) {
      var role = null;
      try {
        var u = JSON.parse(window.localStorage.getItem("varnis_user") || "null");
        role = u && u.role;
      } catch (e) { /* ignore */ }
      if (role !== "admin") {
        location.replace("../public/index.html");
      }
    }
    return;
  }

  // Not authenticated → remember where they were headed, go to login.
  try {
    sessionStorage.setItem("varnis_post_login_redirect", location.pathname + location.search);
  } catch (e) { /* ignore */ }

  var isAdmin = location.pathname.toLowerCase().indexOf("/admin/") !== -1;
  location.replace(isAdmin ? "../public/login.html" : "login.html");
})();
