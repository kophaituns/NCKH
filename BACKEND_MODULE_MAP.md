# Backend Module Map – NCKH LLM Survey System

**Last Updated:** November 13, 2025

---

## Overview

The backend follows a **modular architecture** where each domain has isolated routes, controller, service, and repository layers. All modules are mounted at `/api/modules/{moduleName}`.

**Mount Point:** `Backend/src/routes/modules.routes.js` (lines 1–18)

---

## Module Directory Structure

```
Backend/modules/
├── auth-rbac/           (Authentication & Role-Based Access Control)
├── users/               (User Management)
├── templates/           (Survey Template Management)
├── surveys/             (Survey Lifecycle Management)
├── responses/           (Survey Response Collection)
├── collectors/          (Public Survey Distribution)
├── analytics/           (Survey Analytics & Insights)
├── export/              (Data Export)
├── health/              (System Health Check)
└── index.js             (Module Loader)
```

---

## Module Specifications

### 1. AUTH-RBAC Module

**Purpose:** User authentication, JWT token management, role-based access control

**Directory:** `Backend/modules/auth-rbac/`

#### Routes
**File:** `Backend/modules/auth-rbac/routes/auth.routes.js` (lines 1–45)

| Method | Path | Handler | Access | Notes |
|--------|------|---------|--------|-------|
| **POST** | `/api/modules/auth/register` | `authController.register` | Public | Create new user account |
| **POST** | `/api/modules/auth/login` | `authController.login` | Public | Authenticate with email/username + password |
| **POST** | `/api/modules/auth/refresh` | `authController.refreshToken` | Public | Exchange refresh token for new access token |
| **GET** | `/api/modules/auth/profile` | `authController.getProfile` | Private | Get current user profile (authenticated) |
| **GET** | `/api/modules/auth/me` | `authController.getProfile` | Private | Alias for `/profile` |
| **POST** | `/api/modules/auth/logout` | `authController.logout` | Private | Logout (invalidate session) |

#### Controller
**File:** `Backend/modules/auth-rbac/controller/auth.controller.js` (lines 1–147)

| Method | Lines | Purpose |
|--------|-------|---------|
| `register(req, res)` | 8–36 | Validate credentials, call `authService.register()`, return user + tokens |
| `login(req, res)` | 40–64 | Accept email or username, call `authService.login()`, return tokens |
| `refreshToken(req, res)` | 68–89 | Validate refresh token, generate new access token |
| `getProfile(req, res)` | 93–110 | Call `authService.getProfile(req.user.id)` |
| `logout(req, res)` | 114–126 | Clear token (frontend responsibility; server-side: no-op) |

#### Service
**File:** `Backend/modules/auth-rbac/service/auth.service.js`

**Key Methods:**
```javascript
async register({ username, email, password, full_name, role })
  → User.create() with bcrypt hashed password
  → Generate JWT tokens (access + refresh)
  → Return { user, token, refreshToken }

async login(identifier, password)
  → Find User by email or username
  → Compare password with bcrypt.compare()
  → Generate tokens

async refreshToken(refreshToken)
  → jwt.verify(refreshToken, JWT_REFRESH_SECRET)
  → Generate new access token

async getProfile(userId)
  → User.findByPk(userId)
  → Return user with omitted password
```

#### Middleware
**File:** `Backend/modules/auth-rbac/middleware/auth.middleware.js` (lines 1–92)

| Middleware | Purpose | Returns |
|-----------|---------|---------|
| `authenticate` | Parse JWT from `Authorization: Bearer <token>`, set `req.user` | 401 if invalid/missing |
| `isAdmin` | Check if `req.user.role === 'admin'` | 403 if not admin |
| `isCreatorOrAdmin` | Check if `req.user.role in ['admin', 'creator']` | 403 if not authorized |
| `isOwnerOrAdmin` | Check if `req.user.id === resource[fieldName]` | 403 if not owner/admin |

**Models Used:**
- `User` (verify JWT payload against DB user)

---

### 2. USERS Module

