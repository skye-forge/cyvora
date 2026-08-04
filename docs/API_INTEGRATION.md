# Varnis — Live Support Chat: API Integration Guide

Audience: Flutter team (citizen app), Admin/Agent console frontend team.
Backend owner: Leon (Backend Lead) — ping for auth issues or endpoint bugs.

---

## 1. Overview

Support chat has two transport layers:

| Purpose | Transport | Base |
|---|---|---|
| Create ticket, list tickets, history, close, agent queue | REST (HTTPS) | `https://api.varnis.cm/api/support/` |
| Live message send/receive while chat is open | WebSocket | `wss://api.varnis.cm/ws/support/<ticket_id>/` |

**Rule of thumb:** use REST for anything that happens once (creating a ticket, loading history when the screen opens, closing a ticket). Use the WebSocket only while the chat screen is actually on-screen and open.

A ticket starts **AI-handled**. The AI (Gemini-backed today) always identifies itself as an AI assistant in its first reply. If the AI can't confidently answer, the ticket is **escalated** to a human agent automatically — no citizen action needed. The UI should treat AI and human messages as the same chat thread, just visually distinguished (see §5).

---

## 2. Authentication

Both REST and WebSocket use the same JWT access token issued by your existing auth endpoints.

- REST: standard `Authorization: Bearer <access_token>` header.
- WebSocket: token passed as a query parameter at connect time (WebSocket headers are unreliable across platforms, so we use a query param instead):

```
wss://api.varnis.cm/ws/support/3fa85f64-5717-4562-b3fc-2c963f66afa6/?token=<access_token>
```

If the token is missing/invalid/expired, the server closes the socket immediately with code `4401`. Refresh the token via your normal refresh flow and reconnect.

---

## 3. REST Endpoints

### 3.1 Create a ticket

```
POST /api/support/tickets/
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Payment not going through",   // optional, auto-derived from message if omitted
  "category": "technical",                   // one of: report_help | certificate | technical | general
  "message": "I tried to pay for my certificate but MoMo failed twice.",
  "attachment_url": null                      // optional
}
```

