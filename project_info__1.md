# varnis Backend — Codebase Overview

## Summary

Varnis is a production-grade Django backend for a Cameroonian digital safety platform. The backend is the central hub connecting a Flutter mobile app to PostgreSQL, an ML classification service, Resend email, and Cloudflare R2 object storage. It handles user authentication, a gamified learning curriculum, incident reporting with anonymous submissions, and email notification delivery via Celery + Resend.

## Architecture

The architecture follows a **strict layered pattern**:

```
Flutter App → HTTPS → Nginx → Gunicorn → Django → DRF APIViews → Serializers → Permissions → Services → Models/DB
```

Key architectural principles:

1. **Views are thin** — they validate input via serializers, call a service function, and return a standardized JSON envelope. No business logic lives in views.
2. **Services contain all business logic** — each app has a `services.py` for mutations and a `selectors.py` for reads. Services raise `shared.exceptions.ServiceError` subclasses, which the `ServiceExceptionHandlingMixin` catches and converts to the standard error envelope.
3. **Every response uses one envelope** — `{"success": bool, "message": str, "data": ...}` for success, `{"success": false, "message": str, "errors": ...}` for errors. Pagination has a slightly different shape (`count`, `num_pages`, `current_page`, `next`, `previous`, `results`).
4. **Email is async** — the `post_save` signal on User fires a Celery task chain: `accounts.signals` → `accounts.tasks.send_welcome_email` → `notifications.tasks.send_email_task` → `integrations.email.resend_client.ResendClient.send`. Each step has retry logic.
5. **AI integration is proxied** — Django never talks to the ML model directly. It calls a `POST /predict` endpoint on a separate ML microservice and stores the result.
6. **File storage is external** — incident evidence uploads go to Cloudflare R2 / AWS S3. PostgreSQL stores only the URL.

### Technology Stack

| Layer        | Technology                                                         |
| ------------ | ------------------------------------------------------------------ |
| Language     | Python 3.12                                                        |
| Framework    | Django 5.0.6 + Django REST Framework 3.15.1                        |
| Database     | PostgreSQL 16 (via psycopg2-binary)                                |
| Auth         | SimpleJWT (access + refresh tokens, rotation, blacklisting)        |
| Async tasks  | Celery 5.4.0 + Redis 7 (broker + result backend)                   |
| Scheduler    | django-celery-beat                                                 |
| API docs     | drf-spectacular (Swagger UI + ReDoc)                               |
| Email        | Resend SDK                                                         |
| Storage      | boto3 / S3-compatible (Cloudflare R2) — client not yet implemented |
| Filtering    | django-filter                                                      |
| CORS         | django-cors-headers                                                |
| Static files | whitenoise                                                         |
| Server       | Gunicorn behind Nginx (Docker)                                     |
| Testing      | pytest + factory-boy                                               |
| CI/CD        | GitHub Actions                                                     |
| Linting      | flake8 (120 chars)                                                 |

## Directory Structure

