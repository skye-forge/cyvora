# VARNIS

**Civic cybersecurity portal for Cameroon** — citizen reporting, learning, national threat monitoring, and QR-verifiable certification.

This bundle is a **static frontend only**. No backend ships with it. Every screen talks to the API exclusively through `window.VarnisAPI` (`assets/js/api.js`), which resolves against bundled mock data until you point it at your backend.

```bash
npm install        # only needed for Tailwind rebuilds
npm start          # serves the site statically on http://localhost:8080
```

- Portal → <http://localhost:8080/public/>
- Admin  → <http://localhost:8080/admin/>

Any static host works (Nginx, Apache, Netlify, GitHub Pages, S3, or your backend's static middleware) — there is no build step required to run; `assets/css/tailwind-output.css` is pre-compiled.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Static frontend                          │
│  Tailwind · PWA (service worker) · bilingual EN/FR · offline UX  │
│                                                                  │
│  All network I/O funnels through assets/js/api.js (VarnisAPI)    │
│  Config lives in ONE file: assets/js/config.js (VarnisConfig)    │
└─────────────────────────────┬────────────────────────────────────┘
                              │  Bearer JWT · JSON over REST
┌─────────────────────────────▼────────────────────────────────────┐
│                     YOUR BACKEND  (not included)                 │
│        Implement the API contract below at API_BASE_URL          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Connecting your backend

Edit **`assets/js/config.js`** — nothing else in the frontend needs to change:

1. Set `API_BASE_URL` to your API origin (e.g. `"https://api.varnis.cm/api/v1"`), or keep `"/api/v1"` if your backend serves this frontend from the same origin.
2. Set `USE_MOCKS: false`.
3. (Optional) Set `AI_BASE_URL` if AI endpoints live on a separate service.

Runtime overrides, no rebuild needed:

| Query string | Effect |
| --- | --- |
| `?api=https://api.varnis.cm/api/v1` | override `API_BASE_URL` |
| `?ai=https://ai.varnis.cm` | override `AI_BASE_URL` |
| `?live=1` | force live mode |
| `?mock=1` | force mock mode |

With `AUTO_FALLBACK: true` (default), if the backend is unreachable (network error or timeout) the UI transparently serves mock data so a demo never dead-ends. HTTP errors (4xx/5xx) are surfaced normally.

**Auth expectations:** the frontend sends `Authorization: Bearer <token>`, persists `{ token, refreshToken, user }` from auth responses, and on a 401 will POST the refresh token to `AUTH_REFRESH_PATH` once and retry.

---

## API contract

All endpoints are relative to `API_BASE_URL`. Response shapes should match the JSON in `assets/data/seed.json` / `assets/js/mock-data.js` (the canonical contract). Roles: `citizen` / `moderator` / `admin`.

| Category | Endpoint(s) |
| --- | --- |
| Auth | `POST /auth/{login,register,logout,refresh}` · `POST /auth/otp/{verify,resend}` · `GET /auth/google` |
| Users | `GET/PATCH /users/me` · `GET/PUT /users/me/preferences` · `GET /users` (mod) · `PATCH /users/:id` (admin) |
| Reports | `GET/POST /reports` · `GET /reports/:id` · `PATCH /reports/:id` (mod) |
| Alerts | `GET /alerts` · `POST /alerts` (mod) |
| Community | `GET/POST /community/posts` · `PATCH /community/posts/:id` (mod) |
| Learning | `GET/PATCH /learning/courses[/:id]` · `GET/POST /learning/courses/:id/quiz` |
| Lessons | `GET /learning/lessons[/:id]` · `POST/PATCH/DELETE` (admin) · `PATCH .../:id/status` (admin) |
| Notifications | `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/:id` · `POST /notifications/read-all` |
| Monitor | `GET /monitor/stats` · `GET /leaderboard?scope=` · `GET /challenges/today` |
| Certificates | `GET /certificates` · `GET /certificates/verify/:id` (public QR) |
| AI content | `POST /ai/ask` · `POST /ai/lessons/{generate,recommend}` · `GET/PUT /ai/preferences` |
| Search | `GET /search?q=` |
| Support | `POST /support/chat` |
| i18n | `POST /i18n/translate` |
| Meta | `GET /health` |

### Global search (topbar)

`GET /search?q=<query>` powers the search bar shown on every page. Expected response:

```json
{
  "results": [
    { "type": "report", "id": "r-001", "title": "Fake MoMo reversal call", "subtitle": "VAR-942-01A · in review" },
    { "type": "lesson", "id": "lesson-phishing-basics", "title": "Spotting Phishing Messages", "subtitle": "Lesson · beginner" }
  ]
}
```

`type` is one of `report | alert | course | lesson | community | user | page`. The frontend derives the destination from `type` + `id` (e.g. a report opens `report-detail.html?id=<id>`); include an optional `href` to override it. Return only what the caller's role may see (search runs with the user's Bearer token), and cap results (~12) — the UI groups them under Reports / Alerts / Learning / Community. Page navigation ("settings", "leaderboard", …) is handled client-side and needs no backend support.

