/**
 * Varnis — Input Validation & Security Layer
 * ------------------------------------------------------------
 * Centralized client-side validation, sanitization, and threat detection.
 * Protects against:
 *   - XSS (scripting attacks)
 *   - SQL Injection attempts
 *   - Command injection / path traversal
 *   - Invalid / malicious payloads (unauthorized entry attempts)
 *   - Excessive length, format violations
 *
 * Used by:
 *   - Form handlers in app.js (before calling API)
 *   - API create methods in api.js (defense in depth)
 *   - Future real backend (same rules can be ported)
 *
 * All functions are pure where possible. Errors are thrown with clear messages
 * for toasts / UI feedback. Never trust input.
 */
(function () {
  "use strict";

  // Whitelists for categories, severities, etc. (prevent injection via enums)
  // Must stay in sync with reportCategories in mock-data.js and the
  // category grid in report-incident.html (single canonical list).
  var ALLOWED_CATEGORIES = [
    "AI-Generated Scam", "Mobile Money Fraud", "Phishing", "Identity Theft",
    "Child Safety", "Business Attack", "Disinformation", "Hacking", "Other"
  ];
  var ALLOWED_SEVERITIES = ["low", "medium", "high", "critical"];
  // 10 official regions (spelling matches monitor.html / leaderboard.html)
  // + Yaoundé and Douala for city-level districts.
  var ALLOWED_REGIONS = ["Adamawa", "Centre", "East", "Far North", "Littoral", "North", "Northwest", "South", "Southwest", "West", "Yaoundé", "Douala"];
  // Community posts can use any incident category plus discussion types.
  var ALLOWED_COMMUNITY_CATEGORIES = ALLOWED_CATEGORIES.concat(["Community", "Recognition", "Success Story"]);
  var ALLOWED_ROLES = ["citizen", "moderator", "admin", "analyst"];
  var ALLOWED_STATUSES = ["pending", "in_review", "approved", "rejected", "resolved"];

  // Dangerous patterns for detection (case-insensitive)
  var XSS_PATTERNS = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,           // onclick=, onerror= etc.
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location/i
  ];

  var SQLI_PATTERNS = [
    /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,  // OR 1=1, AND 1=1
    /'\s*or\s+'1'\s*=\s*'1/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+\w+\s+set/i,
    /--\s*$/m,                     // SQL comment
    /;\s*drop/i,
    /exec\s*\(/i,
    /xp_cmdshell/i
  ];

  var CMD_INJECTION_PATTERNS = [
    /[;&|`$(){}[\]]/,           // shell metachars
    /\.\.\//,                   // path traversal
    /\/etc\/passwd/i,
    /cat\s+\/etc\//i
  ];

  /**
   * Core sanitizer: strips dangerous content, normalizes, limits length.
   * Safe for storage and later display (combined with esc() in templates).
   */
  function sanitizeInput(str, maxLen) {
    if (str == null) return "";
    if (typeof str !== "string") str = String(str);

    str = str.trim();

    // Remove null bytes and control chars except newline/tab
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Strip HTML tags entirely for safety (defense against stored XSS)
    str = str.replace(/<[^>]*>/g, "");

    // Remove dangerous protocols
    str = str.replace(/javascript:/gi, "");
    str = str.replace(/data:/gi, "");
    str = str.replace(/vbscript:/gi, "");

    // Collapse multiple spaces
    str = str.replace(/\s+/g, " ");

    // Enforce max length (prevent DoS / buffer issues)
    if (maxLen && str.length > maxLen) {
      str = str.substring(0, maxLen);
    }

    return str;
  }

  /**
   * Detect if input contains obvious attack patterns.
   * Returns { isMalicious: bool, type: string, matched: string }
   */
  function detectMaliciousInput(str) {
    if (!str || typeof str !== "string") return { isMalicious: false };

    var lower = str.toLowerCase();

    for (var i = 0; i < XSS_PATTERNS.length; i++) {
      if (XSS_PATTERNS[i].test(str)) {
        return { isMalicious: true, type: "XSS", matched: XSS_PATTERNS[i].toString() };
      }
    }

    for (var j = 0; j < SQLI_PATTERNS.length; j++) {
      if (SQLI_PATTERNS[j].test(lower)) {
        return { isMalicious: true, type: "SQL_INJECTION", matched: SQLI_PATTERNS[j].toString() };
      }
    }

    for (var k = 0; k < CMD_INJECTION_PATTERNS.length; k++) {
      if (CMD_INJECTION_PATTERNS[k].test(lower)) {
        return { isMalicious: true, type: "COMMAND_INJECTION", matched: CMD_INJECTION_PATTERNS[k].toString() };
      }
    }

    // Excessive repetition (possible fuzzing / DoS attempt)
    if (/(.)\1{20,}/.test(str)) {
      return { isMalicious: true, type: "REPEATED_CHARS", matched: "repetition" };
    }

    return { isMalicious: false };
  }

  /**
   * Validate email format (basic but effective for demo)
   */
  function validateEmail(email) {
    if (!email) return { valid: false, error: "Email is required" };
    email = sanitizeInput(email, 254);
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return { valid: false, error: "Please enter a valid email address" };
    return { valid: true, sanitized: email };
  }

  /**
   * Validate Cameroon phone number (+237 format or local)
   */
  function validatePhone(phone) {
    if (!phone) return { valid: false, error: "Phone number is required" };
    phone = sanitizeInput(phone, 20).replace(/\s+/g, "");
    // Accept +2376XXXXXXXX or 6XXXXXXXX or 2376...
    var re = /^(\+?237)?6[0-9]{8}$/;
    if (!re.test(phone)) {
      return { valid: false, error: "Enter a valid Cameroon phone number (e.g. +237 6XX XXX XXX)" };
    }
    return { valid: true, sanitized: phone.startsWith("+") ? phone : "+237" + phone.replace(/^237/, "") };
  }

  /**
   * Validate free-text fields (title, description, body, message)
   */
  function validateTextField(value, fieldName, minLen, maxLen) {
    if (!value || typeof value !== "string") value = "";
    value = sanitizeInput(value, maxLen || 2000);

    var malicious = detectMaliciousInput(value);
    if (malicious.isMalicious) {
      return {
        valid: false,
        error: "Invalid " + fieldName + " — possible " + malicious.type + " attempt detected. Please use plain text only.",
        malicious: malicious
      };
    }

    if (value.length < (minLen || 3)) {
      return { valid: false, error: fieldName + " must be at least " + (minLen || 3) + " characters" };
    }
    if (value.length > (maxLen || 2000)) {
      return { valid: false, error: fieldName + " is too long (max " + (maxLen || 2000) + " characters)" };
    }

    return { valid: true, sanitized: value };
  }

  /**
   * Validate against whitelist
   */
  function validateEnum(value, fieldName, allowedList) {
    if (!value) return { valid: false, error: fieldName + " is required" };
    value = sanitizeInput(value, 50);
    if (allowedList.indexOf(value) === -1) {
      return { valid: false, error: "Invalid " + fieldName + ". Please select from the list." };
    }
    return { valid: true, sanitized: value };
  }

  /**
   * Validate report payload (core for incident reporting security)
   */
  function validateReport(payload) {
    var errors = [];
    var sanitized = {};

    // Category
    var cat = validateEnum(payload.category, "Category", ALLOWED_CATEGORIES);
    if (!cat.valid) errors.push(cat.error); else sanitized.category = cat.sanitized;

    // Title
    var title = validateTextField(payload.title, "Title", 5, 150);
    if (!title.valid) errors.push(title.error); else sanitized.title = title.sanitized;

    // Description
    var desc = validateTextField(payload.description || payload.body, "Description", 10, 2000);
    if (!desc.valid) errors.push(desc.error); else sanitized.description = desc.sanitized;

    // District / Location (optional but sanitize)
    if (payload.district) {
      var dist = validateTextField(payload.district, "District", 2, 100);
      if (!dist.valid) errors.push(dist.error); else sanitized.district = dist.sanitized;
    }
    if (payload.location) {
      var loc = validateTextField(payload.location, "Location", 3, 200);
      if (!loc.valid) errors.push(loc.error); else sanitized.location = loc.sanitized;
    }

    // Evidence URL (if provided) - basic URL check, no malicious
    if (payload.evidenceUrl) {
      var url = sanitizeInput(payload.evidenceUrl, 500);
      if (!/^https?:\/\//i.test(url) && url.length > 0) {
        errors.push("Evidence URL must start with http:// or https://");
      } else {
        sanitized.evidenceUrl = url;
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      sanitized: sanitized,
      original: payload
    };
  }

  /**
   * Validate community post
   */
  function validateCommunityPost(payload) {
    var errors = [];
    var sanitized = {};

    var title = validateTextField(payload.title, "Title", 5, 120);
    if (!title.valid) errors.push(title.error); else sanitized.title = title.sanitized;

    var body = validateTextField(payload.body, "Post body", 10, 3000);
    if (!body.valid) errors.push(body.error); else sanitized.body = body.sanitized;

    if (payload.category) {
      var cat = validateEnum(payload.category, "Category", ALLOWED_COMMUNITY_CATEGORIES);
      if (!cat.valid) errors.push(cat.error); else sanitized.category = cat.sanitized;
    } else {
      sanitized.category = "Other";
    }

    return { valid: errors.length === 0, errors: errors, sanitized: sanitized };
  }

  /**
   * Validate alert (admin)
   */
  function validateAlert(payload) {
    var errors = [];
    var sanitized = {};

    var sev = validateEnum(payload.severity, "Severity", ALLOWED_SEVERITIES);
    if (!sev.valid) errors.push(sev.error); else sanitized.severity = sev.sanitized;

    var title = validateTextField(payload.title, "Title", 5, 100);
    if (!title.valid) errors.push(title.error); else sanitized.title = title.sanitized;

    var msg = validateTextField(payload.message, "Message", 10, 1500);
    if (!msg.valid) errors.push(msg.error); else sanitized.message = msg.sanitized;

    if (payload.region) {
      var reg = validateEnum(payload.region, "Region", ALLOWED_REGIONS);
      if (!reg.valid) errors.push(reg.error); else sanitized.region = reg.sanitized;
    }

    return { valid: errors.length === 0, errors: errors, sanitized: sanitized };
  }

  /**
   * Validate login credentials (prevent injection in auth)
   */
  function validateLogin(identifier, password) {
    var errors = [];
    var sanitized = {};

    // Identifier can be email or phone
    if (!identifier) {
      errors.push("Phone or email is required");
    } else {
      identifier = sanitizeInput(identifier, 100);
      var emailCheck = validateEmail(identifier);
      var phoneCheck = validatePhone(identifier);
      if (!emailCheck.valid && !phoneCheck.valid) {
        errors.push("Enter a valid phone number or email");
      } else {
        sanitized.identifier = emailCheck.valid ? emailCheck.sanitized : phoneCheck.sanitized;
      }
    }

    if (!password || password.length < 6) {
      errors.push("Password must be at least 6 characters");
    } else {
      // Do not fully sanitize password (but check for obvious injection)
      var mal = detectMaliciousInput(password);
      if (mal.isMalicious) {
        errors.push("Password contains invalid characters. Please use a strong password without special scripts.");
      } else {
        sanitized.password = password; // keep original for auth (mock)
      }
    }

    return { valid: errors.length === 0, errors: errors, sanitized: sanitized };
  }

  /**
   * Validate profile update
   */
  function validateProfileUpdate(payload) {
    var errors = [];
    var sanitized = {};

    if (payload.name) {
      var name = validateTextField(payload.name, "Name", 2, 80);
      if (!name.valid) errors.push(name.error); else sanitized.name = name.sanitized;
    }
    if (payload.email) {
      var em = validateEmail(payload.email);
      if (!em.valid) errors.push(em.error); else sanitized.email = em.sanitized;
    }
    if (payload.phone) {
      var ph = validatePhone(payload.phone);
      if (!ph.valid) errors.push(ph.error); else sanitized.phone = ph.sanitized;
    }
    if (payload.district) {
      var dist = validateTextField(payload.district, "District", 2, 60);
      if (!dist.valid) errors.push(dist.error); else sanitized.district = dist.sanitized;
    }

    return { valid: errors.length === 0, errors: errors, sanitized: sanitized };
  }

  // Expose globally
  window.VarnisValidation = {
    sanitizeInput: sanitizeInput,
    detectMaliciousInput: detectMaliciousInput,
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    validateTextField: validateTextField,
    validateEnum: validateEnum,
    validateReport: validateReport,
    validateCommunityPost: validateCommunityPost,
    validateAlert: validateAlert,
    validateLogin: validateLogin,
    validateProfileUpdate: validateProfileUpdate,

    // Helper to show errors nicely
    showValidationErrors: function (errors, toastFn) {
      if (!errors || errors.length === 0) return;
      var msg = errors.join(" • ");
      if (typeof toastFn === "function") {
        toastFn(msg, "error");
      } else if (typeof window.showToast === "function") {
        window.showToast(msg, "error");
      } else {
        alert("Validation failed: " + msg);
      }
    }
  };

  // Also attach to VarnisAPI for convenience in future
  if (window.VarnisAPI) {
    window.VarnisAPI._validation = window.VarnisValidation;
  }

  console.log("[Varnis] Input validation & security layer loaded.");
})();
