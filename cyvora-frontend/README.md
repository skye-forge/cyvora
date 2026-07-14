# Cyvora — Civic Safety Portal (Frontend)

Professional static frontend for the Cyvora / ANTIC civic cybersecurity awareness platform (Cameroon).  
Citizen portal + admin management dashboard. Design system aligned with DESIGN.md (Deep Trust Blue, Public Sans / Work Sans, Material Symbols).

## Structure

```
cyvora/
├── index.html                 # Root redirect → public/index.html
├── public/                    # Citizen-facing pages
│   ├── index.html             # Home dashboard
│   ├── login.html             # Auth — sign in
│   ├── register.html          # Auth — register
│   ├── otp.html               # Auth — OTP verify
│   ├── language.html          # Language select (EN/FR)
│   ├── assessment.html        # Initial 5-question assessment
│   ├── report-incident.html   # Multi-step incident report
│   ├── my-reports.html        # Citizen report history
│   ├── learn.html             # Learning dashboard
│   ├── zones.html             # 8 learning zones board
│   ├── daily-challenge.html   # Daily challenge + streak
│   ├── lesson-phishing.html
│   ├── lesson-cybersecurity.html
│   ├── leaderboard.html       # National / Regional / Institutional
│   ├── monitor.html           # National threat monitor + heat map
│   ├── certificates.html      # Bronze / Silver / Gold certs
│   ├── certificate-verify.html # Public QR verify
│   ├── community.html
│   ├── profile.html
│   ├── institution.html       # Institution admin dashboard
│   └── support.html
├── admin/                     # Management platform
│   ├── index.html             # Overview
│   ├── reports.html
│   ├── learning.html
│   ├── alerts.html
│   ├── community.html
│   ├── users.html
│   └── settings.html
├── assets/
│   ├── css/site.css           # Mobile responsive + design tokens
│   ├── css/tailwind-output.css
│   └── js/
│       ├── config.js          # Mock/live API toggle
│       ├── mock-data.js       # JSON data contracts
│       ├── api.js             # CyvoraAPI facade
│       ├── templates.js       # HTML templates from JSON
│       ├── app.js             # Page bootstrap
│       └── site.js            # Nav drawer, UI helpers
├── package.json
├── tailwind.config.js
├── BACKEND.md
└── README.md
```

## Run locally

```bash
cd cyvora
python3 -m http.server 8080
# open http://localhost:8080/public/
# or http://localhost:8080/public/login.html
```

## Features

- Full mobile-responsive layout (drawer nav, stacking grids, safe areas)
- JSON-driven templates for reports, lessons, alerts, community, stats
- Mock API layer ready for live backend (`?api=live` or config.js)
- Auth flow: login → OTP → language → assessment → home
- Gamification: XP, lives, levels, daily challenge, leaderboards
- National MONITOR dashboard with regional heat map
- QR-verifiable digital safety certificates
- Admin management screens (overview, reports, learning, alerts, users)

## Design

Follows DESIGN.md: primary `#002869` / `#0B3D91`, secondary signal green, Public Sans + Work Sans, 8px spacing, tonal cards, status chips.
