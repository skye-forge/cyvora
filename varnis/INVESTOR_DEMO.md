# VARNIS — Investor Demo · Run of Show

**Duration:** 8–10 min · **Setup time:** 30 seconds

---

## Before you start

This bundle is frontend-only and runs on bundled demo data (mock mode) out of the box:

```bash
npm start        # http://localhost:8080
```

Open two browser windows side by side:

- **Window A (citizen)** — `http://localhost:8080/public/`
- **Window B (admin)**   — `http://localhost:8080/admin/`

If your live backend is up, demo real traffic instead by appending `?api=<your-api-base>&live=1` to the URL (see README → *Connecting your backend*).

---

## Suggested run of show

### 1 · The citizen story — LEARN + REPORT (3 min)

1. **Register** a new account — note the **national ID card upload** step (identity-verified onboarding), then the OTP verification screen.
2. **Report an incident.** Go to *Report Incident*, submit a phishing report. Open *My Reports* — it appears with a tracking ID like `VAR-482-19K`.
3. **Learn.** Open a lesson, take the quiz, show XP / streak / daily challenge.

### 2 · The admin story — TRIAGE (2 min)

1. In Window B, open *Reports* — filter, open the new report, change its status.
2. Show *Alerts* publishing and the *Users* management view.

### 3 · Trust surface (2 min)

- **Certificates** — open a certificate and scan/click the QR to the public verification page.
- **Bilingual** — flip EN ↔ FR live from the language toggle.
- **Offline** — kill the network; the PWA keeps serving cached pages.

### 4 · The ask (1 min)

The frontend is production-shaped: one config file (`assets/js/config.js`) points it at the production API — every screen already routes through a single API client with token refresh, validation, and graceful fallback built in.

---

Skye8 — VARNIS
