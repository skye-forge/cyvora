/**
 * Cyvora — mock data
 * ------------------------------------------------------------
 * Local stand-ins for the real database. CyvoraAPI (api.js) serves
 * these when window.CyvoraConfig.USE_MOCKS is true. Shapes here are
 * the contract the real backend should return — see BACKEND.md.
 */
window.CyvoraMockData = {
  reports: [
    { id: "r-001", trackingId: "CYV-942-01A", title: "Streetlight outage on 5th & Main", category: "Utility Failure", severity: "medium", status: "pending", district: "Downtown-04", reporterName: "Marcus Henderson", createdAt: "2026-07-10T14:20:00Z", description: "Three consecutive streetlights have been out for a week, creating a safety concern for evening pedestrians." },
    { id: "r-002", trackingId: "CYV-941-09B", title: "Suspicious activity near riverside park", category: "Suspicious Activity", severity: "high", status: "in_review", district: "Harbor Hills", reporterName: "Aisha Bello", createdAt: "2026-07-09T09:05:00Z", description: "Unfamiliar vehicle parked overnight near the playground entrance for three nights running." },
    { id: "r-003", trackingId: "CYV-938-22C", title: "Pothole causing minor collisions", category: "Road Hazards", severity: "critical", status: "approved", district: "Tech Corridor", reporterName: "James Sterling", createdAt: "2026-07-06T16:40:00Z", description: "Deep pothole on the main corridor has already caused two minor vehicle incidents." },
    { id: "r-004", trackingId: "CYV-935-04D", title: "Water main leak flooding sidewalk", category: "Utility Failure", severity: "medium", status: "approved", district: "East Riverside", reporterName: "Priya Nair", createdAt: "2026-07-03T08:12:00Z", description: "Steady water leak has flooded the sidewalk outside the community center." },
    { id: "r-005", trackingId: "CYV-930-17E", title: "Graffiti on transit station wall", category: "Urban Improvement", severity: "low", status: "rejected", district: "Central Metro", reporterName: "Diego Alvarez", createdAt: "2026-06-28T11:30:00Z", description: "Non-urgent graffiti report, routed to municipal maintenance queue." },
  ],

  alerts: [
    { id: "a-001", severity: "high", category: "SEVERE WEATHER", title: "High Wind Warning: Zone B", message: "Authorities advise securing outdoor items. Expected duration: 6 hours.", region: "Zone B", active: true, issuedAt: "2026-07-14T06:00:00Z" },
    { id: "a-002", severity: "medium", category: "INFRASTRUCTURE", title: "Main St Bridge Maintenance", message: "Limited access between 11 PM - 4 AM tonight. Plan routes accordingly.", region: "Downtown-04", active: true, issuedAt: "2026-07-13T20:00:00Z" },
    { id: "a-003", severity: "low", category: "PUBLIC HEALTH", title: "Seasonal Immunization Drive", message: "Mobile clinics stationed at all Community Hubs this weekend.", region: "All Districts", active: true, issuedAt: "2026-07-12T09:00:00Z" },
    { id: "a-004", severity: "critical", category: "COASTAL MONITORING", title: "Live Alert: West Coastal Sweep", message: "Routine coastal monitoring sweep in progress, coverage at 94.2%.", region: "West Coast", active: true, issuedAt: "2026-07-14T05:40:00Z" },
  ],

  users: [
    { id: "u-001", name: "Marcus Henderson", email: "m.henderson@metropolis.gov", role: "citizen", status: "active", district: "Central Metro", trustScore: 9.8, joinedAt: "2024-02-11" },
    { id: "u-002", name: "Aisha Bello", email: "a.bello@metropolis.gov", role: "citizen", status: "active", district: "Harbor Hills", trustScore: 8.9, joinedAt: "2024-05-03" },
    { id: "u-003", name: "James Sterling", email: "j.sterling@metropolis.gov", role: "moderator", status: "active", district: "Tech Corridor", trustScore: 9.4, joinedAt: "2023-11-20" },
    { id: "u-004", name: "Priya Nair", email: "p.nair@metropolis.gov", role: "citizen", status: "suspended", district: "East Riverside", trustScore: 4.1, joinedAt: "2025-01-08" },
    { id: "u-005", name: "Diego Alvarez", email: "d.alvarez@metropolis.gov", role: "citizen", status: "pending", district: "Central Metro", trustScore: 6.7, joinedAt: "2026-06-30" },
    { id: "u-006", name: "Cyvora Admin", email: "admin@cyvora.gov", role: "admin", status: "active", district: "HQ", trustScore: 10, joinedAt: "2022-01-01" },
  ],

  communityPosts: [
    { id: "c-001", author: "Marcus Henderson", title: "Park Lighting Initiative", body: "Success! New solar LED paths installed in North Sector Park thanks to resident reports.", category: "Infrastructure", upvotes: 128, comments: 14, status: "published", createdAt: "2026-07-08T10:00:00Z" },
    { id: "c-002", author: "James Sterling", title: "Citizen Excellence Award", body: "Recognized for reporting a critical infrastructure fault in Sector 7.", category: "Recognition", upvotes: 96, comments: 9, status: "published", createdAt: "2026-07-05T12:00:00Z" },
    { id: "c-003", author: "Anonymous", title: "Unverified claim about water safety", body: "Post flagged by three residents for containing unverified public-health claims.", category: "Public Health", upvotes: 3, comments: 22, status: "flagged", createdAt: "2026-07-11T09:15:00Z" },
    { id: "c-004", author: "Diego Alvarez", title: "New crosswalk suggestion", body: "Proposing a marked crosswalk near the transit station — awaiting moderator review.", category: "Infrastructure", upvotes: 41, comments: 6, status: "pending", createdAt: "2026-07-12T15:45:00Z" },
  ],

  courses: [
    {
      id: "course-phishing",
      title: "Phishing Awareness",
      description: "Identify and report phishing attempts targeting municipal utilities. Earn the Cyber Vigilant badge.",
      progressPct: 100,
      status: "completed",
      lessonsCount: 5,
      duration: "45 mins",
      href: "lesson-phishing.html"
    },
    {
      id: "course-cyber",
      title: "Cybersecurity Training",
      description: "Core protocols for personal and civic digital security in a connected city.",
      progressPct: 65,
      status: "in_progress",
      lessonsCount: 12,
      duration: "1h 20m",
      href: "lesson-cybersecurity.html"
    },
    {
      id: "course-ethics",
      title: "Ethics in Public Data Management",
      description: "Essential protocols for handling citizen sensitive information in a digital-first governance model.",
      progressPct: 45,
      status: "in_progress",
      lessonsCount: 8,
      duration: "12h left",
      href: "learn.html"
    },
    {
      id: "course-resilience",
      title: "Community Resilience Networking",
      description: "How to leverage community leaders and local assets during systemic infrastructure challenges.",
      progressPct: 82,
      status: "in_progress",
      lessonsCount: 9,
      duration: "4h left",
      href: "learn.html"
    },
  ],

  currentUser: {
    id: "u-001",
    name: "Marcus Henderson",
    email: "m.henderson@metropolis.gov",
    phone: "+1 (555) 012-3456",
    district: "Central Metro",
    role: "citizen",
    trustScore: 9.8,
    verified: true,
  },
};