### AI assistant (`assistant.html`)

`POST /ai/ask` powers the in-app Q&A assistant. Requests go to `AI_BASE_URL` when set, otherwise `API_BASE_URL`. Body:

```json
{
  "question": "How do I spot a phishing SMS?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "language": "en"
}
```

`history` carries up to the last 10 turns for conversational context; `language` is the user's current UI language (`en`/`fr`). Expected response:

```json
{
  "answer": "Plain-text answer (newlines allowed).",
  "suggestions": ["Optional follow-up question", "..."]
}
```

`suggestions` (optional, max 4 shown) render as tappable follow-up chips. The assistant can be disabled without touching the page via `AI.ASSISTANT: false` in `config.js`.

### Registration (with ID card upload)

`POST /auth/register` receives a JSON body:

```json
{
  "name": "Jean Dupont",
  "phone": "+237 6XX XXX XXX",
  "email": "you@example.com",
  "password": "********",
  "idCard": {
    "fileName": "cni-front.jpg",
    "mimeType": "image/jpeg",
    "size": 482031,
    "data": "data:image/jpeg;base64,/9j/4AAQ..."
  }
}
```

- `idCard.data` is a **base64 data URL**. Accepted types: JPG, PNG, WebP, PDF. The frontend enforces a 5 MB max before upload; enforce it server-side too (raise your JSON body-size limit accordingly, e.g. ~8 MB).
- The backend should persist the document and may gate account approval on identity review.
- Expected response: `{ "otpRequired": true, "pendingId": "..." }`, followed by `POST /auth/otp/verify { identifier, code }` → `{ token, refreshToken, user }`.

---

## Directory layout

```
varnis/
├── public/              # Citizen-facing pages
├── admin/               # Management dashboard
├── assets/
│   ├── css/             # Tailwind (compiled)
│   ├── js/              # api.js, config.js, i18n.js, validation.js, storage.js
│   ├── img/             # Logos / PWA icons
│   └── data/seed.json   # Canonical data shapes (the API contract)
├── manifest.json + sw.js  # PWA
├── index.html           # Redirect → public/landing.html
├── package.json         # Tailwind toolchain + static-serve script
└── README.md
```

---

## Frontend security posture

Client-side validation is a first line of defense only — **mirror all of it server-side**. `assets/js/validation.js` performs XSS / SQLi / command-injection / path-traversal pattern detection before the request leaves the browser, plus:

- Compiled Tailwind ships in `assets/css/tailwind-output.css` (no CDN dependency at runtime)
- Bearer token stored via a namespaced `VarnisStore` (localStorage wrapper, keys `varnis_token` / `varnis_refresh` / `varnis_user`)
- Automatic refresh-token rotation on 401
- Automatic fallback to bundled mock data if the backend is unreachable

---

Skye8 — VARNIS v2.1.0 (frontend-only)