```
varnis_backend/
├── api/                            # Cross-cutting API infrastructure
│   ├── urls.py                     # Top-level v1 URL routing + health check
│   ├── permissions.py              # Role-based permission classes
│   ├── pagination.py               # StandardResultsPagination (20/page, max 100)
│   ├── exceptions.py               # custom_exception_handler → standard error envelope
│   ├── responses.py                # success_response() / error_response() helpers
│   └── versioning.py               # URLPathVersioning subclass
│
├── apps/                           # Domain modules (each a Django app)
│   ├── accounts/                   # User auth, registration, JWT, profile
│   ├── learning/                   # Zones, lessons, progress, XP/level
│   ├── incidents/                  # Cyber-incident reporting, role-scoped visibility
│   └── notifications/              # Email log, Resend webhook handler
│   └── (certificates, dashboard, leaderboard, institutions, reports — Sprint 4)
│
├── core/                           # Django project configuration
│   ├── settings/
│   │   ├── base.py                 # Shared settings (DB, auth, Celery, DRF, JWT, integrations)
│   │   ├── development.py          # +debug_toolbar, BrowsableAPIRenderer
│   │   └── production.py           # SSL/HSTS, CORS whitelist, Sentry
│   ├── urls.py                     # Root URL conf (admin, Swagger, API v1 routing)
│   ├── asgi.py                     # ASGI entry point (production settings)
│   ├── wsgi.py                     # WSGI entry point (production settings)
│   └── celery.py                   # Celery app definition + autodiscovery
│
├── integrations/                   # External service clients
│   └── email/
│       └── resend_client.py        # Thin Resend SDK wrapper (no business logic)
│   └── ai/                         # Placeholder for ML microservice client (Sprint 3)
│   └── storage/                    # Placeholder for S3/R2 client (Sprint 3)
│
├── shared/                         # Cross-cutting code
│   ├── constants.py                # Roles, Languages, IncidentSeverity, CertificateTier enums
│   ├── exceptions.py               # ServiceError hierarchy (NotFound, PermissionDenied, etc.)
│   ├── validators.py               # Cameroon phone regex, strong password validator
│   ├── mixins.py                   # ServiceExceptionHandlingMixin, TimestampedMixin
│   └── helpers.py                  # generate_unique_code(), get_client_ip()
│
├── requirements/
│   ├── base.txt                    # Production deps
│   ├── development.txt             # base + pytest, factory-boy, flake8, black, debug-toolbar
│   └── production.txt              # base + Sentry SDK
│
├── docker/
│   └── Dockerfile                  # Python 3.12-slim, multi-stage, Gunicorn CMD
├── docker-compose.yml              # db (Postgres 16), redis, web, celery_worker, celery_beat
├── manage.py                       # Defaults to core.settings.development
├── pytest.ini                      # --reuse-db, settings module
├── .flake8                         # max-line-length=120
├── .env.example                    # All configurable env vars with defaults
└── .github/workflows/ci.yml        # Postgres service container, Redis, lint, migrate, test
```

## Key Abstractions

### User (`apps/accounts/models.py`)

- **File**: `apps/accounts/models.py` (line 10)
- **Responsibility**: The domain user model — replaces Django's AbstractUser with email-based auth. Contains gamification fields (xp_points, level, streak_count) and role (citizen, institution_admin, system_admin).
- **Key behavior**: `award_xp(amount)` is a domain method on the model itself — it increments points and recalculates level in one atomic `save(update_fields=[...])`. The `calculate_level()` formula is `max(1, xp_points // 500 + 1)`.
- **Lifecycle**: Created via `RegisterView` (citizens) or Django admin (staff/superusers). Manager methods `create_user`/`create_superuser` handle password hashing.
- **Used by**: Every other app (via `settings.AUTH_USER_MODEL` foreign keys).

### ServiceExceptionHandlingMixin (`shared/mixins.py`)

- **File**: `shared/mixins.py` (line 16)
- **Responsibility**: Catches `ServiceError` subclasses raised in views and converts them to the standard error envelope. Without this mixin, a `ValidationFailedError("Lesson already completed")` would bubble up as a 500.
- **Used by**: Every APIView that calls service-layer functions (RegisterView, IncidentListCreateView, LessonCompleteView, etc.).

### StandardResultPagination (`api/pagination.py`)

- **File**: `api/pagination.py` (line 6)
- **Responsibility**: Custom pagination class that returns the standard success envelope with pagination metadata (`count`, `num_pages`, `current_page`, `next`, `previous`, `results`). Default page size is 20, max 100.
- **Note**: Paginated responses have a _different_ envelope shape than regular responses — they omit `message` and wrap `success` at the top level, but include pagination metadata instead of `data`.

### ResendClient (`integrations/email/resend_client.py`)

- **File**: `integrations/email/resend_client.py` (line 11)
- **Responsibility**: A static-method wrapper around the Resend SDK. No business logic. Services call this directly, never the SDK.
- **Key design choice**: Uses a lazy import with a runtime `ImportError` guard — if the `resend` package isn't installed, calling `send()` raises a clear `RuntimeError` rather than a cryptic import stack trace.