**Purpose:** Admin user management (CRUD, role updates)

**Directory:** `Backend/modules/users/`

#### Routes
**File:** `Backend/modules/users/routes/user.routes.js` (lines 1–53)

| Method | Path | Handler | Access | Notes |
|--------|------|---------|--------|-------|
| **GET** | `/api/modules/users` | `userController.getAllUsers` | Admin only | List all users with pagination |
| **GET** | `/api/modules/users/role-stats` | `userController.getRoleStats` | Admin only | User count by role |
| **GET** | `/api/modules/users/stats` | `userController.getUserStats` | Admin only | Overall user statistics |
| **GET** | `/api/modules/users/:id` | `userController.getUserById` | Admin only | Get single user by ID |
| **POST** | `/api/modules/users` | `userController.createUser` | Admin only | Create new user |
| **PUT** | `/api/modules/users/:id` | `userController.updateUser` | Admin only | Update user details |
| **DELETE** | `/api/modules/users/:id` | `userController.deleteUser` | Admin only | Delete user account |
| **PATCH** | `/api/modules/users/:id/role` | `userController.updateUserRole` | Admin only | Change user role |

**Middleware:** `authenticate` + `isAdmin` on all routes

#### Controller
**File:** `Backend/modules/users/controller/user.controller.js`

**Key Methods:**
```javascript
async getAllUsers(req, res)
  → Query User with page/limit
  → Return { users, pagination }

async getUserById(req, res)
  → User.findByPk(id)
  → Return user (omit password)

async createUser(req, res)
  → Validate { username, email, password, full_name, role }
  → userService.createUser()

async updateUserRole(req, res)
  → Validate new role in ['admin', 'creator', 'user']
  → User.update({ role })
```

#### Service
**File:** `Backend/modules/users/service/user.service.js`

**Key Methods:**
```javascript
async getAllUsers({ page, limit, search }, user)
  → SurveyTemplate.findAndCountAll() filtered by search
  → Pagination: (page-1)*limit

async getUserById(id)
  → User.findByPk(id) with associations

async createUser(userData)
  → Hash password with bcrypt
  → User.create()

async updateUser(id, updateData)
  → User.update(updateData)

async deleteUser(id)
  → User.destroy() (hard delete)

async updateUserRole(id, newRole)
  → User.update({ role: newRole })
```

#### Models Used
- `User` (id, username, email, password, full_name, role, created_at, updated_at)

---

### 3. TEMPLATES Module

**Purpose:** Survey template CRUD, question management

**Directory:** `Backend/modules/templates/`

#### Routes
**File:** `Backend/modules/templates/routes/template.routes.js` (lines 1–68)

| Method | Path | Handler | Access | Notes |
|--------|------|---------|--------|-------|
| **GET** | `/api/modules/templates/question-types` | `templateController.getQuestionTypes` | Auth | List all question types (multiple-choice, text, rating, etc.) |
| **GET** | `/api/modules/templates` | `templateController.getAllTemplates` | Auth | List templates with pagination |
| **GET** | `/api/modules/templates/:id` | `templateController.getTemplateById` | Auth | Get template with questions + options |
| **POST** | `/api/modules/templates` | `templateController.createTemplate` | Creator/Admin | Create new template |
| **PUT** | `/api/modules/templates/:id` | `templateController.updateTemplate` | Creator/Admin + owner check | Update template metadata |
| **DELETE** | `/api/modules/templates/:id` | `templateController.deleteTemplate` | Creator/Admin + owner check | Hard delete (with TEMPLATE_IN_USE check) |
| **PATCH** | `/api/modules/templates/:id/archive` | `templateController.archiveTemplate` | Creator/Admin + owner check | Soft delete (set is_archived=1) |
| **PATCH** | `/api/modules/templates/:id/unarchive` | `templateController.unarchiveTemplate` | Creator/Admin + owner check | Restore archived template |
| **POST** | `/api/modules/templates/:id/questions` | `templateController.addQuestion` | Creator/Admin + owner check | Add question to template |
| **GET** | `/api/modules/templates/:id/questions` | `templateController.getQuestionsByTemplate` | Auth | List questions for template |