**201 Created**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "user": 42,
  "subject": "Payment not going through",
  "category": "technical",
  "status": "open",
  "auto_handled": true,
  "assigned_agent": null,
  "created_at": "2026-07-23T10:15:00Z",
  "updated_at": "2026-07-23T10:15:00Z",
  "closed_at": null,
  "messages": [
    {
      "id": "b1f0...",
      "ticket": "3fa85f64-...",
      "sender_id": 42,
      "sender_role": "citizen",
      "message": "I tried to pay for my certificate but MoMo failed twice.",
      "attachment_url": null,
      "is_ai_generated": false,
      "is_read": false,
      "created_at": "2026-07-23T10:15:00Z"
    }
  ]
}
```

After this call returns, **open the WebSocket** using the returned `id` as `ticket_id` — the AI's reply (or escalation notice) arrives a moment later over the socket, not in this response. Show a "typing..." / "Assistant is thinking..." indicator immediately after ticket creation until the first AI/system message arrives.

---

### 3.2 List my tickets

```
GET /api/support/tickets/
Authorization: Bearer <token>
```

Returns an array of tickets (same shape as above, minus the nested `messages`, plus `last_message`). Use this to render a "My Support Chats" list screen.

---

### 3.3 Get ticket + full history

```
GET /api/support/tickets/{ticket_id}/
GET /api/support/tickets/{ticket_id}/messages/     (identical response — kept as an alias for clarity)
```

Call this **every time the chat screen opens**, before connecting the WebSocket, so the message list is populated instantly and doesn't depend on socket timing. Response shape matches §3.1's 201 body.

---

### 3.4 Close a ticket

```
PATCH /api/support/tickets/{ticket_id}/close/
Authorization: Bearer <token>
```

Either the citizen or the assigned agent may call this. Returns the updated ticket. The server also broadcasts a `ticket.closed` event over the WebSocket to anyone still connected (see §4.4).

---

### 3.5 Agent-only endpoints (Admin console)

```
GET   /api/support/agents/queue/          list of tickets escalated to a human, unassigned
PATCH /api/support/tickets/{id}/assign/   current agent claims the ticket
```

These require the authenticated user to be `is_staff` or have a `SupportAgentProfile`. Returns `403` otherwise.

---

## 4. WebSocket Protocol

### 4.1 Connecting

```
wss://api.varnis.cm/ws/support/<ticket_id>/?token=<access_token>
```

On success, server sends:

```json
{ "type": "connection.ack", "payload": { "ticket_id": "3fa85f64-...", "status": "open" } }
```

Close codes to handle client-side:

| Code | Meaning | Client action |
|---|---|---|
| 4401 | Missing/invalid token | Refresh token, reconnect |
| 4403 | Not your ticket / not assigned agent | Do not retry — show error |
| 4404 | Ticket doesn't exist | Do not retry — show error |

Reconnect with exponential backoff on any unexpected drop (network loss, backgrounding). Since REST §3.3 is always the source of truth for history, a reconnect never loses messages — just re-fetch history on reconnect if you're unsure what was missed, then resume listening live.

---

### 4.2 Sending a message

```json
{
  "event": "message.send",
  "payload": {
    "message": "It still says pending after 2 days",
    "attachment_url": null
  }
}
```

The server will:
1. Save the message and broadcast it back to **everyone** in the ticket (including you — treat this as the source of truth, don't optimistically render-and-forget; reconcile with the broadcast echo).
2. If the ticket is still AI-handled, trigger AI triage asynchronously — the AI's reply (or an escalation system message) arrives moments later as its own `chat.message` frame.

There is no dedicated "send success" ack beyond the broadcast echo of your own message — if you need a local optimistic UI, key it by a client-generated temp ID and reconcile against the echoed message's `created_at`/content once it arrives.

---

### 4.3 Receiving messages

```json
{
  "type": "chat.message",
  "payload": {
    "id": "c2d1...",
    "ticket": "3fa85f64-...",
    "sender_id": null,
    "sender_role": "ai",
    "message": "Hi, I'm the Varnis AI Assistant. Your certificate payment typically...",
    "attachment_url": null,
    "is_ai_generated": true,
    "is_read": false,
    "created_at": "2026-07-23T10:15:04Z"
  }
}
```

`sender_role` is one of: `citizen`, `agent`, `ai`, `system`. `sender_id` is `null` for `ai` and `system` messages.

**UI requirement:** whenever `is_ai_generated` is `true` (or `sender_role == "ai"`), the message bubble must be visually labeled as AI — e.g. an "AI Assistant" tag/icon distinct from the human agent's avatar. This isn't cosmetic: the AI's own first reply also states in text that it's an AI, but the UI must reinforce that at a glance for every AI message, not just the first one. Never render an `ai` message using the same avatar/style as an `agent` message.

`system` messages (e.g. "Connecting you to a human support agent...", "Agent X has joined the chat.") should render as centered, muted system-style text, not a chat bubble — same convention as WhatsApp/Slack system events.

---

### 4.4 Other server → client events

```json
{ "type": "typing", "payload": { "user_id": "17", "is_typing": true } }
{ "type": "ticket.closed", "payload": { "ticket_id": "3fa85f64-...", "closed_at": "2026-07-23T11:00:00Z" } }
{ "type": "error", "payload": { "code": "ticket_closed", "detail": "This ticket is closed." } }
```

On `ticket.closed`, disable the message input and show a "This conversation has ended" banner; the citizen can still scroll history via REST.

---

### 4.5 Sending typing indicators (optional, nice-to-have)

```json
{ "event": "typing", "payload": { "is_typing": true } }
```

Not required for MVP — skip if short on time before demo day.

---

## 5. Chat UI Reference (message rendering by sender_role)

| sender_role | Rendering |
|---|---|
| `citizen` | Standard outgoing bubble (right-aligned), your own avatar |
| `agent` | Standard incoming bubble (left-aligned), agent name + "Support Agent" |
| `ai` | Incoming bubble, **must** show an "AI Assistant" badge/icon, visually distinct from `agent` |
| `system` | Centered, muted, no bubble — status/event line |

---

## 6. End-to-End Flow (for reference)

```
1. Citizen taps "Contact Support" → POST /api/support/tickets/
2. App opens WebSocket with returned ticket_id
3. AI triage runs automatically (async, ~1-3s) →
      a. AI answers directly → chat.message (sender_role: ai) → citizen can keep chatting with AI
      b. AI escalates       → chat.message (sender_role: system, "Connecting you...") 
                               → ticket now appears in agent queue
4. Agent claims via admin console → PATCH /tickets/{id}/assign/
      → chat.message (system, "Agent X has joined the chat")
5. Agent and citizen exchange messages live over the same socket/group
6. Either party → PATCH /tickets/{id}/close/ → ticket.closed broadcast
```

---

## 7. Environment / Config Needed From Backend

Nothing client-side needs configuring beyond the base URLs above. If you're testing locally against a dev backend, ask Leon for the local `ws://` (not `wss://`) URL and a test JWT.

---

## 8. Open Items For Product/Design Sign-off

- Exact copy/wording for the AI's mandatory self-identification line (currently enforced server-side via the system prompt, but worth a design pass for tone/localization).
- Whether `typing` indicators are in scope for MVP demo (currently optional, see §4.5).
