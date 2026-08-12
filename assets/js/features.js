/**
 * VARNIS — shared helpers for KYC, device recovery and support tickets
 * ------------------------------------------------------------
 * One vocabulary for the three new features so a status chip, a stage
 * label or a money format is identical on every screen that shows it.
 *
 * Load AFTER config.js / storage.js / api.js and BEFORE the page script.
 *
 * Exposes window.VarnisFeatures:
 *   KYC_STATUS / RECOVERY_STAGES / PAYMENT_STATUS / TICKET_STATUS
 *   stageIndex(id) · stageMeta(id) · chip(meta, opts)
 *   fcfa(n) · readFile(file) · fileGuard(file)
 *   kycState() · gateOnKyc(opts)
 */
(function () {
  "use strict";

  var MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB — matches the register.html rule
  var ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------------- Status vocabularies ---------------- */

  // Draft → Submitted → Under Review → Approved → Rejected → Expired
  var KYC_STATUS = {
    draft:        { label: "Not started",  chip: "chip-pending", icon: "edit_note",     tone: "neutral", blurb: "You haven't submitted your identity documents yet." },
    submitted:    { label: "Submitted",    chip: "chip-review",  icon: "outbox",        tone: "info",    blurb: "We've received your documents and queued them for review." },
    under_review: { label: "Under review", chip: "chip-review",  icon: "hourglass_top", tone: "info",    blurb: "A reviewer is checking your documents. This usually takes up to three working days." },
    approved:     { label: "Approved",     chip: "chip-secure",  icon: "verified",      tone: "good",    blurb: "Your identity is verified. Reporting, the academy, certification and device recovery are unlocked." },
    rejected:     { label: "Rejected",     chip: "chip-error",   icon: "cancel",        tone: "bad",     blurb: "Your submission was not accepted. Read the reason below and send it again." },
    expired:      { label: "Expired",      chip: "chip-error",   icon: "event_busy",    tone: "bad",     blurb: "Your verification has lapsed. Renew it to keep using reporting and recovery." },
  };

  // The nine tracking stages, in order. `optional` stages only appear on a
  // case when they actually happened.
  var RECOVERY_STAGES = [
    { id: "ownership_verified",  label: "Ownership verified",            icon: "how_to_reg",      blurb: "Your right to file this case was confirmed." },
    { id: "payment_submitted",   label: "Payment submitted",             icon: "receipt_long",    blurb: "Tracking fee sent — awaiting confirmation." },
    { id: "payment_approved",    label: "Payment approved",              icon: "price_check",     blurb: "Payment matched against the operator statement." },
    { id: "sent_to_authorities", label: "Sent to authorities",           icon: "gavel",           blurb: "Case filed with the competent unit." },
    { id: "under_investigation", label: "Under investigation",           icon: "travel_explore",  blurb: "Tracing in progress with network operators." },
    { id: "evidence_requested",  label: "Additional evidence requested",  icon: "upload_file",     blurb: "Investigators need more documents from you.", optional: true },
    { id: "device_located",      label: "Located",                       icon: "my_location",     blurb: "A confirmed sighting or signal was obtained." },
    { id: "recovered",           label: "Recovered",                     icon: "inventory_2",     blurb: "The asset is secured. Collection instructions follow." },
    { id: "closed",              label: "Closed",                        icon: "task_alt",        blurb: "The case file is complete." },
  ];

  var PAYMENT_STATUS = {
    pending:  { label: "Pending",  chip: "chip-pending", icon: "schedule" },
    approved: { label: "Approved", chip: "chip-secure",  icon: "check_circle" },
    rejected: { label: "Rejected", chip: "chip-error",   icon: "error" },
  };

  // Open → Pending → Resolved → Closed
  var TICKET_STATUS = {
    open:     { label: "Open",     chip: "chip-review",  icon: "mark_email_unread", blurb: "With the support desk." },
    pending:  { label: "Pending",  chip: "chip-pending", icon: "hourglass_top",     blurb: "Waiting on your reply." },
    resolved: { label: "Resolved", chip: "chip-secure",  icon: "check_circle",      blurb: "Fixed — reopen if it comes back." },
    closed:   { label: "Closed",   chip: "chip-pending", icon: "lock",              blurb: "Archived." },
  };

  var PAYMENT_METHODS = [
    { id: "mtn",    name: "MTN Mobile Money", short: "MoMo",         shortcode: "*126#", accent: "#FFCC00" },
    { id: "orange", name: "Orange Money",     short: "Orange Money", shortcode: "#150#", accent: "#FF7900" },
  ];

  function stageIndex(id) {
    for (var i = 0; i < RECOVERY_STAGES.length; i++) if (RECOVERY_STAGES[i].id === id) return i;
    return -1;
  }
  function stageMeta(id) {
    return RECOVERY_STAGES[stageIndex(id)] || { id: id, label: id, icon: "radio_button_unchecked", blurb: "" };
  }

  /** Status chip markup. meta is any entry from the maps above. */
  function chip(meta, opts) {
    opts = opts || {};
    if (!meta) return "";
    return '<span class="chip ' + meta.chip + '">' +
      (opts.icon === false ? "" : '<span class="material-symbols-outlined text-[15px]">' + esc(meta.icon) + "</span> ") +
      esc(opts.label || meta.label) + "</span>";
  }

  /* ---------------- Formatting ---------------- */

  /** 15000 → "15,000 FCFA". Cameroon prices are always whole francs. */
  function fcfa(n) {
    var v = Number(n || 0);
    return v.toLocaleString("en-US").replace(/,/g, "\u202f") + " FCFA";
  }

  function bytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }

  /* ---------------- Uploads ---------------- */

  /** Reject anything the backend would reject anyway. Returns null when ok. */
  function fileGuard(file) {
    if (!file) return "Choose a file first.";
    if (ACCEPTED.indexOf(file.type) === -1) return "Use a JPG, PNG, WebP or PDF file.";
    if (file.size > MAX_UPLOAD_BYTES) return "That file is " + bytes(file.size) + ". The limit is 5 MB.";
    return null;
  }

  /** File → { fileName, mimeType, size, data } with data as a base64 data
   *  URL, the same envelope /auth/register already uses for the ID card. */
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var problem = fileGuard(file);
      if (problem) return reject(new Error(problem));
      var r = new FileReader();
      r.onload = function () {
        resolve({ fileName: file.name, mimeType: file.type, size: file.size, data: r.result });
      };
      r.onerror = function () { reject(new Error("That file could not be read. Try another one.")); };
      r.readAsDataURL(file);
    });
  }

  /** Wire a drop-zone label + hidden input + preview list. Returns an object
   *  with .files() so the page can read the current selection. */
  function attachUploader(opts) {
    var input = document.getElementById(opts.input);
    var list = document.getElementById(opts.list);
    var picked = [];
    if (!input) return { files: function () { return picked; } };

    function paint() {
      if (!list) return;
      if (!picked.length) { list.innerHTML = ""; return; }
      list.innerHTML = picked.map(function (f, i) {
        return '<li class="flex items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2">' +
          '<span class="material-symbols-outlined text-[20px] text-primary">' + (f.mimeType === "application/pdf" ? "picture_as_pdf" : "image") + "</span>" +
          '<span class="min-w-0 flex-1 truncate text-body-md text-on-surface">' + esc(f.fileName) + "</span>" +
          '<span class="text-caption text-on-surface-variant">' + bytes(f.size) + "</span>" +
          '<button type="button" class="text-on-surface-variant hover:text-error" data-drop="' + i + '" aria-label="Remove ' + esc(f.fileName) + '">' +
          '<span class="material-symbols-outlined text-[18px]">close</span></button></li>';
      }).join("");
      list.querySelectorAll("[data-drop]").forEach(function (b) {
        b.addEventListener("click", function () {
          picked.splice(Number(b.getAttribute("data-drop")), 1);
          paint();
          if (opts.onChange) opts.onChange(picked);
        });
      });
    }

    input.addEventListener("change", function () {
      var files = Array.prototype.slice.call(input.files || []);
      var jobs = files.map(function (f) { return readFile(f); });
      Promise.all(jobs).then(function (read) {
        picked = opts.multiple ? picked.concat(read) : read.slice(0, 1);
        paint();
        if (opts.onChange) opts.onChange(picked);
      }).catch(function (err) {
        if (window.showToast) window.showToast(err.message, "error");
      });
      input.value = "";
    });

    return { files: function () { return picked; }, clear: function () { picked = []; paint(); } };
  }

  /* ---------------- KYC state ---------------- */

  var _kycCache = null;
  function kycState(force) {
    if (_kycCache && !force) return Promise.resolve(_kycCache);
    if (!window.VarnisAPI || !window.VarnisAPI.kyc) return Promise.resolve({ status: "draft" });
    return window.VarnisAPI.kyc.get().then(function (rec) {
      _kycCache = rec || { status: "draft" };
      return _kycCache;
    }, function () { return { status: "draft" }; });
  }

  /** Replace a container with a "verify first" panel when KYC isn't approved.
   *  opts: { host (element), feature (string), onReady (fn) } */
  function gateOnKyc(opts) {
    opts = opts || {};
    var host = opts.host;
    return kycState().then(function (rec) {
      var status = (rec && rec.status) || "draft";
      if (status === "approved") { if (opts.onReady) opts.onReady(rec); return true; }
      if (host) {
        var meta = KYC_STATUS[status] || KYC_STATUS.draft;
        var waiting = status === "submitted" || status === "under_review";
        host.innerHTML =
          '<div class="card card-lg max-w-2xl">' +
            '<div class="flex items-start gap-4">' +
              '<span class="material-symbols-outlined text-[32px] text-primary">' + (waiting ? "hourglass_top" : "verified_user") + "</span>" +
              '<div class="flex-1">' +
                '<h2 class="text-headline-md text-primary">' + (waiting ? "Verification in progress" : "Verify your identity first") + "</h2>" +
                '<p class="mt-2 text-body-md text-on-surface-variant">' +
                  (waiting
                    ? "We're reviewing your documents. " + esc(opts.feature || "This service") + " opens as soon as you're approved."
                    : esc(opts.feature || "This service") + " is only available to verified citizens. Identity checks keep recovery cases and incident reports admissible to the authorities.") +
                "</p>" +
                '<div class="mt-4">' + chip(meta) + "</div>" +
                '<a href="kyc.html" class="btn btn-primary mt-5">' + (waiting ? "View verification status" : "Start verification") + "</a>" +
              "</div>" +
            "</div>" +
          "</div>";
      }
      return false;
    });
  }

  window.VarnisFeatures = {
    esc: esc,
    MAX_UPLOAD_BYTES: MAX_UPLOAD_BYTES,
    KYC_STATUS: KYC_STATUS,
    RECOVERY_STAGES: RECOVERY_STAGES,
    PAYMENT_STATUS: PAYMENT_STATUS,
    PAYMENT_METHODS: PAYMENT_METHODS,
    TICKET_STATUS: TICKET_STATUS,
    stageIndex: stageIndex,
    stageMeta: stageMeta,
    chip: chip,
    fcfa: fcfa,
    bytes: bytes,
    fileGuard: fileGuard,
    readFile: readFile,
    attachUploader: attachUploader,
    kycState: kycState,
    gateOnKyc: gateOnKyc,
  };
})();