**Middleware:** `authenticate` + `isCreatorOrAdmin` on protected routes

#### Controller
**File:** `Backend/modules/templates/controller/template.controller.js` (lines 1–408)

| Method | Lines | Purpose |
|--------|-------|---------|
| `getAllTemplates(req, res)` | 7–24 | Paginate templates, filter by search |
| `getTemplateById(req, res)` | 28–71 | Fetch template with Questions + QuestionOptions nested, normalize response |
| `createTemplate(req, res)` | 75–107 | Validate title, call `templateService.createTemplate()` |
| `updateTemplate(req, res)` | 111–X | Update template fields (title, description) |
| `deleteTemplate(req, res)` | X–X | Hard delete with FK constraint check → return error if surveys exist |
| `archiveTemplate(req, res)` | X–X | Set `is_archived=1` for soft delete |
| `unarchiveTemplate(req, res)` | X–X | Set `is_archived=0` for restore |
| `addQuestion(req, res)` | X–X | Create Question + QuestionOptions in transaction |
| `getQuestionTypes(req, res)` | X–X | List all QuestionType records |

**Response Normalization (lines 48–54):**
```javascript
normalizedQuestions = template.Questions.map(q => ({
  id: q.id,
  label: q.question_text,           // field renamed
  type: q.QuestionType.type_name,   // field renamed
  required: q.required,
  display_order: q.display_order,
  options: q.QuestionOptions.map(opt => ({
    id: opt.id,
    text: opt.option_text,          // field renamed
    display_order: opt.display_order
  }))
}))
```

#### Service
**File:** `Backend/modules/templates/service/template.service.js` (lines 1–382)

| Method | Purpose |
|--------|---------|
| `getAllTemplates(options, user)` | Fetch templates with pagination, search filter (title + description), order by created_at DESC |
| `getTemplateById(templateId)` | Find template with eager-loaded Questions and QuestionOptions |
| `createTemplate(templateData, user)` | Create template + questions array in transaction (or loop) |
| `updateTemplate(templateId, updateData, user)` | Update title/description, check ownership |
| `deleteTemplate(templateId, user)` | Check for FK violations (surveys referencing template), throw TEMPLATE_IN_USE if found |
| `archiveTemplate(templateId, user)` | Set is_archived=1 (soft delete) |
| `unarchiveTemplate(templateId, user)` | Set is_archived=0 (restore) |
| `addQuestion(templateId, questionData, user)` | Create Question + QuestionOptions from payload |

#### Models Used
- `SurveyTemplate` (id, title, description, created_by, status, is_archived, created_at, updated_at)
- `Question` (id, template_id, question_text, question_type_id, required, display_order)
- `QuestionType` (id, type_name, description)
- `QuestionOption` (id, question_id, option_text, display_order)
- `User` (creator relationship)

**Critical FK Check (deleteTemplate):**
```
Survey.count({ where: { template_id } }) > 0
  → throw Error('Template in use. Archive instead.')
```

---

### 4. SURVEYS Module

**Purpose:** Survey lifecycle (create, publish, close, delete)

**Directory:** `Backend/modules/surveys/`

#### Routes
**File:** `Backend/modules/surveys/routes/survey.routes.js` (lines 1–61)

| Method | Path | Handler | Access | Notes |
|--------|------|---------|--------|-------|
| **GET** | `/api/modules/surveys` | `surveyController.getAllSurveys` | Auth | List surveys (filter by status, target_audience, search) |
| **GET** | `/api/modules/surveys/:id` | `surveyController.getSurveyById` | Auth | Get survey with template data |
| **GET** | `/api/modules/surveys/:id/stats` | `surveyController.getSurveyStats` | Auth | Get response count + completion percentage |
| **POST** | `/api/modules/surveys` | `surveyController.createSurvey` | Creator/Admin | Create survey from template |
| **PUT** | `/api/modules/surveys/:id` | `surveyController.updateSurvey` | Creator/Admin + owner check | Update survey metadata |
| **PATCH** | `/api/modules/surveys/:id/status` | `surveyController.updateSurveyStatus` | Creator/Admin + owner check | Change status (draft→active→closed→analyzed) |
| **DELETE** | `/api/modules/surveys/:id` | `surveyController.deleteSurvey` | Creator/Admin + owner check | Hard delete survey + responses + answers |

