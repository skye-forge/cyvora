/**
 * Varnis — mock data (canonical test dataset)
 * ------------------------------------------------------------
 * Single source of truth for demo/testing. VarnisAPI (api.js) serves
 * these when window.VarnisConfig.USE_MOCKS is true. Shapes here are
 * the contract the real backend should return — see README.md.
 *
 * CONSISTENCY RULES (keep these when editing):
 *  - Report/alert categories come from `reportCategories` below and
 *    must match ALLOWED_CATEGORIES in validation.js.
 *  - Regions use the 10 official Cameroon regions (+ Yaoundé/Douala
 *    for city-level districts) and must match ALLOWED_REGIONS.
 *  - currentUser is "Precious" (matches the approved mobile designs:
 *    home screen greeting "Hello Precious").
 *  - Leaderboard, monitor, certificates and daily-challenge values
 *    match the numbers shown across the static page sections.
 */
window.VarnisMockData = {

  /* ---------------- Canonical report categories ----------------
     Used by: report-incident.html category grid, validation.js
     whitelist, monitor "By category" bars, admin screens. */
  reportCategories: [
    { id: "ai_scam",        name: "AI-Generated Scam",  icon: "smart_toy",   desc: "Deepfakes, AI voice clones, generated phishing content." },
    { id: "momo_fraud",     name: "Mobile Money Fraud", icon: "payments",    desc: "MTN MoMo / Orange Money scams, unauthorised transfers." },
    { id: "phishing",       name: "Phishing",           icon: "phishing",    desc: "Fake emails, SMS or sites asking for credentials." },
    { id: "identity_theft", name: "Identity Theft",     icon: "badge",       desc: "Impersonation, stolen documents or accounts." },
    { id: "child_safety",   name: "Child Safety",       icon: "child_care",  desc: "Grooming, exploitation or harmful content involving minors." },
    { id: "business_attack",name: "Business Attack",    icon: "business",    desc: "BEC, ransomware targeting organisations." },
    { id: "disinformation", name: "Disinformation",     icon: "campaign",    desc: "Coordinated false narratives or propaganda." },
    { id: "hacking",        name: "Hacking",            icon: "terminal",    desc: "Account takeover, unauthorised access, malware." },
    { id: "other",          name: "Other",              icon: "more_horiz",  desc: "Any other cyber incident not listed above." }
  ],

  /* ---------------- Current session user ----------------
     Matches the design board: home greeting "Hello Precious",
     leaderboard "You" row (rank 12 · Centre · 1,450 XP · Apprenti),
     daily-challenge streak (4 days), bronze certificate holder. */
  currentUser: {
    id: "u-001",
    name: "Precious Ngum",
    email: "precious.ngum@example.cm",
    phone: "+237 670 123 456",
    district: "Centre",
    city: "Yaoundé",
    role: "citizen",
    trustScore: 9.8,
    verified: true,
    xp: 1450,
    level: "Apprenti",
    rank: 12,
    streakDays: 4,
    reportsFiled: 7,
  },

  /* ---------------- Incident reports ----------------
     Categories ∈ reportCategories names; districts ∈ ALLOWED_REGIONS. */
  reports: [
    { id: "r-001", trackingId: "VAR-942-01A", title: "Fake MTN MoMo reversal call asking for PIN", category: "Mobile Money Fraud", severity: "high", status: "in_review", district: "Centre", reporterName: "Precious Ngum", createdAt: "2026-07-13T14:20:00Z", description: "Caller claimed to be MTN support and requested my MoMo PIN to reverse a wrong transfer. I hung up and am reporting the number." },
    { id: "r-002", trackingId: "VAR-941-09B", title: "Phishing SMS impersonating Express Union", category: "Phishing", severity: "high", status: "pending", district: "Littoral", reporterName: "Eric Kamdem", createdAt: "2026-07-12T09:05:00Z", description: "SMS with a shortened link asking me to 'verify' my account within 24 hours or lose funds. The site copies the Express Union login page." },
    { id: "r-003", trackingId: "VAR-938-22C", title: "WhatsApp account takeover spreading scam links", category: "Hacking", severity: "critical", status: "approved", district: "Southwest", reporterName: "Grace Tchoua", createdAt: "2026-07-08T16:40:00Z", description: "My colleague's WhatsApp was hijacked and is messaging contacts with fake investment links. Several people in Buea received it." },
    { id: "r-004", trackingId: "VAR-935-04D", title: "AI voice clone of a bank manager requesting transfer", category: "AI-Generated Scam", severity: "critical", status: "approved", district: "Littoral", reporterName: "Samuel Oben", createdAt: "2026-07-05T08:12:00Z", description: "Received a voice note that sounds exactly like our branch manager instructing an urgent supplier payment. The number is not his." },
    { id: "r-005", trackingId: "VAR-930-17E", title: "Fake NGO job offers collecting ID documents", category: "Identity Theft", severity: "medium", status: "resolved", district: "Northwest", reporterName: "Fatima Bello", createdAt: "2026-06-28T11:30:00Z", description: "A Facebook page posing as an NGO recruiter collects national ID scans and 'processing fees' from applicants in Bamenda." },
    { id: "r-006", trackingId: "VAR-928-33F", title: "Coordinated false health rumour on social media", category: "Disinformation", severity: "medium", status: "rejected", district: "Far North", reporterName: "Precious Ngum", createdAt: "2026-06-25T10:00:00Z", description: "Viral posts claim a vaccination campaign is harmful. Rejected as duplicate — already tracked under an existing case." },
    { id: "r-007", trackingId: "VAR-925-08G", title: "Ransomware email targeting a Douala SME", category: "Business Attack", severity: "high", status: "pending", district: "Douala", reporterName: "Amina Nkolo", createdAt: "2026-06-22T15:45:00Z", description: "Invoice-themed email with a macro attachment. One workstation was encrypted before IT isolated the network." },
  ],

  /* ---------------- National alerts (design: "National Updates") ---------------- */
  alerts: [
    { id: "a-001", severity: "critical", category: "Phishing",           title: "New Phishing Wave Targeting MoMo Users", message: "Fraudulent 'account verification' SMS in circulation nationwide. Never share your PIN or OTP. Report suspicious numbers on Varnis.", region: "All Regions", active: true, issuedAt: "2026-07-14T06:00:00Z" },
    { id: "a-002", severity: "high",     category: "Mobile Money Fraud", title: "SIM-Swap Fraud Spike in Littoral", message: "Operators report increased SIM-swap attempts in Douala. Enable a SIM lock PIN and alert your operator to any sudden loss of network.", region: "Littoral", active: true, issuedAt: "2026-07-13T20:00:00Z" },
    { id: "a-003", severity: "medium",   category: "Identity Theft",     title: "Fake Job Portals Collecting ID Documents", message: "Sites impersonating public recruitment portals are harvesting national ID scans. Verify offers on official government domains only.", region: "All Regions", active: true, issuedAt: "2026-07-12T09:00:00Z" },
    { id: "a-004", severity: "low",      category: "Other",              title: "National Cyber Hygiene Week", message: "Free digital-safety workshops at community hubs and schools nationwide. Complete the Phishing zone on VARNIS for bonus XP.", region: "All Regions", active: true, issuedAt: "2026-07-10T05:40:00Z" },
  ],

  /* ---------------- Users (admin directory) ---------------- */
  users: [
    { id: "u-001", name: "Precious Ngum", email: "precious.ngum@example.cm", role: "citizen",   status: "active",    district: "Centre",    trustScore: 9.8, joinedAt: "2025-02-11" },
    { id: "u-002", name: "Amina Nkolo",   email: "a.nkolo@varnis.cm",        role: "moderator", status: "active",    district: "Littoral",  trustScore: 9.4, joinedAt: "2024-05-03" },
    { id: "u-003", name: "Eric Kamdem",   email: "e.kamdem@example.cm",      role: "citizen",   status: "active",    district: "Southwest", trustScore: 8.9, joinedAt: "2024-11-20" },
    { id: "u-004", name: "Fatima Bello",  email: "f.bello@example.cm",       role: "citizen",   status: "active",    district: "Far North", trustScore: 8.2, joinedAt: "2025-01-08" },
    { id: "u-005", name: "Samuel Oben",   email: "s.oben@example.cm",        role: "citizen",   status: "suspended", district: "Littoral",  trustScore: 4.1, joinedAt: "2025-06-30" },
    { id: "u-006", name: "Grace Tchoua",  email: "g.tchoua@example.cm",      role: "citizen",   status: "pending",   district: "West",      trustScore: 6.7, joinedAt: "2026-07-01" },
    { id: "u-007", name: "VARNIS Admin",  email: "admin@varnis.cm",          role: "admin",     status: "active",    district: "Centre",    trustScore: 10,  joinedAt: "2023-01-01" },
  ],

  /* ---------------- Community ---------------- */
  communityPosts: [
    { id: "c-001", author: "Amina Nkolo",   title: "Phishing ring reported through VARNIS dismantled in Douala", body: "Twelve citizen reports on the same fake bank portal led investigators to the operators. Your reports work — keep them coming.", category: "Phishing", upvotes: 128, comments: 14, status: "published", createdAt: "2026-07-08T10:00:00Z" },
    { id: "c-002", author: "Eric Kamdem",   title: "Our Buea cyber club completed the Phishing zone together", body: "Fifteen students earned the Bronze certificate this week. Happy to share how we organised the study sessions.", category: "Other", upvotes: 96, comments: 9, status: "published", createdAt: "2026-07-05T12:00:00Z" },
    { id: "c-003", author: "Anonymous",     title: "Unverified claim about a mobile operator breach", body: "Post flagged by residents for spreading an unconfirmed data-breach rumour. Moderators are verifying with the operator.", category: "Disinformation", upvotes: 3, comments: 22, status: "flagged", createdAt: "2026-07-11T09:15:00Z" },
    { id: "c-004", author: "Grace Tchoua",  title: "Proposal: MoMo safety talk at Bafoussam market", body: "Vendors are frequent fraud targets. Proposing a weekend awareness session with the regional VARNIS ambassadors — awaiting review.", category: "Mobile Money Fraud", upvotes: 41, comments: 6, status: "pending", createdAt: "2026-07-12T15:45:00Z" },
  ],

  /* ---------------- Learning ---------------- */
  courses: [
    { id: "course-phishing", title: "Phishing Awareness", description: "Spot fake emails, SMS and sites before they steal your credentials. Earn the Cyber Vigilant badge.", progressPct: 100, status: "completed",  lessonsCount: 9,  duration: "45 mins", href: "lesson-phishing.html" },
    { id: "course-cyber",    title: "Cybersecurity Essentials", description: "Core protocols for personal and civic digital security — passwords, devices, safe browsing.", progressPct: 65, status: "in_progress", lessonsCount: 12, duration: "1h 20m", href: "lesson-cybersecurity.html" },
    { id: "course-momo",     title: "Mobile Money Safety", description: "Protect your MTN MoMo and Orange Money accounts from fraud, SIM-swap and social engineering.", progressPct: 45, status: "in_progress", lessonsCount: 8,  duration: "55 mins", href: "learn.html" },
    { id: "course-family",   title: "Family & Child Online Safety", description: "Keep children safe online: privacy settings, grooming red flags, and how to report.", progressPct: 82, status: "in_progress", lessonsCount: 9,  duration: "1h 05m", href: "learn.html" },
  ],

  /* ---------------- Leaderboard ----------------
     national top-3 matches the static podium on leaderboard.html.
     Entry with you:true is the current user (rank/xp match currentUser). */
  leaderboard: {
    national: [
      { rank: 1,  name: "Paul M.",    region: "Centre",    level: "Patriote Digital", xp: 6140 },
      { rank: 2,  name: "Amina N.",   region: "Littoral",  level: "Sentinelle",       xp: 4820 },
      { rank: 3,  name: "Grace T.",   region: "West",      level: "Gardien",          xp: 4210 },
      { rank: 4,  name: "Eric K.",    region: "Southwest", level: "Gardien",          xp: 3890 },
      { rank: 5,  name: "Fatima B.",  region: "Far North", level: "Apprenti",         xp: 3120 },
      { rank: 6,  name: "Joseph E.",  region: "Littoral",  level: "Apprenti",         xp: 2870 },
      { rank: 7,  name: "Vanessa A.", region: "Centre",    level: "Apprenti",         xp: 2640 },
      { rank: 8,  name: "Ibrahim S.", region: "North",     level: "Apprenti",         xp: 2310 },
      { rank: 9,  name: "Claudine F.",region: "East",      level: "Apprenti",         xp: 2050 },
      { rank: 10, name: "Divine T.",  region: "Northwest", level: "Apprenti",         xp: 1890 },
      { rank: 11, name: "Solange M.", region: "Adamawa",   level: "Apprenti",         xp: 1620 },
      { rank: 12, name: "You (Precious N.)", region: "Centre", level: "Apprenti",     xp: 1450, you: true },
      { rank: 13, name: "Samuel O.",  region: "Littoral",  level: "Novice",           xp: 980 },
    ],
    regional: [
      { rank: 1, name: "Paul M.",             region: "Centre", level: "Patriote Digital", xp: 6140 },
      { rank: 2, name: "Vanessa A.",          region: "Centre", level: "Apprenti",         xp: 2640 },
      { rank: 3, name: "You (Precious N.)",   region: "Centre", level: "Apprenti",         xp: 1450, you: true },
      { rank: 4, name: "Bertrand K.",         region: "Centre", level: "Novice",           xp: 860 },
      { rank: 5, name: "Nadia O.",            region: "Centre", level: "Novice",           xp: 540 },
    ],
    institutional: [
      { rank: 1, name: "University of Yaoundé I",   region: "Centre",    level: "Institution", xp: 48200 },
      { rank: 2, name: "University of Buea",        region: "Southwest", level: "Institution", xp: 41350 },
      { rank: 3, name: "IUT Douala",                region: "Littoral",  level: "Institution", xp: 38900 },
      { rank: 4, name: "University of Bamenda",     region: "Northwest", level: "Institution", xp: 33470 },
      { rank: 5, name: "Lycée Général Leclerc",     region: "Centre",    level: "Institution", xp: 27210 },
    ],
  },

  /* ---------------- National threat monitor ----------------
     Values match the stat cards on monitor.html. */
  monitor: {
    updatedAt: "2026-07-15T06:00:00Z",
    monthlyReports: 1284,
    monthlyChangePct: 12,
    estLossFcfa: "482M",
    lossChangePct: 8,
    mostTargetedRegion: { name: "Littoral", incidents: 312 },
    trendingThreat: { name: "Mobile Money Fraud", sharePct: 28 },
    regions: [
      { name: "Adamawa",   incidents: 42 },
      { name: "Centre",    incidents: 198 },
      { name: "East",      incidents: 55 },
      { name: "Far North", incidents: 87 },
      { name: "Littoral",  incidents: 312 },
      { name: "North",     incidents: 64 },
      { name: "Northwest", incidents: 91 },
      { name: "South",     incidents: 48 },
      { name: "Southwest", incidents: 120 },
      { name: "West",      incidents: 167 },
    ],
    categories: [
      { name: "Mobile Money Fraud", pct: 28 },
      { name: "Phishing",           pct: 22 },
      { name: "AI-Generated Scam",  pct: 15 },
      { name: "Identity Theft",     pct: 12 },
      { name: "Hacking",            pct: 9 },
      { name: "Other",              pct: 14 },
    ],
  },

  /* ---------------- Certificates ----------------
     Bronze values match the preview card + verify link on
     certificates.html (ID VAR-BR-2026-00482). */
  certificates: [
    { id: "VAR-BR-2026-00482", tier: "bronze", label: "Bronze", requirement: "3 zones · 70% min",     status: "earned",      issuedAt: "2026-07-14", expiresAt: "2028-07-14", holder: "Precious Ngum" },
    { id: null,                tier: "silver", label: "Silver", requirement: "6 zones · 75% min",     status: "in_progress", progress: { done: 3, total: 6 } },
    { id: null,                tier: "gold",   label: "Gold",   requirement: "8 zones · 80% + 1 report", status: "locked" },
  ],

  /* ---------------- Daily challenge ----------------
     Matches daily-challenge.html copy; correct = index 1. */
  dailyChallenge: {
    id: "dc-2026-07-15",
    date: "2026-07-15",
    streakDays: 4,
    bonusXp: 50,
    resets: "00:00 WAT",
    question: "Someone calls claiming to be from MTN support and asks for your MoMo PIN to “reverse a wrong transfer.” What do you do?",
    options: [
      { text: "Give the PIN so they can reverse it",                 correct: false },
      { text: "Hang up, never share PIN, and report on VARNIS",      correct: true },
      { text: "Ask them to call back later",                          correct: false },
      { text: "Send a screenshot of your balance",                    correct: false },
    ],
    correctFeedback: "Correct! +50 bonus XP",
    correctExplanation: "MTN (and banks) never ask for your PIN by phone. Report scams immediately.",
    incorrectFeedback: "Not quite. Never share your MoMo PIN.",
    incorrectExplanation: "Correct answer highlighted. Try again tomorrow for streak XP.",
  },

  /* ---------------- Quizzes (LEARN engine, SRS FR-11..FR-14) ----------------
     Each quiz is a set of questions used by VarnisQuiz (5 lives, +XP per
     correct answer, 70% to pass). Keyed by lesson/course id. */
  quizzes: {
    "lesson-phishing": {
      title: "Phishing Awareness — Module Quiz",
      passPct: 70,
      xpPerCorrect: 20,
      questions: [
        { q: "A message says your bank account will be closed in 2 hours unless you 'verify' via a link. This is a classic sign of…", options: ["A genuine bank notice", "Phishing using urgency", "A system update", "A delivery alert"], correctIndex: 1, explanation: "Creating urgency is one of the most common phishing tactics. Banks don't threaten instant closure over SMS links." },
        { q: "Which detail most reliably reveals a fake sender?", options: ["A logo in the email", "A polite greeting", "A misspelled or look-alike domain", "The word 'official'"], correctIndex: 2, explanation: "Attackers use look-alike domains (e.g. varnis-official.net). Always check the exact domain, not the display name." },
        { q: "You hover a 'Verify now' button and the status bar shows a different address than the text. You should…", options: ["Click it quickly", "Trust the button text", "Not click and report it", "Forward it to friends"], correctIndex: 2, explanation: "If the real destination doesn't match the visible text, don't click. Report it on VARNIS." },
        { q: "An official institution will NEVER ask you by email or SMS for…", options: ["Your name", "Your region", "Your full password or PIN", "Your feedback"], correctIndex: 2, explanation: "No legitimate institution asks for your full password, PIN, or OTP. Never share them." },
        { q: "Poor grammar and inconsistent capitalisation in a 'bank' message are…", options: ["Normal", "A red flag", "Proof it's real", "Irrelevant"], correctIndex: 1, explanation: "Professional institutions proofread. Sloppy language is a strong warning sign of a scam." },
      ],
    },
    "lesson-cybersecurity": {
      title: "Cybersecurity Essentials — Module Quiz",
      passPct: 70,
      xpPerCorrect: 20,
      questions: [
        { q: "The strongest password is…", options: ["Your birth year", "A long unique passphrase", "Your name + 123", "The same PIN you use for MoMo"], correctIndex: 1, explanation: "Length and uniqueness beat complexity. Never reuse your MoMo PIN as a password." },
        { q: "Two-step verification protects you because…", options: ["It speeds up login", "A stolen password alone isn't enough", "It hides your screen", "It blocks all ads"], correctIndex: 1, explanation: "Even if your password leaks, the attacker still needs the one-time code from your device." },
        { q: "Public Wi-Fi is risky mainly because…", options: ["It's slow", "Others may intercept your traffic", "It drains battery", "It costs money"], correctIndex: 1, explanation: "On untrusted networks, avoid logging into sensitive accounts or use a trusted connection." },
        { q: "The safest response to an unexpected software update popup on a website is to…", options: ["Install immediately", "Ignore the popup and update via official settings", "Share it", "Disable your antivirus"], correctIndex: 1, explanation: "Fake 'update' popups deliver malware. Update only through official app or OS settings." },
        { q: "If your account may be compromised, first…", options: ["Do nothing", "Change the password from a trusted device", "Post about it", "Delete the app"], correctIndex: 1, explanation: "Change the password from a device you trust and enable two-step verification." },
      ],
    },
  },

  /* ---------------- Lessons (admin JSON authoring) ----------------
     Mirrors the server's lesson shape so the admin Learning editor has
     content in pure-static/offline mode. Live mode uses the backend seed. */
  lessons: [
    {
      id: "lesson-phishing-basics", slug: "phishing-basics",
      title: "Spotting Phishing Messages", topic: "phishing",
      level: "beginner", language: "en",
      summary: "Recognise fake SMS and emails that imitate MTN, Orange, banks and government portals.",
      durationMin: 10, xp: 50, status: "published",
      sections: [
        { heading: "Why this matters", body: "Phishing is the #1 entry point for account takeover in Cameroon. Fake SMS and emails imitate MTN, Orange, banks and even government portals to steal your PIN, OTP or password." },
        { heading: "How to spot it", body: "Watch for urgency, look-alike domains, requests for your PIN/OTP, and links that don't match the visible text." },
        { heading: "What to do", body: "Never tap the link. Contact the institution through its official app or number. Then report it on VARNIS." },
      ],
      quiz: [
        { q: "A message asks for your MoMo PIN to 'unlock a bonus'. You should…", options: ["Send the PIN", "Ignore and report it on VARNIS", "Forward it to friends", "Reply to ask questions"], answer: 1, explanation: "No legitimate service asks for your PIN. Report it." },
      ],
      createdAt: "2026-07-15T09:00:00Z", updatedAt: "2026-07-15T09:00:00Z",
    },
    {
      id: "lesson-momo-defense", slug: "mobile-money-defense",
      title: "Mobile Money Fraud Defense", topic: "mobile money",
      level: "beginner", language: "en",
      summary: "Defend against reversal scams, fake agents and 'customer care' calls.",
      durationMin: 8, xp: 40, status: "draft",
      sections: [
        { heading: "Why this matters", body: "MoMo fraud drains real savings. Scammers pose as agents, 'customer care', or friends in trouble to get you to approve a transfer or reveal your PIN." },
        { heading: "What to do", body: "Hang up, dial the official short code yourself, and never share your PIN — MTN and Orange never ask for it. Report the number on VARNIS." },
      ],
      quiz: [
        { q: "Someone says they sent you money 'by mistake' and asks you to send it back now. This is…", options: ["Normal", "A classic reversal scam", "A bank procedure", "A network test"], answer: 1, explanation: "Reversal scams rely on urgency. Verify first." },
      ],
      createdAt: "2026-07-15T09:00:00Z", updatedAt: "2026-07-15T09:00:00Z",
    },
  ],

  /* ---------------- Notifications ----------------
     Data contract for the notifications screen in the mobile designs
     (screen not built yet — see gap analysis / next phase). */
  notifications: [
    { id: "n-001", type: "alert",     title: "New national alert", message: "New Phishing Wave Targeting MoMo Users — read the advisory.", createdAt: "2026-07-14T06:05:00Z", read: false },
    { id: "n-002", type: "report",    title: "Report status updated", message: "Your report VAR-942-01A is now In Review.", createdAt: "2026-07-13T15:00:00Z", read: false },
    { id: "n-003", type: "learning",  title: "Daily challenge available", message: "Keep your 4-day streak alive — today's question is ready.", createdAt: "2026-07-15T05:00:00Z", read: false },
    { id: "n-004", type: "community", title: "Your post was approved", message: "\"MoMo safety talk at Bafoussam market\" is now visible to the community.", createdAt: "2026-07-12T16:10:00Z", read: true },
  ],
};

