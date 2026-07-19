# VARNIS Interactive Prototype

A clickable HTML mockup of the full VARNIS app — 25 screens in an iPhone frame, with real navigation between them. Built for pitch decks, stakeholder demos, and design reviews. No install required.

## How to run

1. Unzip the folder
2. Double-click `index.html`

Runs offline in any modern browser (Chrome, Safari, Firefox, Edge). No server, no dependencies, no build step.

## Layout

- **Left sidebar** — index of all 25 screens grouped by flow. Click any to jump.
- **Center** — the phone. Tap buttons inside to navigate like a real app.
- **Right sidebar** — presentation controls and keyboard shortcuts.

On mobile, the sidebars hide and the phone fills the screen.

## The 25 screens

**Onboarding**
1. Splash
2. Sign In
3. Sign Up

**Identity Verification**
4. KYC Intro
5. Capture CNI
6. Processing
7. Approved

**Main App**
8. Dashboard (bottom nav starts here)
9. Report Incident
10. Community Feed
11. Notifications
12. Safety Lessons
13. Profile

**Support**
14. Support Home
15. FAQ
16. New Ticket
17. Ticket Chat

**Recovery Center** *(the money-maker)*
18. Recovery Home
19. Ownership Verification
20. Asset Category
21. Electronic Device Form
22. Review & Submit
23. Payment (MoMo / Orange)
24. Case Timeline
25. Check IMEI

## The pitch flow (auto-play)

Hit `Space` (or click "Auto-play pitch flow") for a guided tour through the value proposition:

**Splash → Sign in → KYC → Dashboard → Recovery Center → Ownership → Category → Device form → Review → Payment → Case timeline → IMEI check → Support → Ticket chat**

15 screens at 3.2 seconds each ≈ 48 seconds. Hit `Esc` to stop.

## Keyboard shortcuts

| Key         | Action                         |
|-------------|--------------------------------|
| `Space`     | Start/stop auto-play           |
| `→`         | Next screen in pitch flow      |
| `←`         | Go back                        |
| `Esc`       | Stop auto-play                 |
| `R`         | Restart at splash              |

## Presenting

**Live**: Use the sidebar to jump to any screen for talk-through, or click buttons inside the phone to demonstrate real flows.

**Auto-play**: Hit `Space`. UI goes into presentation mode with a "Presenting" badge at the top. Talk over it. `Esc` when you want to take back control and dive deeper into a specific screen.

**Recording**: Full-screen your browser (F11), hit Space, capture with QuickTime / OBS / Loom.

## Design notes

- **Colors**: Indigo `#4F46E5` primary (trust + security), green `#16A34A` for the Recovery Center (money-maker), plus the standard success/warning/error palette.
- **Copy**: Real strings from the app — no lorem ipsum. Uses Amie Diland as the demo user, ANTIC references, real ticket flow (Ref VN-SUP-2026-000042), real IMEI samples.
- **Iconography**: All inline SVG. No external icon library.
- **Fonts**: System fonts. No web font requests.

## Adjusting content

- Screen text lives in `screens-extra.js` for screens 09–25, and in `index.html` for screens 01–08.
- Colors are CSS variables at the top of `style.css`.
- The auto-play sequence is `PITCH_SEQUENCE` in `script.js`.

## Files

```
varnis-demo/
├── index.html          Screens 01–08 (splash, auth, KYC, dashboard)
├── screens-extra.js    Screens 09–25 (injected into the DOM on load)
├── style.css           Design system + all screen styles
├── script.js           Router, auto-play, keyboard
└── README.md           This file
```