**Middleware:** `authenticate` + `isCreatorOrAdmin` on write routes

#### Controller
**File:** `Backend/modules/surveys/controller/survey.controller.js` (lines 1–250)

| Method | Purpose |
|--------|---------|
| `getAllSurveys(req, res)` | Filter by status, target_audience, search; paginate |
| `getSurveyById(req, res)` | Fetch survey with creator + template |
| `getSurveyStats(req, res)` | Count responses, calculate completion % |
| `createSurvey(req, res)` | Validate template_id + title, call `surveyService.createSurvey()` |
| `updateSurvey(req, res)` | Update title, description, dates; check ownership |
| `updateSurveyStatus(req, res)` | Validate status transition, call `surveyService.updateSurveyStatus()` |
| `deleteSurvey(req, res)` | Hard delete + cascade to responses + answers |

#### Service
**File:** `Backend/modules/surveys/service/survey.service.js` (lines 1–223)

| Method | Purpose |
|--------|---------|
| `getAllSurveys(options, user)` | Query with filters; non-admin users see only own surveys (created_by === user.id) |
| `getSurveyById(surveyId, user)` | Find with creator + template; ownership check for non-admin |
| `createSurvey(surveyData, user)` | Validate template exists, create survey with status='draft' |
| `updateSurvey(surveyId, updateData, user)` | Update fields; check ownership |
| `updateSurveyStatus(surveyId, newStatus, user)` | Validate transition, update status |
| `deleteSurvey(surveyId, user)` | Hard delete + cascade (FK cascade configured) |

#### Models Used
- `Survey` (id, template_id, title, description, start_date, end_date, target_audience, target_value, created_by, status, created_at, updated_at)
  - FK: template_id → SurveyTemplate.id
  - FK: created_by → User.id
  - Enum: status in ['draft', 'active', 'closed', 'analyzed']
- `SurveyTemplate` (eager load)
- `User` (eager load)

**Status Transitions:**
```
draft → active (when published)
active → closed (when ended)
closed → analyzed (after LLM analysis, optional)
active ↔ closed (can re-open in some flows)
```

---

### 5. RESPONSES Module

**Purpose:** Survey response submission (authenticated + anonymous), result retrieval

**Directory:** `Backend/modules/responses/`

#### Routes
**File:** `Backend/modules/responses/routes/response.routes.js` (lines 1–62)

| Method | Path | Handler | Access | Notes |
|--------|------|---------|--------|-------|
| **GET** | `/api/modules/responses/public/:token` | `publicResponsesController.getSurveyByToken` | Public | Fetch survey + questions for public form (via collector token) |
| **POST** | `/api/modules/responses/public/:token` | `publicResponsesController.submitResponse` | Public | Submit anonymous response to survey |
| **POST** | `/api/modules/responses` | `responseController.submitResponse` | Auth | Submit response as authenticated user |
| **GET** | `/api/modules/responses/my-responses` | `responseController.getUserResponses` | Auth | Get user's own responses |
| **GET** | `/api/modules/responses/:id` | `responseController.getResponseById` | Auth | Get single response (owner/creator/admin) |
| **GET** | `/api/modules/responses/survey/:surveyId` | `responseController.getResponsesBySurvey` | Auth + Creator/Admin | Get all responses for survey (creator/admin only) |
| **DELETE** | `/api/modules/responses/:id` | `responseController.deleteResponse` | Auth + Owner/Admin | Delete response (owner or admin) |

