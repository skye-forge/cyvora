# Cyvora — Backend Integration Guide

This frontend is built so a backend can be dropped in without touching page
markup. Every page talks to data through **one** JavaScript object,
`window.CyvoraAPI`, defined in `assets/js/api.js`. Nothing else calls
`fetch()` directly.

```
assets/js/
  config.js      <- the ONE file to edit to go live
  mock-data.js    <- local sample data (used until a backend exists)
  api.js          <- CyvoraAPI: the only seam between pages and the network
  site.js         <- UI-only behavior (nav, animations, toasts) — no data logic
```

## Security & Input Validation (must implement server-side)

The frontend ships with a complete `CyvoraValidation` layer (`assets/js/validation.js`) that you should **port to your backend** for defense-in-depth:

- Same sanitization + pattern detection for XSS, SQLi, command injection.
- Same validators for reports, posts, alerts, login, profile.
- Login rate limiting + lockout logic.
- All `CyvoraAPI` create/update calls already reject bad payloads with 400 + `validationErrors`.

**Recommendation**: Implement identical rules (or use a shared library) on every POST/PATCH endpoint. Never trust client input.

## Go live in three steps

1. Open `assets/js/config.js` and set:
   ```js
   API_BASE_URL: "https://api.yourdomain.com/v1",
   USE_MOCKS: false,
   ```
   (Or leave the file alone and load any page with `?live=1&api=https://api.yourdomain.com/v1`
   while testing — no rebuild needed.)
2. Implement the REST endpoints below, returning the same JSON shapes used
   in `mock-data.js`.
3. That's it — every page already calls `CyvoraAPI.*`, so no HTML/JS changes
   are needed elsewhere.

## Auth

`CyvoraAPI` reads a bearer token from `localStorage["cyvora_token"]`
(configurable via `CyvoraConfig.AUTH_TOKEN_KEY`) and attaches it to every
request as `Authorization: Bearer <token>`. Call `CyvoraAPI.auth.login(email, password)`
to obtain one; store it yourself with
`localStorage.setItem("cyvora_token", token)` after a successful login
(there's no login screen in this build — add one the same way, calling
`CyvoraAPI.auth.login`).

## Endpoints

All paths are relative to `API_BASE_URL`. Request/response bodies are JSON.

### Reports
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/reports?status=&district=` | — | `{ items: Report[], total }` |
| GET | `/reports/:id` | — | `Report` |
| POST | `/reports` | `{ category, title, description, district, reporterName }` | `Report` (server assigns `id`, `trackingId`, `status: "pending"`, `createdAt`) |
| PATCH | `/reports/:id` | `{ status }` | `Report` |

**Report shape:**
```json
{
  "id": "r-001",
  "trackingId": "CYV-942-01A",
  "title": "Streetlight outage on 5th & Main",
  "category": "Utility Failure",
  "severity": "medium",
  "status": "pending",
  "district": "Downtown-04",
  "reporterName": "Marcus Henderson",
  "createdAt": "2026-07-10T14:20:00Z",
  "description": "..."
}
```
`status` ∈ `pending | in_review | approved | rejected`.
`severity` ∈ `low | medium | high | critical`.

Used by: `report-incident.html` (create), `my-reports.html` (list, citizen's
own reports — filter server-side by the authenticated user), `admin/reports.html`
(list all + status transitions), `admin/index.html` (summary counts).

### Alerts
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/alerts` | — | `{ items: Alert[] }` |
| POST | `/alerts` | `{ severity, category, title, message, region }` | `Alert` |

```json
{ "id": "a-001", "severity": "high", "category": "SEVERE WEATHER",
  "title": "High Wind Warning: Zone B", "message": "...", "region": "Zone B",
  "active": true, "issuedAt": "2026-07-14T06:00:00Z" }
```
`severity` ∈ `low | medium | high | critical`.
Used by: `index.html` (sidebar alert feed), `admin/alerts.html`.

### Users (admin)
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/users?role=&status=` | — | `{ items: User[], total }` |
| GET | `/users/me` | — | `User` (current session's profile) |
| PATCH | `/users/me` | `{ name, email, phone, district }` | `User` |
| PATCH | `/users/:id` | `{ status }` | `User` — suspend/reinstate/approve |
| PATCH | `/users/:id` | `{ role }` | `User` — role change |

```json
{ "id": "u-001", "name": "Marcus Henderson", "email": "m.henderson@metropolis.gov",
  "role": "citizen", "status": "active", "district": "Central Metro",
  "trustScore": 9.8, "joinedAt": "2024-02-11" }
