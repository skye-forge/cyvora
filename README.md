# Varnis Backend

Django + DRF backend, merged from two independently-built codebases (this
project's Sprint 1 scaffold + a second contributor's Sprint 2 work on
learning/quizzes/incidents/notifications). See **"Merge notes"** below for
exactly what was found, fixed, and combined.

Architecture: `apps/` (domain logic per module) → `api/` (versioning,
pagination, error envelope) → `core/` (settings, urls, celery) → each app
follows a `views.py` (thin) → `services.py` (business logic) → `selectors.py`
(reads) → `models.py` split.

## Status

| App                                                                   | State                                                                |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `accounts`                                                            | Complete — register, login, refresh, `/me`, roles, XP/level fields   |
| `learning`                                                            | Complete — zones (with XP-gated unlock), lessons, progress, XP award |
| `incidents`                                                           | Complete — report, list (role-scoped), detail, anonymous reporting   |
| `notifications`                                                       | Complete — Resend integration, signed webhook handler, email log     |
| `certificates`, `dashboard`, `leaderboard`, `institutions`, `reports` | Not started (empty placeholders in `apps/`)                          |

All of the above is migrated, tested (28 tests, real Postgres + Redis, not
sqlite fallbacks), linted clean, and smoke-tested against a live server +
Celery worker — including the full async chain: registration → welcome-email
signal → Celery task → Resend API call → retry-on-failure.

## Quick start

```bash
cp .env.example .env
docker compose up --build
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

```
https://varnis.up.railway.app/api/v1/   for all version 1 api      
https://varnis.up.railway.app/api/docs/    the  api doc page      
https://varnis.up.railway.app/admin/    admin dashboard
```

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements/development.txt
cp .env.example .env   # edit POSTGRES_HOST and REDIS_URL to localhost
python manage.py migrate
python manage.py runserver
```

## Running tests

```bash
pytest -q
```

Requires a real Postgres connection and Redis reachable (registration fires
a Celery task through a signal).

## Endpoints implemented

| Method    | Endpoint                                 | Auth                   | Description                             |
| --------- | ---------------------------------------- | ---------------------- | --------------------------------------- |
| POST      | `/api/v1/auth/register`                  | none                   | Create a citizen account                |
| POST      | `/api/v1/auth/login`                     | none                   | Email + password login                  |
| POST      | `/api/v1/auth/refresh`                   | none                   | Refresh access token                    |
| GET/PATCH | `/api/v1/auth/me`                        | Bearer                 | Current user profile                    |
| GET       | `/api/v1/learning/zones`                 | Bearer                 | Zones with XP-based unlock state        |
| GET       | `/api/v1/learning/zones/{id}/lessons`    | Bearer                 | Lessons in a zone                       |
| POST      | `/api/v1/learning/lessons/{id}/complete` | Bearer                 | Mark complete, award XP                 |
| GET       | `/api/v1/learning/progress`              | Bearer                 | Current user's progress                 |
| GET/POST  | `/api/v1/incidents/`                     | Bearer                 | List (role-scoped) / report an incident |
| GET       | `/api/v1/incidents/{id}`                 | Bearer, owner or admin | Incident detail                         |
| POST      | `/api/v1/webhooks/resend`                | signed webhook         | Resend delivery status callback         |
| GET       | `/api/v1/health`                         | none                   | Health check                            |

Standard endpoints use one response envelope:

```json
{"success": true, "message": "...", "data": {...}}
{"success": false, "message": "...", "errors": {...}}
```

The `/webhooks/resend` endpoint is the one exception — it returns Resend's
expected shape, not this envelope, since Resend (not our frontend) consumes it.

---

## Merge notes (what was combined, and why)

A second contributor built `learning`, `incidents`, and
`notifications` independently. Both codebases were verified against a real
Postgres + Redis instance (not just read) before merging.

### Bug found and fixed: migrations were silently never applied

`apps/accounts/migrations/`, `apps/incidents/migrations/`,
`apps/learning/migrations/`, and `apps/migrations/` in the uploaded
project were missing `migrations/__init__.py`. Django's migration loader
treats a migrations folder without `__init__.py` as an unmigrated app and
silently skips it — `manage.py migrate` created **zero** tables for those
four apps. This didn't show up in `pytest`, because pytest-django's test
database setup falls back to direct `syncdb` for unmigrated apps, masking
the problem entirely. A real deployment (`docker compose up` + `migrate`)
would have failed on the very first registration request with
"no such table: users." Fixed by adding the missing `__init__.py` files —
confirmed by running `manage.py migrate` against a fresh Postgres database
and checking `information_schema` directly, not just re-running the tests.

### Bug found and fixed: quiz answers were exposed to the client

The original `QuizQuestionSerializer` included `correct_answer` in every
`GET /quiz/questions` response — any authenticated citizen could read the
answer key. Fixed by excluding it from the serializer; grading now happens
entirely server-side in `apps/quizzes/services.py`.

### Kept close to as-built (it was good work)

- `apps/notifications` — Resend client, `EmailLog` tracking, and the
  Svix-signature-verified webhook handler. Only changed the settings key
  name (`DEFAULT_FROM_EMAIL` → `RESEND_FROM_EMAIL`) for consistency with
  the rest of the settings module.
- The four webhook/health tests were ported with minimal changes.

### Reworked to match the rest of the codebase

- `learning`, `incidents` were restructured into the
  `views → services → selectors` pattern used by `accounts`, and their
  responses now use the standard envelope instead of raw DRF `Response`.
- `User` model: the uploaded project's `User` had no `role`, `xp_points`,
  `level`, `phone`, or `language` — fields the competition doc's domain
  model and use-case diagram require (XP-gated zones, role-based incident
  visibility, bilingual notifications all depend on them). Kept this
  project's richer `User` model as the single source of truth.
- Added `django-celery-beat` and `RESEND_WEBHOOK_SECRET` (both present in
  the uploaded project, missing from this one) to settings and requirements.
- Incidents gained `severity`, `region`, `platform`, `financial_loss`, and
  `is_anonymous` fields to match the doc's `Incident` domain model — additive
  and nullable, doesn't break anything that was already working.

### Still to build (unchanged scope from before the merge)

`certificates`, `dashboard`, `leaderboard`, `institutions`, `reports` —
same as before, follow the `learning`/`incidents` app layout when building
each one.
