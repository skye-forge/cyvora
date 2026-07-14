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
    var tbody = $("#my-reports-tbody");
    if (!tbody) return;

    function render(items) {
      if (!items.length) {
        tbody.innerHTML = T.emptyState(
          'You have not filed any reports yet. <a class="text-primary hover:underline" href="report-incident.html">File your first report</a>.',
          5
        );
        return;
      }
      tbody.innerHTML = items.map(function (r) { return T.reportRow(r, { admin: false }); }).join("");
    }

    API.reports.list().then(function (res) {
      render(res.items || []);
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
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var title = (form.querySelector("[name=title], #post-title") || {}).value || "";
        var body = (form.querySelector("[name=body], #post-body, textarea") || {}).value || "";
        var category = (form.querySelector("[name=category], #post-category") || {}).value || "Infrastructure";
        if (!title.trim() || !body.trim()) {
          showToast("Please fill in title and message.", "error");
          return;
        }
        API.community.create({ title: title.trim(), body: body.trim(), category: category, author: "You" })
          .then(function () {
            showToast("Post submitted for review.", "info");
            form.reset();
            bootPublicCommunity();
          })
          .catch(function () { showToast("Failed to create post.", "error"); });
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
    var form = $("#report-form") || $("form[data-report-form]") || $("main form");
    // multi-step: find final submit
    var submitBtns = $all("button[type=submit], #submit-report, [data-submit-report]");
    var state = {
      category: "Infrastructure Issue",
      title: "",
      description: "",
      district: "Central Metro",
      location: "",
    };

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

      API.users.me().then(function (user) {
        return API.reports.create({
          category: state.category,
          title: title.trim(),
          description: description.trim(),
          district: (user && user.district) || state.district,
          reporterName: (user && user.name) || "Citizen",
          severity: "medium",
        });
      }).then(function (report) {
        showToast("Report filed: " + (report.trackingId || report.id), "info");
        setTimeout(function () {
          location.href = "my-reports.html";
        }, 1200);
      }).catch(function (err) {
        showToast((err && err.message) || "Failed to submit report.", "error");
      });
    }

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
    API.users.me().then(function (user) {
      if (!user) return;
      var nameEl = $("input[name=name], #full-name, #profile-name");
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

      // display name / trust
      $all("[data-profile-name]").forEach(function (el) { el.textContent = user.name; });
      $all("[data-profile-trust]").forEach(function (el) {
        el.textContent = user.trustScore != null ? (Number(user.trustScore) * 100).toFixed(0) + " / 1000" : "—";
      });
      $all("[data-profile-email]").forEach(function (el) { el.textContent = user.email; });
    }).catch(function () {});
  }

  /* ============================================================
     ADMIN: reports (already has loader — enhance if empty tbody)
     ============================================================ */
  function bootAdminReports() {
    var tbody = $("#admin-reports-tbody");
    if (!tbody) return;
    // if page already has its own loadReports, don't double-bind
    if (window.__cyvoraAdminReportsBound) return;
    // Only load if tbody is empty / loading
    if (tbody.children.length > 1) return;

    function render(items) {
      if (!items.length) {
        tbody.innerHTML = '<tr><td class="px-6 py-8 text-center text-on-surface-variant" colspan="6">No reports found.</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(function (r) { return T.reportRow(r, { admin: true }); }).join("");
      tbody.querySelectorAll(".review-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-id");
          var next = btn.getAttribute("data-next") || "approved";
          API.reports.updateStatus(id, next).then(function () {
            showToast("Report updated.", "info");
            bootAdminReports();
          });
        });
      });
    }

    API.reports.list().then(function (res) { render(res.items || []); })
      .catch(function () {
        tbody.innerHTML = '<tr><td class="px-6 py-8 text-center text-error" colspan="6">Could not load reports.</td></tr>';
      });
  }

  /* ============================================================
     ADMIN: alerts — load history + create
     ============================================================ */
  function bootAdminAlerts() {
    // history table if present
    var tbody = $("#alerts-history-tbody") || $("table tbody");
    if (tbody && tbody.id !== "admin-reports-tbody") {
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

      API.alerts.create({
        severity: severity,
        category: severity === "critical" || severity === "high" ? "SEVERE WEATHER" : "PUBLIC NOTICE",
        title: title.trim(),
        message: message.trim().slice(0, 240),
        region: (regionEl && regionEl.value) || "All Districts",
      }).then(function (alert) {
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
      // update analytics cards if present
      var failSocial = $("[data-gap-social]");
      // fill inventory table if empty
      var tbody = $("table tbody");
      if (tbody && items.length && tbody.querySelectorAll("tr").length < 2) {
        tbody.innerHTML = items.map(function (c) {
          return (
            '<tr class="bg-white">' +
              '<td class="px-6 py-4 font-label-lg">' + T.esc(c.title) + '</td>' +
              '<td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-caption ' +
                (c.status === "completed" || (c.progressPct || 0) >= 100 ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary") +
              '">' + T.esc(c.status || "live") + '</span></td>' +
              '<td class="px-6 py-4">' + (c.progressPct != null ? c.progressPct + "%" : "—") + '</td>' +
              '<td class="px-6 py-4">Global Staff</td>' +
              '<td class="px-6 py-4 font-caption text-outline">—</td>' +
            '</tr>'
          );
        }).join("");
      }
    }).catch(function () {});
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

      var activeReports = reports.filter(function (r) {
        return r.status === "pending" || r.status === "in_review";
      }).length;
      var activeAlerts = alerts.filter(function (a) { return a.active; }).length;

      $all("[data-stat='active-reports'], [data-counter]").forEach(function (el, i) {
        // best-effort fill first counters
      });

      // fill common stat cards by label text
      $all(".bento-card, [class*='stat'], main .grid > div").forEach(function (card) {
        var text = card.textContent || "";
        var num = card.querySelector("h3, .text-3xl, .text-4xl, [data-counter], .font-display-lg, .text-\\[32px\\], .text-\\[40px\\]");
        if (!num) return;
        if (/Active Reports|Reports/i.test(text) && /Active|Pending/i.test(text)) {
          num.setAttribute("data-counter", String(activeReports));
          num.textContent = String(activeReports);
        } else if (/Total Users|Users/i.test(text)) {
          num.setAttribute("data-counter", String(users.length));
          num.textContent = String(users.length);
        } else if (/Learning|Modules/i.test(text)) {
          num.setAttribute("data-counter", String(courses.length));
          num.textContent = String(courses.length);
        } else if (/Alert/i.test(text)) {
          num.setAttribute("data-counter", String(activeAlerts));
          num.textContent = String(activeAlerts);
        }
      });

      // recent reports table
      var tbody = $("table tbody");
      if (tbody && reports.length) {
        var rows = tbody.querySelectorAll("tr");
        if (rows.length <= 5) {
          tbody.innerHTML = reports.slice(0, 5).map(function (r) {
            var meta = T.STATUS_META[r.status] || T.STATUS_META.pending;
            return (
              '<tr class="bg-white">' +
                '<td class="px-6 py-3 font-label-md text-primary">#' + T.esc(r.trackingId || r.id) + '</td>' +
                '<td class="px-6 py-3">' + T.esc(r.category) + '</td>' +
                '<td class="px-6 py-3">' + T.esc(r.reporterName || "—") + '</td>' +
                '<td class="px-6 py-3"><span class="px-2 py-1 rounded-full text-caption ' + meta.badge + '">' + meta.label + '</span></td>' +
                '<td class="px-6 py-3 font-caption text-outline">' + T.formatDateTime(r.createdAt) + '</td>' +
              '</tr>'
            );
          }).join("");
        }
      }
    }).catch(function () {});
  }

  /* ============================================================
     Boot
     ============================================================ */
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
        if (location.pathname.indexOf("/admin") >= 0) return; // admin has own
        bootPublicCommunity();
      },
      learn: bootLearn,
      "lesson-phishing": bootLesson,
      "lesson-cybersecurity": bootLesson,
      "report-incident": bootReportIncident,
      profile: bootProfile,
      reports: bootAdminReports,
      alerts: bootAdminAlerts,
      learning: bootAdminLearning,
      users: function () { /* admin users page has own loader */ },
    };
    if (map[p]) map[p]();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
