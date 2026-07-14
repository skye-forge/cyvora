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