### ResendWebhookView (`apps/notifications/views.py`)

- **File**: `apps/notifications/views.py` (line 15)
- **Responsibility**: Processes Resend's delivery-status callbacks (email.delivered, email.bounced, etc.). Verifies Svix webhook signatures, updates `EmailLog.status`, and returns Resend's expected response shape (not the standard envelope).
- **Key design choice**: This is the **only** endpoint that doesn't return the standard JSON envelope. Resend's webhook consumer expects its own response shape, not Cyvora's.
- **Important**: The webhook handler has `authentication_classes = []` — it relies entirely on Svix signature verification for authentication, not JWT.

### LessonCompleteView (`apps/learning/views.py`)

- **File**: `apps/learning/views.py` (line 37)
- **Responsibility**: Marks a lesson complete, awards 50 XP, and recalculates the user's level. Uses `ServiceExceptionHandlingMixin` so re-completing the same lesson raises a `422` with a clear message.

### IncidentListCreateView (`apps/incidents/views.py`)

- **File**: `apps/incidents/views.py` (line 12)
- **Responsibility**: List/create incidents. The `GET` handler applies role-scoped filtering: citizens see only their own reports; institution/system admins see everything. The `POST` handler supports anonymous reporting — if `is_anonymous=True`, the `reporter` field is set to `None`.

## Data Flow

### 1. User Registration → Welcome Email

1. Flutter sends `POST /api/v1/auth/register` with `{name, email, password, phone?, language?}`
2. `RegisterView` → validates with `RegisterSerializer` → calls `accounts.services.register_user()`
3. `register_user()` creates the `User` via `UserManager.create_user()`, which hashes the password
4. `RegisterView` → calls `accounts.services.issue_tokens()` → returns access/refresh tokens + user data
5. Django's `post_save` signal on User fires: `accounts.signals.send_welcome_email_on_registration`
6. `accounts.tasks.send_welcome_email.delay(user_id)` — a Celery task
7. `send_welcome_email` → looks up user → calls `notifications.tasks.send_email_task.delay(to, subject, template_name, context)`
8. `send_email_task` → renders the Django template → creates `EmailLog` (status=pending) → calls `ResendClient.send()` → on success, updates log to "sent"; on failure, retries up to 3 times with exponential backoff

### 2. Lesson Completion → XP Award

1. Flutter sends `POST /api/v1/learning/lessons/{lesson_id}/complete`
2. `LessonCompleteView` → calls `learning.services.mark_lesson_complete(user, lesson_id)`
3. Service fetches the lesson (raises `NotFoundError` if missing)
4. Creates or updates `LessonProgress` (raises `ValidationFailedError` if already completed)
5. Calls `user.award_xp(50)` — pure domain method on the model, atomically updates `xp_points` and `level`
6. Returns the progress record

### 3. Incident Report → (Future: ML Classification)

1. Flutter sends `POST /api/v1/incidents/` with incident details + optional `is_anonymous`
2. `IncidentListCreateView` → validates with `IncidentSerializer` → calls `incidents.services.submit_incident()`
3. Service creates `Incident` record — if `is_anonymous=True`, `reporter` is set to `None`; otherwise `reporter` = authenticated user
4. (Sprint 3) Service will also call `POST /predict` on the ML microservice, store the classification result

### 4. Quiz Attempt → Grading

1. Flutter sends `POST /api/v1/quizzes/attempts` with `{question: id, selected_answer: "..."}`
2. `QuizAttemptView` → validates with `SubmitQuizAttemptSerializer` → calls `quizzes.services.grade_and_record_attempt()`
3. Service does a **case-insensitive string comparison** between `selected_answer` and `question.correct_answer`
4. Creates `QuizAttempt` record with `is_correct` boolean — this is the **only** place the correct answer is accessed server-side
5. Returns the graded attempt

## Non-Obvious Behaviors & Design Decisions

### 1. Migration Bug Was Silent

