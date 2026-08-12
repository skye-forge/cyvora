/* ============================================================
   Varnis — shared motion & interaction layer (behavior)
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
    // Admin sign-out (Management Platform rail).
    (function () {
      var so = document.getElementById("admin-signout");
      if (so) so.addEventListener("click", function (e) {
        e.preventDefault();
        var done = function () { window.location.href = "../public/login.html"; };
        if (window.VarnisAPI && window.VarnisAPI.auth) window.VarnisAPI.auth.logout().then(done, done);
        else done();
      });
    })();
    // Profile page sign-out (public/profile.html — was never wired up).
    (function () {
      var so = document.getElementById("profile-signout");
      if (so) so.addEventListener("click", function (e) {
        e.preventDefault();
        var done = function () { window.location.href = "login.html"; };
        if (window.VarnisAPI && window.VarnisAPI.auth) window.VarnisAPI.auth.logout().then(done, done);
        else done();
      });
    })();
    // Public sidebar "Logout" links (institution/assessment/daily-challenge/
    // leaderboard/monitor/zones/certificates.html). These are plain anchors
    // to login.html with no id — they navigated away without ever clearing
    // the session, so the token stayed in storage and a back-button press
    // (or auth-guard.js) still treated the user as signed in. Matched by
    // visible text rather than an id/class so it doesn't collide with the
    // genuine "Sign in" links elsewhere (landing.html, register.html, etc.)
    // that share the same href.
    (function () {
      Array.prototype.forEach.call(document.querySelectorAll("a"), function (a) {
        // Icons render via a font ligature (the literal text inside that
        // <span> is the word "logout", used to select the glyph) — matching
        // against the anchor's FULL textContent concatenates that with the
        // visible label ("logout" + "Logout"), which never equals "Logout"
        // and silently skipped every one of these links. Check only the
        // last <span> (the actual label) instead.
        var spans = a.querySelectorAll("span");
        var label = spans.length ? (spans[spans.length - 1].textContent || "").trim() : (a.textContent || "").trim();
        if (label !== "Logout") return;
        a.addEventListener("click", function (e) {
          e.preventDefault();
          var href = a.getAttribute("href") || "login.html";
          var done = function () { window.location.href = href; };
          if (window.VarnisAPI && window.VarnisAPI.auth) window.VarnisAPI.auth.logout().then(done, done);
          else done();
        });
      });
    })();
    // Restore a saved profile photo into the topbar avatar across all pages.
    (function restoreAvatar() {
      try {
        var photo = window.VarnisStore && window.VarnisStore.get("profile_photo", null);
        if (!photo) return;
        var link = document.querySelector('header a[aria-label="Profile"]');
        if (!link) return;
        var icon = link.querySelector(".material-symbols-outlined");
        if (icon) icon.classList.add("hidden");
        var img = link.querySelector("img");
        if (!img) {
          img = document.createElement("img");
          img.className = "h-full w-full object-cover";
          img.alt = "Profile";
          link.appendChild(img);
        }
        img.src = photo;
      } catch (e) { /* ignore */ }
    })();
    initEmergencyModal();
    initProgressBars();
    initPlaceholderLinks();

    /* ---------- Accessibility Foundations ---------- */
    initAccessibility();
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

  /* ---------- Active nav highlighting (enhanced) ---------- */
  function markActiveNav() {
    var links = document.querySelectorAll("aside nav a[href]");
    var hereRaw = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var here = hereRaw.replace(/\.html$/, "");

    // Alias map for special cases & sub-pages (better UX)
    var navAliases = {
      "report-incident": "my-reports",      // creation flow belongs under Reports
      "lesson-cybersecurity": "learn",
      "lesson-phishing": "learn",
      "daily-challenge": "learn",
      "zones": "learn",
      "my-reports": "my-reports",
      "learn": "learn"
    };

    var effectiveHere = navAliases[here] || here;

    links.forEach(function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      var target = href.split("/").pop().replace(/\.html$/, "");

      // Clear previous active state first (for robustness)
      a.classList.remove("cyv-active-link", "bg-surface-container-highest/10", "text-on-primary", "border-l-4", "border-secondary-fixed");

      if (target && (target === effectiveHere || target === effectiveHere + ".html")) {
        // Apply full visual active state (matches hardcoded style + our CSS)
        a.classList.add("cyv-active-link", "bg-surface-container-highest/10", "text-on-primary", "border-l-4", "border-secondary-fixed");
      }
    });
  }

  /* ---------- Auto-tag cards for scroll-reveal ---------- */
  function tagRevealTargets() {
    // Redesigned pages (new shell) opt OUT of blanket auto-reveal — their
    // cards are grids/sections that would all get opacity:0 and risk staying
    // hidden if the observer misses them. Only tag when a page explicitly
    // asks via [data-reveal] containers.
    var isNewShell = document.body.classList.contains("cyv-shell");
    var selector = isNewShell
      ? "[data-reveal] > *"
      : "main .bento-card, main section, main > div > section, main .grid > div";
    var candidates = document.querySelectorAll(selector);
    candidates.forEach(function (el) {
      if (!el.classList.contains("reveal") && !el.closest(".cyv-no-reveal")) {
        el.classList.add("reveal");
      }
    });
  }

  function initScrollReveal() {
    function revealAll() {
      document.querySelectorAll(".reveal:not(.in-view)").forEach(function (el) {
        el.classList.add("in-view");
      });
    }
    if (!("IntersectionObserver" in window)) { revealAll(); return; }

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
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

    // Safety net: reveal anything still hidden shortly after load. Covers
    // content injected by app.js after this ran, and any element the
    // observer never fired for. Content must never be stuck at opacity:0.
    setTimeout(revealAll, 1200);
    window.addEventListener("load", function () { setTimeout(revealAll, 300); });
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
    // New shell (redesigned pages): #cyv-rail + #cyv-rail-toggle + #cyv-rail-scrim
    var rail = document.getElementById("cyv-rail") || document.getElementById("side-nav");
    var newToggle = document.getElementById("cyv-rail-toggle");
    var scrim = document.getElementById("cyv-rail-scrim");
    if (rail && rail.classList.contains("cyv-rail") && (newToggle || scrim)) {
      var openRail = function (open) {
        rail.classList.toggle("is-open", open);
        if (scrim) scrim.classList.toggle("hidden", !open);
        document.body.style.overflow = open ? "hidden" : "";
      };
      if (newToggle) newToggle.addEventListener("click", function () { openRail(!rail.classList.contains("is-open")); });
      if (scrim) scrim.addEventListener("click", function () { openRail(false); });
      rail.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { openRail(false); });
      });
      return; // new shell handled; skip legacy drawer
    }

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

  /* ============================================================
     Accessibility Helper Functions
     ============================================================ */
  function initAccessibility() {
    // 1. Skip to main content link
    if (!document.querySelector(".skip-link")) {
      var skipLink = document.createElement("a");
      skipLink.href = "#main-content";
      skipLink.className = "skip-link";
      skipLink.textContent = "Skip to main content";
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // 2. Ensure main content has an id for skip link
    var main = document.querySelector("main");
    if (main && !main.id) {
      main.id = "main-content";
    }

    // 3. Create global aria-live region for dynamic announcements
    if (!document.getElementById("cyv-aria-live")) {
      var liveRegion = document.createElement("div");
      liveRegion.id = "cyv-aria-live";
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.style.position = "absolute";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.padding = "0";
      liveRegion.style.margin = "-1px";
      liveRegion.style.overflow = "hidden";
      liveRegion.style.clip = "rect(0, 0, 0, 0)";
      liveRegion.style.whiteSpace = "nowrap";
      liveRegion.style.border = "0";
      document.body.appendChild(liveRegion);
    }

    // 4. Make sure toasts are announced to screen readers
    // (already handled in showToast via the aria-live region)
  }

  // Expose for future use
  window.VarnisA11y = {
    announce: function (message) {
      var region = document.getElementById("cyv-aria-live");
      if (region) region.textContent = message;
    }
  };

  /* ============================================================
     LOADING STATES HELPERS
     ============================================================ */
  window.VarnisUI = window.VarnisUI || {};

  window.VarnisUI.showLoading = function (container, type = 'spinner') {
    if (!container) return;
    container.innerHTML = '';

    if (type === 'spinner') {
      var spinner = document.createElement('div');
      spinner.className = 'flex justify-center items-center py-8';
      spinner.innerHTML = `<div class="cyv-spinner"></div>`;
      container.appendChild(spinner);
    } else if (type === 'skeleton-card') {
      container.innerHTML = `<div class="skeleton skeleton-card w-full"></div>`;
    } else if (type === 'skeleton-table') {
      var html = '';
      for (let i = 0; i < 5; i++) {
        html += `<div class="skeleton skeleton-table-row w-full mb-2"></div>`;
      }
      container.innerHTML = html;
    }
  };

  window.VarnisUI.hideLoading = function (container, originalContent = null) {
    if (!container) return;
    if (originalContent) {
      container.innerHTML = originalContent;
    } else {
      container.innerHTML = '';
    }
  };

  /* ============================================================
     Language Switcher
     ============================================================ */
  function initLanguageSwitcher() {
    // The i18n topbar toggle ([data-lang-toggle]) now handles language
    // switching live (no page reload). Skip the legacy injected switcher
    // to avoid a duplicate control and a jarring reload.
    if (document.querySelector('[data-lang-toggle]')) return;
    // Only add if not already present
    if (document.getElementById('lang-switcher')) return;

    var header = document.querySelector('header');
    if (!header) return;

    var switcher = document.createElement('div');
    switcher.id = 'lang-switcher';
    switcher.className = 'flex items-center gap-1 ml-2';

    var currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'en';

    switcher.innerHTML = `
      <button data-lang="en" class="px-2 py-1 text-xs rounded ${currentLang === 'en' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container'}">EN</button>
      <button data-lang="fr" class="px-2 py-1 text-xs rounded ${currentLang === 'fr' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container'}">FR</button>
    `;

    // Insert before profile avatar if possible
    var profileLink = header.querySelector('a[href="profile.html"]');
    if (profileLink && profileLink.parentNode) {
      profileLink.parentNode.insertBefore(switcher, profileLink);
    } else {
      header.appendChild(switcher);
    }

    // Add click handlers
    switcher.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-lang');
        if (window.setLanguage) {
          window.setLanguage(lang);
          // Reload to apply translations across the page
          location.reload();
        }
      });
    });
  }

  // Initialize language switcher after DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    if (window.VarnisI18n) {
      initLanguageSwitcher();
    }

    // Register Service Worker for PWA / basic offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('../sw.js')
        .then((registration) => {
          console.log('[Varnis] Service Worker registered successfully');

          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Varnis] New content is available. Please refresh the page.');
              }
            };
          };
        })
        .catch((err) => {
          console.log('[Varnis] Service Worker registration failed:', err);
        });
    }

    // PWA Install Prompt Handler
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install button if it exists on the page
      const installBtn = document.getElementById('install-btn');
      if (installBtn) {
        installBtn.style.display = 'flex';
        installBtn.onclick = () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('[Varnis] User accepted the install prompt');
            }
            deferredPrompt = null;
            installBtn.style.display = 'none';
          });
        };
      }
    });

    // Offline / Online Status Banner
    function createOfflineBanner() {
      if (document.getElementById('offline-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'hidden fixed top-0 left-0 right-0 z-[999] bg-error text-on-error text-center py-2 text-sm font-medium';
      banner.innerHTML = `
        <div class="flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-base">wifi_off</span>
          <span>You are currently offline. Some features may be limited.</span>
        </div>
      `;
      document.body.prepend(banner);
      return banner;
    }

    const offlineBanner = createOfflineBanner();

    function updateOnlineStatus() {
      if (!offlineBanner) return;

      if (navigator.onLine) {
        offlineBanner.classList.add('hidden');
      } else {
        offlineBanner.classList.remove('hidden');
      }
    }

    // Make offline banner dismissible
    if (offlineBanner) {
      offlineBanner.style.cursor = 'pointer';
      offlineBanner.title = 'Click to dismiss';

      offlineBanner.addEventListener('click', () => {
        offlineBanner.classList.add('hidden');
      });
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check initial status
    updateOnlineStatus();
  });

  /* ============================================================
     INLINE FORM VALIDATION SYSTEM
     ============================================================ */
  function initInlineValidation(form) {
    if (!form || !window.VarnisValidation) return;

    var V = window.VarnisValidation;

    // Helper to show/clear inline error
    function setFieldError(input, message) {
      // Remove existing error
      var existingError = input.parentNode.querySelector('.field-error');
      if (existingError) existingError.remove();

      input.classList.remove('border-error', 'ring-error/30');
      input.setAttribute('aria-invalid', 'false');

      if (message) {
        input.classList.add('border-error', 'ring-error/30');
        input.setAttribute('aria-invalid', 'true');

        var errorEl = document.createElement('p');
        errorEl.className = 'field-error text-error text-caption mt-1';
        errorEl.textContent = message;
        errorEl.id = input.id ? input.id + '-error' : 'error-' + Date.now();

        input.setAttribute('aria-describedby', errorEl.id);
        input.parentNode.appendChild(errorEl);
      } else {
        input.removeAttribute('aria-describedby');
      }
    }

    // Attach validation to inputs
    var inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(function (input) {
      var fieldName = input.name || input.id || '';

      function validateField() {
        var value = input.value.trim();
        var errorMsg = '';

        // Use existing validators from VarnisValidation
        if (fieldName.toLowerCase().includes('email')) {
          var res = V.validateEmail(value);
          if (!res.valid) errorMsg = res.error;
        } 
        else if (fieldName.toLowerCase().includes('phone')) {
          var res = V.validatePhone(value);
          if (!res.valid) errorMsg = res.error;
        } 
        else if (fieldName.toLowerCase().includes('password')) {
          if (value.length < 6) errorMsg = 'Password must be at least 6 characters';
          else {
            var mal = V.detectMaliciousInput(value);
            if (mal.isMalicious) errorMsg = 'Password contains invalid patterns';
          }
        } 
        else if (fieldName.toLowerCase().includes('title')) {
          var res = V.validateTextField(value, 'Title', 5, 150);
          if (!res.valid) errorMsg = res.error;
        } 
        else if (fieldName.toLowerCase().includes('description') || fieldName.toLowerCase().includes('body') || fieldName.toLowerCase().includes('message')) {
          var res = V.validateTextField(value, 'This field', 10, 2000);
          if (!res.valid) errorMsg = res.error;
        }

        setFieldError(input, errorMsg);
        return !errorMsg;
      }

      // Expose the validator on the element so the submit handler can call it.
      input._cyvValidate = validateField;

      // Validate on blur
      input.addEventListener('blur', validateField);

      // Clear error while typing
      input.addEventListener('input', function () {
        if (input.classList.contains('border-error')) {
          setFieldError(input, '');
        }
      });
    });

    // Validate entire form on submit
    form.addEventListener('submit', function (e) {
      var isValid = true;
      inputs.forEach(function (input) {
        if (typeof input._cyvValidate === 'function' && !input._cyvValidate()) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();
        // Focus first invalid field
        var firstError = form.querySelector('.border-error');
        if (firstError) firstError.focus();
      }
    });
  }

  // Expose globally so it can be used on any page
  window.initInlineValidation = initInlineValidation;
})();

