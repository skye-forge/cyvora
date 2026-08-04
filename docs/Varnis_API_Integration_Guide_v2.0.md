# Varnis — API Integration Guide (v2.0)

**Rebuilt directly from `Varnis_API_v1.yaml` (OpenAPI 3.0.3) — supersedes v1.0.**

> v1.0 of this guide was derived from the SRS before the backend existed and is now **wrong in several places** (no `/auth/logout/`, no live MoMo/OM gateway call, plus an entire KYC + lost-item Tracking module that wasn't in the SRS). Use this version.

---

## 0. What Changed vs. the SRS / v1.0 Guide

The real backend is broader than the original SRS described, since we added some new features and chat-support is not yet in the system or api guide:

| Module                | What it actually is                                                                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tracking`            | **New.** Citizen reports a _lost/stolen electronic device or vehicle_, goes through an ownership-verification step, pays a tracking fee, and the case is escalated to an authority. This is a distinct flow from generic incident reporting. |
| `kyc`                 | **New.** ID-document + selfie verification, presumably required before certain actions (tracking requests, certificates — confirm which).                                                                                                    |
| `security` (sessions) | Device/session management. **This is where logout lives**, not `/auth/logout/`.                                                                                                                                                              |
| `payments`            | Manual proof-of-payment submission (photo of MoMo/OM receipt + transaction ref), reviewed by an admin — **not** a live payment-gateway callback.                                                                                             |
| `incidents`           | Exists, but the spec doesn't document its request/response body at all (see Section 4 gap note).                                                                                                                                             |

---

## 1. Base URL & Routing —

The spec has **no `servers:` block**, `https://varnis.up.railway.app` is correct and is actually production url, point the app at it.

Path prefixes, as literally declared in the spec:

| Prefix       | Modules                                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/`   | `auth`, `dashboard`, `incidents`, `learning`, `quizzes`, `certificates`, `community`, `leaderboard`, `kyc`, `tracking`, `national-update`, `webhooks`, `health` |
| `/legal/`    | legal resource center (**no** `/api/v1/` prefix)                                                                                                                |
| `/payments/` | payment submissions (**no** `/api/v1/` prefix)                                                                                                                  |
| `/security/` | device sessions (**no** `/api/v1/` prefix)                                                                                                                      |
| `/console/`  | admin/moderator console — out of scope for citizen apps                                                                                                         |

```dart
const apiV1Base = "https://varnis.up.railway.app/api/v1";
const apiRootBase = "https://varnis.up.railway.app"; // legal, payments, security
```

---

## 2. Auth

`security: [jwtAuth: []]` marks a route as requiring `Authorization: Bearer <token>`. Routes with `security: [jwtAuth: [], {}]` (two options, one empty) are **optional-auth** — they work logged out but may return more/personalized data when authenticated.

### 2.1 Endpoints (paths confirmed, bodies **not** documented in spec)

| Method | Path                     | Auth                                                                           |
| ------ | ------------------------ | ------------------------------------------------------------------------------ |
| POST   | `/api/v1/auth/register/` | optional                                                                       |
| POST   | `/api/v1/auth/login/`    | optional                                                                       |
| POST   | `/api/v1/auth/refresh/`  | optional — body `{"refresh": "<token>"}` (this one field name _is_ documented) |
| GET    | `/api/v1/auth/me/`       | required                                                                       |
| PATCH  | `/api/v1/auth/me/`       | required                                                                       |

⚠️ **Gap:** the spec gives no request/response schema for `register`, `login`, or `me` — drf-spectacular didn't pick up their serializers. \*\*Before writing your models, hit `/api/docs/` interactively and inspect a live "Try it out" response. Do not guess field names like `identifier` vs `email` — get it confirmed.

Known from `refresh`: request body key is `refresh` (not `refresh_token`).

### 2.2 Logout — no `/auth/logout/`. Use session revoke instead.

| Method | Path                              | Notes                                                                              |
| ------ | --------------------------------- | ---------------------------------------------------------------------------------- |
| GET    | `/security/sessions/mine/`        | Paginated list of this user's active `DeviceSession` records                       |
| POST   | `/security/sessions/{id}/revoke/` | Log out one specific device                                                        |
| POST   | `/security/sessions/revoke-all/`  | Log out everywhere. Body: `{"keep_current": true}` to preserve the calling session |

`DeviceSession` object shape (confirmed from schema):

```json
{
  "id": "uuid",
  "device_name": "Android App",
  "device_model": "Samsung Galaxy A14",
  "os_name": "Android",
  "os_version": "13",
  "app_version": "1.0.3",
  "ip_address": "197.234.x.x",
  "network_type": "MOBILE_DATA",
  "network_type_display": "Mobile Data",
  "location_label": "Yaoundé, Cameroon",
  "is_active": true,
  "created_at": "2026-07-01T08:00:00Z",
  "last_seen_at": "2026-07-22T09:00:00Z"
}
```

⚠️ **Gap:** all of `device_model`/`os_name`/`os_version`/`app_version`/`network_type` are `readOnly` on this schema — meaning they're set by the backend, not sent by you as headers (no header params exist anywhere in the spec). The likely mechanism is that these are fields in the **login/register request body**, but that's not confirmed. Ask backend directly: _"On login, do I send device_model/os_name/os_version/app_version as body fields, or is this derived server-side from User-Agent?"_

---

## 3. Dashboard

`GET /api/v1/dashboard/` — auth required. Response body not documented in spec (no schema attached) — matches FR-DASH-01..07 conceptually per the endpoint description, but get the actual field names from `/api/docs/` before binding UI to it.

---

## 4. Incidents

| Method | Path                                        | Notes                                                                                                               |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/incidents/`                        | List — supports `?status=pending` per description (query param not formally declared in spec, confirm exact values from `api/docs/`) |
| POST   | `/api/v1/incidents/`                        | Submit report                                                                                                       |
| GET    | `/api/v1/incidents/{incident_id}/`          | Full detail + timeline                                                                                              |
| PATCH  | `/api/v1/incidents/{incident_id}/moderate/` | Moderator-only status transition — not for citizen app                                                              |

⚠️ **Gap:** none of these have a documented request/response schema. This is the single biggest hole for the citizen-facing report flow — get the category list, field names, and evidence-upload mechanism directly from backend before building the Report Incident screen. Don't assume it matches the `TrackingRequest` shape below; they're separate models.

---

## 5. Tracking (Lost/Stolen Device or Vehicle) — fully documented, use this as ground truth

This is a distinct, more elaborate flow than "incidents." A citizen reports a lost/stolen electronic device or vehicle, it goes through ownership verification, a tracking fee payment, and possible escalation to a partner authority.

### 5.1 Status lifecycle (`Status913Enum`)

```
DRAFT → PAYMENT_PENDING → PAYMENT_SUBMITTED → PAYMENT_APPROVED
  → QUEUED → SENT_TO_AUTHORITY → UNDER_INVESTIGATION
  → LOCATED → RECOVERED → CLOSED
  (or CANCELLED at any point)
```

### 5.2 Create a request

`POST /api/v1/tracking/requests/` (multipart/form-data for file fields)

```json
{
  "category": "ELECTRONIC_DEVICE",
  "description": "Phone stolen from my bag at Mokolo market on July 20...",
  "device_data": {
    "device_category": "PHONE",
    "brand": "Samsung",
    "model": "Galaxy A14",
    "color": "Black",
    "serial_number": "SN123456",
    "imei": "356789101234567",
    "purchase_date": "2025-03-10",
    "receipt_file": "<file>"
  }
}
```

`category` is `"ELECTRONIC_DEVICE"` or `"VEHICLE"` (`Category5dbEnum`). Send `device_data` OR `vehicle_data`, matching the category.

**Vehicle shape** (if `category: "VEHICLE"`):

```json
{
  "vehicle_category": "CAR",
  "manufacturer": "Toyota",
  "model": "Corolla",
  "year": 2019,
  "plate_number": "LT 1234 AB",
  "vin": "1HGCM82633A004352",
  "registration_file": "<file>",
  "insurance_file": "<file>",
  "ownership_document_file": "<file>"
}
```

`vehicle_category`: `CAR | MOTORCYCLE | TRUCK | BUS | TAXI | TRICYCLE | OTHER`
`device_category`: `PHONE | LAPTOP | TABLET | DESKTOP | SMART_WATCH | ROUTER | DRONE | CAMERA | GAMING_CONSOLE | EXTERNAL_DRIVE | OTHER`

### 5.3 Read / manage a request

| Method | Path                                                         | Purpose                                                                                                             |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/tracking/requests/mine/?status=UNDER_INVESTIGATION` | Paginated "My Tracking Requests"                                                                                    |
| GET    | `/api/v1/tracking/requests/{id}/`                            | Full detail incl. `authority_cases`, `evidence_items`, `evidence_requests`, `timeline_events`                       |
| POST   | `/api/v1/tracking/requests/{id}/cancel/`                     | Cancel                                                                                                              |
| POST   | `/api/v1/tracking/requests/{id}/evidence/`                   | Attach evidence (`Evidence` schema: `file`, `description`)                                                          |
| POST   | `/api/v1/tracking/requests/{id}/initiate-payment/`           | Moves `OWNERSHIP_VERIFIED → PAYMENT_PENDING` — call this when the citizen taps "Pay Now" on the tracking-fee screen |
| POST   | `/api/v1/tracking/evidence-requests/{id}/fulfill/`           | Respond to a backend-initiated evidence request                                                                     |

Detail response includes a `TimelineEvent` array — render this as a status history UI, same idea as "My Reports" in the old SRS:

```json
{
  "id": "uuid",
  "event_type": "...",
  "description": "...",
  "created_by_name": "...",
  "created_at": "..."
}
```

### 5.4 Paying the tracking fee

Two-step: `initiate-payment` flips status to `PAYMENT_PENDING`, then the citizen actually pays via the **Payments module** (Section 8) with `purpose: "TRACKING_FEE"` and `related_object_id` = the tracking request's `id`.

---

## 6. KYC (Identity Verification)

| Method | Path                                   | Purpose                                              |
| ------ | -------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/v1/kyc/me/`                      | Current status + whether the user counts as verified |
| GET    | `/api/v1/kyc/history/`                 | All past submissions (paginated)                     |
| POST   | `/api/v1/kyc/submissions/`             | Create draft or resubmit after rejection             |
| POST   | `/api/v1/kyc/submissions/{id}/submit/` | Finalize a draft submission                          |

Create payload (`KYCSubmissionCreate`, multipart for files):

```json
{
  "id_document_type": "NATIONAL_ID",
  "id_number": "1234567890",
  "full_name": "Amadou Traoré",
  "date_of_birth": "1998-04-12",
  "id_document_front": "<file>",
  "id_document_back": "<file>",
  "selfie_photo": "<file>"
}
```

`id_document_type`: `NATIONAL_ID | PASSPORT | DRIVER_LICENSE`

Status enum (`StatusEe3Enum`): `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED | EXPIRED`

⚠️ Not documented anywhere in the spec: **which actions require KYC to be `APPROVED` first** (e.g. does submitting a tracking request require it?). Confirm with backend — this affects whether you gate the "Report Lost Item" flow behind a KYC check client-side.

---

## 7. Certificates

| Method | Path                                       | Notes                                                                                 |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| GET    | `/api/v1/certificates/mine`                | Paginated list, "My Certificates"                                                     |
| GET    | `/api/v1/certificates/pricing/{course_id}` | Active pricing tiers — body not documented, fetch fresh before showing payment screen |
| POST   | `/api/v1/certificates/purchase`            | Body not documented — confirm with backend                                            |
| GET    | `/api/v1/certificates/verify/{cert_code}`  | **Public, no auth** — for the QR/verification link                                    |

`Certificate` object:

```json
{
  "id": 1,
  "tier": "gold",
  "cert_code": "VRN-882-XQ",
  "pdf_url": "https://.../882.pdf",
  "qr_url": "https://.../qr/882.png",
  "issued_at": "2026-07-19T07:00:00Z",
  "expires_at": "2027-07-19T07:00:00Z",
  "is_valid": "true"
}
```

`tier`: `bronze | silver | gold`

⚠️ Note: `PurposeEnum` for the Payments module (Section 8) only lists `TRACKING_FEE` and `INSTITUTION_LICENSE` — **no `CERTIFICATE` purpose exists**. So certificate purchase likely does _not_ go through the manual payments-submission flow — `POST /api/v1/certificates/purchase` is probably its own thing. Confirm the actual payment mechanism for certificates with backend before building that screen; don't assume it reuses Section 8.

---

## 8. Payments (Manual Proof-of-Payment — not a live gateway)

This is **not** an MTN/Orange API integration on your side. The flow is: backend shows the citizen an account to pay into, the citizen pays externally (USSD, in person, etc.), then uploads proof of payment through this API for admin review.

| Method | Path                                   | Purpose                                               |
| ------ | -------------------------------------- | ----------------------------------------------------- |
| GET    | `/payments/config/active/?method=MTN`  | Get the account/number to pay into for a given method |
| POST   | `/payments/submissions/`               | Submit payment + proof, in one call                   |
| GET    | `/payments/submissions/mine/`          | Paginated history                                     |
| GET    | `/payments/submissions/{id}/`          | Detail                                                |
| POST   | `/payments/submissions/{id}/resubmit/` | After admin marks `PROOF_REQUESTED`                   |

Create payload (`PaymentSubmissionCreate`, multipart):

```json
{
  "purpose": "TRACKING_FEE",
  "related_object_id": "uuid-of-the-tracking-request",
  "payment_configuration": "uuid-from-/payments/config/active/",
  "payer_name": "Amadou Traoré",
  "payer_phone": "+237670000000",
  "amount_expected": "2500.00",
  "amount_declared": "2500.00",
  "transaction_ref": "MP240722.1234.A56789",
  "proof_file": "<file — screenshot of the MoMo/OM confirmation>"
}
```

`purpose`: `TRACKING_FEE | INSTITUTION_LICENSE`
Status (`Status2d5Enum`) — not fully enumerated in the excerpt available; expect something like `SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED | PROOF_REQUESTED`. Confirm exact values with backend before building status-based UI branching.

---

## 9. Community Feed

| Method   | Path                                    | Auth                                 |
| -------- | --------------------------------------- | ------------------------------------ |
| GET      | `/api/v1/community/feed`                | optional (richer when logged in)     |
| POST     | `/api/v1/community/tips`                | required                             |
| POST     | `/api/v1/community/posts/{id}/like`     | required (DELETE same path = unlike) |
| GET/POST | `/api/v1/community/posts/{id}/comments` | required                             |
| POST     | `/api/v1/community/posts/{id}/report`   | required — flag content              |

`CommunityPost`:

```json
{
  "id": "uuid",
  "type": "alert",
  "content": "Coordinated MoMo scam reported in Littoral...",
  "media_url": "https://...",
  "tags": ["Scam", "Safety"],
  "author_name": "System",
  "is_author_verified": "true",
  "likes_count": 34,
  "comments_count": 5,
  "created_at": "2026-07-20T10:00:00Z"
}
```

`type`: `alert | tip`

---

## 10. Learning Academy, Quizzes, Leaderboard

All under `/api/v1/learning/...`, `/api/v1/quizzes/...`, `/api/v1/leaderboard/...`. Bodies are undocumented in the spec for nearly all of these (no schemas attached) — paths are confirmed real, contents are not:

**Learning:**
`zones/`, `zones/{zone_id}/modules/`, `modules/{module_id}/lessons/`, `lessons/{lesson_id}/parts/`, `lessons/{lesson_id}/progress/`, `lessons/{lesson_id}/complete/` (POST), `courses/`, `courses/{zone_id}/modules/`, `completed-zones/`, `completed-modules/`, `completed-lessons/`, `progress/`, `resume/`, `daily-tip/`, `my-badges/`, `my-streak/`, `my-ranking/`, `xp-history/`, `leaderboard/`

**Quizzes** — this one _is_ documented:

`GET /api/v1/quizzes/{quiz_id}/` →

```json
{
  "id": "uuid",
  "course": "uuid",
  "title": "Phishing Awareness Final Quiz",
  "pass_score_percent": 70,
  "time_limit_seconds": 600,
  "questions": [
    {
      "id": "uuid",
      "text_en": "...",
      "text_fr": "...",
      "order": 1,
      "options": [
        { "id": "uuid", "text_en": "...", "text_fr": "...", "order": 1 }
      ]
    }
  ]
}
```

Correct answers are withheld (as expected). `POST /api/v1/quizzes/{quiz_id}/submit/` grades it — request/response body not documented; likely `{"answers": [{"question_id": "...", "option_id": "..."}]}` based on the shape above, but **confirm before building**, don't assume.

**Leaderboard:** `national`, `regional/{region}`, `institution/{institution_id}`, `my-ranking` — all GET, bodies undocumented.

---

## 11. National Updates

| Method | Path                           | Auth     |
| ------ | ------------------------------ | -------- |
| GET    | `/api/v1/national-update/`     | required |
| GET    | `/api/v1/national-update/{id}` | optional |

```json
{
  "id": "uuid",
  "title_en": "...",
  "title_fr": "...",
  "category": "security_alert",
  "urgency_flag": true,
  "region_scope": {},
  "published_at": "2026-07-20T10:00:00Z"
}
```

`category` (`Category936Enum`): `security_alert | guideline | advisory | general`

Detail view additionally includes `body_en` / `body_fr`. `region_scope` shape isn't typed in the spec (`{}` = untyped object) — confirm the expected structure (list of region names? codes?) with backend.

---

## 12. Legal Resource Center

Root-mounted (no `/api/v1/` prefix — see Section 1).

| Method | Path                                                        | Auth     |
| ------ | ----------------------------------------------------------- | -------- |
| GET    | `/legal/topics`                                             | optional |
| GET    | `/legal/articles`                                           | optional |
| GET    | `/legal/articles/{id}`                                      | optional |
| GET    | `/legal/articles/related-incident-category/{category_code}` | optional |

`LegalArticleDetail`:

```json
{
  "id": "uuid",
  "topic": {
    "id": "uuid",
    "name": "Phishing & Fraud",
    "slug": "phishing-fraud",
    "description": "...",
    "order": 1
  },
  "title_en": "...",
  "title_fr": "...",
  "summary_body_en": "...",
  "summary_body_fr": "...",
  "source_reference": "Law No. 2010/012, Art. 12",
  "official_source_url": "https://...",
  "last_updated": "2026-06-01T00:00:00Z",
  "disclaimer": "This is a plain-language summary, not legal advice..."
}
```

Always render the server-supplied `disclaimer` string verbatim rather than hardcoding your own — matches FR-LAW-04.

---

## 13. Health & Docs

- `GET /api/v1/health` — no auth required, use for connectivity checks / splash-screen ping
- `GET /api/docs/` — Swagger UI, browse live
- (raw schema is this file)

---

## 14. Pagination

Every paginated list accepts `?page=` and `?page_size=` query params (confirmed consistently across `certificates/mine`, `community/feed`, `kyc/history`, `national-update/`, `tracking/requests/mine/`, etc.). The spec doesn't show the response envelope shape (`count`/`next`/`previous`/`results` is DRF's standard default — likely but not 100% confirmed here).