The codebase was formed by merging two independently-built projects. The second contributor's apps (`learning`, `quizzes`, `incidents`, `notifications`) were missing `migrations/__init__.py` files. Django's migration loader silently skips migration folders without `__init__.py` — `manage.py migrate` would create **zero tables** for those apps. Pytest didn't catch this because `pytest-django` falls back to `syncdb` for unmigrated apps, masking the problem. A production deployment would fail on the first request with "no such table: lessons." Fixed by adding the missing `__init__.py` files.

### 2. Correct Answer Never Leaves the Server

The `QuizQuestionSerializer` in the merged codebase **originally exposed `correct_answer`** in `GET /quizzes/questions`. Any authenticated citizen could download the full answer key. This was the most critical security finding. Now `correct_answer` is excluded from the serializer entirely — grading happens server-side in `services.py`, and the client only sees `is_correct` in the attempt response.

### 3. Webhook Endpoint Breaks the Standard Envelope Contract

The `/api/v1/webhooks/resend` endpoint **intentionally does not** use `success_response()`/`error_response()`. Resend expects a specific response shape, not the custom envelope. This is documented in the README but could trip up a frontend developer who assumes all endpoints return the same shape.

### 4. Anonymous Incidents Are Hard-Deletions of Reporter

When `is_anonymous=True`, the `reporter` FK is set to `None` at creation time — there is no "un-anonymize" path. The incident record is permanently detached from the reporting user. There is no audit trail linking the reporter to an anonymous incident.

### 5. ServiceError Status Codes Map to HTTP But Not Through DRF

The `ServiceExceptionHandlingMixin` catches `ServiceError` subclasses and returns `error_response(message, status=exc.status_code)`. But the status code values in `shared/exceptions.py` use non-standard mappings:

- `ValidationFailedError` → **422** (not 400)
- `AuthenticationFailedError` → **401**
- `PermissionDeniedError` → **403**
- `NotFoundError` → **404**

