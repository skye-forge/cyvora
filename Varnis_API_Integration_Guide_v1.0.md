# Varnis API Integration Guide

Version 1.1 · For HTML/Tailwind/JS Frontends and Flutter Clients

This guide is written against the backend that is currently implemented in this repository. It focuses on the routes that are available now and gives practical examples for both web and mobile teams.

---

## 1. Base setup

### 1.1 Base URLs

| Environment       | Base URL                              |
| ----------------- | ------------------------------------- |
| Local development | http://localhost:8000/api/v1/         |
| Swagger UI        | http://localhost:8000/api/docs/       |
| Production        | https://varnis.up.railway.app/api/v1/ |

Use the Swagger UI at /api/docs/ to verify payload names and response shapes before you start building UI screens.

### 1.2 Response envelope

The API uses a consistent envelope:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {}
}
```

Errors usually return:

```json
{
  "success": false,
  "message": "Some validation message"
}
```

### 1.3 Authentication header

Protected routes require:

```http
Authorization: Bearer <access-token>
```

---

## 2. Authentication flow

The current auth endpoints are:

- POST /api/v1/auth/register/
- POST /api/v1/auth/login/
- POST /api/v1/auth/refresh/
- GET /api/v1/auth/me/

### 2.1 Register

Request:

```http
POST /api/v1/auth/register/
Content-Type: application/json
```

```json
{
  "name": "Amadou Traoré",
  "email": "amadou@example.com",
  "phone": "+237670000000",
  "language": "fr",
  "password": "StrongPass123!"
}
```

Response:

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "access": "<jwt-access-token>",
    "refresh": "<jwt-refresh-token>",
    "user": {
      "id": "<uuid>",
      "name": "Amadou Traoré",
      "email": "amadou@example.com",
      "phone": "+237670000000",
      "language": "fr",
      "role": "citizen",
      "xp_points": 0,
      "level": 1,
      "streak_count": 0,
      "is_verified": false,
      "created_at": "2026-07-21T10:00:00Z"
    }
  }
}
```

### 2.2 Login

Request:

```http
POST /api/v1/auth/login/
Content-Type: application/json
```

```json
{
  "email": "amadou@example.com",
  "password": "StrongPass123!"
}
```

Response shape is the same as registration, but with the logged-in user's payload.

### 2.3 Refresh token

Request:

```http
POST /api/v1/auth/refresh/
Content-Type: application/json
```

```json
{
  "refresh": "<refresh-token>"
}
```

Response:

```json
{
  "success": true,
  "message": "Token refreshed.",
  "data": {
    "access": "<new-access-token>"
  }
}
```

### 2.4 Load current user profile

```http
GET /api/v1/auth/me/
Authorization: Bearer <access-token>
```

---

## 3. Frontend integration guide: HTML, Tailwind CSS, and JavaScript

### 3.1 Recommended approach

Use one small helper to centralize the base URL, auth header, and error handling.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Varnis Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50 text-slate-800">
    <main class="mx-auto max-w-3xl px-6 py-12">
      <h1 class="text-3xl font-semibold">Varnis API Demo</h1>
      <form id="login-form" class="mt-8 rounded-xl bg-white p-6 shadow">
        <input
          id="email"
          class="mb-4 w-full rounded border p-3"
          placeholder="Email"
        />
        <input
          id="password"
          type="password"
          class="mb-4 w-full rounded border p-3"
          placeholder="Password"
        />
        <button
          class="w-full rounded bg-emerald-600 px-4 py-3 font-medium text-white"
        >
          Login
        </button>
      </form>
      <div id="result" class="mt-6 rounded bg-slate-100 p-4"></div>
    </main>

    <script>
      const API_BASE = "http://localhost:8000/api/v1";

      async function api(path, options = {}) {
        const token = localStorage.getItem("access");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        };

        const response = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || "Request failed");
        }
        return payload;
      }

      document
        .getElementById("login-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();

          const email = document.getElementById("email").value;
          const password = document.getElementById("password").value;

          try {
            const result = await api("/auth/login/", {
              method: "POST",
              body: JSON.stringify({ email, password }),
            });

            localStorage.setItem("access", result.data.access);
            localStorage.setItem("refresh", result.data.refresh);

            document.getElementById("result").innerHTML = `
            <p class="font-semibold">Login success</p>
            <pre class="mt-2 overflow-x-auto text-sm">${JSON.stringify(result, null, 2)}</pre>
          `;
          } catch (error) {
            document.getElementById("result").textContent = error.message;
          }
        });
    </script>
  </body>
