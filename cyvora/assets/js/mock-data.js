/**
 * Cyvora — mock data (canonical test dataset)
 * ------------------------------------------------------------
 * Single source of truth for demo/testing. CyvoraAPI (api.js) serves
 * these when window.CyvoraConfig.USE_MOCKS is true. Shapes here are
 * the contract the real backend should return — see BACKEND.md.
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
window.CyvoraMockData = {

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
    { id: "r-001", trackingId: "CYV-942-01A", title: "Fake MTN MoMo reversal call asking for PIN", category: "Mobile Money Fraud", severity: "high", status: "in_review", district: "Centre", reporterName: "Precious Ngum", createdAt: "2026-07-13T14:20:00Z", description: "Caller claimed to be MTN support and requested my MoMo PIN to reverse a wrong transfer. I hung up and am reporting the number." },
    { id: "r-002", trackingId: "CYV-941-09B", title: "Phishing SMS impersonating Express Union", category: "Phishing", severity: "high", status: "pending", district: "Littoral", reporterName: "Eric Kamdem", createdAt: "2026-07-12T09:05:00Z", description: "SMS with a shortened link asking me to 'verify' my account within 24 hours or lose funds. The site copies the Express Union login page." },
    { id: "r-003", trackingId: "CYV-938-22C", title: "WhatsApp account takeover spreading scam links", category: "Hacking", severity: "critical", status: "approved", district: "Southwest", reporterName: "Grace Tchoua", createdAt: "2026-07-08T16:40:00Z", description: "My colleague's WhatsApp was hijacked and is messaging contacts with fake investment links. Several people in Buea received it." },
    { id: "r-004", trackingId: "CYV-935-04D", title: "AI voice clone of a bank manager requesting transfer", category: "AI-Generated Scam", severity: "critical", status: "approved", district: "Littoral", reporterName: "Samuel Oben", createdAt: "2026-07-05T08:12:00Z", description: "Received a voice note that sounds exactly like our branch manager instructing an urgent supplier payment. The number is not his." },
    { id: "r-005", trackingId: "CYV-930-17E", title: "Fake NGO job offers collecting ID documents", category: "Identity Theft", severity: "medium", status: "resolved", district: "Northwest", reporterName: "Fatima Bello", createdAt: "2026-06-28T11:30:00Z", description: "A Facebook page posing as an NGO recruiter collects national ID scans and 'processing fees' from applicants in Bamenda." },
    { id: "r-006", trackingId: "CYV-928-33F", title: "Coordinated false health rumour on social media", category: "Disinformation", severity: "medium", status: "rejected", district: "Far North", reporterName: "Precious Ngum", createdAt: "2026-06-25T10:00:00Z", description: "Viral posts claim a vaccination campaign is harmful. Rejected as duplicate — already tracked under an existing case." },
    { id: "r-007", trackingId: "CYV-925-08G", title: "Ransomware email targeting a Douala SME", category: "Business Attack", severity: "high", status: "pending", district: "Douala", reporterName: "Amina Nkolo", createdAt: "2026-06-22T15:45:00Z", description: "Invoice-themed email with a macro attachment. One workstation was encrypted before IT isolated the network." },
  ],

  /* ---------------- National alerts (design: "National Updates") ---------------- */
  alerts: [
    { id: "a-001", severity: "critical", category: "Phishing",           title: "New Phishing Wave Targeting MoMo Users", message: "Fraudulent 'account verification' SMS in circulation nationwide. Never share your PIN or OTP. Report suspicious numbers on Cyvora.", region: "All Regions", active: true, issuedAt: "2026-07-14T06:00:00Z" },
    { id: "a-002", severity: "high",     category: "Mobile Money Fraud", title: "SIM-Swap Fraud Spike in Littoral", message: "Operators report increased SIM-swap attempts in Douala. Enable a SIM lock PIN and alert your operator to any sudden loss of network.", region: "Littoral", active: true, issuedAt: "2026-07-13T20:00:00Z" },
    { id: "a-003", severity: "medium",   category: "Identity Theft",     title: "Fake Job Portals Collecting ID Documents", message: "Sites impersonating public recruitment portals are harvesting national ID scans. Verify offers on official government domains only.", region: "All Regions", active: true, issuedAt: "2026-07-12T09:00:00Z" },
    { id: "a-004", severity: "low",      category: "Other",              title: "National Cyber Hygiene Week", message: "Free digital-safety workshops at community hubs and schools nationwide. Complete the Phishing zone on VARNIS for bonus XP.", region: "All Regions", active: true, issuedAt: "2026-07-10T05:40:00Z" },
  ],

  /* ---------------- Users (admin directory) ---------------- */
  users: [
    { id: "u-001", name: "Precious Ngum", email: "precious.ngum@example.cm", role: "citizen",   status: "active",    district: "Centre",    trustScore: 9.8, joinedAt: "2025-02-11" },
    { id: "u-002", name: "Amina Nkolo",   email: "a.nkolo@cyvora.cm",        role: "moderator", status: "active",    district: "Littoral",  trustScore: 9.4, joinedAt: "2024-05-03" },
    { id: "u-003", name: "Eric Kamdem",   email: "e.kamdem@example.cm",      role: "citizen",   status: "active",    district: "Southwest", trustScore: 8.9, joinedAt: "2024-11-20" },
    { id: "u-004", name: "Fatima Bello",  email: "f.bello@example.cm",       role: "citizen",   status: "active",    district: "Far North", trustScore: 8.2, joinedAt: "2025-01-08" },
    { id: "u-005", name: "Samuel Oben",   email: "s.oben@example.cm",        role: "citizen",   status: "suspended", district: "Littoral",  trustScore: 4.1, joinedAt: "2025-06-30" },
    { id: "u-006", name: "Grace Tchoua",  email: "g.tchoua@example.cm",      role: "citizen",   status: "pending",   district: "West",      trustScore: 6.7, joinedAt: "2026-07-01" },
    { id: "u-007", name: "VARNIS Admin",  email: "admin@cyvora.cm",          role: "admin",     status: "active",    district: "Centre",    trustScore: 10,  joinedAt: "2023-01-01" },
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
     certificates.html (ID CYV-BR-2026-00482). */
  certificates: [
    { id: "CYV-BR-2026-00482", tier: "bronze", label: "Bronze", requirement: "3 zones · 70% min",     status: "earned",      issuedAt: "2026-07-14", expiresAt: "2028-07-14", holder: "Precious Ngum" },
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
     Each quiz is a set of questions used by CyvoraQuiz (5 lives, +XP per
     correct answer, 70% to pass). Keyed by lesson/course id. */
  quizzes: {
    "lesson-phishing": {
      title: "Phishing Awareness — Module Quiz",
      passPct: 70,
      xpPerCorrect: 20,
      questions: [
        { q: "A message says your bank account will be closed in 2 hours unless you 'verify' via a link. This is a classic sign of…", options: ["A genuine bank notice", "Phishing using urgency", "A system update", "A delivery alert"], correctIndex: 1, explanation: "Creating urgency is one of the most common phishing tactics. Banks don't threaten instant closure over SMS links." },
        { q: "Which detail most reliably reveals a fake sender?", options: ["A logo in the email", "A polite greeting", "A misspelled or look-alike domain", "The word 'official'"], correctIndex: 2, explanation: "Attackers use look-alike domains (e.g. cyvora-official.net). Always check the exact domain, not the display name." },
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

  /* ---------------- Notifications ----------------
     Data contract for the notifications screen in the mobile designs
     (screen not built yet — see gap analysis / next phase). */
  notifications: [
    { id: "n-001", type: "alert",     title: "New national alert", message: "New Phishing Wave Targeting MoMo Users — read the advisory.", createdAt: "2026-07-14T06:05:00Z", read: false },
    { id: "n-002", type: "report",    title: "Report status updated", message: "Your report CYV-942-01A is now In Review.", createdAt: "2026-07-13T15:00:00Z", read: false },
    { id: "n-003", type: "learning",  title: "Daily challenge available", message: "Keep your 4-day streak alive — today's question is ready.", createdAt: "2026-07-15T05:00:00Z", read: false },
    { id: "n-004", type: "community", title: "Your post was approved", message: "\"MoMo safety talk at Bafoussam market\" is now visible to the community.", createdAt: "2026-07-12T16:10:00Z", read: true },
  ],
};