This means clients must handle 422 for validation failures, not 400. The DRF `exception_handler` (in `api/exceptions.py`) handles all other exceptions (including DRF's built-in validation, which returns 400) and wraps them in the standard envelope. So validation errors from serializers come as 400, while service-layer validation comes as 422.

### 6. XP Thresholds Are Hardcoded in the Model

The level calculation `max(1, xp_points // 500 + 1)` is hardcoded in `User.calculate_level()`. There is no configuration or constant for the 500 XP threshold. If the threshold needs to change, it must be changed in the model class, which requires a migration to recalculate existing users' levels.

### 7. The Email Chain Has Four Layers

A single welcome email traverses: `post_save signal` → `accounts.tasks` → `notifications.tasks` → `integrations.email.resend_client`. This is intentional — the chain separates concerns (signal firing ≠ task sending ≠ email sending) — but debugging requires tracing through all four layers. The `EmailLog` table is the single source of truth for troubleshooting.

### 8. Production Settings Default to ASGI (with a WSGI Gunicorn)

`core/asgi.py` defaults to `core.settings.production`, and `core/wsgi.py` also defaults to production. But the Docker CMD uses `gunicorn core.wsgi:application`, which means the ASGI configuration is unused in production unless explicitly deployed with an ASGI server (Daphne/Uvicorn). The ASGI setup exists for Sprint 3+ real-time notifications (WebSockets).

### 9. RBAC Is Role-String-Based, Not Permission-Based

The RBAC system uses simple string comparisons on `user.role` (`system_admin`, `institution_admin`, `citizen`) in custom permission classes (`IsSystemAdmin`, `IsInstitutionAdmin`, `IsCitizen`, `IsOwnerOrAdmin`). There is no Django `Permission` model integration — no granular "can edit incident" permissions. This is sufficient for the three-role model but would need rework for more granular access control.

### 10. Celery Tasks Are Defined Across Three Files

Task definitions are split across `accounts/tasks.py` (welcome email dispatch) and `notifications/tasks.py` (actual email sending). The Celery app in `core/celery.py` uses `autodiscover_tasks()`, so all tasks are found automatically. But a developer looking for "all background tasks" must check each app's `tasks.py`.

## Module Reference

| File                                   | Purpose                                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `core/settings/base.py`                | All shared settings: database, DRF, JWT, Celery, CORS, integrations, logging                  |
| `core/settings/production.py`          | Production overrides: SSL/HSTS, CORS whitelist, Sentry, JSON-only renderer                    |
| `core/urls.py`                         | Root URL conf: admin, Swagger, ReDoc, versioned API routing, debug toolbar                    |
| `core/celery.py`                       | Celery app creation + autodiscovery                                                           |
| `api/urls.py`                          | v1 API routing: auth, learning, quizzes, incidents, webhooks, health check                    |
| `api/permissions.py`                   | Four custom permission classes: IsSystemAdmin, IsInstitutionAdmin, IsCitizen, IsOwnerOrAdmin  |
| `api/responses.py`                     | success_response() and error_response() — the standard JSON envelope                          |
| `api/exceptions.py`                    | custom_exception_handler — wraps DRF exceptions in standard envelope                          |
| `api/pagination.py`                    | StandardResultsPagination — 20/page, max 100, with pagination metadata                        |
| `api/versioning.py`                    | URLPathVersioning subclass for future deprecation headers                                     |
| `apps/accounts/models.py`              | User model — email auth, gamification fields, RBAC role, Cameroon phone validation            |
| `apps/accounts/managers.py`            | UserManager — create_user, create_superuser with role auto-set                                |
| `apps/accounts/serializers.py`         | UserSerializer, RegisterSerializer, LoginSerializer, UpdateProfileSerializer                  |
| `apps/accounts/services.py`            | register_user, authenticate_user, issue_tokens, update_profile                                |
| `apps/accounts/selectors.py`           | get_user_by_id, get_user_by_email                                                             |
| `apps/accounts/views.py`               | RegisterView, LoginView, RefreshTokenView, MeView                                             |
| `apps/accounts/urls.py`                | `/register`, `/login`, `/refresh`, `/me`                                                      |
| `apps/accounts/signals.py`             | post_save → send_welcome_email_on_registration                                                |
| `apps/accounts/tasks.py`               | send_welcome_email Celery task (delegates to notifications)                                   |
| `apps/accounts/tests/factories.py`     | UserFactory with post-generation password hashing                                             |
| `apps/accounts/tests/test_auth.py`     | 6 tests: register, duplicate email, login, wrong password, /me auth, /me returns user         |
| `apps/learning/models.py`              | LearningZone, Lesson, LessonProgress                                                          |
| `apps/learning/serializers.py`         | LearningZoneSerializer (with dynamic is_unlocked), LessonSerializer, LessonProgressSerializer |
| `apps/learning/services.py`            | mark_lesson_complete — awards 50 XP                                                           |
| `apps/learning/selectors.py`           | list_zones, list_lessons, get_lesson                                                          |
| `apps/learning/views.py`               | LearningZoneListView, LessonListView, LessonCompleteView, MyProgressView                      |
| `apps/learning/urls.py`                | `/zones`, `/zones/{id}/lessons`, `/lessons/{id}/complete`, `/progress`                        |
| `apps/learning/tests/test_learning.py` | 4 tests: zone lock state, lesson list, XP award, duplicate completion                         |

| `apps/incidents/serializers.py` | IncidentCategorySerializer, IncidentSerializer (with write-only category_id) |
| `apps/incidents/services.py` | submit_incident — handles anonymous reports by nullifying reporter |
| `apps/incidents/selectors.py` | list_incidents (role-scoped), get_incident |
| `apps/incidents/views.py` | IncidentListCreateView, IncidentDetailView |
| `apps/incidents/urls.py` | `/` (list/create), `/{id}` (detail) |
| `apps/incidents/tests/test_incidents.py` | 3 tests: create+list, anonymous, citizen isolation |
| `apps/notifications/models.py` | EmailLog — status (pending/sent/delivered/bounced/failed), provider_message_id |
| `apps/notifications/views.py` | ResendWebhookView — Svix signature verification, status update |
| `apps/notifications/urls.py` | `/resend` |
| `apps/notifications/tasks.py` | send_email_task — renders template, calls ResendClient, retries 3× |
| `apps/notifications/admin.py` | EmailLogAdmin — list/filter/search by status |
| `apps/notifications/tests/test_notifications.py` | 3 tests: webhook status update, invalid signature rejection, health check public |
| `integrations/email/resend_client.py` | ResendClient.send() — static method, lazy import guard |
| `shared/constants.py` | Roles, Languages, IncidentSeverity, CertificateTier — all with CHOICES ||
| `shared/exceptions.py` | ServiceError, NotFoundError, PermissionDeniedError, ValidationFailedError, AuthenticationFailedError |
| `shared/validators.py` | validate_cameroon_phone, validate_strong_password |
| `shared/mixins.py` | ServiceExceptionHandlingMixin, TimestampedMixin |
| `shared/helpers.py` | generate_unique_code, get_client_ip |
| `.github/workflows/ci.yml` | CI: Postgres + Redis service containers, lint, migrate, pytest |

## Suggested Reading Order

1. **`core/settings/base.py`** — Start here. All configuration lives in one file: database, DRF, JWT, Celery, integrations, logging. Understand the stack's wiring before anything else.

2. **`shared/exceptions.py` + `shared/mixins.py`** — The error-handling pattern. Every view that calls services uses `ServiceExceptionHandlingMixin` and raises `ServiceError` subclasses. Understanding this is essential to reading any view.

3. **`api/responses.py` + `api/pagination.py`** — The response envelope. Every endpoint returns one of two shapes. Flutter depends on this contract.

4. **`apps/accounts/models.py` + `apps/accounts/services.py`** — The User model is referenced by every other app. Understand the custom auth, the gamification fields, and the `award_xp` domain method.

5. **`apps/accounts/views.py` + `apps/accounts/urls.py`** — Reference implementation of the thin-view pattern. See how `RegisterView`, `LoginView`, and `MeView` orchestrate serializers → services → response in the same pattern every app follows.

6. **`apps/learning/views.py` + `apps/learning/services.py`** — A service-layer pattern with business logic (XP award, duplicate completion rejection). Shows how the view delegates to services and how the mixin catches the `ValidationFailedError`.

7. **`apps/incidents/views.py` + `apps/incidents/services.py`** — Role-scoped queries and anonymous report handling. Demonstrates the selector pattern and the `IsOwnerOrAdmin` permission class.

8. **`apps/quizzes/services.py` + `apps/quizzes/serializers.py`** — The most security-sensitive part: server-side grading with correct_answer never leaking to the client.

9. **`apps/notifications/views.py`** — The webhook handler that breaks the envelope contract. Svix signature verification. Important to understand before debugging email delivery issues.

10. **`docker-compose.yml` + `docker/Dockerfile`** — The runtime environment. Five services: db, redis, web, celery_worker, celery_beat. Understanding the container dependencies helps with local development.

## Unimplemented / Known Gaps

| App                         | Status      | Notes                                                                 |
| --------------------------- | ----------- | --------------------------------------------------------------------- |
| certificates                | Not started | Placeholder only                                                      |
| dashboard                   | Not started | Analytics/statistics service stubs exist in the plan but not in code  |
| leaderboard                 | Not started | Ranked user queries not implemented                                   |
| institutions                | Not started | Institution model + membership not built; User has a commented-out FK |
| reports                     | Not started | Not in Sprint plan until Sprint 4–5                                   |
| audit                       | Not started | No AuditLog model or middleware; commented out in INSTALLED_APPS      |
| AI integration client       | Not started | `integrations/ai/` is empty — no ML service client                    |
| Storage (R2/S3) client      | Not started | `integrations/storage/` is empty — no file upload endpoint            |
| Media evidence upload       | Not started | No endpoint accepts file uploads                                      |
| QR certificate verification | Not started | Depends on certificates app                                           |
| Password reset flow         | Not started | No endpoint, no email template                                        |
| Institution related-gating  | Not started | Institutions app doesn't exist; membership not enforced               |