**Middleware:**
- Public routes: no auth
- Authenticated routes: `authenticate` middleware
- Creator-only routes: `authenticate` + `isCreatorOrAdmin`

#### Controller
**File:** `Backend/modules/responses/controller/public-responses.controller.js` (lines 1–229)

**Public Response Endpoints:**

| Method | Lines | Purpose |
|--------|-------|---------|
| `getSurveyByToken(req, res)` | 7–62 | Find SurveyCollector by token, fetch survey + template + questions, return survey data |
| `submitResponse(req, res)` | 66–181 | Validate token + survey active, create SurveyResponse, create Answer rows for each question |

**Request/Response Format:**

*GET /responses/public/:token (success):*
```json
{
  "ok": true,
  "data": {
    "survey": {
      "id": 1,
      "title": "Customer Feedback",
      "description": "...",
      "questions": [
        {
          "id": 1,
          "label": "How satisfied?",
          "type": "rating",
          "required": true,
          "options": [
            { "id": 101, "text": "Very Satisfied", "display_order": 1 }
          ]
        }
      ]
    },
    "collector_id": 5
  }
}
```

*POST /responses/public/:token (request):*
```json
{
  "answers": [
    { "questionId": 1, "value": 5 },
    { "questionId": 2, "value": "Some text", "type": "text" },
    { "questionId": 3, "value": 3, "optionId": 102 }
  ]
}
```

*Answer Mapping Logic (lines 125–160):*
```javascript
answers.map(async (answer) => {
  const question = await Question.findByPk(answer.question_id);
  const answerRow = {
    survey_response_id: surveyResponse.id,
    question_id: answer.question_id,
  };
  
  // Map value based on question type
  if (answer.optionId) {
    answerRow.option_id = answer.optionId;
  } else if (question.question_type_id === RATING_TYPE) {
    answerRow.numeric_answer = answer.value;
  } else {
    answerRow.text_answer = answer.value;
  }
  
  return Answer.create(answerRow);
});
```

#### Service
**File:** `Backend/modules/responses/service/response.service.js` (lines 1–220)

| Method | Purpose |
|--------|---------|
| `submitResponse(responseData, user)` | Create SurveyResponse + Answer rows; check survey active + no duplicate user response |
| `getResponseById(responseId, user)` | Fetch response with answers; check access (owner/creator/admin) |
| `getResponsesBySurvey(surveyId, user, options)` | Fetch all responses for survey (owner/creator/admin only); paginate |
| `getUserResponses(user, options)` | Fetch responses where respondent_id === user.id; paginate |
| `deleteResponse(responseId, user)` | Hard delete response + answers (cascade) |

#### Models Used
- `SurveyResponse` (id, survey_id, respondent_id, collector_id, start_time, completion_time, status, created_at, updated_at)
  - FK: survey_id → Survey.id
  - FK: respondent_id → User.id (nullable for anonymous)
  - FK: collector_id → SurveyCollector.id
  - Enum: status in ['started', 'completed', 'abandoned']
- `Answer` (id, survey_response_id, question_id, option_id, text_answer, numeric_answer, created_at)
  - FK: survey_response_id → SurveyResponse.id
  - FK: question_id → Question.id
  - FK: option_id → QuestionOption.id (nullable for open-ended)

**Important:** Answers created_at used for ordering responses by submission time.

---

### 6. COLLECTORS Module

**Purpose:** Public survey distribution via unique tokens (web links, QR codes)

**Directory:** `Backend/modules/collectors/`

#### Routes
**File:** `Backend/modules/collectors/routes/collector.routes.js` (lines 1–32)

| Method | Path | Handler | Access | Notes |
|--------|------|---------|--------|-------|
| **POST** | `/api/modules/collectors` | `collectorController.createCollector` | Auth + Creator/Admin | Generate collector + unique token for survey |
| **GET** | `/api/modules/collectors/survey/:surveyId` | `collectorController.getCollectorsBySurvey` | Auth + Creator/Admin | List collectors for survey with response counts |

**Middleware:** `authenticate` + `isCreatorOrAdmin`