</html>
```

### 3.2 Load the current user profile

```js
const profile = await api("/auth/me/");
console.log(profile.data);
```

### 3.3 Fetch learning content

```js
const zones = await api("/learning/zones/");
console.log(zones.data);
```

### 3.4 Submit an incident report

The incident endpoint accepts multipart/form-data because evidence files are allowed.

```js
const formData = new FormData();
formData.append("description", "Suspicious SMS claiming to be a bank");
formData.append("include_location", "true");
formData.append("latitude", "3.8480");
formData.append("longitude", "11.5021");
formData.append("evidence", fileInput.files[0]);

const response = await fetch(`${API_BASE}/incidents/`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access")}`,
  },
  body: formData,
});

const payload = await response.json();
console.log(payload);
```

### 3.5 Web tips

- Store the access token carefully; local storage is simple but exposes you to XSS risk.
- Always show the backend error message in the UI.
- Use FormData for uploads rather than JSON.

---

## 4. Flutter integration guide

### 4.1 Package setup

Add these dependencies:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  flutter_secure_storage: ^9.0.0
```

### 4.2 Token storage helper

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _storage = FlutterSecureStorage();

  static Future<void> saveAccessToken(String token) async {
    await _storage.write(key: 'access_token', value: token);
  }

  static Future<String?> getAccessToken() async {
    return _storage.read(key: 'access_token');
  }

  static Future<void> clear() async {
    await _storage.deleteAll();
  }
}
```

### 4.3 Simple API client

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  static const String baseUrl = 'http://localhost:8000/api/v1';

  static Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final token = await TokenStorage.getAccessToken();
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );

    final payload = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw Exception(payload['message'] ?? 'Request failed');
    }
    return payload;
  }

  static Future<Map<String, dynamic>> getJson(String path) async {
    final token = await TokenStorage.getAccessToken();
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: {
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    final payload = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw Exception(payload['message'] ?? 'Request failed');
    }
    return payload;
  }
}
```

### 4.4 Login and profile example

```dart
Future<void> login(String email, String password) async {
  final payload = await ApiClient.postJson('/auth/login/', {
    'email': email,
    'password': password,
  });

  await TokenStorage.saveAccessToken(payload['data']['access']);
  final profile = await ApiClient.getJson('/auth/me/');
  print(profile['data']);
}
```

### 4.5 Submit an incident from Flutter

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> submitIncident() async {
  final token = await TokenStorage.getAccessToken();
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('${ApiClient.baseUrl}/incidents/'),
  );

  request.headers['Authorization'] = 'Bearer $token';
  request.fields['description'] = 'Suspicious SMS claiming to be a bank';
  request.fields['include_location'] = 'true';
  request.fields['latitude'] = '3.8480';
  request.fields['longitude'] = '11.5021';

  request.files.add(await http.MultipartFile.fromPath(
    'evidence',
    '/path/to/file.jpg',
  ));

  final response = await request.send();
  final body = await response.stream.bytesToString();
  print(body);
}
```

### 4.6 Flutter tips

- Use flutter_secure_storage for access and refresh tokens.
- Keep network code inside a single service layer.
- Use multipart requests for file uploads.

---

## 5. Endpoint quick reference

### Auth

- POST /api/v1/auth/register/
- POST /api/v1/auth/login/
- POST /api/v1/auth/refresh/
- GET /api/v1/auth/me/

### Learning

- GET /api/v1/learning/zones/
- GET /api/v1/learning/zones/<zone_id>/modules/
- GET /api/v1/learning/modules/<module_id>/lessons/
- GET /api/v1/learning/lessons/<lesson_id>/parts/
- POST /api/v1/learning/lessons/<lesson_id>/complete/
- GET /api/v1/learning/progress/
- GET /api/v1/learning/daily-tip/

### Incidents

- GET /api/v1/incidents/
- POST /api/v1/incidents/
- GET /api/v1/incidents/<incident_id>/

### Health and docs

- GET /api/v1/health
- GET /api/docs/
- GET /api/schema/

---

## 6. Common gotchas

- The registration endpoint expects the field name name, not full_name.
- The login endpoint expects email as the request body field.
- Refresh uses the body key refresh, not refresh_token.
- The incident endpoint requires multipart/form-data for uploads.
- Always send the Bearer token for protected routes.