---

## 15. Consolidated List of Confirmed Gaps — Ask Backend Before Coding These Screens

1. **Auth request/response bodies** (`register`, `login`, `me`) — no schema in spec at all.
2. **Device telemetry** (`device_model`, `os_name`, etc.) — mechanism for the client to supply these is undocumented; not headers.
3. **Incidents module** — no schema for create/list/detail. Biggest gap for the citizen report flow.
4. **Dashboard response shape** — no schema.
5. **Certificate purchase flow** (`POST /certificates/purchase`) — body undocumented, and doesn't fit the `PurposeEnum` used elsewhere.
6. **Learning/Quiz submit bodies** — mostly undocumented except `Quiz` GET response.
7. **`Status2d5Enum`** (payment submission status) — not fully visible; get the full value list.
8. **`region_scope`** shape on National Updates — untyped in spec.
9. **KYC gating** — which flows require `APPROVED` KYC first.
10. **Root-mounted modules** (`legal`, `payments`, `security`) missing `/api/v1/` prefix — confirm intentional.

The fastest way to close most of these: hit `/api/docs/` and use "Try it out" on each undocumented endpoint against a real test account, or ask backend to add response examples to the DRF serializers (drf-spectacular will then auto-populate this file).

---

_Varnis — API Integration Guide v2.0 · Rebuilt from the actual OpenAPI spec, July 2026_