/* ============================================================================
   NEW FEATURE DATASETS — KYC · Device Recovery · Support tickets
   ----------------------------------------------------------------------------
   Appended as a separate block so the original dataset above stays untouched.
   Same rule as the rest of this file: these shapes ARE the API contract.
   See README.md → "API contract (new features)".
   ========================================================================== */
Object.assign(window.VarnisMockData, {

  /* ---------------- KYC ----------------
     States: draft → submitted → under_review → approved → rejected → expired
     KYC gates: report-incident, learn/academy, certificates, device recovery. */
  kycDocumentTypes: [
    { id: "cni",       name: "National ID Card (CNI)", hint: "Front and back required" },
    { id: "passport",  name: "Passport",               hint: "Photo page only" },
    { id: "residence", name: "Residence Permit",       hint: "For non-nationals" },
    { id: "driver",    name: "Driver's Licence",       hint: "Front and back required" },
  ],

  kyc: {
    id: "kyc-001",
    userId: "u-001",
    status: "draft",          // draft|submitted|under_review|approved|rejected|expired
    level: "standard",
    submittedAt: null,
    reviewedAt: null,
    expiresAt: null,
    reviewer: null,
    rejectionReason: null,
    personal: {
      fullName: "Precious Ngum",
      dob: "",
      gender: "",
      nationality: "Cameroonian",
      region: "Centre",
      city: "Yaoundé",
      address: "",
      occupation: "",
    },
    document: { type: "cni", number: "", issuedAt: "", expiresAt: "", frontFileName: "", backFileName: "" },
    selfie: { fileName: "" },
    history: [],
  },

  /* Review queue for admin/kyc.html */
  kycSubmissions: [
    { id: "kyc-104", userId: "u-002", name: "Eric Kamdem",   phone: "+237 699 220 118", docType: "cni",      docNumber: "1198340221", region: "Littoral", status: "under_review", submittedAt: "2026-07-15T08:12:00Z", riskFlags: [] },
    { id: "kyc-103", userId: "u-004", name: "Aminatou Bello", phone: "+237 677 401 903", docType: "passport", docNumber: "CM0442118",  region: "Far North", status: "submitted",    submittedAt: "2026-07-15T06:40:00Z", riskFlags: ["Document expires in 45 days"] },
    { id: "kyc-102", userId: "u-005", name: "Serge Mbarga",   phone: "+237 655 118 220", docType: "cni",      docNumber: "1102994417", region: "Centre",   status: "approved",     submittedAt: "2026-07-14T11:02:00Z", riskFlags: [] },
    { id: "kyc-101", userId: "u-006", name: "Grace Nfor",     phone: "+237 681 330 774", docType: "driver",   docNumber: "DL-88-2211",  region: "North-West", status: "rejected",   submittedAt: "2026-07-13T15:55:00Z", riskFlags: ["Photo unreadable"] },
  ],

  /* ---------------- Device recovery ---------------- */
  recoveryFees: {
    currency: "FCFA",
    electronics: { amount: 15000, label: "Electronic device tracking" },
    vehicle:     { amount: 35000, label: "Vehicle tracking" },
    note: "A single tracking fee covers the whole case: authority filing, network tracing and status updates until the case is closed. It is not refundable once authorities begin processing.",
  },

  deviceTypes: ["Smartphone", "Laptop", "Tablet", "Smartwatch", "Camera", "Games console", "Other"],
  deviceBrands: ["Apple", "Samsung", "Tecno", "Infinix", "itel", "Xiaomi", "Oppo", "Huawei", "Nokia", "Lenovo", "HP", "Dell", "Asus", "Acer", "Sony", "Other"],
  vehicleTypes: ["Car", "Motorcycle", "Tricycle", "Van / Minibus", "Truck", "Bus", "Other"],
  vehicleManufacturers: ["Toyota", "Nissan", "Mitsubishi", "Hyundai", "Kia", "Mercedes-Benz", "Volkswagen", "Ford", "Peugeot", "Honda", "Suzuki", "Yamaha", "Bajaj", "TVS", "Sanili", "Other"],

  /* Stage order matches the tracking timeline in the spec. */
  recoveryStages: [
    { id: "ownership_verified", label: "Ownership verified" },
    { id: "payment_submitted",  label: "Payment submitted" },
    { id: "payment_approved",   label: "Payment approved" },
    { id: "sent_to_authorities", label: "Sent to authorities" },
    { id: "under_investigation", label: "Under investigation" },
    { id: "evidence_requested",  label: "Additional evidence requested", optional: true },
    { id: "device_located",      label: "Device located" },
    { id: "recovered",           label: "Recovered" },
    { id: "closed",              label: "Closed" },
  ],

  recoveryCases: [
    {
      id: "rc-001",
      trackingId: "REC-2026-0431",
      assetType: "electronics",
      assetLabel: "Samsung Galaxy A54 · Black",
      asset: { deviceType: "Smartphone", brand: "Samsung", model: "Galaxy A54", color: "Black", imei: "356938035643809", serial: "RF8T30ZXKYW" },
      stage: "under_investigation",
      state: "active",
      onBehalf: false,
      owner: { name: "Precious Ngum", phone: "+237 670 123 456" },
      submittedBy: "Precious Ngum",
      incidentDate: "2026-07-11",
      lastSeen: "Marché Central, Yaoundé",
      payment: { method: "MTN Mobile Money", amount: 15000, reference: "MP260713.1432.A9210", status: "approved", proofFileName: "momo-receipt.jpg", submittedAt: "2026-07-13T14:35:00Z", reviewedAt: "2026-07-13T17:02:00Z" },
      caseFile: "ANTIC/REC/2026/0431",
      eta: "2026-07-24T16:00:00Z",
      location: { label: "Douala · Bonabéri sector", confidence: 78, updatedAt: "2026-07-19T09:10:00Z" },
      createdAt: "2026-07-13T14:20:00Z",
      updatedAt: "2026-07-19T09:10:00Z",
      timeline: [
        { stage: "ownership_verified", at: "2026-07-13T14:22:00Z", note: "Two of three ownership fields matched the VARNIS account on file.", actor: "VARNIS" },
        { stage: "payment_submitted",  at: "2026-07-13T14:35:00Z", note: "MTN Mobile Money · 15,000 FCFA · proof uploaded.", actor: "Precious Ngum" },
        { stage: "payment_approved",   at: "2026-07-13T17:02:00Z", note: "Payment reference confirmed against the operator statement.", actor: "VARNIS Finance" },
        { stage: "sent_to_authorities", at: "2026-07-14T08:15:00Z", note: "Case filed with the Judicial Police cybercrime unit as ANTIC/REC/2026/0431.", actor: "VARNIS" },
        { stage: "under_investigation", at: "2026-07-16T10:40:00Z", note: "IMEI flagged with network operators. Tracing in progress.", actor: "Judicial Police" },
      ],
      evidenceRequests: [
        { id: "ev-001", requestedAt: "2026-07-18T13:20:00Z", requestedBy: "Judicial Police", message: "Please upload the original purchase invoice showing the IMEI, and a screenshot of the last known Find-My-Device location.", dueAt: "2026-07-25T23:59:00Z", status: "pending", files: [] },
      ],
      documents: [
        { name: "purchase-receipt.pdf", kind: "Ownership document", uploadedAt: "2026-07-13T14:28:00Z" },
        { name: "momo-receipt.jpg",     kind: "Proof of payment",   uploadedAt: "2026-07-13T14:35:00Z" },
      ],
    },
    {
      id: "rc-002",
      trackingId: "REC-2026-0388",
      assetType: "vehicle",
      assetLabel: "Toyota Corolla 2016 · LT 447 AB",
      asset: { vehicleType: "Car", manufacturer: "Toyota", model: "Corolla", year: "2016", plate: "LT 447 AB", vin: "JTDBR32E560098771", color: "Silver" },
      stage: "recovered",
      state: "active",
      onBehalf: true,
      owner: { name: "Jeanne Ngum", phone: "+237 690 550 118" },
      submittedBy: "Precious Ngum",
      incidentDate: "2026-06-28",
      lastSeen: "Akwa, Douala",
      payment: { method: "Orange Money", amount: 35000, reference: "OM260629.0918.C4471", status: "approved", proofFileName: "om-receipt.pdf", submittedAt: "2026-06-29T09:18:00Z", reviewedAt: "2026-06-29T12:44:00Z" },
      caseFile: "ANTIC/REC/2026/0388",
      eta: null,
      location: { label: "Recovered · Bonabéri impound, Douala", confidence: 100, updatedAt: "2026-07-12T15:30:00Z" },
      createdAt: "2026-06-29T09:05:00Z",
      updatedAt: "2026-07-12T15:30:00Z",
      timeline: [
        { stage: "ownership_verified", at: "2026-06-29T09:07:00Z", note: "Submitted on behalf of the owner — name and telephone matched the owner's VARNIS account.", actor: "VARNIS" },
        { stage: "payment_submitted",  at: "2026-06-29T09:18:00Z", note: "Orange Money · 35,000 FCFA · proof uploaded.", actor: "Precious Ngum" },
        { stage: "payment_approved",   at: "2026-06-29T12:44:00Z", note: "Payment confirmed.", actor: "VARNIS Finance" },
        { stage: "sent_to_authorities", at: "2026-06-30T07:50:00Z", note: "Filed with the Gendarmerie vehicle theft brigade.", actor: "VARNIS" },
        { stage: "under_investigation", at: "2026-07-02T11:15:00Z", note: "Plate and VIN circulated to checkpoints across Littoral and Centre.", actor: "Gendarmerie" },
        { stage: "evidence_requested", at: "2026-07-05T14:00:00Z", note: "Carte grise requested to confirm registration details.", actor: "Gendarmerie" },
        { stage: "device_located",     at: "2026-07-10T16:20:00Z", note: "Vehicle identified at a checkpoint in Bonabéri.", actor: "Gendarmerie" },
        { stage: "recovered",          at: "2026-07-12T15:30:00Z", note: "Vehicle secured at the Bonabéri impound. Collection instructions sent.", actor: "Gendarmerie" },
      ],
      evidenceRequests: [
        { id: "ev-002", requestedAt: "2026-07-05T14:00:00Z", requestedBy: "Gendarmerie", message: "Upload the carte grise (vehicle registration certificate).", dueAt: "2026-07-09T23:59:00Z", status: "submitted", files: [{ name: "carte-grise.pdf", uploadedAt: "2026-07-06T08:40:00Z" }] },
      ],
      documents: [
        { name: "carte-grise.pdf", kind: "Ownership document", uploadedAt: "2026-06-29T09:12:00Z" },
        { name: "om-receipt.pdf",  kind: "Proof of payment",   uploadedAt: "2026-06-29T09:18:00Z" },
      ],
    },
    {
      id: "rc-003",
      trackingId: "REC-2026-0455",
      assetType: "electronics",
      assetLabel: "Apple MacBook Air M2 · Midnight",
      asset: { deviceType: "Laptop", brand: "Apple", model: "MacBook Air M2", color: "Midnight", imei: "", serial: "C02X1LMEJHD3" },
      stage: "payment_submitted",
      state: "active",
      onBehalf: false,
      owner: { name: "Precious Ngum", phone: "+237 670 123 456" },
      submittedBy: "Precious Ngum",
      incidentDate: "2026-07-17",
      lastSeen: "Bus stop, Nkolbisson",
      payment: { method: "MTN Mobile Money", amount: 15000, reference: "MP260718.1120.B7734", status: "pending", proofFileName: "momo-proof.png", submittedAt: "2026-07-18T11:20:00Z", reviewedAt: null },
      caseFile: null,
      eta: null,
      location: null,
      createdAt: "2026-07-18T11:05:00Z",
      updatedAt: "2026-07-18T11:20:00Z",
      timeline: [
        { stage: "ownership_verified", at: "2026-07-18T11:08:00Z", note: "Ownership confirmed against the account on file.", actor: "VARNIS" },
        { stage: "payment_submitted",  at: "2026-07-18T11:20:00Z", note: "Awaiting confirmation of the payment reference.", actor: "Precious Ngum" },
      ],
      evidenceRequests: [],
      documents: [
        { name: "apple-invoice.pdf", kind: "Ownership document", uploadedAt: "2026-07-18T11:12:00Z" },
        { name: "momo-proof.png",    kind: "Proof of payment",   uploadedAt: "2026-07-18T11:20:00Z" },
      ],
    },
  ],

  /* ---------------- Support tickets ----------------
     Status: open → pending → resolved → closed */
  supportCategories: [
    { id: "technical",   name: "Technical issue",     desc: "The app crashes, a page won't load, uploads fail." },
    { id: "account",     name: "Account & sign-in",   desc: "Password, Google sign-in, phone number changes." },
    { id: "kyc",         name: "Identity verification", desc: "KYC rejected, documents, expiry." },
    { id: "recovery",    name: "Device recovery",     desc: "Recovery cases, tracking, authorities." },
    { id: "payment",     name: "Payments",            desc: "Tracking fees, MoMo and Orange Money proof." },
    { id: "report",      name: "Incident reports",    desc: "Report status, evidence, corrections." },
    { id: "other",       name: "Something else",      desc: "Anything not covered above." },
  ],

  supportChannels: {
    phone: "+237 222 500 100",
    phoneHours: "Mon–Sat · 08:00–18:00 WAT",
    email: "support@varnis.cm",
    emailSla: "One business day",
    chatSla: "Under 3 minutes during business hours",
  },

  supportTickets: [
    {
      id: "t-1042", reference: "SUP-1042", subject: "Payment proof rejected on recovery case REC-2026-0455",
      category: "payment", priority: "high", status: "pending", channel: "form",
      createdAt: "2026-07-18T12:04:00Z", updatedAt: "2026-07-19T08:30:00Z", agent: "Nadia · Payments",
      messages: [
        { from: "user",  author: "You",             body: "I uploaded my MTN MoMo receipt for case REC-2026-0455 but the status still shows pending after a day. The reference is MP260718.1120.B7734.", at: "2026-07-18T12:04:00Z" },
        { from: "agent", author: "Nadia · Payments", body: "Thanks for the reference. Payments submitted after 17:00 WAT are confirmed the next working morning. I can see yours in the queue — I've flagged it for priority review.", at: "2026-07-18T16:22:00Z" },
        { from: "agent", author: "Nadia · Payments", body: "The operator statement hasn't landed yet. Could you confirm the phone number the payment was sent from? That lets me match it manually.", at: "2026-07-19T08:30:00Z" },
      ],
    },
    {
      id: "t-1039", reference: "SUP-1039", subject: "Evidence upload fails on Android Chrome",
      category: "technical", priority: "normal", status: "open", channel: "form",
      createdAt: "2026-07-17T09:41:00Z", updatedAt: "2026-07-17T09:41:00Z", agent: null,
      messages: [
        { from: "user", author: "You", body: "When I pick a photo from the gallery on my phone the upload bar reaches 90% and then resets. It works on my laptop. Android 13, Chrome 126.", at: "2026-07-17T09:41:00Z" },
      ],
    },
    {
      id: "t-1021", reference: "SUP-1021", subject: "Google sign-in sends me back to the login page",
      category: "account", priority: "normal", status: "resolved", channel: "chat",
      createdAt: "2026-07-09T18:12:00Z", updatedAt: "2026-07-10T10:05:00Z", agent: "Yann · Accounts",
      messages: [
        { from: "user",  author: "You",            body: "Continue with Google takes me to the Google screen, I pick my account, and then I land back on the VARNIS login page.", at: "2026-07-09T18:12:00Z" },
        { from: "agent", author: "Yann · Accounts", body: "That happens when a browser blocks third-party cookies for the sign-in redirect. Allow cookies for varnis.cm, or link Google from Profile → Security once you're signed in with your phone number.", at: "2026-07-09T19:30:00Z" },
        { from: "user",  author: "You",            body: "Linking it from the profile worked. Thank you.", at: "2026-07-10T10:05:00Z" },
      ],
    },
    {
      id: "t-0998", reference: "SUP-0998", subject: "How long does KYC review take?",
      category: "kyc", priority: "low", status: "closed", channel: "email",
      createdAt: "2026-06-30T07:20:00Z", updatedAt: "2026-07-01T09:15:00Z", agent: "Support Desk",
      messages: [
        { from: "user",  author: "You",          body: "I submitted my CNI two days ago and it still says under review.", at: "2026-06-30T07:20:00Z" },
        { from: "agent", author: "Support Desk", body: "Standard review takes up to three working days. Yours was approved this morning — you now have access to reporting, the academy and device recovery.", at: "2026-07-01T09:15:00Z" },
      ],
    },
  ],
});
