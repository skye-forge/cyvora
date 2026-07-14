/**
 * Cyvora — HTML templates from JSON
 * ------------------------------------------------------------
 * Pure functions: JSON in → safe HTML string out.
 * Used by every page that renders lists / cards / alerts / etc.
 * Keep these in sync with the shapes in mock-data.js / BACKEND.md.
 */
(function () {
  "use strict";

  function esc(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(iso, opts) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, opts || { month: "short", day: "2-digit", year: "numeric" });
    } catch (e) {
      return String(iso).slice(0, 10);
    }
  }

  function formatDateTime(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: "short", day: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) {
      return String(iso);
    }
  }

  function greetingForHour(h) {
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }

  var STATUS_META = {
    pending:   { label: "Pending",    badge: "bg-outline-variant/30 text-on-surface-variant", dot: "bg-outline" },
    in_review: { label: "In Review",  badge: "bg-primary/10 text-primary",                    dot: "bg-primary" },
    approved:  { label: "Approved",   badge: "bg-secondary/10 text-secondary",                dot: "bg-secondary" },
    rejected:  { label: "Rejected",   badge: "bg-error/10 text-error",                        dot: "bg-error" },
    resolved:  { label: "Resolved",   badge: "bg-secondary/10 text-secondary",                dot: "bg-secondary" },
  };

  var SEVERITY_BORDER = {
    critical: "border-error",
    high:     "border-error",
    medium:   "border-surface-tint",
    low:      "border-secondary",
  };

  var SEVERITY_LABEL_COLOR = {
    critical: "text-error",
    high:     "text-error",
    medium:   "text-primary",
    low:      "text-secondary",
  };

  var CATEGORY_ICON = {
    "Utility Failure": "electric_bolt",
    "Suspicious Activity": "visibility",
    "Road Hazards": "report_problem",
    "Urban Improvement": "brush",
    "Public Safety": "security",
    "Infrastructure Issue": "construction",
    "Fire & Hazards": "local_fire_department",
    "Medical Emergency": "health_and_safety",
    "Environmental": "eco",
    "Other": "more_horiz",
  };

  var ROLE_BADGE = {
    citizen:   "bg-surface-container-high text-on-surface-variant",
    moderator: "bg-primary/10 text-primary",
    admin:     "bg-secondary/10 text-secondary",
  };

  var USER_STATUS = {
    active:    { label: "Active",    cls: "bg-secondary/10 text-secondary" },
    pending:   { label: "Pending",   cls: "bg-outline-variant/40 text-on-surface-variant" },
    suspended: { label: "Suspended", cls: "bg-error/10 text-error" },
  };

  var POST_STATUS = {
    published: { label: "Published", cls: "bg-secondary/10 text-secondary" },
    pending:   { label: "Pending",   cls: "bg-outline-variant/40 text-on-surface-variant" },
    flagged:   { label: "Flagged",   cls: "bg-error/10 text-error" },
    removed:   { label: "Removed",   cls: "bg-error/10 text-error" },
  };

  /* ---------- Templates ---------- */

  window.CyvoraTemplates = {
    esc: esc,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    greetingForHour: greetingForHour,
    STATUS_META: STATUS_META,
    CATEGORY_ICON: CATEGORY_ICON,

    /** Alert card (public sidebar / national alerts) */
    alertCard: function (a) {
      var border = SEVERITY_BORDER[a.severity] || "border-outline";
      var color = SEVERITY_LABEL_COLOR[a.severity] || "text-primary";
      return (
        '<div class="bg-white p-4 rounded-lg border-l-4 ' + border + ' shadow-sm reveal">' +
          '<p class="font-label-md text-label-md ' + color + ' mb-1">' + esc(a.category || "ALERT") + '</p>' +
          '<h5 class="font-label-lg text-label-lg text-primary">' + esc(a.title) + '</h5>' +
          '<p class="font-caption text-caption text-on-surface-variant mt-2">' + esc(a.message) + '</p>' +
          (a.region ? '<p class="font-caption text-caption text-outline mt-1">' + esc(a.region) + ' · ' + formatDateTime(a.issuedAt) + '</p>' : '') +
        '</div>'
      );
    },

    /** Community highlight card (public index) */
    communityHighlight: function (p) {
      return (
        '<div class="bento-card p-6 flex gap-gutter reveal">' +
          '<div class="w-20 h-20 bg-surface-container rounded-lg overflow-hidden shrink-0 flex items-center justify-center">' +
            '<span class="material-symbols-outlined text-3xl text-primary">forum</span>' +
          '</div>' +
          '<div class="flex flex-col justify-center min-w-0">' +
            '<h5 class="font-label-lg text-label-lg text-primary">' + esc(p.title) + '</h5>' +
            '<p class="font-body-md text-body-md text-on-surface-variant line-clamp-2">' + esc(p.body) + '</p>' +
            '<p class="font-caption text-caption text-outline mt-1">' + esc(p.author) + ' · ' + formatDate(p.createdAt) +
              ' · ' + (p.upvotes || 0) + ' upvotes</p>' +
          '</div>' +
        '</div>'
      );
    },

    /** Public community feed post */
    communityPost: function (p) {
      var st = POST_STATUS[p.status] || POST_STATUS.published;
      return (
        '<article class="bento-card overflow-hidden reveal" data-post-id="' + esc(p.id) + '">' +
          '<div class="p-6">' +
            '<div class="flex items-start justify-between gap-4 mb-4">' +
              '<div class="flex items-center gap-3">' +
                '<div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold">' +
                  esc((p.author || "?").slice(0, 2).toUpperCase()) +
                '</div>' +
                '<div>' +
                  '<p class="font-label-lg text-label-lg text-on-surface">' + esc(p.author) + '</p>' +
                  '<p class="font-caption text-caption text-outline">' + formatDateTime(p.createdAt) +
                    ' · <span class="px-2 py-0.5 rounded-full text-[10px] ' + st.cls + '">' + st.label + '</span></p>' +
                '</div>' +
              '</div>' +
              '<span class="font-caption text-caption text-outline">' + esc(p.category || "") + '</span>' +
            '</div>' +
            '<h3 class="font-headline-md text-headline-md text-primary mb-2">' + esc(p.title) + '</h3>' +
            '<p class="font-body-md text-body-md text-on-surface-variant">' + esc(p.body) + '</p>' +
            '<div class="flex items-center gap-6 mt-4 text-on-surface-variant">' +
              '<span class="flex items-center gap-1 font-label-md"><span class="material-symbols-outlined text-[18px]">thumb_up</span> ' + (p.upvotes || 0) + '</span>' +
              '<span class="flex items-center gap-1 font-label-md"><span class="material-symbols-outlined text-[18px]">chat_bubble</span> ' + (p.comments || 0) + ' Comments</span>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    },

    /** Report row (my-reports / admin) */
    reportRow: function (r, opts) {
      opts = opts || {};
      var meta = STATUS_META[r.status] || STATUS_META.pending;
      var icon = CATEGORY_ICON[r.category] || "description";
      if (opts.admin) {
        return (
          '<tr class="bg-white hover:bg-surface-container-low transition-colors border-l-4 border-transparent hover:border-primary" data-id="' + esc(r.id) + '">' +
            '<td class="px-6 py-4 font-label-lg text-primary">#' + esc(r.trackingId || r.id) + '</td>' +
            '<td class="px-6 py-4 font-body-md">' + esc(r.category) + '</td>' +
            '<td class="px-6 py-4 font-body-md">' + esc(r.reporterName || "—") + '</td>' +
            '<td class="px-6 py-4"><span class="inline-flex items-center px-3 py-1 rounded-full text-caption font-label-md ' + meta.badge + '">' +
              '<span class="w-2 h-2 rounded-full ' + meta.dot + ' mr-2"></span>' + meta.label + '</span></td>' +
            '<td class="px-6 py-4 font-caption text-outline">' + formatDateTime(r.createdAt) + '</td>' +
            '<td class="px-6 py-4 text-right">' +
              (r.status === "pending" || r.status === "in_review"
                ? '<button class="review-btn text-primary font-label-md hover:underline" data-id="' + esc(r.id) + '" data-next="approved">Approve</button>'
                : '<span class="text-outline font-caption">—</span>') +
            '</td>' +
          '</tr>'
        );
      }
      // citizen my-reports
      return (
        '<tr class="report-row bg-white transition-all duration-200 group border-l-4 border-transparent hover:border-primary cursor-pointer reveal" data-id="' + esc(r.id) + '">' +
          '<td class="px-8 py-6">' +
            '<span class="font-label-lg text-label-lg text-primary">#' + esc(r.trackingId || r.id) + '</span>' +
            '<div class="text-caption text-outline mt-1">Submitted: ' + formatDate(r.createdAt) + '</div>' +
          '</td>' +
          '<td class="px-8 py-6">' +
            '<div class="flex items-center gap-2">' +
              '<span class="material-symbols-outlined text-on-surface-variant">' + icon + '</span>' +
              '<span class="font-body-md text-body-md text-on-surface">' + esc(r.title) + '</span>' +
            '</div>' +
          '</td>' +
          '<td class="px-8 py-6 font-body-md text-body-md text-on-surface">' + esc(r.district) + '</td>' +
          '<td class="px-8 py-6">' +
            '<span class="inline-flex items-center px-3 py-1 rounded-full text-caption font-label-md ' + meta.badge + '">' +
              '<span class="w-2 h-2 rounded-full ' + meta.dot + ' mr-2"></span>' + meta.label +
            '</span>' +
          '</td>' +
          '<td class="px-8 py-6 text-right">' +
            '<button class="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors font-label-lg text-label-lg flex items-center justify-end gap-2 ml-auto view-report-btn" data-id="' + esc(r.id) + '">' +
              'View Details<span class="material-symbols-outlined">arrow_forward</span>' +
            '</button>' +
          '</td>' +
        '</tr>'
      );
    },

    /** Learning course card */
    courseCard: function (c) {
      var pct = c.progressPct || 0;
      var statusLabel = pct >= 100 ? "Completed" : (pct > 0 ? pct + "% Complete" : "Not Started");
      var statusCls = pct >= 100 ? "text-secondary font-bold" : (pct > 0 ? "text-primary" : "text-on-surface-variant");
      var barCls = pct >= 100 ? "bg-secondary" : "bg-primary";
      var live = pct >= 100 ? "Finished" : (pct > 0 ? "In progress" : "New");
      return (
        '<div class="course-card bento-card p-6 flex flex-col gap-4 reveal" data-course-id="' + esc(c.id) + '">' +
          '<div class="flex items-start justify-between">' +
            '<span class="font-caption text-caption text-outline uppercase tracking-wider">' + esc(live) + '</span>' +
            (c.duration ? '<span class="font-caption text-caption text-outline flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> ' + esc(c.duration) + '</span>' : '') +
          '</div>' +
          '<h4 class="font-headline-md text-headline-md text-primary">' + esc(c.title) + '</h4>' +
          '<p class="font-body-md text-body-md text-on-surface-variant flex-1">' + esc(c.description || "Security awareness training module.") + '</p>' +
          '<div>' +
            '<div class="flex justify-between items-center mb-2">' +
              '<span class="course-progress-text font-label-md text-label-md ' + statusCls + '">' + statusLabel + '</span>' +
              (c.lessonsCount ? '<span class="font-caption text-caption text-outline">' + c.lessonsCount + ' lessons</span>' : '') +
            '</div>' +
            '<div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">' +
              '<div class="course-progress-bar h-full ' + barCls + ' rounded-full transition-all" style="width:' + pct + '%"></div>' +
            '</div>' +
          '</div>' +
          '<a href="' + esc(c.href || (c.id === "course-phishing" ? "lesson-phishing.html" : "lesson-cybersecurity.html")) +
            '" class="mt-2 inline-flex items-center gap-2 text-primary font-label-lg hover:underline">' +
            (pct >= 100 ? "Review" : "Continue") + ' <span class="material-symbols-outlined text-[18px]">arrow_forward</span></a>' +
        '</div>'
      );
    },

    /** User row (admin) */
    userRow: function (u) {
      var st = USER_STATUS[u.status] || USER_STATUS.active;
      var roleCls = ROLE_BADGE[u.role] || ROLE_BADGE.citizen;
      return (
        '<tr class="bg-white hover:bg-surface-container-low" data-id="' + esc(u.id) + '">' +
          '<td class="px-6 py-4 font-label-lg text-on-surface">' + esc(u.name) + '</td>' +
          '<td class="px-6 py-4 font-body-md text-on-surface-variant">' + esc(u.email) + '</td>' +
          '<td class="px-6 py-4 font-body-md">' + esc(u.district || "—") + '</td>' +
          '<td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-caption ' + roleCls + '">' + esc(u.role) + '</span></td>' +
          '<td class="px-6 py-4 font-label-lg">' + (u.trustScore != null ? Number(u.trustScore).toFixed(1) : "—") + '</td>' +
          '<td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-caption ' + st.cls + '">' + st.label + '</span></td>' +
          '<td class="px-6 py-4 text-right space-x-2">' +
            (u.status === "active"
              ? '<button class="user-status-btn text-error font-label-md hover:underline" data-id="' + esc(u.id) + '" data-next="suspended">Suspend</button>'
              : '<button class="user-status-btn text-secondary font-label-md hover:underline" data-id="' + esc(u.id) + '" data-next="active">Activate</button>') +
          '</td>' +
        '</tr>'
      );
    },

    /** Empty / error states */
    emptyState: function (msg, cols) {
      return '<tr><td class="px-8 py-10 text-center text-on-surface-variant font-body-md" colspan="' + (cols || 5) + '">' + msg + '</td></tr>';
    },
    errorState: function (msg, cols) {
      return '<tr><td class="px-8 py-10 text-center text-error font-body-md" colspan="' + (cols || 5) + '">' + msg + '</td></tr>';
    },
  };
})();
