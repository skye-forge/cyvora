# varnis — Phase 1: Requirements Engineering

## Lifecycle Status

```
[✓] Phase 0: Team Formation
[✓] Phase 1: Requirements Engineering
[ ] Phase 2: System Design
[ ] Phase 3: UI/UX Design
[ ] Phase 4: Infrastructure
[ ] Phase 5: Database Engineering
[ ] Phase 6: API Contract Design
[ ] Phase 7: Development
[ ] Phase 8: Integration
[ ] Phase 9: Quality Assurance
[ ] Phase 10: Security Review
[ ] Phase 11: Production Deployment
[ ] Phase 12: Monitoring & Operations
```

---

## Objective

Define and document all functional and non-functional requirements for the varnis platform — the ANTIC initiative for Cameroon. This document captures what the system must do, who uses it, and the constraints it must operate within.

---

## 1. Stakeholder Identification

| ID | Stakeholder | Role | Interest in System | Primary Concerns |
|----|-------------|------|--------------------|------------------|
| S1 | **Citizens (General Public)** | End users of the mobile app | Digital literacy education, incident reporting, certification | Usability, privacy, bilingual (FR/EN), offline access, gamification engagement |
| S2 | **Institution Administrators** | Manage learners within their institution | Track learner progress, view institutional reports, manage members | Accuracy of reports, bulk operations, role management |
| S3 | **System Administrators (ANTIC)** | Platform operators | Full platform oversight, content management, user moderation, system configuration | Security, scalability, audit trail, compliance with Cameroon law |
| S4 | **ANTIC / Government (Sponsor)** | Funder & policy owner | National cybersecurity posture improvement, KPI reporting, regulatory compliance | Platform reach, effectiveness metrics, budget, legal compliance |
| S5 | **Rayan (ML Engineer)** | AI classification service developer | Incident auto-classification API, confidence scoring | API contract stability, model deployment pipeline, data quality |
| S6 | **leon(Backend Lead)** | API design & infrastructure | System reliability, code quality, deployment | Tech stack consistency, test coverage, CI/CD, documentation |
| S7 | **Flutter Lead (TBD)** | Mobile app developer | Consuming REST APIs for all platform features | API contract stability, offline mode, push notifications, performance |
| S8 | **React/PWA Lead (TBD)** | Admin dashboard developer | Data visualization, user management, content CRUD | Rich data tables, real-time updates, role-based UI |

---

## 2. System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VARNIS PLATFORM                              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Flutter App  │  │   PWA/Web   │  │  External Systems         │   │
│  │  (Citizens)   │  │  Dashboard  │  │  • Resend (Email)         │   │
│  │  Android/iOS  │  │  (Admins)   │  │  • Cloudflare R2 (Files)  │   │
│  └──────┬───────┘  └──────┬───────┘  │  • ML Microservice (AI)   │   │
│         │                 │          │  • Svix/Resend Webhooks   │   │
│         ▼                 ▼          └──────────┬───────────────┘   │
│  ┌──────────────────────────────────────────────┐                  │
│  │          Django REST API (this project)       │                  │
│  │  ┌──────┐ ┌───────┐ ┌──────┐ ┌────────┐ ┌────┐               │
│  │  │Auth  │ │Learn  │ │Quiz  │ │Incident│ │Notif│               │
│  │  └──┬───┘ └──┬────┘ └──┬───┘ └───┬────┘ └──┬─┘               │
│  │     │        │        │         │         │                    │
│  │  ┌──┴────────┴────────┴─────────┴─────────┴──┐                │
│  │  │         PostgreSQL 16                       │                │
│  │  └────────────────────────────────────────────┘                │
│  └──────────────────────────────────────────────┘                  │
│                                                                     │
│  ┌──────────────────────────────────────┐                          │
│  │        Async Infrastructure          │                          │
│  │  Redis 7 → Celery 5.4 → Tasks        │                          │
│  └──────────────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Functional Requirements