/* ============================================================================
 * Global search (topbar) — works on every page that has a search input.
 * ----------------------------------------------------------------------------
 * - Instant page navigation (client-side index, EN + FR keywords)
 * - Live results via VarnisAPI.search.global -> GET /search?q= (mock-aware)
 * - Keyboard: ArrowUp/Down to move, Enter to open, Escape to close
 * - Context-aware destinations (citizen pages vs admin dashboard)
 * ========================================================================= */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var input =
      document.querySelector(".cyv-topbar .cyv-search input") ||
      document.querySelector('header .relative input[type="search"]') ||
      document.querySelector('header .relative input[type="text"]');
    if (!input) return; // page has no topbar search (login, register, …)

    var isAdmin = location.pathname.indexOf("/admin/") !== -1;

    var anchor = input.closest("label") || input.parentElement;
    if (!anchor) return;
    if (getComputedStyle(anchor).position === "static") anchor.style.position = "relative";

    function tr(key, fallback) { return (window.t && window.t(key)) || fallback; }

    /* ---- Page index (instant navigation) -------------------------------- */
    var PAGES = isAdmin ? [
      { href: "index.html",     icon: "dashboard",        title: "Dashboard",       kw: "dashboard home accueil overview" },
      { href: "reports.html",   icon: "description",      title: "Reports",         kw: "reports rapports signalements review triage" },
      { href: "alerts.html",    icon: "campaign",         title: "Alerts",          kw: "alerts alertes publish broadcast" },
      { href: "users.html",     icon: "group",            title: "Users",           kw: "users utilisateurs citizens roles moderator" },
      { href: "learning.html",  icon: "school",           title: "Learning",        kw: "learning lessons courses formation cours" },
      { href: "community.html", icon: "groups",           title: "Community",       kw: "community communaute posts moderation" },
      { href: "settings.html",  icon: "settings",         title: "Settings",        kw: "settings parametres configuration" }
    ] : [
      { href: "index.html",           icon: "home",              title: "Home",              kw: "home dashboard accueil" },
      { href: "my-reports.html",      icon: "description",       title: "My Reports",        kw: "my reports mes rapports signalements tracking status" },
      { href: "report-incident.html", icon: "emergency",         title: "Report an incident", kw: "report incident signaler fraude scam arnaque new" },
      { href: "learn.html",           icon: "school",            title: "Learn",             kw: "learn lessons courses apprendre cours formation" },
      { href: "assistant.html",       icon: "smart_toy",         title: "Ask AI",            kw: "ai assistant ask question ia demander chatbot" },
      { href: "community.html",       icon: "groups",            title: "Community",         kw: "community communaute posts feed" },
      { href: "leaderboard.html",     icon: "emoji_events",      title: "Leaderboard",       kw: "leaderboard classement ranking xp" },
      { href: "monitor.html",         icon: "public",            title: "National Monitor",  kw: "monitor national threats menaces alerts map" },
      { href: "zones.html",           icon: "map",               title: "Safety Zones",      kw: "zones safety districts regions carte" },
      { href: "daily-challenge.html", icon: "bolt",              title: "Daily Challenge",   kw: "daily challenge defi quotidien streak xp" },
      { href: "certificates.html",    icon: "workspace_premium", title: "Certificates",      kw: "certificates certificats badges qr verify" },
      { href: "notifications.html",   icon: "notifications",     title: "Notifications",     kw: "notifications alerts messages" },
      { href: "profile.html",         icon: "account_circle",    title: "Profile",           kw: "profile profil account compte" },
      { href: "settings.html",        icon: "settings",          title: "Settings",          kw: "settings parametres preferences language langue" },
      { href: "support.html",         icon: "help",              title: "Support",           kw: "support help aide faq contact" }
    ];

    function pageMatches(q) {
      var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
      return PAGES.filter(function (p) {
        var hay = (p.title + " " + p.kw).toLowerCase();
        return tokens.every(function (t) { return hay.indexOf(t) !== -1; });
      }).slice(0, 4);
    }

    /* ---- Result destinations -------------------------------------------- */
    var TYPE_META = {
      report:    { icon: "description", href: function (r) { return isAdmin ? "reports.html" : "report-detail.html?id=" + encodeURIComponent(r.id); } },
      alert:     { icon: "campaign",    href: function ()  { return isAdmin ? "alerts.html" : "monitor.html"; } },
      course:    { icon: "school",      href: function ()  { return isAdmin ? "learning.html" : "learn.html"; } },
      lesson:    { icon: "menu_book",   href: function ()  { return isAdmin ? "learning.html" : "learn.html"; } },
      community: { icon: "groups",      href: function ()  { return "community.html"; } },
      user:      { icon: "person",      href: function ()  { return isAdmin ? "users.html" : "profile.html"; } },
      page:      { icon: "arrow_forward", href: function (r) { return r.href || "index.html"; } }
    };
    var GROUP_OF = { report: "search.reports", alert: "search.alerts", course: "search.learning", lesson: "search.learning", community: "search.community", user: "search.community" };
    var GROUP_FALLBACK = { "search.reports": "Reports", "search.alerts": "Alerts", "search.learning": "Learning", "search.community": "Community", "search.pages": "Pages" };

    /* ---- Panel ----------------------------------------------------------- */
    var panel = document.createElement("div");
    panel.className = "absolute left-0 right-0 z-50 hidden overflow-y-auto rounded-lg border border-outline-variant bg-white shadow-lg";
    panel.style.top = "calc(100% + 8px)";
    panel.style.maxHeight = "60vh";
    panel.setAttribute("role", "listbox");
    anchor.appendChild(panel);

    var items = [];      // focusable result buttons, in visual order
    var activeIdx = -1;
    var seq = 0;         // discards stale async responses
    var debounceTimer = null;
    var open = false;

    function el(tag, className, text) {
      var n = document.createElement(tag);
      if (className) n.className = className;
      if (text != null) n.textContent = text;
      return n;
    }

    function closePanel() {
      panel.classList.add("hidden");
      open = false;
      activeIdx = -1;
      items = [];
    }

    function openPanel() {
      panel.classList.remove("hidden");
      open = true;
    }

    function setActive(idx) {
      if (activeIdx >= 0 && items[activeIdx]) items[activeIdx].classList.remove("bg-surface-container-low");
      activeIdx = idx;
      if (activeIdx >= 0 && items[activeIdx]) {
        items[activeIdx].classList.add("bg-surface-container-low");
        items[activeIdx].scrollIntoView({ block: "nearest" });
      }
    }

    function addGroupHeader(labelKey) {
      panel.appendChild(el("p", "px-4 pb-1 pt-3 text-caption uppercase tracking-wider text-on-surface-variant", tr(labelKey, GROUP_FALLBACK[labelKey] || "")));
    }

    function addRow(icon, title, subtitle, href) {
      var btn = el("button", "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-container-low");
      btn.type = "button";
      btn.setAttribute("role", "option");
      btn.appendChild(el("span", "material-symbols-outlined shrink-0 text-[20px] text-primary", icon));
      var txt = el("div", "min-w-0 flex-1");
      txt.appendChild(el("p", "truncate text-label-lg text-on-surface", title));
      if (subtitle) txt.appendChild(el("p", "truncate text-caption text-on-surface-variant", subtitle));
      btn.appendChild(txt);
      btn.addEventListener("click", function () { location.href = href; });
      panel.appendChild(btn);
      items.push(btn);
    }

    function addNote(text) {
      panel.appendChild(el("p", "px-4 py-3 text-body-md text-on-surface-variant", text));
    }

    function renderPages(q) {
      panel.textContent = "";
      items = [];
      activeIdx = -1;
      var pages = pageMatches(q);
      if (pages.length) {
        addGroupHeader("search.pages");
        pages.forEach(function (p) { addRow(p.icon, p.title, null, p.href); });
      }
      return pages.length;
    }

    function renderResults(q, results) {
      // Group API results by section, preserving order within groups.
      var groups = {};
      results.forEach(function (r) {
        var key = GROUP_OF[r.type] || "search.community";
        (groups[key] = groups[key] || []).push(r);
      });
      ["search.reports", "search.alerts", "search.learning", "search.community"].forEach(function (key) {
        if (!groups[key]) return;
        addGroupHeader(key);
        groups[key].forEach(function (r) {
          var meta = TYPE_META[r.type] || TYPE_META.page;
          addRow(meta.icon, r.title || r.id, r.subtitle || "", r.href || meta.href(r));
        });
      });
    }

    function run(q) {
      var mySeq = ++seq;
      var pageCount = renderPages(q);
      var loading = el("p", "px-4 py-3 text-body-md text-on-surface-variant", tr("search.searching", "Searching…"));
      panel.appendChild(loading);
      openPanel();

      var api = window.VarnisAPI && window.VarnisAPI.search && window.VarnisAPI.search.global;
      var call = api ? window.VarnisAPI.search.global(q) : Promise.resolve({ results: [] });

      call.then(function (res) {
        if (mySeq !== seq) return; // a newer query superseded this one
        if (loading.parentNode) loading.parentNode.removeChild(loading);
        var results = (res && res.results) || [];
        if (results.length) renderResults(q, results);
        else if (!pageCount) addNote(tr("search.no_results", "No results for") + " \u201C" + q + "\u201D");
      }).catch(function () {
        if (mySeq !== seq) return;
        if (loading.parentNode) loading.parentNode.removeChild(loading);
        if (!pageCount) addNote(tr("search.no_results", "No results for") + " \u201C" + q + "\u201D");
      });
    }

    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (q.length < 2) { closePanel(); seq++; return; }
      debounceTimer = setTimeout(function () { run(q); }, 250);
    });

    input.addEventListener("focus", function () {
      if (input.value.trim().length >= 2 && panel.childNodes.length) openPanel();
    });

    input.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(activeIdx + 1, items.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(activeIdx - 1, 0)); }
      else if (e.key === "Enter") {
        var target = items[activeIdx >= 0 ? activeIdx : 0];
        if (target) { e.preventDefault(); target.click(); }
      }
      else if (e.key === "Escape") { closePanel(); input.blur(); }
    });

    document.addEventListener("click", function (e) {
      if (open && !anchor.contains(e.target)) closePanel();
    });
  });
})();
