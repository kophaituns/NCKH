# API Surface - Complete Endpoint Reference

Base URL: `http://localhost:5000/api/modules`

---

## Legend
- 🔓 Public (no auth)
- 🔐 Authenticated (JWT required)
- 👑 Admin only
- 📝 Creator or Admin only

---

## Authentication (`/auth`)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| POST | `/auth/register` | 🔓 | Register new user | `modules/auth-rbac/routes/auth.routes.js:12` |
| POST | `/auth/login` | 🔓 | Login user | `modules/auth-rbac/routes/auth.routes.js:19` |
| POST | `/auth/refresh` | 🔓 | Refresh access token | `modules/auth-rbac/routes/auth.routes.js:26` |
| GET | `/auth/profile` | 🔐 | Get current user profile | `modules/auth-rbac/routes/auth.routes.js:33` |
| GET | `/auth/me` | 🔐 | Get current user (alias) | `modules/auth-rbac/routes/auth.routes.js:40` |
| POST | `/auth/logout` | 🔐 | Logout user | `modules/auth-rbac/routes/auth.routes.js:47` |

---

## Users (`/users`)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| GET | `/users` | 👑 | List all users | `modules/users/routes/user.routes.js:12` |
| GET | `/users/role-stats` | 👑 | Get user counts by role | `modules/users/routes/user.routes.js:19` |
| GET | `/users/stats` | 👑 | Get user statistics | `modules/users/routes/user.routes.js:26` |
| GET | `/users/:id` | 👑 | Get user by ID | `modules/users/routes/user.routes.js:33` |
| POST | `/users` | 👑 | Create new user | `modules/users/routes/user.routes.js:40` |
| PUT | `/users/:id` | 👑 | Update user | `modules/users/routes/user.routes.js:47` |
| DELETE | `/users/:id` | 👑 | Delete user | `modules/users/routes/user.routes.js:54` |
| PATCH | `/users/:id/role` | 👑 | Update user role | `modules/users/routes/user.routes.js:61` |

---

## Templates (`/templates`)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| GET | `/templates/question-types` | 🔐 | List question types | `modules/templates/routes/template.routes.js:12` |
| GET | `/templates` | 🔐 | List all templates | `modules/templates/routes/template.routes.js:19` |
| GET | `/templates/:id` | 🔐 | Get template by ID (with questions) | `modules/templates/routes/template.routes.js:26` |
| POST | `/templates` | 📝 | Create template | `modules/templates/routes/template.routes.js:33` |
| PUT | `/templates/:id` | 📝 | Update template | `modules/templates/routes/template.routes.js:40` |
| DELETE | `/templates/:id` | 📝 | Delete template | `modules/templates/routes/template.routes.js:47` |
| PATCH | `/templates/:id/archive` | 📝 | Archive template | `modules/templates/routes/template.routes.js:54` |
| PATCH | `/templates/:id/unarchive` | 📝 | Unarchive template | `modules/templates/routes/template.routes.js:61` |
| POST | `/templates/:id/questions` | 📝 | Add question to template | `modules/templates/routes/template.routes.js:68` |
| GET | `/templates/:id/questions` | 🔐 | Get template questions | `modules/templates/routes/template.routes.js:75` |

---

## Surveys (`/surveys`)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| GET | `/surveys` | 🔐 | List all surveys | `modules/surveys/routes/survey.routes.js:12` |
| GET | `/surveys/:id` | 🔐 | Get survey by ID | `modules/surveys/routes/survey.routes.js:19` |
| GET | `/surveys/:id/stats` | 🔐 | Get survey statistics | `modules/surveys/routes/survey.routes.js:26` |
| POST | `/surveys` | 📝 | Create survey from template | `modules/surveys/routes/survey.routes.js:33` |
| PUT | `/surveys/:id` | 📝 | Update survey | `modules/surveys/routes/survey.routes.js:40` |
| PATCH | `/surveys/:id/status` | 📝 | Update survey status | `modules/surveys/routes/survey.routes.js:47` |
| DELETE | `/surveys/:id` | 📝 | Delete survey | `modules/surveys/routes/survey.routes.js:54` |

---

## Collectors (`/collectors`)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| POST | `/collectors` | 📝 | Create collector (generate link) | `modules/collectors/routes/collector.routes.js:12` |
| GET | `/collectors/survey/:surveyId` | 📝 | Get collectors for survey | `modules/collectors/routes/collector.routes.js:19` |

---

## Responses (`/responses`)

### Public Endpoints (No Auth)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| GET | `/responses/public/:token` | 🔓 | Get survey by token (public form) | `modules/responses/routes/response.routes.js:17` |
| POST | `/responses/public/:token` | 🔓 | Submit public response | `modules/responses/routes/response.routes.js:24` |

### Authenticated Endpoints

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| POST | `/responses` | 🔐 | Submit authenticated response | `modules/responses/routes/response.routes.js:35` |
| GET | `/responses/my-responses` | 🔐 | Get current user's responses | `modules/responses/routes/response.routes.js:42` |
| GET | `/responses/:id` | 🔐 | Get response by ID | `modules/responses/routes/response.routes.js:49` |
| GET | `/responses/survey/:surveyId` | 📝 | Get all responses for survey | `modules/responses/routes/response.routes.js:56` |
| DELETE | `/responses/:id` | 🔐 | Delete response | `modules/responses/routes/response.routes.js:63` |

