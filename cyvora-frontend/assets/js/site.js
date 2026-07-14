/* ============================================================
   Cyvora — shared motion & interaction layer (behavior)
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.remove("cyv-preload");

  /* ---------- Page load fade ---------- */
  window.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("cyv-loaded");

    var aside = document.querySelector("aside");
    var header = document.querySelector("header");
    if (aside) aside.classList.add("cyv-nav-in");
    if (header) header.classList.add("cyv-topbar-in");

    markActiveNav();
    tagRevealTargets();
    initScrollReveal();
    initCounters();
    initRipples();
    initMobileNav();
    initEmergencyModal();
    initProgressBars();
    initPlaceholderLinks();
  });

  /* ---------- Placeholder links (not yet built) ---------- */
  function initPlaceholderLinks() {
    document.querySelectorAll('a[href="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var label = a.textContent.trim() || "This section";
        showToast(label + " is coming soon.", "info");
      });
    });
  }

  /* ---------- Active nav highlighting ---------- */
  function markActiveNav() {
    var links = document.querySelectorAll("aside nav a[href]");
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    links.forEach(function (a) {
      var target = (a.getAttribute("href") || "").split("/").pop().toLowerCase();
      if (target && target === here) {
        a.classList.add("cyv-active-link");
      }
    });
  }

  /* ---------- Auto-tag cards for scroll-reveal ---------- */
  function tagRevealTargets() {
    var candidates = document.querySelectorAll(
      "main .bento-card, main section, main > div > section, main .grid > div"
    );
    candidates.forEach(function (el) {
      if (!el.classList.contains("reveal") && !el.closest(".cyv-no-reveal")) {
        el.classList.add("reveal");
      }
    });
  }

  function initScrollReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Animated number counters ---------- */
  function initCounters() {
    var els = document.querySelectorAll("[data-counter]");
    if (!els.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-counter"));
    var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 900;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Button ripple ---------- */
  function initRipples() {
    var selector = "button, a.cyv-ripple, .bento-card button";
    document.querySelectorAll(selector).forEach(function (btn) {
      btn.classList.add("cyv-ripple");
      btn.addEventListener("click", function (e) {
        var rect = btn.getBoundingClientRect();
        var dot = document.createElement("span");
        var size = Math.max(rect.width, rect.height);
        dot.className = "cyv-ripple-dot";
        dot.style.width = dot.style.height = size + "px";
        dot.style.left = (e.clientX - rect.left - size / 2) + "px";
        dot.style.top = (e.clientY - rect.top - size / 2) + "px";
        btn.appendChild(dot);
        setTimeout(function () { dot.remove(); }, 650);
      });
    });
  }

  /* ---------- Mobile nav toggle ---------- */
  function initMobileNav() {
    // Prefer the primary left nav (first fixed aside or first aside)
    var aside = document.querySelector("aside.fixed, aside[class*='w-64'], aside[class*='w-[240'], aside");
    if (!aside) return;
    aside.classList.add("cyv-sidebar");

    var backdrop = document.querySelector(".cyv-nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "cyv-nav-backdrop";
      document.body.appendChild(backdrop);
    }

    var btn = document.querySelector(".cyv-menu-btn");
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "cyv-menu-btn material-symbols-outlined";
      btn.setAttribute("aria-label", "Toggle navigation menu");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = "menu";
      document.body.appendChild(btn);
    }

    function toggleMenu(force) {
      var shouldOpen = typeof force === "boolean" ? force : !aside.classList.contains("cyv-sidebar-open");
      aside.classList.toggle("cyv-sidebar-open", shouldOpen);
      backdrop.classList.toggle("cyv-open", shouldOpen);
      btn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      btn.textContent = shouldOpen ? "close" : "menu";
      // Prevent body scroll when drawer is open
      document.body.style.overflow = shouldOpen ? "hidden" : "";
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    backdrop.addEventListener("click", function () {
      toggleMenu(false);
    });

    // Close drawer when a nav link is tapped (mobile UX)
    aside.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 1024) toggleMenu(false);
      });
    });

    // Escape key closes
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") toggleMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) toggleMenu(false);
    });
  }

  /* ---------- Emergency alert confirm modal ---------- */
  function initEmergencyModal() {
    var trigger = Array.prototype.find.call(
      document.querySelectorAll("button"),
      function (b) { return /emergency alert/i.test(b.textContent || ""); }
    );
    if (!trigger) return;
    trigger.classList.add("cyv-pulse");

    var backdrop = document.createElement("div");
    backdrop.className = "cyv-modal-backdrop";
    backdrop.innerHTML =
      '<div class="cyv-modal-card">' +
      '<div class="flex items-center gap-3 mb-4">' +
      '<span class="material-symbols-outlined text-error" style="font-size:32px;">campaign</span>' +
      '<h3 style="font-family:\'Public Sans\',sans-serif;font-weight:700;font-size:20px;color:#0B3D91;">Send Emergency Alert?</h3>' +
      "</div>" +
      '<p style="font-family:\'Public Sans\',sans-serif;font-size:14px;color:#434652;margin-bottom:24px;">This will immediately notify local authorities and your district safety network. Only use this for genuine emergencies.</p>' +
      '<div style="display:flex;gap:12px;justify-content:flex-end;">' +
      '<button data-action="cancel" style="padding:10px 18px;border-radius:8px;border:1px solid #D1D5DB;background:#fff;color:#434652;font-family:\'Work Sans\',sans-serif;font-weight:600;">Cancel</button>' +
      '<button data-action="confirm" style="padding:10px 18px;border-radius:8px;border:none;background:#ba1a1a;color:#fff;font-family:\'Work Sans\',sans-serif;font-weight:600;">Send Alert</button>' +
      "</div></div>";
    document.body.appendChild(backdrop);

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      backdrop.classList.add("cyv-open");
    });
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop || e.target.getAttribute("data-action") === "cancel") {
        backdrop.classList.remove("cyv-open");
      }
      if (e.target.getAttribute("data-action") === "confirm") {
        backdrop.classList.remove("cyv-open");
        showToast("Emergency alert sent. Authorities have been notified.", "success");
      }
    });
  }

  /* ---------- Progress bars grow on view ---------- */
  function initProgressBars() {
    var bars = document.querySelectorAll("[data-progress]");
    if (!bars.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var pct = el.getAttribute("data-progress");
          requestAnimationFrame(function () {
            el.style.width = pct + "%";
          });
          io.unobserve(el);
        });
      },
      { threshold: 0.3 }
    );
    bars.forEach(function (el) {
      el.classList.add("cyv-progress-fill");
      el.style.width = "0%";
      io.observe(el);
    });
  }

  /* ---------- Toasts (exposed globally) ---------- */
  function showToast(message, type) {
    var region = document.getElementById("cyv-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.id = "cyv-toast-region";
      document.body.appendChild(region);
    }
    var toast = document.createElement("div");
    var cls = type === "error" ? " cyv-toast-error" : type === "info" ? " cyv-toast-info" : "";
    toast.className = "cyv-toast" + cls;
    var color = type === "error" ? "#ba1a1a" : type === "info" ? "#345baf" : "#1FAE64";
    var icon = type === "error" ? "error" : type === "info" ? "info" : "check_circle";
    toast.innerHTML =
      '<span class="material-symbols-outlined" style="color:' + color + ';">' + icon +
      "</span><span>" + message + "</span>";
    region.appendChild(toast);
    setTimeout(function () {
      toast.classList.add("cyv-toast-leaving");
      setTimeout(function () { toast.remove(); }, 300);
    }, 4200);
  }
  window.cyvToast = showToast;
  window.showToast = showToast;
})();