#### Controller
**File:** `Backend/modules/collectors/controller/collector.controller.js`

**Key Methods:**
```javascript
async createCollector(req, res)
  → Validate survey exists + is active
  → collectorService.createCollector()
  → Return { collector, publicUrl, token }

async getCollectorsBySurvey(req, res)
  → collectorService.getCollectorsBySurvey(surveyId, user)
  → Return [ { id, token, type, publicUrl, responsesCount } ]
```

#### Service
**File:** `Backend/modules/collectors/service/collector.service.js` (lines 1–100+)

| Method | Purpose |
|--------|---------|
| `getCollectorsBySurvey(surveyId, user)` | Query SurveyCollector for survey, count responses per collector, return formatted array with publicUrl + responsesCount |
| `createCollector(surveyId, collectorData, user)` | Generate crypto.randomBytes(16).toString('hex') token, create SurveyCollector with type (web_link, qr_code, email, embedded) |

**Response Format (lines 30–43):**
```javascript
{
  id: collector.id,
  surveyId: collector.survey_id,
  token: collector.token,
  type: collector.collector_type,
  name: collector.name,
  isActive: collector.is_active,
  allowMultipleResponses: collector.allow_multiple_responses,
  publicUrl: `${FRONTEND_URL}/public/${collector.token}`,  // Frontend constructs response form
  createdAt: collector.created_at,
  responsesCount: <subquery count>
}
```

#### Models Used
- `SurveyCollector` (id, survey_id, collector_type, token, name, is_active, allow_multiple_responses, response_count, created_by, created_at, updated_at)
  - FK: survey_id → Survey.id
  - FK: created_by → User.id
  - Unique: token

---

### 7. ANALYTICS Module

**Purpose:** Survey insights, response analysis, visualization data

**Directory:** `Backend/modules/analytics/`

#### Routes
**File:** `Backend/modules/analytics/routes/analytics.routes.js` (lines 1–46)

| Method | Path | Handler | Access | Notes |
|--------|------|---------|--------|-------|
| **GET** | `/api/modules/analytics/dashboard` | `analyticsController.getDashboardStats` | Auth | System-wide stats (user count, survey count, response rate) |
| **GET** | `/api/modules/analytics/survey/:survey_id/summary` | `analyticsController.getSurveySummary` | Auth + Creator/Admin | Response count, completion %, avg time |
| **GET** | `/api/modules/analytics/survey/:survey_id/questions` | `analyticsController.getQuestionAnalytics` | Auth + Creator/Admin | Per-question analytics (answer distribution, word clouds for open-ended) |
| **GET** | `/api/modules/analytics/survey/:survey_id/responses` | `analyticsController.getResponseDetails` | Auth + Creator/Admin | Paginated response list with answer details |

**Middleware:** `authenticate` + `isCreatorOrAdmin` (for survey-specific queries)

#### Controller
**File:** `Backend/modules/analytics/controller/analytics.controller.js`

**Key Methods:**
```javascript
async getDashboardStats(req, res)
  → analyticsService.getDashboardStats(req.user)
  → Return { userCount, surveyCount, responseCount, avgCompletionTime }

async getSurveySummary(req, res)
  → Validate survey ownership
  → analyticsService.getSurveySummary(surveyId)
  → Return { totalResponses, completionPercentage, avgTimeMinutes, statusBreakdown }

async getQuestionAnalytics(req, res)
  → For each question, aggregate Answer rows
  → Return [ { question_id, question_text, distribution: { optionId: count } } ]

async getResponseDetails(req, res)
  → Query SurveyResponse with pagination
  → Include Answer details normalized
```

#### Service
**File:** `Backend/modules/analytics/service/analytics.service.js`