Requirements are organized by domain module. Each requirement has a unique ID, priority (M = Must have, S = Should have, C = Could have, W = Won't have this sprint), and traceability to the relevant app.

### 3.1 Authentication & Accounts (`apps/accounts`)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-AUTH-01 | User shall register with email, name, password, and optional phone/language | M | Competition spec | ✅ Implemented |
| FR-AUTH-02 | User shall log in with email + password to receive JWT tokens (access + refresh) | M | Competition spec | ✅ Implemented |
| FR-AUTH-03 | Access tokens shall expire after configurable minutes (default 15 min) | M | Security best practice | ✅ Implemented |
| FR-AUTH-04 | Refresh tokens shall expire after configurable days (default 7 days) | M | Usability | ✅ Implemented |
| FR-AUTH-05 | Refresh token rotation and blacklisting shall be enabled | M | Security | ✅ Implemented |
| FR-AUTH-06 | System shall support three roles: citizen, institution_admin, system_admin | M | Competition spec | ✅ Implemented |
| FR-AUTH-07 | Users shall view and update their own profile (name, phone, language) | M | UX | ✅ Implemented |
| FR-AUTH-08 | Self-registration shall only create citizen accounts | M | Policy | ✅ Implemented |
| FR-AUTH-09 | System shall prevent duplicate email registration (case-insensitive) | M | Data integrity | ✅ Implemented |
| FR-AUTH-10 | Passwords shall be validated against Django's minimum 8-char + complexity rules | M | Security | ✅ Implemented |
| FR-AUTH-11 | Account verification email shall be sent upon registration via Celery → Resend | S | UX | ✅ Implemented |
| FR-AUTH-12 | Password reset flow (request → email → reset) | S | UX | ❌ Not implemented |
| FR-AUTH-13 | Cameroon phone number format validation for the phone field | S | Data quality | ✅ Implemented |
| FR-AUTH-14 | Institution admin accounts shall be provisioned via admin, not self-registration | M | Policy | ✅ Implemented |

### 3.2 Learning Zones & Lessons (`apps/learning`)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-LRN-01 | System shall display learning zones with XP-based unlock status | M | Competition spec | ✅ Implemented |
| FR-LRN-02 | Lessons within a zone shall be listable by zone ID | M | Competition spec | ✅ Implemented |
| FR-LRN-03 | Users shall mark a lesson as completed | M | Competition spec | ✅ Implemented |
| FR-LRN-04 | Completing a lesson shall award 50 XP | M | Competition spec | ✅ Implemented |
| FR-LRN-05 | XP shall be added atomically and level recalculated immediately | M | Data integrity | ✅ Implemented |
| FR-LRN-06 | Re-completing the same lesson shall return a 422 error | M | Data integrity | ✅ Implemented |
| FR-LRN-07 | Users shall view their own learning progress (completed lessons, timestamps) | M | UX | ✅ Implemented |
| FR-LRN-08 | Level shall be calculated as max(1, XP // 500 + 1) | M | Competition spec | ✅ Implemented (hardcoded) |
| FR-LRN-09 | Zone unlock threshold (XP) shall be configurable per zone | M | Flexibility | ✅ Implemented |
| FR-LRN-10 | Streak tracking (consecutive days of learning activity) | S | Gamification | 🔲 Field exists, no logic written |
| FR-LRN-11 | Lesson content shall support rich text (HTML/Markdown) | M | Content delivery | ✅ Implemented (TextField) |
| FR-LRN-12 | Lessons shall be ordered within a zone via configurable order field | M | UX | ✅ Implemented |
| FR-LRN-13 | Learning zones shall support bilingual content (FR/EN) | S | Bilingual requirement | ❌ Not implemented (content model is single-language) |

### 3.3 Quizzes & Grading (`apps/quizzes`)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-QUZ-01 | System shall display quiz questions (never exposing correct_answer) | M | Security | ✅ Implemented |
| FR-QUZ-02 | Users shall submit a single selected answer per question | M | Competition spec | ✅ Implemented |
| FR-QUZ-03 | Grading shall be case-insensitive server-side string comparison | M | Fairness | ✅ Implemented |
| FR-QUZ-04 | Quiz attempts shall be stored with is_correct boolean | M | Progress tracking | ✅ Implemented |
| FR-QUZ-05 | Users shall view their own attempt history | S | UX | ✅ Implemented |
| FR-QUZ-06 | Questions may optionally be associated with a lesson | S | Content model | ✅ Implemented (nullable FK) |
| FR-QUZ-07 | Multiple-choice question support (4 options, one correct) | S | Content model | ❌ Not implemented; free-text only |
| FR-QUZ-08 | Quiz score summary per lesson (X/Y correct) | S | UX | ❌ Not implemented |

### 3.4 Incident Reporting (`apps/incidents`)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-INC-01 | Users shall submit an incident report with title, description, category | M | Competition spec | ✅ Implemented |
| FR-INC-02 | Incidents shall have a severity level (low, medium, high, critical) | M | Classification | ✅ Implemented |
| FR-INC-03 | Incident categories shall be predefined and managed via admin | M | Content model | ✅ Implemented |
| FR-INC-04 | Users may submit incidents anonymously (reporter set to None) | M | Privacy (Cameroon law) | ✅ Implemented |
| FR-INC-05 | Anonymous incidents shall be permanently detached from the reporter | M | Privacy | ✅ Implemented (no audit trail — noted as gap) |
| FR-INC-06 | Citizens shall only see their own reported incidents | M | Privacy | ✅ Implemented |
| FR-INC-07 | Institution and system admins shall see all incidents | M | Operational need | ✅ Implemented |
| FR-INC-08 | Incidents shall include region, platform, and optional financial loss fields | M | ANAC/ANTIC reporting | ✅ Implemented |
| FR-INC-09 | Incident status lifecycle: reported → investigating → resolved/dismissed | S | Workflow | ✅ Implemented |
| FR-INC-10 | Evidence file upload (screenshots, documents) attached to incidents | S | Investigation | ❌ Not implemented; no storage client |
| FR-INC-11 | ML auto-classification of incident by category/severity | S | Efficiency | ❌ Not implemented; placeholder in service |
| FR-INC-12 | Incident detail view requires ownership or admin role | M | Security | ✅ Implemented |
| FR-INC-13 | Admin ability to flag an incident for investigation | S | Workflow | ✅ Implemented (flag_for_review method) |

### 3.5 Notifications & Email (`apps/notifications`)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-NTF-01 | Welcome email shall be sent asynchronously after user registration | M | UX | ✅ Implemented (Celery chain) |
| FR-NTF-02 | Email delivery status shall be tracked in EmailLog table | M | Observability | ✅ Implemented |
| FR-NTF-03 | Email status lifecycle: pending → sent → delivered/bounced/failed | M | Observability | ✅ Implemented |
| FR-NTF-04 | Resend webhook shall update EmailLog status on delivery events | M | Accuracy | ✅ Implemented |
| FR-NTF-05 | Webhook endpoint shall verify Svix signatures for authenticity | M | Security | ✅ Implemented |
| FR-NTF-06 | Email sending shall retry up to 3 times with exponential backoff on failure | M | Reliability | ✅ Implemented |
| FR-NTF-07 | Email templates shall be rendered server-side using Django templates | M | Flexibility | ✅ Implemented |
| FR-NTF-08 | System shall support push notifications (FCM) for mobile engagement | S | Engagement | ❌ Not implemented |
| FR-NTF-09 | In-app notification feed (alerts about incident updates, new content) | C | UX | ❌ Not implemented |
| FR-NTF-10 | Bulk email sending (e.g., campaign announcements to all users) | C | Operations | ❌ Not implemented |

### 3.6 Certificates (Sprint 4+)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-CRT-01 | Users shall earn a certificate upon completing all lessons in a zone | M | Competition spec | ❌ Not implemented |
| FR-CRT-02 | Certificates shall have tier levels: bronze, silver, gold | M | Competition spec | Constant exists; no logic |
| FR-CRT-03 | Certificates shall have a unique verification code (QR code) | M | Credentialing | ❌ Not implemented |
| FR-CRT-04 | Third parties shall verify certificates via QR code or public URL | S | Usability | ❌ Not implemented |
| FR-CRT-05 | Certificate PDF generation for download/printing | S | UX | ❌ Not implemented |

### 3.7 Dashboard & Analytics (Sprint 4+)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-DSH-01 | Citizens shall see a personal dashboard: progress, XP, streak, recent activity | S | UX | ❌ Not implemented |
| FR-DSH-02 | Institution admins shall see aggregate progress for their institution members | S | Operations | ❌ Not implemented |
| FR-DSH-03 | System admins shall see platform-wide statistics (users, incidents, completions) | S | Operations | ❌ Not implemented |
| FR-DSH-04 | Dashboard data shall be queryable by date range | S | Reporting | ❌ Not implemented |

### 3.8 Leaderboard (Sprint 4+)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-LDB-01 | System shall display a ranked leaderboard of citizens by XP | C | Gamification | ❌ Not implemented |
| FR-LDB-02 | Leaderboard shall support optional institution-level filtering | C | Gamification | ❌ Not implemented |
| FR-LDB-03 | Leaderboard position of the current user shall be shown | C | UX | ❌ Not implemented |

### 3.9 Institutions (Sprint 4+)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-INS-01 | System shall support institution entities (schools, universities, NGOs) | S | Scale | ❌ Not implemented; commented FK in User |
| FR-INS-02 | Institution admins shall manage member rosters | S | Operations | ❌ Not implemented |
| FR-INS-03 | Users may belong to one institution at a time | S | Data model | ❌ Not implemented |
| FR-INS-04 | Institution-level reporting on learner progress | S | Operations | ❌ Not implemented |

### 3.10 AI Classification (Sprint 3)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-AI-01 | Incident submission shall call ML microservice for auto-classification | S | Efficiency | ❌ Not implemented; TODO in submit_incident |
| FR-AI-02 | ML service result shall be stored alongside the incident record | S | Data integrity | ❌ Not implemented |
| FR-AI-03 | ML service timeout shall be configurable (default 10s) | S | Reliability | ✅ Settings var exists (AI_SERVICE_TIMEOUT) |
| FR-AI-04 | Classification failure shall not block incident creation (degraded mode) | S | UX | ❌ Not implemented |

### 3.11 File Storage (Sprint 3)

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-STR-01 | Incident evidence files shall be uploadable and stored in Cloudflare R2 / S3 | S | Investigation | ❌ Not implemented; settings exist |
| FR-STR-02 | File access shall be restricted to authorized users | M | Privacy | ❌ Not implemented |
| FR-STR-03 | Accepted file types: images, PDFs, documents | S | Utility | ❌ Not implemented |
| FR-STR-04 | File size limit: 10 MB per upload | S | Practicality | ❌ Not implemented |

### 3.12 Audit & Compliance

| ID | Requirement | Priority | Source | Notes |
|----|-------------|----------|--------|-------|
| FR-AUD-01 | All user actions changing system state shall be logged | S | Compliance | ❌ Not implemented; audit app commented out |
| FR-AUD-02 | Admin actions (user suspension, content changes) shall be traceable to admin user | M | Compliance | ❌ Not implemented |
| FR-AUD-03 | Incident report access shall be logged | M | Privacy (Cameroon law) | ❌ Not implemented |
| FR-AUD-04 | Data retention policy shall be configurable | S | Compliance (RGPD) | ❌ Not implemented |

---

## 4. Non-Functional Requirements

| ID | Requirement | Category | Target | Measured By |
|----|-------------|----------|--------|-------------|
| NFR-PERF-01 | API response time shall be < 300ms p95 for read endpoints | Performance | < 300ms p95 | Application monitoring (Sentry, New Relic) |
| NFR-PERF-02 | API response time shall be < 500ms p95 for write endpoints | Performance | < 500ms p95 | Application monitoring |
| NFR-PERF-03 | Paginated lists shall support up to 100 items per page | Performance | Max 100 | API contract compliance |
| NFR-PERF-04 | Database queries for list endpoints shall be indexed and < 50ms | Performance | < 50ms | EXPLAIN ANALYZE |
| NFR-SEC-01 | All endpoints (except auth & webhooks) shall require JWT authentication | Security | 100% coverage | Automated security scan |
| NFR-SEC-02 | Passwords shall never be stored in plaintext | Security | Django PBKDF2+HMAC | Code review |
| NFR-SEC-03 | Quiz answers shall never be exposed to the client | Security | Server-side grading only | Code review + integration test |
| NFR-SEC-04 | Webhook endpoints shall verify cryptographic signatures | Security | Svix/Resend HMAC | Integration test |
| NFR-SEC-05 | Anonymous incident reports shall not be traceable to the reporter | Security/privacy | reporter=null | Code review |
| NFR-SEC-06 | API shall rate-limit auth endpoints (register/login) | Security | 10 req/min per IP | Middleware configuration |
| NFR-SEC-07 | CORS shall be restricted in production to known origins | Security | Whitelist enforced | Config review |
| NFR-REL-01 | Email sending shall tolerate transient failures (3 retries) | Reliability | 99.9% delivery | Grafana dashboard |
| NFR-REL-02 | Database shall be backed up at least daily | Reliability | RPO < 24h | Backup script verification |
| NFR-REL-03 | System shall handle zero-downtime deployments | Reliability | Rolling update | CI/CD pipeline |
| NFR-SCA-01 | System shall support 10,000 concurrent users at launch | Scalability | < 50% resource utilization | Load testing |
| NFR-SCA-02 | System shall horizontally scale via Docker Compose | Scalability | Multi-container design | Architecture review |
| NFR-SCA-03 | Celery workers shall scale independently from web processes | Scalability | Separate containers | Architecture review |
| NFR-MNT-01 | All API endpoints shall have auto-generated Swagger documentation | Maintainability | drf-spectacular | CI check |
| NFR-MNT-02 | Codebase shall adhere to flake8 linting with 120-char line limit | Maintainability | Zero lint errors | CI check |
| NFR-MNT-03 | Test coverage shall exceed 85% for all apps | Maintainability | pytest - coverage | CI check |
| NFR-MNT-04 | Business logic shall live in services.py, never in views | Maintainability | Architecture check | Code review |
| NFR-USAB-01 | API language field shall support FR and EN | Usability | Bilingual | Integration test |
| NFR-USAB-02 | Error messages shall be user-readable, not technical stack traces | Usability | Standard error envelope | Integration test |
| NFR-USAB-03 | All timestamps shall use Africa/Douala timezone | Usability | TZ configured | Config review |

---

## 5. Actor-Use-Case Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USE-CASE DIAGRAM (TEXTUAL)                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ ACTOR: Unauthenticated Visitor                                         │
│   UC-01: Register a citizen account                                    │
│   UC-02: Log in with email + password                                  │
│   UC-03: Refresh JWT access token                                      │
│   UC-04: Request password reset (future)                               │
│                                                                        │
│ ACTOR: Citizen                                                         │
│   UC-10: View and update own profile                                   │
│   UC-11: Browse learning zones (with lock/unlock state)                │
│   UC-12: View lessons within a zone                                    │
│   UC-13: Complete a lesson → earn 50 XP                                │
│   UC-14: View own learning progress                                    │
│   UC-15: Take a quiz (view question, submit answer)                    │
│   UC-16: View own quiz attempt history                                 │
│   UC-17: Report a cyber incident                                       │
│   UC-18: Report an incident anonymously                                │
│   UC-19: View own reported incidents                                   │
│   UC-20: View incident detail (own)                                    │
│   UC-21: View own XP, level, streak                                    │
│                                                                        │
│ ACTOR: Institution Admin                                               │
│   UC-30: All Citizen use cases                                         │
│   UC-31: View all incidents (platform-wide)                            │
│   UC-32: View institution member progress (Sprint 4)                   │
│   UC-33: Manage institution members (Sprint 4)                         │
│   UC-34: View institution-level reports (Sprint 4)                     │
│                                                                        │
│ ACTOR: System Admin                                                    │
│   UC-40: All Institution Admin use cases                               │
│   UC-41: Create/manage learning content (zone, lessons, questions)     │
│   UC-42: Manage incident categories                                    │
│   UC-43: Manage users (view, suspend, role change)                     │
│   UC-44: View platform analytics (Sprint 4)                            │
│   UC-45: Manage email templates                                        │
│   UC-46: View EmailLog delivery reports                                │
│   UC-47: Configure system settings                                     │
│                                                                        │
│ ACTOR: ML Microservice (System)                                        │
│   UC-50: Receive incident data for classification (Sprint 3)            │
│   UC-51: Return prediction (category + severity)                       │
│                                                                        │
│ ACTOR: Resend (External System)                                         │
│   UC-60: Send email via API                                            │
│   UC-61: Deliver delivery-status webhook callbacks                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Priority Matrix

| Priority | Count | Requirements |
|----------|-------|--------------|
| **M — Must Have (MVP)** | 38 | Core authentication, basic learning, quiz grading, incident reporting, email notifications, RBAC, standard API envelope |
| **S — Should Have** | 24 | Password reset, file uploads, ML classification, certificates (basic), dashboard, institutions, streak logic, push notifications |
| **C — Could Have** | 7 | Leaderboard, in-app notifications, bulk email, offline support, advanced analytics |
| **W — Won't Build (this sprint)** | 4 | Advanced PWA features, real-time chat, marketplace, third-party integrations |

---

## 7. Requirements Traceability Matrix (Implemented vs Pending)

| App | Total Reqs | Implemented | Not Implemented | Coverage |
|-----|-----------|-------------|-----------------|----------|
| accounts | 14 | 13 | 1 (password reset) | 93% |
| learning | 13 | 11 | 2 (streak logic, bilingual content) | 85% |
| quizzes | 8 | 5 | 3 (multiple choice, per-lesson summary) | 63% |
| incidents | 13 | 11 | 2 (file upload, ML classification) | 85% |
| notifications | 10 | 7 | 3 (push, in-app feed, bulk) | 70% |
| certificates | 5 | 0 | 5 | 0% |
| dashboard | 4 | 0 | 4 | 0% |
| leaderboard | 3 | 0 | 3 | 0% |
| institutions | 4 | 0 | 4 | 0% |
| AI | 4 | 0 | 4 | 0% |
| storage | 4 | 0 | 4 | 0% |
| audit | 4 | 0 | 4 | 0% |
| **TOTAL** | **86** | **47** | **39** | **55%** |

---

## 8. Key Requirements Decisions

### 8.1 Bilingual Content Strategy (FR/EN)
The `User.language` field stores the user's preference. However, the current content model (lessons, questions, categories) stores content in a single language. **Decision**: Bilingual content requires either:
- (a) A parallel content model with language FK — preferred for flexibility
- (b) A single JSONField per content row storing `{"fr": "...", "en": "..."}`
- **Recommendation**: Option (a) for Sprint 4, as it allows category-level language fallback and works with Django's admin.

### 8.2 Anonymous Incident Privacy Model
When `is_anonymous=True`, the `reporter` FK is set to `None` at creation. There is **no** audit trail linking the reporter to an anonymous report. This satisfies Cameroon's strict privacy requirements for whistleblowers but means:
- No way for the reporter to reclaim or follow up on their anonymous report
- No deduplication possible for anonymous reports from the same user
- **Decision**: Accepted trade-off. A "report token" (requester-generated UUID) could be added in Sprint 4 to allow anonymous follow-up while maintaining privacy.

### 8.3 XP Threshold Hardcoding
Level calculation `max(1, xp_points // 500 + 1)` is hardcoded in `User.calculate_level()`. **Decision**: Extract to a configuration constant (`XP_PER_LEVEL` in `shared/constants.py`) and add a management command to recalculate levels if the threshold changes.

### 8.4 Correct Answer Secrecy
`QuizQuestion.correct_answer` is never exposed through the serializer. All grading is server-side. This is a **hard security invariant** — no future change should ever expose it.

### 8.5 Webhook Envelope Exception
`POST /api/v1/webhooks/resend` intentionally does not return the standard JSON envelope. Resend's webhook client expects its own response shape. This is a **documented exception** — all other endpoints must use the standard envelope.

### 8.6 Rate Limiting Gap
There is currently no rate limiting on auth endpoints. **Decision**: Add `django-ratelimit` or DRF throttling before production launch to prevent brute-force attacks on login/register.

---

## 9. Glossary

| Term | Definition |
|------|------------|
| ANTIC | Agence Nationale des Technologies de l'Information et de la Communication — Cameroon's IT agency |
| Citizen | A registered end user of the Cyvora platform (general public) |
| Institution Admin | An administrator managing learners within a school, university, or NGO |
| System Admin | ANTIC operator with full platform access |
| XP | Experience points earned by completing lessons |
| Level | Derived from XP: max(1, XP // 500 + 1) |
| Zone | A themed learning area with XP-gated unlock (e.g., "Mobile Money Safety") |
| Evidence | Files (screenshots, PDFs) attached to incident reports |
| EmailLog | Database record tracking email delivery status through its lifecycle |
| Svix | Webhook signature verification standard used by Resend |
| Resend | Email delivery service (replaces Mailgun/SendGrid for this project) |
| Celery | Distributed task queue used for async email sending |
| Streak | Consecutive days of learning activity (field exists, logic not yet implemented) |

---

## 10. Open Questions (to resolve in Phase 2)

| # | Question | Impact | Suggested Resolution |
|---|----------|--------|---------------------|
| 1 | Should the Flutter app consume API v1 directly or via a BFF (Backend for Frontend)? | Flutter integration complexity | Discuss with Flutter Lead |
| 2 | What is the SLA target for the ML microservice? | Incident creation degraded-mode logic | Clarify with Rayan |
| 3 | Should anonymous incident reports allow reporter follow-up via a token? | Privacy vs UX trade-off | Product decision |
| 4 | What is the expected launch scale (concurrent users, total users)? | Infrastructure sizing | Clarify with ANTIC stakeholders |
| 5 | Is there a budget for paid Sentry tier or monitoring tools? | Observability strategy | Discuss with PM |
| 6 | What PDF library should be used for certificate generation? | Architecture decision | Evaluate WeasyPrint vs ReportLab |
| 7 | Should R2/S3 file access be presigned-URL or proxy-through-Django? | Security + performance | Evaluate based on file sensitivity |
| 8 | How are mobile push notifications planned (FCM via Firebase)? | Notification architecture | Discuss with Flutter Lead |

---

## 11. Phase 1 Exit Criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Stakeholders identified | ✅ | Section 1 — 8 stakeholders documented |
| Functional requirements documented | ✅ | Section 3 — 86 requirements across 12 modules |
| Non-functional requirements documented | ✅ | Section 4 — 20 NFRs across 6 categories |
| Use cases defined | ✅ | Section 5 — 20+ use cases across 5 actors |
| Priority matrix established | ✅ | Section 6 — M/S/C/W classifications |
| Requirements traceability mapped | ✅ | Section 7 — Implemented vs pending per app |
| Key decisions documented | ✅ | Section 8 — 6 architectural decisions |
| Open questions recorded | ✅ | Section 10 — 8 open items for Phase 2 |

---

## 12. Next Steps (Phase 2: System Design)

```
[ ] Phase 0: Team Formation
[✓] Phase 1: Requirements Engineering
[ ] Phase 2: System Design
    [ ] High-level architecture diagram
    [ ] System decomposition (microservices vs monolith decision)
    [ ] Data flow diagrams per use case
    [ ] Component interaction diagrams
    [ ] Technology stack verification
    [ ] Security architecture
    [ ] Scalability analysis
    [ ] Integration point design (ML, Storage, Email)
    [ ] ADR directory creation for architecture decisions
    [ ] Design details for unimplemented modules:
        - Certificates
        - Dashboard
        - Leaderboard
        - Institutions
        - AI integration
        - File storage
        - Audit logging
```

---

**Document written by**: Leon (Backend & Database Lead)
**Date**: 2026-07-09
**Status**: Complete — ready for review and approval to proceed to Phase 2.

> **Next**: Awaiting **"next phase"** instruction before proceeding to **Phase 2: System Design**.