**Note**: Public endpoints also mounted at `/api/modules/responses/public/:token` via public-responses.routes.js

---

## Analytics (`/analytics`)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| GET | `/analytics/dashboard` | 🔐 | Get dashboard statistics | `modules/analytics/routes/analytics.routes.js:12` |
| GET | `/analytics/survey/:survey_id/summary` | 🔐 | Get survey summary | `modules/analytics/routes/analytics.routes.js:19` |
| GET | `/analytics/survey/:survey_id/questions` | 🔐 | Get question-level analytics | `modules/analytics/routes/analytics.routes.js:26` |
| GET | `/analytics/survey/:survey_id/responses` | 🔐 | Get response details | `modules/analytics/routes/analytics.routes.js:33` |

---

## Export (`/export`)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| GET | `/export/survey/:survey_id/metadata` | 🔐 | Get export metadata | `modules/export/routes/export.routes.js:12` |
| GET | `/export/survey/:survey_id/csv` | 🔐 | Export survey responses as CSV | `modules/export/routes/export.routes.js:19` |
| GET | `/export/survey/:survey_id/json` | 🔐 | Export survey responses as JSON | `modules/export/routes/export.routes.js:26` |

---

## Health (`/health`)

| Method | Endpoint | Auth | Description | File |
|--------|----------|------|-------------|------|
| GET | `/health` | 🔓 | Health check + DB status | `modules/health/routes/health.routes.js:13` |

---

## Query Parameters

### Templates
- `GET /templates`: `?page=1&limit=10&search=keyword`

### Surveys
- `GET /surveys`: `?page=1&limit=10&search=keyword&status=active`

### Users
- `GET /users`: `?page=1&limit=10&search=keyword&role=admin`

---

## Request/Response Examples

### POST /templates
```json
Request:
{
  "title": "Customer Satisfaction",
  "description": "Q4 2025 survey",
  "questions": [
    {
      "question_type_id": 1,
      "question_text": "Rate our service",
      "required": true,
      "display_order": 1,
      "options": [
        { "option_text": "Excellent", "display_order": 1 },
        { "option_text": "Good", "display_order": 2 }
      ]
    }
  ]
}

Response (201):
{
  "success": true,
  "ok": true,
  "message": "Template created successfully",
  "id": 5,
  "data": {
    "template": { "id": 5, "title": "...", "Questions": [...] }
  }
}
```

### POST /collectors
```json
Request:
{
  "survey_id": 8,
  "collector_type": "public_link",
  "name": "General Public Link"
}

Response (201):
{
  "success": true,
  "message": "Collector created successfully",
  "data": {
    "collector": {
      "id": 15,
      "token": "a3f7b8c2d4e5...",
      "public_url": "http://localhost:3000/public/survey/a3f7b8c2d4e5..."
    }
  }
}
```

### POST /responses/public/:token
```json
Request:
{
  "answers": [
    { "questionId": 12, "value": 45 },         // Single choice
    { "questionId": 13, "value": [47, 49] },   // Checkbox
    { "questionId": 14, "value": "Great!" }    // Text
  ]
}

Response (200):
{
  "ok": true,
  "message": "Response submitted successfully",
  "data": { "response_id": 25 }
}
```

### PATCH /surveys/:id/status
```json
Request:
{
  "status": "active"
}

Response (200):
{
  "success": true,
  "ok": true,
  "message": "Survey status updated to active",
  "data": { "survey": { "id": 8, "status": "active", ... } }
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "ok": false,
  "error": true,
  "code": "TEMPLATE_IN_USE",
  "message": "This template is used by existing surveys and cannot be deleted.",
  "stack": "Error: ...\n  at ..." // Only in development
}
```

### Common Error Codes
- `UNAUTHORIZED`: Missing or invalid token (401)
- `ACCESS_DENIED`: Insufficient permissions (403)
- `NOT_FOUND`: Resource not found (404)
- `TEMPLATE_IN_USE`: Template cannot be deleted due to FK constraints (400)
- `INVALID_INPUT`: Validation failed (400)
- `INTERNAL_ERROR`: Server error (500)

---

## Authentication Flow

1. **Login**: `POST /auth/login` → Get `token` + `refreshToken`
2. **Store**: Save tokens in localStorage
3. **Request**: Add header `Authorization: Bearer <token>` to all authenticated requests
4. **Refresh**: On 401 error, call `POST /auth/refresh` with `refreshToken`
5. **Retry**: Retry original request with new token

---

## Middleware Chain

All routes pass through:
1. **helmet()** - Security headers
2. **cors()** - CORS validation
3. **express.json()** - Parse JSON body
4. **morgan()** - Request logging
5. **Route-specific middleware**:
   - `authenticate` - JWT verification (requires token)
   - `isAdmin` - Admin role check
   - `isCreatorOrAdmin` - Creator or Admin role check
6. **Route handler** - Controller function
7. **Error handler** - Global error catcher

---

## Status Codes

- **200** OK - Success
- **201** Created - Resource created
- **400** Bad Request - Validation error
- **401** Unauthorized - Missing/invalid token
- **403** Forbidden - Insufficient permissions
- **404** Not Found - Resource not found
- **500** Internal Server Error - Server error

---

*All endpoints prefixed with `/api/modules` base path.*