**Key Methods:**
```javascript
async getDashboardStats(user)
  → User.count()
  → Survey.count() (own surveys if non-admin)
  → SurveyResponse.count()
  → Avg(completion_time - start_time)

async getSurveySummary(surveyId)
  → SurveyResponse.count({ where: { survey_id } })
  → Calculate completion %
  → Avg completion time

async getQuestionAnalytics(surveyId)
  → Group Answer rows by question_id
  → For each question, count answers by option_id
  → Return distribution histogram

async getResponseDetails(surveyId, options)
  → SurveyResponse.findAndCountAll()
  → Include Answer + Question details
  → Paginate
```

#### Models Used
- `SurveyResponse`, `Answer`, `Question`, `QuestionOption` (query + aggregate)

---

### 8. EXPORT Module

**Purpose:** Export survey data to CSV, PDF, or JSON

**Directory:** `Backend/modules/export/`

#### Routes
**File:** `Backend/modules/export/routes/export.routes.js`

**Expected Endpoints (to be verified):**
```
POST /api/modules/export/survey/:surveyId/csv
POST /api/modules/export/survey/:surveyId/pdf
POST /api/modules/export/survey/:surveyId/json
```

#### Controller & Service
**Status:** Module structure exists; implementation details TBD

---

### 9. HEALTH Module

**Purpose:** System health check endpoint

**Directory:** `Backend/modules/health/`

#### Routes
**File:** `Backend/modules/health/routes/health.routes.js` (lines 1–52)

| Method | Path | Handler | Access | Notes |
|--------|------|---------|--------|-------|
| **GET** | `/api/modules/health` | (inline async) | Public | Check API + DB connectivity |

**Response (Success - 200):**
```json
{
  "ok": true,
  "timestamp": "2025-11-13T12:34:56.789Z",
  "uptime": 12345.67,
  "version": "1.0.0",
  "environment": "development",
  "db": true,
  "dbDetails": {
    "connected": true,
    "database": "allmtags_survey_db",
    "tables": 14
  }
}
```

**Response (DB Failure - 503):**
```json
{
  "ok": false,
  "timestamp": "2025-11-13T12:34:56.789Z",
  "uptime": 12345.67,
  "version": "1.0.0",
  "environment": "development",
  "db": false,
  "dbDetails": {
    "connected": false,
    "error": "Connection refused"
  }
}
```

---

## Module Index & Exports

**File:** `Backend/modules/index.js` (lines 1–18)

```javascript
module.exports = {
  authRbac: { routes, controller, service, middleware },
  surveys: { routes, controller, service },
  responses: { routes, controller, service },
  templates: { routes, controller, service },
  analytics: { routes, controller, service },
  export: { routes, controller, service },
  collectors: { routes, controller, service },
  users: { routes, controller, service, repository },
  health: { routes }
};
```

Each module's `index.js` re-exports the core files for clean import.

---

## Summary Table

| Module | Routes File | Endpoints | Controller Methods | Key Models | Middleware |
|--------|------------|-----------|-------------------|------------|-----------|
| **auth-rbac** | `auth.routes.js` | 6 | 5 | User | none (public/private mixed) |
| **users** | `user.routes.js` | 8 | 7 | User | authenticate + isAdmin |
| **templates** | `template.routes.js` | 10 | 8 | SurveyTemplate, Question, QuestionOption | authenticate + isCreatorOrAdmin |
| **surveys** | `survey.routes.js` | 7 | 7 | Survey, SurveyTemplate, User | authenticate + isCreatorOrAdmin |
| **responses** | `response.routes.js` | 7 | 6 | SurveyResponse, Answer | public + authenticated |
| **collectors** | `collector.routes.js` | 2 | 2 | SurveyCollector | authenticate + isCreatorOrAdmin |
| **analytics** | `analytics.routes.js` | 4 | 4 | SurveyResponse, Answer, Question | authenticate + isCreatorOrAdmin |
| **export** | `export.routes.js` | 3+ | TBD | Survey, Answer | authenticate + isCreatorOrAdmin |
| **health** | `health.routes.js` | 1 | inline | User (via sequelize test) | none (public) |

**Total Public Endpoints:** 7  
**Total Authenticated Endpoints:** 35+  
**Total Endpoints:** 42+

---

**End of Backend Module Map**
