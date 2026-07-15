# Cyvora — Next Phase Recommendations (Backend Integration)

**Date:** July 15, 2026  
**Focus:** Priorities for moving from frontend demo to full production system

---

## 1. Backend Architecture Priorities

### Recommended Tech Stack (Aligned with SRS)
| Layer           | Recommendation              | Reason |
|-----------------|-----------------------------|--------|
| **API**         | Laravel 11 or Node.js (NestJS) | Good developer experience + strong ecosystem |
| **Database**    | PostgreSQL                  | Strong JSON support + GIS capabilities |
| **Auth**        | Laravel Sanctum / JWT       | Secure token-based authentication |
| **Real-time**   | Laravel Echo + Pusher / Soketi | For live alerts and community updates |
| **File Storage**| Cloudinary or S3            | For evidence uploads + malware scanning |
| **NLP**         | Python FastAPI microservice | For incident classification (as per SRS) |

---

## 2. High-Priority Backend Tasks

### Phase 1: Core Functionality (MVP)
1. **Authentication System**
   - Email + Phone login
   - OTP verification
   - JWT + Refresh tokens
   - Role-based access (Citizen / Moderator / Admin)

2. **Incident Reporting API**
   - `POST /reports` with validation
   - File upload handling + virus scanning
   - NLP auto-classification integration
   - Tracking ID generation

3. **User Management**
   - Profile management
   - Trust score calculation
   - Role management

### Phase 2: Engagement Features
4. **Learning System**
   - Progress tracking
   - XP, levels, and badges
   - Certificate generation (PDF + QR)

5. **Community & Moderation**
   - Post creation + moderation
   - Upvoting system

### Phase 3: National Features
6. **Monitor Dashboard**
   - Regional heat map data API
   - Aggregated statistics

7. **Leaderboard**
   - Ranking calculation (National / Regional / Institutional)

---

## 3. Frontend-Backend Alignment

The current frontend is designed to work with minimal changes:

- All data flows through `CyvoraAPI` in `api.js`
- Set `USE_MOCKS = false` in `config.js` to switch to live API
- Most endpoints already match expected shapes in `mock-data.js`

**Recommended API Contract Alignment:**
- Follow the shapes defined in `mock-data.js`
- Return consistent error formats (especially validation errors)
- Support the same query parameters used in the frontend

---

## 4. Recommended Order of Implementation

| Order | Feature                    | Frontend Readiness | Backend Effort | Priority |
|-------|---------------------------|--------------------|----------------|----------|
| 1     | Authentication + OTP      | High               | Medium         | Critical |
| 2     | Incident Reporting        | Very High          | High           | Critical |
| 3     | User Profile & Trust Score| High               | Medium         | High     |
| 4     | Learning Progress         | High               | Medium         | High     |
| 5     | Community Posts           | High               | Medium         | Medium   |
| 6     | Certificates & QR         | Medium             | High           | Medium   |
| 7     | National Monitor + Heatmap| Low                | High           | Medium   |

---

## 5. Non-Functional Priorities

- **Security**: Input validation (already strong on frontend — replicate on backend)
- **Performance**: Add caching (especially for leaderboards and monitor data)
- **Scalability**: Use queues for NLP processing and certificate generation
- **Monitoring**: Add logging + error tracking (Sentry recommended)
- **Compliance**: Ensure CPDP data protection requirements are met

---

## 6. Quick Wins (Can be done in parallel)

- Connect real authentication
- Add file upload + basic virus scanning
- Implement certificate PDF generation
- Add basic admin approval workflow for reports

---

## Final Note

The frontend is in excellent shape and ready to connect to a backend. The strongest next step is building a **secure authentication system + incident reporting API** as the foundation.

Once those two are working, the rest of the application can be connected relatively quickly.

---

*Prepared as part of the Cyvora development process*