```
`role` ∈ `citizen | moderator | admin`. `status` ∈ `active | pending | suspended`.
Used by: `admin/users.html`, `profile.html` (via `/users/me`).

### Community
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/community/posts?status=` | — | `{ items: Post[], total }` |
| POST | `/community/posts` | `{ title, body, category }` | `Post` |
| PATCH | `/community/posts/:id` | `{ status }` | `Post` — approve/flag/remove |

```json
{ "id": "c-001", "author": "Marcus Henderson", "title": "Park Lighting Initiative",
  "body": "...", "category": "Infrastructure", "upvotes": 128, "comments": 14,
  "status": "published", "createdAt": "2026-07-08T10:00:00Z" }
```
`status` ∈ `pending | published | flagged | removed`.
Used by: `community.html`, `admin/community.html`.

### Learning
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/learning/courses` | — | `{ items: Course[] }` |
| PATCH | `/learning/courses/:id` | `{ progressPct }` | `Course` |

```json
{ "id": "course-phishing", "title": "Phishing Awareness", "progressPct": 100, "status": "completed" }
```
Used by: `learn.html`, `lesson-phishing.html`, `lesson-cybersecurity.html`,
`admin/learning.html`.

### Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |

## Error handling

`CyvoraAPI` methods reject with an `Error` carrying `.status` (HTTP code)
and `.body` (parsed JSON error payload, if any) when a request fails. UI
code already wraps calls in `.catch()` and shows a toast via
`window.showToast(message, "error")` — return a `{ message }` field in your
error responses so it surfaces something useful.

## Notes for the backend team

- **CORS**: if the API is on a different origin than the static site, enable
  CORS for that origin (credentials not required — auth is bearer-token,
  not cookies).
- **Pagination**: the mock `list()` endpoints return everything in `items`.
  If you paginate, keep the `{ items, total }` envelope and the frontend
  will need a small update to request pages — nothing else changes shape-wise.
- **Tailwind**: styling is Tailwind CSS loaded via the CDN script
  (`cdn.tailwindcss.com`) for fast iteration. Before a production launch,
  compile it properly (Tailwind CLI or PostCSS) instead of the CDN build —
  the CDN script itself warns it isn't meant for production. The token
  config for both design systems (citizen app vs admin) is inlined in each
  page's `<script id="tailwind-config">`; pull it into a shared
  `tailwind.config.js` when you set up the CLI build.
- **No build step today**: every page is static HTML + Tailwind CDN + plain
  JS (no bundler). That's intentional so any backend stack (Django, Rails,
  Express, Laravel, etc.) can serve these files as-is, or you can drop them
  behind a templating layer without fighting a JS build pipeline.

---

## Update — backend + AI readiness (v9)

The frontend is now fully wired to a live backend. Flip `USE_MOCKS: false`
(or use `?live=1`) and implement the endpoints below.

### Client storage is JSON (`assets/js/storage.js`)

All browser persistence goes through `window.CyvoraStore`, which serializes
everything as JSON under the `cyvora:` namespace (plus the auth keys below):

| Helper | Storage key | Contents |
|---|---|---|
| `getToken/setToken` | `cyvora_token` | Bearer access token (string) |
| `getRefreshToken/setRefreshToken` | `cyvora_refresh` | Refresh token (string) |
| `getUser/setUser` | `cyvora_user` | Current user JSON |
| `getPreferences/setPreferences` | `cyvora:preferences` | User preferences JSON (below) |

The API client attaches `Authorization: Bearer <token>` automatically and,
on a `401` with a stored refresh token, POSTs `AUTH_REFRESH_PATH` once and
retries the original request.

### Seed data (`assets/data/seed.json`)

Canonical JSON for every collection the frontend expects
(`reports`, `alerts`, `users`, `communityPosts`, `courses`, `leaderboard`,
`monitor`, `certificates`, `dailyChallenge`, `notifications`,
`reportCategories`, `currentUser`). Load it into the DB to reproduce the demo
state; the REST responses must match these shapes.

### Auth (full flow)

| Method & path | Body | Returns |
|---|---|---|
| `POST /auth/register` | `{ name, email, phone, password }` | `{ otpRequired, pendingId, user }` |
| `POST /auth/otp/verify` | `{ identifier, code }` | `{ token, refreshToken, user }` |
| `POST /auth/otp/resend` | `{ identifier }` | `{ ok }` |
| `POST /auth/login` | `{ identifier, password }` | `{ token, refreshToken, user }` |
| `GET  /auth/google?redirect_uri=…` | — | 302 redirect back with a token (SRS FR-02) |
| `POST /auth/refresh` | `{ refreshToken }` | `{ token, refreshToken }` |
| `POST /auth/logout` | — | `{ ok }` |

Frontend calls: `CyvoraAPI.auth.{register, verifyOtp, resendOtp, login, google, refresh, logout}`.
On success, tokens + user are persisted via `CyvoraStore` — the backend only
returns them.

### User preferences (`CyvoraApi.preferences`)

| Method & path | Body | Returns |
|---|---|---|
| `GET /users/me/preferences` | — | preferences JSON |
| `PUT /users/me/preferences` | preferences JSON | updated preferences JSON |

Preferences shape:
```json
{
  "language": "en",
  "notifications": { "alerts": true, "reports": true, "learning": true, "community": false },
  "subscriptions": { "weekly": true, "monthly": false, "quarterly": false, "email": "" },
  "privacy": { "leaderboard": true, "anonymousReports": false },
  "ai": { "recommendations": true, "difficulty": "adaptive", "interests": [] }
}
```
Powers Settings (FR-05 language, FR-37 report subscriptions) and AI personalization.

### AI services (`CyvoraApi.ai`)

Routes to `AI_BASE_URL` when set, else `API_BASE_URL`. Toggle per-feature in
`CyvoraConfig.AI`.

| Method & path | Body | Returns |
|---|---|---|
| `POST /ai/lessons/generate` | `{ topic, level, language, interests }` | generated lesson JSON |
| `POST /ai/lessons/recommend` | `{ interests, history }` | `{ items: [{ id, title, reason }] }` |
| `GET  /ai/preferences` | — | AI personalization JSON |
| `PUT  /ai/preferences` | `{ recommendations, difficulty, interests }` | updated JSON |

Generated-lesson shape:
```json
{
  "id": "ai-lesson-…", "generated": true,
  "topic": "Phishing", "level": "beginner", "language": "en",
  "title": "…", "summary": "…",
  "sections": [ { "heading": "…", "body": "…" } ],
  "quiz": [ { "q": "…", "options": ["…"], "answer": 0 } ],
  "model": "auto"
}
```

### Config surface (`assets/js/config.js`)

`API_BASE_URL`, `USE_MOCKS`, `AUTH_TOKEN_KEY`, `REFRESH_TOKEN_KEY`, `USER_KEY`,
`AUTH_REFRESH_PATH`, `TOKEN_AUTO_REFRESH`, `GOOGLE_OAUTH_START_PATH`,
`AI_BASE_URL`, `AI.{ENABLED,LESSON_GENERATION,RECOMMENDATIONS,PERSONALIZATION,DEFAULT_MODEL,DEFAULT_LANGUAGE}`,
`REQUEST_TIMEOUT_MS`, `MOCK_LATENCY_MS`, `FEATURES`.
Runtime overrides: `?api=`, `?ai=`, `?live=1`, `?mock=1`.

### Learning quiz (`CyvoraApi.learning`) — SRS FR-12/13/14

| Method & path | Body | Returns |
|---|---|---|
| `GET  /learning/courses/:id/quiz` | — | `{ title, passPct, xpPerCorrect, questions:[{ q, options, correctIndex, explanation }] }` |
| `POST /learning/courses/:id/quiz` | `{ score, total, percent, xp, passed, ranOut }` | `{ ok, xp, level }` |

The reusable engine `CyvoraQuiz` (`assets/js/quiz.js`) enforces the rules
client-side: 5 lives, −1 per wrong answer (0 = game over), XP per correct
answer, and a 70% pass mark. `quiz.html?id=<lessonId>` mounts it. **The
backend must re-check the score and award XP server-side** — never trust the
client's `xp`/`passed`.

### Translation (`CyvoraApi.i18n`) — real language API

Curated UI strings live in `i18n.js` (instant, free). DYNAMIC content
(report text, AI lessons, posts) is machine-translated via a real service.

| Method | Purpose |
|---|---|
| `CyvoraApi.i18n.translate(text, { from, to })` | Translate one string (cached as JSON) |
| `CyvoraApi.i18n.translateBatch(texts, { to })` | Translate many |
| `CyvoraApi.i18n.languages()` | List supported languages |

Provider is set in `CyvoraConfig.TRANSLATION`:
- `"libretranslate"` (default) — POSTs `{ q, source, target, format }` to
  `LIBRETRANSLATE_URL + /translate`. Self-host LibreTranslate for production.
- `"backend"` — POSTs to `BACKEND_PATH` on your API so the provider key stays
  server-side (recommended for production). Expected response:
  `{ "translatedText": "…" }`.

Results are cached in `CyvoraStore` (JSON). On any failure the original text
is returned, so the UI never breaks. Mark dynamic elements with
`data-i18n-auto` to have them auto-translated on language switch.
