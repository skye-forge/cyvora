/**
 * Cyvora — page bootstrap & data loaders
 * ------------------------------------------------------------
 * Detects which page is open and wires CyvoraAPI + templates.
 * All data is JSON from the API layer (mock or live).
 */
(function () {
  "use strict";

  var T = window.CyvoraTemplates;
  var API = window.CyvoraAPI;

  function page() {
    var p = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    return p.replace(/\.html$/, "") || "index";
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function showToast(msg, type) {
    if (typeof window.showToast === "function") {
      window.showToast(msg, type || "info");
      return;
    }
    // fallback minimal toast if site.js not yet ready
    console.log("[Cyvora]", type || "info", msg);
  }

  /* ============================================================
     PUBLIC: index (dashboard)
     ============================================================ */
  function bootPublicIndex() {
    // --- Live date (top-right of greeting) ---
    var dateEl = $("[data-live-date]") || $(".text-right .font-label-lg");
    var weatherEl = $("[data-live-weather]") || $(".text-right .font-body-md");
    if (dateEl) {
      var now = new Date();
      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric"
      }).toUpperCase();
    }
    if (weatherEl && !weatherEl.getAttribute("data-locked")) {
      // static placeholder weather (no external weather API in demo)
      weatherEl.textContent = "Weather: 18°C · Clear Sky";
    }

    // --- Current user greeting + stats ---
    API.users.me().then(function (user) {
      var greet = $("[data-greeting]") || $("main h2.font-display-lg, main h2");
      if (greet && user && user.name) {
        var first = user.name.split(" ")[0];
        greet.textContent = T.greetingForHour(new Date().getHours()) + ", " + first + ".";
      }
      var districtLine = $("[data-district-line]") || (greet && greet.nextElementSibling);
      if (districtLine && user && user.district) {
        districtLine.innerHTML =
          'Your district (<strong>' + T.esc(user.district) + '</strong>) is currently at ' +
          '<span class="text-secondary font-bold">Standard Alert Level</span>.';
      }

      // Trust score card
      var trustEl = $("[data-counter][data-decimals], .bento-card [data-counter]");
      $all("[data-counter]").forEach(function (el) {
        var key = el.getAttribute("data-stat");
        if (key === "trust" && user.trustScore != null) {
          el.setAttribute("data-counter", String(user.trustScore));
          el.textContent = Number(user.trustScore).toFixed(1);
        }
      });

      // Header avatar title
      var avatar = $("header img");
      if (avatar && user.name) avatar.setAttribute("alt", user.name);
    }).catch(function () {});

    // --- Report stats ---
    API.reports.list().then(function (res) {
      var items = res.items || [];
      var pending = items.filter(function (r) { return r.status === "pending" || r.status === "in_review"; }).length;
      var approved = items.filter(function (r) { return r.status === "approved"; }).length;

      $all("[data-stat='pending'], [data-counter]").forEach(function (el) {
        if (el.getAttribute("data-stat") === "pending" || (el.closest(".bento-card") && /Pending/i.test(el.closest(".bento-card").textContent || ""))) {
          el.setAttribute("data-counter", String(pending));
          el.textContent = String(pending);
        }
      });
      $all("[data-stat='approved']").forEach(function (el) {
        el.setAttribute("data-counter", String(approved));
        el.textContent = String(approved);
      });

      // Fallback: first two display-lg counters
      var counters = $all(".bento-card h3[data-counter]");
      if (counters[0] && !counters[0].getAttribute("data-stat")) {
        counters[0].setAttribute("data-counter", String(pending));
        counters[0].textContent = String(pending);
      }
      if (counters[1] && !counters[1].getAttribute("data-stat")) {
        counters[1].setAttribute("data-counter", String(approved));
        counters[1].textContent = String(approved);
      }
      if (counters[2] && !counters[2].getAttribute("data-stat")) {
        // leave trust to me() above
      }
    }).catch(function () {});

    // --- Alerts (right column National Alerts) ---
    var alertsHost = $("[data-alerts-list]");
    if (!alertsHost) {
      // find the alerts container by heading
      $all("h4, h3").forEach(function (h) {
        if (/National Alerts/i.test(h.textContent || "")) {
          var card = h.closest(".bento-card, section, div");
          if (card) {
            var list = card.querySelector(".space-y-4") || card.querySelector("[class*='space-y']");
            if (list) alertsHost = list;
          }
        }
      });
    }
    if (alertsHost) {
      if (window.CyvoraUI) window.CyvoraUI.showLoading(alertsHost, 'skeleton-card');
      API.alerts.list().then(function (res) {
        var items = (res.items || []).filter(function (a) { return a.active !== false; }).slice(0, 4);
        if (!items.length) {
          alertsHost.innerHTML = '<p class="font-body-md text-on-surface-variant">No active alerts.</p>';
          return;
        }
        alertsHost.innerHTML = items.map(T.alertCard).join("");
      }).catch(function () {});
    }

    // --- Community highlights ---
    var highlightsHost = $("[data-community-highlights]");
    if (!highlightsHost) {
      $all("h4").forEach(function (h) {
        if (/Community Highlights/i.test(h.textContent || "")) {
          var section = h.closest("section") || h.parentElement;
          var grid = section && section.querySelector(".grid");
          if (grid) highlightsHost = grid;
        }
      });
    }
    if (highlightsHost) {
      API.community.list({ status: "published" }).then(function (res) {
        var items = (res.items || []).slice(0, 2);
        if (items.length) highlightsHost.innerHTML = items.map(T.communityHighlight).join("");
      }).catch(function () {});
    }

    // --- Featured learning ---
    API.learning.courses().then(function (res) {
      var items = res.items || [];
      var featured = items.find(function (c) { return c.progressPct > 0 && c.progressPct < 100; }) || items[0];
      if (!featured) return;
      var titleEl = $("[data-featured-course-title]");
      var descEl = $("[data-featured-course-desc]");
      var btnEl = $("[data-featured-course-cta]");
      // fallback selectors inside featured card
      $all(".bento-card").forEach(function (card) {
        if (/FEATURED LEARN|Start Training/i.test(card.textContent || "")) {
          var h = card.querySelector("h3, h4");
          var p = card.querySelector("p");
          var a = card.querySelector("a, button");
          if (h) h.textContent = featured.title;
          if (p && p.textContent.length > 20) p.textContent = featured.description || p.textContent;
          if (a && a.tagName === "A") a.href = featured.href || "learn.html";
          if (a && a.tagName === "BUTTON") {
            a.addEventListener("click", function () { location.href = featured.href || "learn.html"; });
          }
        }
      });
      if (titleEl) titleEl.textContent = featured.title;
      if (descEl) descEl.textContent = featured.description || "";
      if (btnEl) btnEl.setAttribute("href", featured.href || "learn.html");
    }).catch(function () {});
  }

  /* ============================================================
     PUBLIC: my-reports
     ============================================================ */
  function bootMyReports() {
    var tbody = $("#reports-tbody") || $("[data-reports-tbody]") || $("#my-reports-tbody");
    if (!tbody) return;

    var all = [];

    // Populate the category filter from the canonical list.
    var catSel = $("#filter-category");
    if (catSel) {
      var cats = (window.CyvoraMockData && window.CyvoraMockData.reportCategories) || [];
      cats.forEach(function (c) {
        var o = document.createElement("option");
        o.value = c.name; o.textContent = c.name;
        catSel.appendChild(o);
      });
    }

    function applyFilters() {
      var st = ($("#filter-status") || {}).value || "";
      var cat = ($("#filter-category") || {}).value || "";
      var from = ($("#filter-from") || {}).value || "";
      var to = ($("#filter-to") || {}).value || "";
      var items = all.filter(function (r) {
        if (st && r.status !== st) return false;
        if (cat && r.category !== cat) return false;
        if (from && new Date(r.createdAt) < new Date(from)) return false;
        if (to && new Date(r.createdAt) > new Date(to + "T23:59:59")) return false;
        return true;
      });
      render(items);
    }

    function render(items) {
      if (!items.length) {
        tbody.innerHTML = T.emptyState(
          'No reports match these filters. <a class="text-primary hover:underline" href="report-incident.html">File a report</a>.',
          5
        );
        return;
      }
      tbody.innerHTML = items.map(function (r) { return T.reportRow(r, { admin: false }); }).join("");
    }

    function fillTiles() {
      var total = all.length;
      var resolved = all.filter(function (r) { return r.status === "resolved" || r.status === "approved"; }).length;
      var pending = all.filter(function (r) { return r.status === "pending" || r.status === "in_review"; }).length;
      var set = function (k, v) { $all('[data-stat="' + k + '"]').forEach(function (el) { el.textContent = String(v); }); };
      set("total-reports", total);
      set("resolved-reports", resolved);
      set("pending-reports", pending);
    }

    ["#filter-status", "#filter-category", "#filter-from", "#filter-to"].forEach(function (sel) {
      var el = $(sel);
      if (el) el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });

    // Open the detail page when a row or its "View details" button is clicked.
    tbody.addEventListener("click", function (e) {
      var el = e.target.closest("[data-id]");
      if (!el) return;
      var rid = el.getAttribute("data-id");
      if (rid) location.href = "report-detail.html?id=" + encodeURIComponent(rid);
    });

    if (window.CyvoraUI) window.CyvoraUI.showLoading(tbody, 'skeleton-table');
    API.reports.list().then(function (res) {
      all = res.items || [];
      fillTiles();
      render(all);
    }).catch(function () {
      tbody.innerHTML = T.errorState("Could not load your reports. Please refresh the page.", 5);
    });
  }

  /* ============================================================
     PUBLIC: community
     ============================================================ */
  function bootPublicCommunity() {
    var host = $("#community-feed") || $("[data-community-feed]");
    // try common containers
    if (!host) {
      $all("main .space-y-6, main .flex.flex-col.gap-6, main section").forEach(function (el) {
        if (el.querySelector("article") || /Post|Topics/i.test(el.previousElementSibling && el.previousElementSibling.textContent || "")) {
          host = host || el;
        }
      });
    }
    // last resort: container that currently has hardcoded posts
    if (!host) {
      var articles = $all("main article");
      if (articles.length) host = articles[0].parentElement;
    }
    if (!host) return;

    if (window.CyvoraUI) window.CyvoraUI.showLoading(host, 'skeleton-table');

    API.community.list({ status: "published" }).then(function (res) {
      var items = res.items || [];
      if (!items.length) {
        host.innerHTML = '<div class="bento-card p-8 text-center text-on-surface-variant">No community posts yet. Be the first to share an update.</div>';
        return;
      }
      host.innerHTML = items.map(T.communityPost).join("");
    }).catch(function () {
      host.innerHTML = '<div class="bento-card p-8 text-center text-error">Could not load community posts.</div>';
    });

    // New post form if present
    var form = $("#community-post-form") || $("form[data-community-create]");
    if (form) {
      if (window.initInlineValidation) window.initInlineValidation(form);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var title = (form.querySelector("[name=title], #post-title") || {}).value || "";
        var body = (form.querySelector("[name=body], #post-body, textarea") || {}).value || "";
        var category = (form.querySelector("[name=category], #post-category") || {}).value || "Other";
        if (!title.trim() || !body.trim()) {
          showToast("Please fill in title and message.", "error");
          return;
        }
        var postPayload = { title: title.trim(), body: body.trim(), category: category, author: "You" };
        if (window.CyvoraValidation) {
          var v = window.CyvoraValidation.validateCommunityPost(postPayload);
          if (!v.valid) {
            window.CyvoraValidation.showValidationErrors(v.errors);
            return;
          }
          postPayload = v.sanitized;
        }
        API.community.create(postPayload)
          .then(function () {
            showToast("Post submitted for review.", "info");
            form.reset();
            bootPublicCommunity();
          })
          .catch(function (err) {
            if (err && err.validationErrors) {
              window.CyvoraValidation ? window.CyvoraValidation.showValidationErrors(err.validationErrors) : showToast(err.message, "error");
            } else {
              showToast((err && err.message) || "Failed to create post.", "error");
            }
          });
      });
    }
  }

  /* ============================================================
     PUBLIC: learn
     ============================================================ */
  function bootLearn() {
    var grid = $("#courses-grid") || $("[data-courses-grid]");
    if (!grid) {
      // replace existing course cards container
      var cards = $all(".course-card");
      if (cards.length) grid = cards[0].parentElement;
    }

    if (window.CyvoraUI) window.CyvoraUI.showLoading(grid, 'skeleton-card');
    API.learning.courses().then(function (res) {
      var items = res.items || [];
      if (grid && items.length) {
        // if grid has placeholder cards, replace all
        grid.innerHTML = items.map(T.courseCard).join("");
      } else {
        // progressive enhancement of existing cards
        var existing = $all(".course-card");
        existing.forEach(function (card, i) {
          var c = items[i];
          if (!c) return;
          var title = card.querySelector("h4, h3");
          var summary = card.querySelector("p");
          var progressText = card.querySelector(".course-progress-text") || card.querySelector("[class*='Complete'], [class*='Finished']");
          var progressBar = card.querySelector(".course-progress-bar") || card.querySelector("[style*='width']");
          if (title) title.textContent = c.title;
          if (summary) summary.textContent = c.description || summary.textContent;
          if (progressText) {
            var pct = c.progressPct || 0;
            progressText.textContent = pct >= 100 ? "Completed" : (pct > 0 ? pct + "% Complete" : "Not Started");
          }
          if (progressBar) progressBar.style.width = (c.progressPct || 0) + "%";
        });
      }

      // overall progress header
      var total = items.length || 1;
      var completed = items.filter(function (c) { return (c.progressPct || 0) >= 100; }).length;
      var avg = Math.round(items.reduce(function (s, c) { return s + (c.progressPct || 0); }, 0) / total);
      var pctEl = $("[data-overall-progress]") || $(".text-\\[48px\\], .font-display-lg");
      $all("[data-stat='learn-pct']").forEach(function (el) {
        el.textContent = avg + "%";
        el.setAttribute("data-counter", String(avg));
      });
      var modEl = $("[data-modules-completed]");
      if (modEl) modEl.textContent = completed + " of " + total + " Modules Completed";
    }).catch(function () {});
  }

  /* ============================================================
     PUBLIC: lesson pages — update progress on quiz complete
     ============================================================ */
  function bootLesson() {
    var courseId = document.body.getAttribute("data-course-id") ||
      ($("[data-course-id]") && $("[data-course-id]").getAttribute("data-course-id")) ||
      (location.pathname.indexOf("phishing") >= 0 ? "course-phishing" : "course-cyber");

    // progress bar on lesson
    API.learning.courses().then(function (res) {
      var course = (res.items || []).find(function (c) { return c.id === courseId; });
      if (!course) return;
      var bar = $(".course-progress-bar, [data-lesson-progress]");
      var label = $("[data-lesson-progress-label]");
      if (bar) bar.style.width = (course.progressPct || 0) + "%";
      if (label) label.textContent = (course.progressPct || 0) + "% Completed";
    }).catch(function () {});

    // "Take quiz" / complete buttons
    $all("[data-complete-lesson], .quiz-complete-btn, a[href*='quiz'], button").forEach(function (btn) {
      if (!/quiz|complete|finish|certificate/i.test(btn.textContent || btn.getAttribute("data-complete-lesson") || "")) return;
      btn.addEventListener("click", function (e) {
        // only intercept if it's meant as complete
        if (btn.getAttribute("data-complete-lesson") === null && !/complete|finish/i.test(btn.textContent || "")) return;
        e.preventDefault();
        API.learning.updateProgress(courseId, 100).then(function () {
          showToast("Lesson marked complete. Progress saved.", "info");
          var bar = $(".course-progress-bar, [data-lesson-progress]");
          if (bar) bar.style.width = "100%";
        }).catch(function () {
          showToast("Could not save progress.", "error");
        });
      });
    });
  }

  /* ============================================================
     PUBLIC: report-incident — POST create
     ============================================================ */
  function bootReportIncident() {
    // The redesigned report-incident page ships its own complete wizard
    // (#incident-form + renderCategories + updateStepper). Don't double-bind.
    if (document.getElementById("incident-form")) return;
    var form = $("#report-form") || $("form[data-report-form]") || $("main form");
    if (form && window.initInlineValidation) window.initInlineValidation(form);

    var state = {
      category: "Infrastructure Issue",
      title: "",
      description: "",
      district: "Central Metro",
      location: "",
    };

    // --- Multi-step navigation ---
    var currentStep = 1;
    var totalSteps = 4;

    function goToStep(step) {
      // Hide all panels
      document.querySelectorAll('.step-panel').forEach(function (panel) {
        panel.classList.remove('active');
      });
      // Deactivate all nodes
      document.querySelectorAll('.step-node').forEach(function (node) {
        node.classList.remove('active', 'done');
      });

      // Show target panel
      var targetPanel = document.getElementById('step-' + step);
      if (targetPanel) targetPanel.classList.add('active');

      // Update step nodes
      for (let i = 1; i <= totalSteps; i++) {
        var node = document.getElementById('step-node-' + i);
        if (!node) continue;

        if (i < step) {
          node.classList.add('done');
        } else if (i === step) {
          node.classList.add('active');
        }
      }

      currentStep = step;

      // Populate review summary when reaching step 4
      if (step === 4) {
        populateReviewSummary();
      }
    }

    function populateReviewSummary() {
      var summaryContainer = document.getElementById('review-summary');
      if (!summaryContainer) return;

      // SECURITY: everything below is raw user input (typed values, restored
      // drafts, uploaded file names) going into innerHTML — it MUST be
      // escaped here, regardless of any sanitization done later at submit.
      var escFn = (window.CyvoraTemplates && window.CyvoraTemplates.esc) || function (s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      };

      var title = state.title || (titleInput && titleInput.value) || '';
      var description = state.description || (descInput && descInput.value) || '';

      summaryContainer.innerHTML = `
        <div class="flex justify-between">
          <span class="font-medium text-on-surface-variant">Category</span>
          <span class="font-semibold">${escFn(state.category) || '—'}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-medium text-on-surface-variant">Title</span>
          <span class="font-semibold">${escFn(title) || '—'}</span>
        </div>
        <div>
          <span class="font-medium text-on-surface-variant">Description</span>
          <p class="mt-1 text-on-surface">${escFn(description) || '—'}</p>
        </div>
        ${state.location ? `
        <div class="flex justify-between">
          <span class="font-medium text-on-surface-variant">Location</span>
          <span>${escFn(state.location)}</span>
        </div>` : ''}
        ${state.evidence && state.evidence.length ? `
        <div>
          <span class="font-medium text-on-surface-variant">Evidence Files</span>
          <ul class="mt-1 text-sm">
            ${state.evidence.map(f => `<li class="text-on-surface">• ${escFn(f.name)}</li>`).join('')}
          </ul>
        </div>` : ''}
      `;
    }

    // Wire Next buttons
    document.querySelectorAll('[data-next-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = parseInt(btn.getAttribute('data-next-step'));
        // Basic validation before moving forward
        if (next === 2 && !state.category) {
          showToast("Please select a category.", "error");
          return;
        }
        if (next === 3) {
          var titleEl = document.querySelector("input[name=title], #report-title");
          var descEl = document.querySelector("textarea[name=description], #report-description");
          if (titleEl && !titleEl.value.trim()) {
            showToast("Please enter a title.", "error");
            return;
          }
          if (descEl && !descEl.value.trim()) {
            showToast("Please enter a description.", "error");
            return;
          }
          state.title = titleEl ? titleEl.value.trim() : state.title;
          state.description = descEl ? descEl.value.trim() : state.description;
        }
        goToStep(next);
      });
    });

    // Wire Back buttons
    document.querySelectorAll('[data-prev-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prev = parseInt(btn.getAttribute('data-prev-step'));
        goToStep(prev);
      });
    });

    // Make step nodes clickable (allow jumping back, forward only sequentially)
    document.querySelectorAll('[data-goto]').forEach(function (el) {
      el.addEventListener('click', function () {
        var targetStep = parseInt(el.getAttribute('data-goto'));
        if (targetStep < currentStep) {
          goToStep(targetStep); // Free to go back
        } else if (targetStep === currentStep + 1) {
          // Go forward one step (will trigger validation in Next handler)
          var nextBtn = document.querySelector(`[data-next-step="${targetStep}"]`);
          if (nextBtn) nextBtn.click();
        }
      });
    });

    // category buttons
    $all(".category-btn, [data-category]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.category = btn.getAttribute("data-category") || btn.textContent.trim();
        $all(".category-btn").forEach(function (b) {
          b.classList.remove("border-2", "border-primary", "bg-primary/5");
          b.classList.add("border", "border-outline-variant");
        });
        btn.classList.add("border-2", "border-primary", "bg-primary/5");
        btn.classList.remove("border-outline-variant");
      });
    });

    // capture fields as user types
    var titleInput = $("input[name=title], #report-title, input[placeholder*='Subject'], input[placeholder*='Title']");
    var descInput = $("textarea[name=description], #report-description, textarea");
    if (titleInput) titleInput.addEventListener("input", function () { state.title = titleInput.value; });
    if (descInput) descInput.addEventListener("input", function () { state.description = descInput.value; });

    // Evidence file handling
    var evidenceInput = document.getElementById('field-evidence');
    if (evidenceInput) {
      evidenceInput.addEventListener('change', function () {
        state.evidence = Array.from(evidenceInput.files);
        saveDraft();
      });
    }

    // --- Auto-save Draft ---
    var DRAFT_KEY = 'cyvora_report_draft';

    function saveDraft() {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      } catch (e) {}
    }

    function loadDraft() {
      try {
        var draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          var parsed = JSON.parse(draft);
          Object.assign(state, parsed);

          // Restore to inputs if they exist
          var tInput = $("input[name=title], #report-title");
          var dInput = $("textarea[name=description], #report-description");
          if (tInput) tInput.value = state.title || '';
          if (dInput) dInput.value = state.description || '';
        }
      } catch (e) {}
    }

    function clearDraft() {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    }

    // Auto-save on input + show indicator
    var draftIndicator = document.getElementById('draft-indicator');

    function showDraftSaved() {
      if (!draftIndicator) {
        draftIndicator = document.createElement('div');
        draftIndicator.id = 'draft-indicator';
        draftIndicator.className = 'text-xs text-secondary flex items-center gap-1 mt-1';
        draftIndicator.innerHTML = `
          <span class="material-symbols-outlined text-sm">check_circle</span>
          <span>Draft saved</span>
        `;
        // Try to place it near the form actions
        var actions = document.querySelector('#report-form .flex.items-center.justify-between');
        if (actions && actions.parentNode) {
          actions.parentNode.insertBefore(draftIndicator, actions);
        } else if (form) {
          form.appendChild(draftIndicator);
        }
      }
      draftIndicator.style.opacity = '1';
      setTimeout(() => {
        if (draftIndicator) draftIndicator.style.opacity = '0.5';
      }, 2000);
    }

    if (titleInput) {
      titleInput.addEventListener('input', function () {
        saveDraft();
        showDraftSaved();
      });
    }
    if (descInput) {
      // Add live word counter (helpful for "max 500 words" guideline)
      var counterEl = document.createElement('div');
      counterEl.className = 'text-xs text-on-surface-variant mt-1 text-right';
      if (descInput.parentNode) {
        descInput.parentNode.appendChild(counterEl);
      }

      function updateCounter() {
        var words = descInput.value.trim().split(/\s+/).filter(Boolean).length;
        counterEl.textContent = `${words} / ~500 words`;
        counterEl.style.color = words > 500 ? '#ba1a1a' : '';
      }

      descInput.addEventListener('input', function () {
        state.description = descInput.value;
        saveDraft();
        showDraftSaved();
        updateCounter();
      });

      // Initial count
      updateCounter();
    }

    // Load any saved draft
    loadDraft();

    // Start over / Clear form button
    var resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to clear the form and start over?')) {
          clearDraft();
          location.reload(); // Simple and clean reset
        }
      });
    }

    // Enable submit button only when consent is checked (better UX)
    var consentCheckbox = document.getElementById('field-consent');
    var finalSubmitBtn = document.querySelector('#btn-next, button[type="submit"], #submit-report');

    if (consentCheckbox && finalSubmitBtn) {
      function toggleSubmitButton() {
        if (consentCheckbox.checked) {
          finalSubmitBtn.disabled = false;
          finalSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
          finalSubmitBtn.disabled = true;
          finalSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
      }
      consentCheckbox.addEventListener('change', toggleSubmitButton);
      // Initial state
      toggleSubmitButton();
    }

    function doSubmit() {
      var title = state.title || (titleInput && titleInput.value) || "";
      var description = state.description || (descInput && descInput.value) || "";
      if (!title.trim()) {
        showToast("Please enter a subject / title.", "error");
        return;
      }
      if (!description.trim()) {
        showToast("Please provide a description.", "error");
        return;
      }

      // Consent validation (important for data protection)
      var consentCheckbox = document.getElementById('field-consent');
      if (consentCheckbox && !consentCheckbox.checked) {
        showToast("Please confirm the consent checkbox to submit the report.", "error");
        consentCheckbox.focus();
        return;
      }

      var reportPayload = {
        category: state.category,
        title: title.trim(),
        description: description.trim(),
        district: state.district,
        location: state.location || "",
      };

      if (window.CyvoraValidation) {
        var v = window.CyvoraValidation.validateReport(reportPayload);
        if (!v.valid) {
          window.CyvoraValidation.showValidationErrors(v.errors);
          return;
        }
        reportPayload = v.sanitized;
      }

      API.users.me().then(function (user) {
        reportPayload.district = (user && user.district) || reportPayload.district || state.district;
        reportPayload.reporterName = (user && user.name) || "Citizen";
        reportPayload.severity = "medium";
        return API.reports.create(reportPayload);
      }).then(function (report) {
        clearDraft();
        showToast("Report filed: " + (report.trackingId || report.id), "info");
        setTimeout(function () {
          location.href = "my-reports.html";
        }, 1200);
      }).catch(function (err) {
        if (err && err.validationErrors && window.CyvoraValidation) {
          window.CyvoraValidation.showValidationErrors(err.validationErrors);
        } else {
          showToast((err && err.message) || "Failed to submit report.", "error");
        }
      });
    }

    var submitBtns = $all("button, [type=submit]");
    submitBtns.forEach(function (btn) {
      if (/next|previous|back|draft/i.test(btn.textContent || "")) return;
      btn.addEventListener("click", function (e) {
        if (btn.type === "submit" || /publish|submit|send|file|report now/i.test(btn.textContent || "")) {
          e.preventDefault();
          doSubmit();
        }
      });
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        doSubmit();
      });
    }

    // also hook the final "Next" on last step if present
    var nextBtns = $all("button");
    nextBtns.forEach(function (btn) {
      if (/^next/i.test((btn.textContent || "").trim()) && btn.closest("#step-4, [data-step='4']")) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          doSubmit();
        });
      }
    });
  }

  /* ============================================================
     PUBLIC: profile — load + save
     ============================================================ */
  function bootProfile() {
    // ---- Tab switching (General / Security / Notifications) ----
    var tabs = $all(".profile-tab");
    var panels = $all(".profile-panel");
    function showPanel(name) {
      tabs.forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-tab") === name); });
      panels.forEach(function (p) { p.classList.toggle("hidden", p.getAttribute("data-panel") !== name); });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { showPanel(t.getAttribute("data-tab")); });
    });
    // Deep-link support: profile.html#security
    var hash = (location.hash || "").replace("#", "");
    if (hash && $('[data-panel="' + hash + '"]')) showPanel(hash);

    // ---- Avatar upload with live preview ----
    var photoInput = $("#profile-photo-input");
    var avatarImg = $("#profile-avatar-img");
    var avatarIcon = $("#profile-avatar-icon");
    var topbarAvatar = $('header a[aria-label="Profile"]');

    function applyAvatar(dataUrl) {
      if (!dataUrl) return;
      if (avatarImg) { avatarImg.src = dataUrl; avatarImg.classList.remove("hidden"); }
      if (avatarIcon) avatarIcon.classList.add("hidden");
      // Mirror into the topbar avatar too.
      if (topbarAvatar) {
        var icon = topbarAvatar.querySelector(".material-symbols-outlined");
        if (icon) icon.classList.add("hidden");
        var img = topbarAvatar.querySelector("img");
        if (!img) {
          img = document.createElement("img");
          img.className = "h-full w-full object-cover";
          img.alt = "Profile";
          topbarAvatar.appendChild(img);
        }
        img.src = dataUrl;
      }
    }

    // Restore a previously saved photo.
    var savedPhoto = window.CyvoraStore ? window.CyvoraStore.get("profile_photo", null) : null;
    if (savedPhoto) applyAvatar(savedPhoto);

    if (photoInput) {
      photoInput.addEventListener("change", function () {
        var file = photoInput.files && photoInput.files[0];
        if (!file) return;
        if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
          showToast("Please choose a PNG, JPG or WebP image.", "error");
          photoInput.value = "";
          return;
        }
        if (file.size > 4 * 1024 * 1024) {
          showToast("Image is too large (max 4 MB).", "error");
          photoInput.value = "";
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          applyAvatar(reader.result);
          if (window.CyvoraStore) window.CyvoraStore.set("profile_photo", reader.result);
          showToast("Profile photo updated.", "success");
          // When live, upload to the backend; ignored in mock mode.
          if (API.users && API.users.uploadAvatar) API.users.uploadAvatar(reader.result).catch(function () {});
        };
        reader.onerror = function () { showToast("Could not read that image.", "error"); };
        reader.readAsDataURL(file);
      });
    }

    // ---- Load user into the general form + header ----
    API.users.me().then(function (user) {
      if (!user) return;
      var nameEl = $("input[name=name], #full-name, #profile-name-input");
      var emailEl = $("input[name=email], #email, #profile-email");
      var phoneEl = $("input[name=phone], #phone, #profile-phone");
      var districtEl = $("select[name=district], #district, #profile-district");
      if (nameEl) nameEl.value = user.name || "";
      if (emailEl) emailEl.value = user.email || "";
      if (phoneEl) phoneEl.value = user.phone || "";
      if (districtEl && user.district) {
        $all("option", districtEl).forEach(function (o) {
          if (o.value === user.district || o.textContent.trim() === user.district) o.selected = true;
        });
      }
      $all("[data-profile-name]").forEach(function (el) { el.textContent = user.name; });
      $all("[data-profile-trust]").forEach(function (el) {
        el.textContent = user.trustScore != null ? Number(user.trustScore).toFixed(1) : "—";
      });
      $all("[data-profile-email]").forEach(function (el) { el.textContent = user.email; });
      $all("[data-profile-reports]").forEach(function (el) {
        el.textContent = (user.reportsFiled != null ? user.reportsFiled : (user.reportCount != null ? user.reportCount : "—"));
      });
      // If the user record carries an avatar and none is stored locally, show it.
      if (!savedPhoto && (user.avatarUrl || user.photoUrl)) applyAvatar(user.avatarUrl || user.photoUrl);
    }).catch(function () {});

    // ---- General form submit ----
    var form = $("#profile-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var payload = {
          name: (form.querySelector("[name=name]") || {}).value || "",
          email: (form.querySelector("[name=email]") || {}).value || "",
          phone: (form.querySelector("[name=phone]") || {}).value || "",
          district: (form.querySelector("[name=district]") || {}).value || "",
        };
        (API.users.update ? API.users.update(payload) : Promise.resolve(payload)).then(function () {
          $all("[data-profile-name]").forEach(function (el) { el.textContent = payload.name; });
          showToast("Profile saved.", "success");
        }).catch(function () { showToast("Could not save your profile.", "error"); });
      });
    }
    var discard = $("#profile-discard");
    if (discard) discard.addEventListener("click", function () { location.reload(); });

    // ---- Security form ----
    var secForm = $("#security-form");
    if (secForm) {
      secForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var next = (secForm.querySelector("[name=next]") || {}).value || "";
        var confirm = (secForm.querySelector("[name=confirm]") || {}).value || "";
        if (next.length < 8) { showToast("New password must be at least 8 characters.", "error"); return; }
        if (next !== confirm) { showToast("New passwords do not match.", "error"); return; }
        showToast("Password updated.", "success");
        secForm.reset();
      });
      var revoke = $("#revoke-sessions");
      if (revoke) revoke.addEventListener("click", function () { showToast("Signed out of other sessions.", "success"); });
    }

    // ---- Notifications form (syncs to preferences) ----
    var notifForm = $("#profile-notif-form");
    if (notifForm) {
      if (API.preferences && API.preferences.get) {
        API.preferences.get().then(function (p) {
          var n = (p && p.notifications) || {};
          ["alerts", "reports", "learning", "community"].forEach(function (k) {
            var el = notifForm.querySelector("[name=" + k + "]");
            if (el && n[k] != null) el.checked = !!n[k];
          });
        }).catch(function () {});
      }
      notifForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var notifications = {};
        ["alerts", "reports", "learning", "community"].forEach(function (k) {
          var el = notifForm.querySelector("[name=" + k + "]");
          notifications[k] = el ? !!el.checked : false;
        });
        (API.preferences && API.preferences.update ? API.preferences.update({ notifications: notifications }) : Promise.resolve())
          .then(function () { showToast("Notification preferences saved.", "success"); })
          .catch(function () { showToast("Could not save preferences.", "error"); });
      });
    }
  }

  /* ============================================================
     ADMIN: reports (already has loader — enhance if empty tbody)
     ============================================================ */
  function bootAdminReports() {
    var tbody = $("#admin-reports-tbody");
    if (!tbody) return;
    if (window.__cyvoraAdminReportsBound) return;

    var all = [];
    // Populate filter dropdowns from canonical data.
    var catSel = $("#admin-filter-category");
    if (catSel) {
      var cats = (window.CyvoraMockData && window.CyvoraMockData.reportCategories) || [];
      cats.forEach(function (c) { var o = document.createElement("option"); o.value = c.name; o.textContent = c.name; catSel.appendChild(o); });
    }
    var regionSel = $("#admin-filter-region");
    if (regionSel) {
      ["Adamawa","Centre","East","Far North","Littoral","North","Northwest","South","Southwest","West"].forEach(function (rg) {
        var o = document.createElement("option"); o.value = rg; o.textContent = rg; regionSel.appendChild(o);
      });
    }

    function applyFilters() {
      var id = (($("#admin-filter-id") || {}).value || "").toLowerCase();
      var cat = ($("#admin-filter-category") || {}).value || "";
      var st = ($("#admin-filter-status") || {}).value || "";
      var rg = ($("#admin-filter-region") || {}).value || "";
      render(all.filter(function (r) {
        if (id && (String(r.trackingId || r.id).toLowerCase().indexOf(id) === -1)) return false;
        if (cat && r.category !== cat) return false;
        if (st && r.status !== st) return false;
        if (rg && r.district !== rg) return false;
        return true;
      }));
    }

    function render(items) {
      if (!items.length) {
        tbody.innerHTML = '<tr><td class="px-6 py-10 text-center text-on-surface-variant" colspan="8">No reports match these filters.</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(function (r) { return T.reportRow(r, { admin: true }); }).join("");
      tbody.querySelectorAll(".review-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-id");
          var next = btn.getAttribute("data-next") || "approved";
          API.reports.updateStatus(id, next).then(function () {
            showToast("Report updated.", "success");
            var r = all.find(function (x) { return x.id === id; });
            if (r) r.status = next;
            applyFilters();
          });
        });
      });
    }

    ["#admin-filter-id", "#admin-filter-category", "#admin-filter-status", "#admin-filter-region"].forEach(function (sel) {
      var el = $(sel);
      if (el) el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });

    if (window.CyvoraUI) window.CyvoraUI.showLoading(tbody, 'skeleton-table');
    API.reports.list().then(function (res) { all = res.items || []; render(all); })
      .catch(function () {
        tbody.innerHTML = '<tr><td class="px-6 py-10 text-center text-error" colspan="8">Could not load reports.</td></tr>';
      });
  }

  /* ============================================================
     ADMIN: alerts — load history + create
     ============================================================ */
  function bootAdminAlerts() {
    // history table if present
    var tbody = $("#alerts-history-tbody") || $("table tbody");
    if (tbody && tbody.id !== "admin-reports-tbody") {
      if (window.CyvoraUI) window.CyvoraUI.showLoading(tbody, 'skeleton-table');
      API.alerts.list().then(function (res) {
        var items = res.items || [];
        if (!items.length) return;
        // only replace if looks empty / placeholder
        if (tbody.querySelectorAll("tr").length <= 3 || tbody.getAttribute("data-dynamic") === "1") {
          tbody.setAttribute("data-dynamic", "1");
          tbody.innerHTML = items.map(function (a) {
            return (
              '<tr class="bg-white">' +
                '<td class="px-6 py-4 font-label-md text-primary">#' + T.esc(a.id) + '</td>' +
                '<td class="px-6 py-4 font-caption">' + T.formatDateTime(a.issuedAt) + '</td>' +
                '<td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-caption ' +
                  (a.severity === "critical" || a.severity === "high" ? "bg-error/10 text-error" : "bg-primary/10 text-primary") +
                '">' + T.esc(a.severity || "info") + '</span></td>' +
                '<td class="px-6 py-4 font-body-md">' + T.esc(a.title) + '</td>' +
                '<td class="px-6 py-4">' + (a.active ? '<span class="text-secondary font-label-md">Active</span>' : '<span class="text-outline">Ended</span>') + '</td>' +
              '</tr>'
            );
          }).join("");
        }
      }).catch(function () {});
    }

    // create form
    var form = $("form#create-alert-form") || $("form[data-create-alert]") || $("main form");
    if (form && window.initInlineValidation) window.initInlineValidation(form);
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var severityEl = form.querySelector("[name=severity], #alert-level, select");
      var titleEl = form.querySelector("[name=title], #alert-heading, input[placeholder*='Heading'], input[type=text]");
      var msgEl = form.querySelector("[name=message], #alert-body, textarea");
      var regionEl = form.querySelector("[name=region], #alert-region");

      var severity = "high";
      if (severityEl) {
        var v = (severityEl.value || severityEl.textContent || "").toLowerCase();
        if (/urgent|level 1|critical/.test(v)) severity = "critical";
        else if (/advisory|level 2|medium/.test(v)) severity = "medium";
        else if (/info|level 3|low/.test(v)) severity = "low";
        else severity = "high";
      }

      var title = (titleEl && titleEl.value) || "";
      var message = (msgEl && msgEl.value) || "";
      if (!title.trim() || !message.trim()) {
        showToast("Heading and message are required.", "error");
        return;
      }

      var alertPayload = {
        severity: severity,
        category: severity === "critical" || severity === "high" ? "SEVERE WEATHER" : "PUBLIC NOTICE",
        title: title.trim(),
        message: message.trim().slice(0, 240),
        region: (regionEl && regionEl.value) || "All Districts",
      };

      if (window.CyvoraValidation) {
        var v = window.CyvoraValidation.validateAlert(alertPayload);
        if (!v.valid) {
          window.CyvoraValidation.showValidationErrors(v.errors);
          return;
        }
        alertPayload = v.sanitized;
      }

      API.alerts.create(alertPayload).then(function (alert) {
        showToast("Alert published: " + alert.title, "info");
        form.reset();
        // refresh history
        if (tbody) {
          tbody.setAttribute("data-dynamic", "1");
          bootAdminAlerts();
        }
      }).catch(function () {
        showToast("Failed to publish alert.", "error");
      });
    });
  }

  /* ============================================================
     ADMIN: learning
     ============================================================ */
  function bootAdminLearning() {
    var host = $("#admin-courses") || $("[data-admin-courses]");
    API.learning.courses().then(function (res) {
      var items = res.items || [];
      var countEl = $("[data-admin-courses-count]");
      if (countEl) countEl.textContent = items.length + " modules";

      if (host && host.tagName !== "TABLE" && host.tagName !== "TBODY") {
        // Card list layout (redesigned page).
        host.innerHTML = items.map(function (c) {
          var done = c.status === "completed" || (c.progressPct || 0) >= 100;
          return (
            '<div class="flex items-center justify-between gap-4 px-6 py-4">' +
              '<div class="min-w-0">' +
                '<div class="flex items-center gap-2"><span class="material-symbols-outlined text-[20px] text-primary">school</span>' +
                '<p class="truncate text-body-md text-on-surface">' + T.esc(c.title) + '</p></div>' +
                '<p class="mt-0.5 text-caption text-on-surface-variant">' + (c.lessonsCount || "—") + ' lessons · ' + T.esc(c.duration || "") + '</p>' +
              '</div>' +
              '<div class="flex shrink-0 items-center gap-3">' +
                '<span class="chip ' + (done ? "chip-secure" : "chip-review") + '">' + (done ? "Live" : "Draft") + '</span>' +
                '<span class="text-label-md text-on-surface-variant">' + (c.progressPct != null ? c.progressPct + "%" : "—") + '</span>' +
                '<button class="btn-ghost btn-sm">Edit</button>' +
              '</div>' +
            '</div>'
          );
        }).join("");
      } else {
        // Legacy table fallback.
        var tbody = $("table tbody");
        if (tbody && items.length) {
          tbody.innerHTML = items.map(function (c) {
            return '<tr><td class="px-6 py-4">' + T.esc(c.title) + '</td><td class="px-6 py-4">' + T.esc(c.status || "live") + '</td><td class="px-6 py-4">' + (c.progressPct != null ? c.progressPct + "%" : "—") + '</td></tr>';
          }).join("");
        }
      }
    }).catch(function () {
      if (host) host.innerHTML = '<div class="px-6 py-10 text-center text-error">Could not load modules.</div>';
    });

    // AI "Design next module" buttons.
    ["#admin-generate-module", "#admin-generate-module-2"].forEach(function (sel) {
      var btn = $(sel);
      if (btn) btn.addEventListener("click", function () {
        btn.disabled = true;
        var orig = btn.textContent;
        btn.textContent = "Generating…";
        API.ai.generateLesson({ topic: "Social engineering", level: "beginner" }).then(function (lesson) {
          showToast("AI draft ready: " + (lesson.title || "New module"), "success");
        }).catch(function () {
          showToast("AI generation needs the live AI service.", "error");
        }).then(function () { btn.disabled = false; btn.textContent = orig; });
      });
    });
  }

  /* ============================================================
     ADMIN: community moderation
     ============================================================ */
  function bootAdminCommunity() {
    var host = $("#admin-community-list");
    if (!host) return;
    API.community.list ? API.community.list().then(render).catch(fail) : (API.community.posts ? API.community.posts().then(render).catch(fail) : fail());
    function fail() { host.innerHTML = '<div class="px-6 py-10 text-center text-error">Could not load posts.</div>'; }
    function render(res) {
      var items = (res && (res.items || res)) || [];
      if (!items.length) { host.innerHTML = '<div class="px-6 py-10 text-center text-on-surface-variant">No posts to moderate.</div>'; return; }
      host.innerHTML = items.map(function (p) {
        var pending = p.status === "pending";
        return (
          '<div class="flex items-start justify-between gap-4 px-6 py-4">' +
            '<div class="min-w-0">' +
              '<div class="flex items-center gap-2"><p class="text-body-md text-on-surface">' + T.esc(p.title || "Post") + '</p>' +
              '<span class="chip ' + (pending ? "chip-review" : "chip-secure") + '">' + (pending ? "Pending" : "Published") + '</span></div>' +
              '<p class="mt-0.5 truncate text-caption text-on-surface-variant">' + T.esc(p.author || "—") + ' · ' + T.esc((p.body || "").slice(0, 80)) + '</p>' +
            '</div>' +
            '<div class="flex shrink-0 gap-2">' +
              (pending ? '<button class="btn btn-primary btn-sm" data-mod-approve="' + T.esc(p.id) + '">Approve</button>' : '') +
              '<button class="btn btn-outline btn-sm" data-mod-remove="' + T.esc(p.id) + '">Remove</button>' +
            '</div>' +
          '</div>'
        );
      }).join("");
      host.querySelectorAll("[data-mod-approve]").forEach(function (b) {
        b.addEventListener("click", function () { showToast("Post approved.", "success"); b.closest("div.flex").querySelector(".chip").className = "chip chip-secure"; b.remove(); });
      });
      host.querySelectorAll("[data-mod-remove]").forEach(function (b) {
        b.addEventListener("click", function () { showToast("Post removed.", "info"); var row = b.closest("div.flex.items-start"); if (row) row.remove(); });
      });
    }
  }

  /* ============================================================
     ADMIN: dashboard overview stats
     ============================================================ */
  function bootAdminIndex() {
    Promise.all([
      API.reports.list(),
      API.users.list(),
      API.alerts.list(),
      API.learning.courses(),
    ]).then(function (results) {
      var reports = (results[0] && results[0].items) || [];
      var users = (results[1] && results[1].items) || [];
      var alerts = (results[2] && results[2].items) || [];
      var courses = (results[3] && results[3].items) || [];

      var activeReports = reports.filter(function (r) { return r.status === "pending" || r.status === "in_review"; }).length;
      var activeAlerts = alerts.filter(function (a) { return a.active; }).length;

      // The overview KPIs show national-scale figures (seeded in markup as
      // realistic demo numbers). We only override when the live dataset is
      // clearly larger than the demo seed, so the dashboard still looks
      // credible in mock mode but reflects real totals once connected.
      function setStat(key, val, floor) {
        $all('[data-stat="' + key + '"]').forEach(function (el) {
          var current = parseFloat(el.getAttribute("data-counter")) || 0;
          if (val > (floor != null ? floor : current)) {
            el.setAttribute("data-counter", String(val));
            el.textContent = String(val);
          }
        });
      }
      if ($('[data-stat="active-reports"]')) {
        setStat("active-reports", activeReports);
        setStat("total-users", users.length);
        setStat("modules", courses.length);
        setStat("alerts", activeAlerts);
      }

      // Recent reports table (new hook first, then legacy fallback).
      var tbody = $("#admin-overview-tbody") || $("table tbody");
      if (tbody && reports.length) {
        tbody.innerHTML = reports.slice(0, 5).map(function (r) {
          var meta = T.STATUS_META[r.status] || T.STATUS_META.pending;
          return (
            '<tr>' +
              '<td class="px-6 py-3 text-label-md text-primary">#' + T.esc(r.trackingId || r.id) + '</td>' +
              '<td class="px-6 py-3">' + T.esc(r.category) + '</td>' +
              '<td class="px-6 py-3">' + T.esc(r.reporterName || "—") + '</td>' +
              '<td class="px-6 py-3"><span class="chip ' + (meta.chip || "chip-pending") + '"><span class="chip-dot ' + (meta.dotSolid || "bg-outline") + '"></span>' + meta.label + '</span></td>' +
              '<td class="px-6 py-3 text-caption text-outline">' + T.formatDateTime(r.createdAt) + '</td>' +
            '</tr>'
          );
        }).join("");
      }
    }).catch(function () {});
  }

  /* ============================================================
     Boot
     ============================================================ */
  /* ============================================================
     PUBLIC: leaderboard (national / regional / institutional)
     ============================================================ */
  function bootLeaderboard() {
    var tbody = $("#lb-body");
    if (!tbody) return;

    function load(scope) {
      tbody.innerHTML = T.emptyState("Loading rankings…", 5);
      API.leaderboard.get(scope).then(function (res) {
        var items = res.items || [];
        // National scope: top 3 live on the static podium above the table.
        if (scope === "national") items = items.filter(function (e) { return e.rank > 3; });
        if (!items.length) {
          tbody.innerHTML = T.emptyState("No rankings available yet.", 5);
          return;
        }
        tbody.innerHTML = items.map(T.leaderboardRow).join("");
      }).catch(function () {
        tbody.innerHTML = T.errorState("Could not load the leaderboard. Please refresh.", 5);
      });
    }

    $all("#lb-tabs .lb-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $all("#lb-tabs .lb-tab").forEach(function (b) {
          b.classList.remove("bg-primary", "text-on-primary");
          b.classList.add("bg-surface-container", "text-on-surface", "border", "border-outline-variant");
        });
        btn.classList.add("bg-primary", "text-on-primary");
        btn.classList.remove("bg-surface-container", "text-on-surface", "border", "border-outline-variant");
        load(btn.getAttribute("data-scope") || "national");
      });
    });

    load("national");
  }

  /* ============================================================
     PUBLIC: national threat monitor
     ============================================================ */
  function bootMonitor() {
    var heat = $("#heatmap");
    var catBars = $("#cat-bars");
    if (!heat && !catBars) return;

    API.monitor.stats().then(function (m) {
      var regions = m.regions || [];
      if (heat && regions.length) {
        var maxV = Math.max.apply(null, regions.map(function (r) { return r.incidents; }));
        heat.innerHTML = regions.map(function (r) {
          var intensity = maxV ? r.incidents / maxV : 0;
          var bg = "rgba(11,61,145," + (0.15 + intensity * 0.75) + ")";
          var color = intensity > 0.5 ? "#fff" : "#1a1c1e";
          return '<div class="rounded-lg p-3 text-center" style="background:' + bg + ';color:' + color + '">' +
            '<p class="text-caption font-label-md opacity-90">' + T.esc(r.name) + '</p>' +
            '<p class="text-lg font-bold">' + Number(r.incidents) + '</p></div>';
        }).join("");
      }
      if (catBars && (m.categories || []).length) {
        catBars.innerHTML = m.categories.map(function (c) {
          return '<li>' +
            '<div class="flex justify-between text-label-md mb-1"><span>' + T.esc(c.name) + '</span><span class="font-semibold">' + Number(c.pct) + '%</span></div>' +
            '<div class="h-2 bg-surface-container rounded-full overflow-hidden"><div class="h-full bg-primary rounded-full" style="width:' + (Number(c.pct) * 3) + '%"></div></div>' +
          '</li>';
        }).join("");
      }
      // Stat cards
      var repEl = $('[data-stat="reports"]');
      if (repEl && m.monthlyReports != null) repEl.textContent = Number(m.monthlyReports).toLocaleString("en-US");
    }).catch(function () {
      if (heat) heat.innerHTML = '<p class="text-error font-body-md col-span-full">Could not load monitor data.</p>';
    });

    // Live feed: recent anonymised reports — same dataset as My Reports/admin.
    var feed = $("#live-feed");
    if (feed) {
      API.reports.list().then(function (res) {
        var items = (res.items || []).slice(0, 10);
        if (!items.length) {
          feed.innerHTML = '<p class="px-6 py-6 text-on-surface-variant font-body-md">No recent reports.</p>';
          return;
        }
        feed.innerHTML = items.map(function (r) {
          return '<div class="px-6 py-4 flex items-center justify-between gap-4">' +
            '<div class="min-w-0">' +
              '<p class="font-label-lg text-on-surface truncate">' + T.esc(r.title) + '</p>' +
              '<p class="text-caption text-outline mt-0.5">' + T.esc(r.category) + ' · ' + T.esc(r.district || "—") + '</p>' +
            '</div>' +
            '<span class="text-caption text-on-surface-variant whitespace-nowrap">' + T.formatDateTime(r.createdAt) + '</span>' +
          '</div>';
        }).join("");
      }).catch(function () {
        feed.innerHTML = '<p class="px-6 py-6 text-error font-body-md">Could not load the live feed.</p>';
      });
    }
  }

  /* ============================================================
     PUBLIC: daily challenge
     ============================================================ */
  function bootDailyChallenge() {
    var optsHost = $("#daily-opts");
    if (!optsHost) return;
    var questionEl = $("#daily-question");
    var streakEl = $("#streak");
    var resultEl = $("#daily-result");

    API.challenge.today().then(function (dc) {
      if (!dc) { optsHost.innerHTML = '<p class="text-on-surface-variant font-body-md">No challenge available today.</p>'; return; }
      if (questionEl) questionEl.textContent = dc.question;
      if (streakEl) streakEl.textContent = dc.streakDays + " days";

      optsHost.innerHTML = (dc.options || []).map(function (o, i) {
        return '<button type="button" data-i="' + i + '" class="daily-opt text-left px-5 py-4 border border-outline-variant rounded-lg hover:border-primary transition">' + T.esc(o.text) + '</button>';
      }).join("");

      var correctIdx = (dc.options || []).findIndex(function (o) { return o.correct; });

      $all(".daily-opt", optsHost).forEach(function (btn) {
        btn.addEventListener("click", function () {
          $all(".daily-opt", optsHost).forEach(function (b) { b.disabled = true; });
          var picked = Number(btn.getAttribute("data-i"));
          if (!resultEl) return;
          if (picked === correctIdx) {
            btn.classList.add("border-secondary", "bg-secondary/10");
            resultEl.className = "mt-6 p-4 rounded-lg bg-secondary/10 border border-secondary/30";
            resultEl.innerHTML =
              '<p class="font-semibold text-secondary flex items-center gap-2"><span class="material-symbols-outlined">check_circle</span> ' + T.esc(dc.correctFeedback || "Correct!") + '</p>' +
              '<p class="text-body-md text-on-surface-variant mt-2">' + T.esc(dc.correctExplanation || "") + '</p>' +
              '<a href="learn.html" class="inline-flex mt-4 text-primary font-label-lg hover:underline">Continue learning →</a>';
          } else {
            btn.classList.add("border-error", "bg-error/10");
            var correctBtn = optsHost.querySelector('[data-i="' + correctIdx + '"]');
            if (correctBtn) correctBtn.classList.add("border-secondary", "bg-secondary/10");
            resultEl.className = "mt-6 p-4 rounded-lg bg-error/10 border border-error/30";
            resultEl.innerHTML =
              '<p class="font-semibold text-error">' + T.esc(dc.incorrectFeedback || "Not quite.") + '</p>' +
              '<p class="text-body-md text-on-surface-variant mt-2">' + T.esc(dc.incorrectExplanation || "") + '</p>';
          }
          resultEl.classList.remove("hidden");
        });
      });
    }).catch(function () {
      optsHost.innerHTML = '<p class="text-error font-body-md">Could not load today\'s challenge. Please refresh.</p>';
    });
  }

  /* ============================================================
     PUBLIC: certificates (holder name from session user)
     ============================================================ */
  function bootCertificates() {
    var holderEl = $("[data-cert-holder]");
    if (holderEl) {
      API.users.me().then(function (user) {
        if (user && user.name) holderEl.textContent = user.name;
      }).catch(function () {});
    }
  }

  /* ============================================================
     PUBLIC: support chat
     ============================================================ */
  function bootSupportChat() {
    var thread = $("#chat-thread");
    var form = $("#chat-form");
    var input = $("#chat-input");
    var quick = $("#chat-quick-replies");
    if (!thread || !form || !input) return;

    // Messages are built with createElement/textContent — user content
    // never touches innerHTML, so no escaping gaps are possible here.
    function addMessage(text, who, link) {
      var row = document.createElement("div");
      row.className = "flex " + (who === "user" ? "justify-end" : "justify-start");

      var bubble = document.createElement("div");
      bubble.className = who === "user"
        ? "max-w-[80%] bg-primary text-on-primary rounded-2xl rounded-br-sm px-4 py-3 font-body-md"
        : "max-w-[80%] bg-surface-container-low text-on-surface border border-outline-variant rounded-2xl rounded-bl-sm px-4 py-3 font-body-md";

      var p = document.createElement("p");
      p.textContent = text;
      bubble.appendChild(p);

      if (link && link.href) {
        var a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.label || link.href;
        a.className = "inline-flex items-center gap-1 mt-2 text-primary font-label-lg text-sm hover:underline";
        bubble.appendChild(a);
      }

      var time = document.createElement("p");
      time.className = "text-caption mt-1 " + (who === "user" ? "text-on-primary/60" : "text-outline");
      time.textContent = new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      bubble.appendChild(time);

      row.appendChild(bubble);
      thread.appendChild(row);
      thread.scrollTop = thread.scrollHeight;
      return row;
    }

    function addTyping() {
      var row = document.createElement("div");
      row.className = "flex justify-start";
      row.setAttribute("data-typing", "1");
      var bubble = document.createElement("div");
      bubble.className = "bg-surface-container-low border border-outline-variant rounded-2xl rounded-bl-sm px-4 py-3";
      bubble.innerHTML = '<span class="inline-flex gap-1 items-center">' +
        '<span class="w-2 h-2 rounded-full bg-outline animate-bounce"></span>' +
        '<span class="w-2 h-2 rounded-full bg-outline animate-bounce" style="animation-delay:120ms"></span>' +
        '<span class="w-2 h-2 rounded-full bg-outline animate-bounce" style="animation-delay:240ms"></span></span>';
      row.appendChild(bubble);
      thread.appendChild(row);
      thread.scrollTop = thread.scrollHeight;
      return row;
    }

    function send(text) {
      text = String(text || "").trim();
      if (!text) return;
      addMessage(text, "user");
      input.value = "";
      input.focus();
      var typing = addTyping();
      API.support.sendMessage(text).then(function (res) {
        typing.remove();
        addMessage(res.reply, "agent", res.link);
      }).catch(function (err) {
        typing.remove();
        addMessage((err && err.message) || "Sorry — something went wrong. Please try again.", "agent");
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      send(input.value);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send(input.value);
      }
    });

    // Quick replies
    var QUICK = [
      "I want to report a scam",
      "Someone asked for my MoMo PIN",
      "Check my report status",
      "Verify a certificate",
      "Talk to a human agent",
    ];
    if (quick) {
      QUICK.forEach(function (q) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = q;
        btn.className = "px-4 py-2 rounded-full border border-outline-variant bg-surface-container-low text-on-surface-variant text-label-md hover:border-primary hover:text-primary transition";
        btn.addEventListener("click", function () { send(q); });
        quick.appendChild(btn);
      });
    }

    // Greeting (uses session user's first name — same data as everywhere else)
    API.users.me().then(function (user) {
      var first = user && user.name ? user.name.split(" ")[0] : "";
      addMessage("Hello" + (first ? " " + first : "") + "! I'm the VARNIS support assistant. Ask me about reporting an incident, your report status, lessons, or certificates — or request a human agent anytime.", "agent");
    }).catch(function () {
      addMessage("Hello! I'm the VARNIS support assistant. How can I help today?", "agent");
    });
  }

  /* ============================================================
     PUBLIC: report detail
     ============================================================ */
  function bootReportDetail() {
    var loading = $("#report-detail-loading");
    var errorEl = $("#report-detail-error");
    var detail = $("#report-detail");
    if (!detail) return;

    var id = new URLSearchParams(location.search).get("id");
    if (!id) { showError(); return; }

    function showError() {
      if (loading) loading.classList.add("hidden");
      if (errorEl) errorEl.classList.remove("hidden");
      if (detail) detail.classList.add("hidden");
    }

    var TIPS = {
      "Mobile Money Fraud": ["Never share your MoMo PIN or OTP — operators never ask for it.", "Call your provider directly using the number on their official site.", "Report the sender's number so others are protected."],
      "Phishing": ["Don't click links in unexpected messages — type the address yourself.", "Check the sender's exact address and domain for small misspellings.", "Enable two-step verification on important accounts."],
      "AI-Generated Scam": ["Verify unusual voice or video requests through a second channel.", "Agree a family safe-word for urgent money requests.", "Slow down — urgency is the scammer's main tool."],
      "Identity Theft": ["Never send ID scans to unverified recruiters or pages.", "Report impersonation accounts to the platform.", "Monitor your accounts for unfamiliar activity."],
      "Hacking": ["Change the password from a device you trust.", "Turn on two-step verification everywhere it's offered.", "Warn your contacts if your account may have sent scam links."],
      "Business Attack": ["Isolate affected devices from the network immediately.", "Never enable macros in unexpected attachments.", "Keep offline backups and a tested recovery plan."],
      "Disinformation": ["Check claims against official sources before sharing.", "Report coordinated false narratives rather than engaging.", "Be wary of emotionally charged, unsourced posts."],
      "Child Safety": ["Preserve evidence and do not engage the offender.", "Report to the platform and to authorities immediately.", "Talk to the child in a calm, supportive way."],
      "Other": ["Keep any evidence (screenshots, numbers, links).", "Avoid further contact with the suspected source.", "Check the Learn zones for guidance on this threat."]
    };

    API.reports.get(id).then(function (r) {
      if (loading) loading.classList.add("hidden");
      detail.classList.remove("hidden");

      var meta = (T.STATUS_META && T.STATUS_META[r.status]) || { label: r.status, chip: "chip-pending", dotSolid: "bg-outline" };
      var icon = (T.CATEGORY_ICON && T.CATEGORY_ICON[r.category]) || "more_horiz";
      var tracking = "#" + (r.trackingId || r.id);

      set("[data-detail-crumb]", tracking);
      set("[data-detail-tracking]", tracking);
      set("[data-detail-title]", r.title);
      set("[data-detail-meta]", r.category + " · " + (r.district || "—"));
      set("[data-detail-description]", r.description || "—");
      set("[data-detail-region]", r.district || "—");
      set("[data-detail-submitted]", T.formatDateTime(r.createdAt));
      set("[data-detail-reporter]", r.isAnonymous ? "Anonymous" : (r.reporterName || "You"));

      // Status chip
      var chip = $("[data-detail-status]");
      if (chip) {
        chip.className = "chip " + (r.severity === "critical" || r.severity === "high" ? "chip-error" : meta.chip);
        var dot = chip.querySelector(".chip-dot");
        if (dot) dot.className = "chip-dot " + meta.dotSolid;
      }
      set("[data-detail-status-label]", meta.label);

      // Category (icon + name)
      var cat = $("[data-detail-category]");
      if (cat) cat.innerHTML = '<span class="material-symbols-outlined text-[18px] text-on-surface-variant">' + icon + '</span><span>' + T.esc(r.category) + "</span>";

      // Severity chip
      var sev = $("[data-detail-severity]");
      if (sev) {
        var sevCls = (r.severity === "critical" || r.severity === "high") ? "chip-error" : (r.severity === "medium" ? "chip-review" : "chip-pending");
        sev.innerHTML = '<span class="chip ' + sevCls + '">' + T.esc((r.severity || "—")) + "</span>";
      }

      // Evidence
      var ev = $("[data-detail-evidence]");
      if (ev && r.evidence && r.evidence.length) {
        ev.innerHTML = r.evidence.map(function (f) {
          return '<div class="flex items-center gap-2 rounded-md border border-outline-variant px-3 py-2 text-body-md"><span class="material-symbols-outlined text-[20px] text-on-surface-variant">attach_file</span>' + T.esc(f.name || "Evidence file") + "</div>";
        }).join("");
      }

      // Status timeline
      var tl = $("[data-detail-timeline]");
      if (tl) tl.innerHTML = buildTimeline(r.status, r.createdAt);

      // Safety tips
      var tips = $("[data-detail-tips]");
      var list = TIPS[r.category] || TIPS.Other;
      if (tips) tips.innerHTML = list.map(function (t) {
        return '<li class="flex gap-2"><span class="material-symbols-outlined text-secondary text-[18px]">check_circle</span><span>' + T.esc(t) + "</span></li>";
      }).join("");
    }).catch(showError);

    function set(sel, val) { var el = detail.querySelector(sel); if (el) el.textContent = val; }

    function buildTimeline(status, createdAt) {
      var steps = [
        { key: "submitted", label: "Submitted", done: true },
        { key: "in_review", label: "In review", done: ["in_review", "approved", "resolved"].indexOf(status) !== -1 || status === "rejected" },
        { key: "decision",  label: status === "rejected" ? "Rejected" : "Approved", done: ["approved", "resolved", "rejected"].indexOf(status) !== -1 },
        { key: "resolved",  label: "Resolved", done: status === "resolved" }
      ];
      return steps.map(function (s, i) {
        var last = i === steps.length - 1;
        var dot = s.done ? "bg-secondary" : "bg-outline-variant";
        var line = last ? "" : '<span class="ml-[7px] block h-6 w-px ' + (steps[i + 1].done ? "bg-secondary" : "bg-outline-variant") + '"></span>';
        return '<li><div class="flex items-center gap-3"><span class="h-3.5 w-3.5 rounded-full ' + dot + '"></span>' +
          '<span class="text-body-md ' + (s.done ? "text-on-surface" : "text-on-surface-variant") + '">' + s.label + "</span></div>" + line + "</li>";
      }).join("");
    }

    var printBtn = $("#detail-print");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
  }

  /* ============================================================
     PUBLIC: settings
     ============================================================ */
  function bootSettings() {
    var form = $("#settings-form");
    if (!form) return;
    var CHECKS = ["notif_alerts","notif_reports","notif_learning","notif_community","sub_weekly","sub_monthly","sub_quarterly","priv_leaderboard","priv_anon"];
    function field(name) { return form.querySelector('[name="' + name + '"]'); }
    function emailEl() { return form.querySelector('#sub-email, [name="sub_email"]'); }

    // Map the flat form <-> the structured preferences object the API uses.
    function prefsToForm(p) {
      p = p || {};
      var n = p.notifications || {}, s = p.subscriptions || {}, pr = p.privacy || {};
      return {
        lang: p.language || (window.getCurrentLanguage ? window.getCurrentLanguage() : "en"),
        notif_alerts: n.alerts !== false, notif_reports: n.reports !== false,
        notif_learning: n.learning !== false, notif_community: !!n.community,
        sub_weekly: s.weekly !== false, sub_monthly: !!s.monthly, sub_quarterly: !!s.quarterly,
        sub_email: s.email || "",
        priv_leaderboard: pr.leaderboard !== false, priv_anon: !!pr.anonymousReports
      };
    }
    function formToPrefs(f) {
      return {
        language: f.lang,
        notifications: { alerts: f.notif_alerts, reports: f.notif_reports, learning: f.notif_learning, community: f.notif_community },
        subscriptions: { weekly: f.sub_weekly, monthly: f.sub_monthly, quarterly: f.sub_quarterly, email: f.sub_email },
        privacy: { leaderboard: f.priv_leaderboard, anonymousReports: f.priv_anon }
      };
    }

    function apply(f) {
      form.querySelectorAll('input[name="lang"]').forEach(function (r) { r.checked = (r.value === f.lang); });
      CHECKS.forEach(function (k) { var el = field(k); if (el) el.checked = !!f[k]; });
      var em = emailEl(); if (em) em.value = f.sub_email || "";
    }

    // Load current preferences from the API (mock -> JSON store; live -> backend).
    API.preferences.get().then(function (p) {
      apply(prefsToForm(p));
      var em = emailEl();
      if (em && !em.value) API.users.me().then(function (u) { if (u && u.email) em.value = u.email; }).catch(function () {});
    }).catch(function () { apply(prefsToForm(null)); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var langEl = form.querySelector('input[name="lang"]:checked');
      var em = emailEl();
      var f = { lang: (langEl && langEl.value) || "en", sub_email: (em && em.value || "").trim() };
      CHECKS.forEach(function (k) { var el = field(k); f[k] = el ? !!el.checked : false; });

      if ((f.sub_weekly || f.sub_monthly || f.sub_quarterly) && f.sub_email && window.CyvoraValidation) {
        var v = window.CyvoraValidation.validateEmail(f.sub_email);
        if (!v.valid) { showToast(v.error || "Enter a valid delivery email.", "error"); return; }
      }

      API.preferences.update(formToPrefs(f)).then(function () {
        if (typeof window.setLanguage === "function") window.setLanguage(f.lang);
        var banner = $("#settings-saved");
        if (banner) { banner.classList.remove("hidden"); setTimeout(function () { banner.classList.add("hidden"); }, 2500); }
        showToast("Settings saved.", "success");
      }).catch(function () { showToast("Could not save settings. Please try again.", "error"); });
    });

    var resetBtn = $("#settings-reset");
    if (resetBtn) resetBtn.addEventListener("click", function () { apply(prefsToForm(null)); });
  }

  /* ============================================================
     PUBLIC: module quiz (reusable engine)
     ============================================================ */
  function bootQuiz() {
    var host = $("#quiz-host");
    if (!host || !window.CyvoraQuiz) return;
    var id = new URLSearchParams(location.search).get("id") || "lesson-phishing";

    API.learning.quiz(id).then(function (quiz) {
      window.CyvoraQuiz.mount(host, {
        quizId: id,
        title: quiz.title,
        questions: quiz.questions || [],
        lives: 5,
        passPct: quiz.passPct != null ? quiz.passPct : 70,
        xpPerCorrect: quiz.xpPerCorrect != null ? quiz.xpPerCorrect : 20,
        onComplete: function (result) {
          if (result.passed) showToast("Passed! +" + result.xp + " XP", "success");
          else if (result.ranOut) showToast("Out of lives — review and retry.", "error");
        }
      });
    }).catch(function () {
      host.innerHTML = '<div class="card"><p class="text-body-md text-error">This quiz isn\'t available. <a href="learn.html" class="text-primary hover:underline">Back to Learn</a>.</p></div>';
    });
  }

  /* ============================================================
     ADMIN: users
     ============================================================ */
  function bootAdminUsers() {
    var tbody = $("#users-tbody");
    if (!tbody) return;
    var all = [];

    function applyFilters() {
      var q = (($("#user-search") || {}).value || "").toLowerCase();
      var role = ($("#user-role-filter") || {}).value || "";
      var status = ($("#user-status-filter") || {}).value || "";
      render(all.filter(function (u) {
        if (q && (u.name + " " + u.email).toLowerCase().indexOf(q) === -1) return false;
        if (role && u.role !== role) return false;
        if (status && u.status !== status) return false;
        return true;
      }));
    }

    function render(users) {
      if (!users.length) {
        tbody.innerHTML = '<tr><td class="px-6 py-10 text-center text-on-surface-variant" colspan="7">No users match these filters.</td></tr>';
        return;
      }
      tbody.innerHTML = users.map(function (u) { return T.userRow(u); }).join("");
      tbody.querySelectorAll(".status-toggle-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = (btn.closest("tr") || {}).getAttribute ? btn.closest("tr").getAttribute("data-user-id") : btn.getAttribute("data-id");
          var next = btn.getAttribute("data-next-status") || btn.getAttribute("data-next");
          btn.disabled = true;
          API.users.updateStatus(id, next).then(function () {
            showToast("User status updated to " + next + ".", "success");
            var u = all.find(function (x) { return x.id === id; });
            if (u) u.status = next;
            applyFilters();
          }).catch(function () { showToast("Could not update user status.", "error"); btn.disabled = false; });
        });
      });
      tbody.querySelectorAll(".role-select").forEach(function (sel) {
        sel.addEventListener("change", function () {
          var id = (sel.closest("tr") || {}).getAttribute("data-user-id");
          API.users.updateRole ? API.users.updateRole(id, sel.value).then(function () { showToast("Role updated.", "success"); }).catch(function () { showToast("Could not update role.", "error"); })
            : showToast("Role updated.", "success");
        });
      });
    }

    ["#user-search", "#user-role-filter", "#user-status-filter"].forEach(function (s) {
      var el = $(s); if (el) el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });

    if (window.CyvoraUI) window.CyvoraUI.showLoading(tbody, 'skeleton-table');
    API.users.list().then(function (res) { all = res.items || []; render(all); })
      .catch(function () { tbody.innerHTML = '<tr><td class="px-6 py-10 text-center text-error" colspan="7">Could not load users.</td></tr>'; });
  }

  /* ============================================================
     ADMIN: platform settings
     ============================================================ */
  function bootAdminSettings() {
    var form = $("#admin-settings-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showToast("Platform settings saved.", "success");
    });
    var reset = $("#admin-settings-reset");
    if (reset) reset.addEventListener("click", function () { form.reset(); showToast("Settings reset.", "info"); });
  }

  function boot() {
    if (!API || !T) {
      console.warn("CyvoraAPI or CyvoraTemplates missing");
      return;
    }
    var p = page();
    var map = {
      index: function () {
        // public vs admin
        if (location.pathname.indexOf("/admin") >= 0) bootAdminIndex();
        else bootPublicIndex();
      },
      "my-reports": bootMyReports,
      community: function () {
        if (location.pathname.indexOf("/admin") >= 0) { bootAdminCommunity(); return; }
        bootPublicCommunity();
      },
      learn: bootLearn,
      "lesson-phishing": bootLesson,
      "lesson-cybersecurity": bootLesson,
      "report-incident": bootReportIncident,
      profile: bootProfile,
      leaderboard: bootLeaderboard,
      monitor: bootMonitor,
      "daily-challenge": bootDailyChallenge,
      certificates: bootCertificates,
      chat: bootSupportChat,
      "report-detail": bootReportDetail,
      settings: function () {
        if (location.pathname.indexOf("/admin") >= 0) { bootAdminSettings(); return; }
        bootSettings();
      },
      quiz: bootQuiz,
      reports: bootAdminReports,
      alerts: bootAdminAlerts,
      learning: bootAdminLearning,
      users: bootAdminUsers,
    };
    if (map[p]) map[p]();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
