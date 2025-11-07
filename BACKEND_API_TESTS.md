# Backend API Test Documentation

## ✅ Server Status
- **Base URL**: `http://localhost:5000/api`
- **Status**: Running ✓
- **Database**: Connected ✓
- **Active Modules**: 9 modules loaded

---

## 🔐 Authentication Flow

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/modules/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teacher1",
    "email": "teacher1@example.com",
    "password": "password123",
    "full_name": "Teacher One",
    "role": "creator"
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "teacher1",
      "email": "teacher1@example.com",
      "full_name": "Teacher One",
      "role": "creator"
    },
    "token": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/modules/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "teacher1",
    "password": "password123"
  }'
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "username": "teacher1", "role": "creator" },
    "token": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

### 3. Get Profile
```bash
curl -X GET http://localhost:5000/api/modules/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:5000/api/modules/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 📋 Template Management

### 1. Create Template
```bash
curl -X POST http://localhost:5000/api/modules/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Course Feedback Survey",
    "description": "Template for course evaluation",
    "questions": [
      {
        "question_text": "Rate the course content",
        "question_type_id": 3,
        "is_required": true,
        "display_order": 1
      },
      {
        "question_text": "What did you like most?",
        "question_type_id": 4,
        "is_required": false,
        "display_order": 2
      }
    ]
  }'
```

### 2. Get All Templates
```bash
curl -X GET "http://localhost:5000/api/modules/templates?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Template by ID
```bash
curl -X GET http://localhost:5000/api/modules/templates/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Update Template
```bash
curl -X PUT http://localhost:5000/api/modules/templates/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Course Feedback Survey",
    "description": "Updated description"
  }'
```

### 5. Delete Template
```bash
curl -X DELETE http://localhost:5000/api/modules/templates/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Get Question Types
```bash
curl -X GET http://localhost:5000/api/modules/templates/question-types \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "questionTypes": [
      { "id": 1, "type_name": "multiple_choice", "description": "..." },
      { "id": 2, "type_name": "checkbox", "description": "..." },
      { "id": 3, "type_name": "likert_scale", "description": "..." },
      { "id": 4, "type_name": "open_ended", "description": "..." },
      { "id": 5, "type_name": "dropdown", "description": "..." }
    ]
  }
}
```

---

## 📝 Survey Management

### 1. Create Survey from Template
```bash
curl -X POST http://localhost:5000/api/modules/surveys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": 1,
    "title": "Fall 2024 Course Evaluation",
    "description": "Please provide feedback on your course experience",
    "start_date": "2024-12-01T00:00:00Z",
    "end_date": "2024-12-31T23:59:59Z",
    "target_audience": "all_users"
  }'
```

### 2. Get All Surveys
```bash
curl -X GET "http://localhost:5000/api/modules/surveys?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Survey by ID
```bash
curl -X GET http://localhost:5000/api/modules/surveys/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Update Survey
```bash
curl -X PUT http://localhost:5000/api/modules/surveys/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Survey Title",
    "end_date": "2025-01-15T23:59:59Z"
  }'
```

### 5. Publish Survey (draft → active)
```bash
curl -X POST http://localhost:5000/api/modules/surveys/1/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Survey published successfully",
  "data": {
    "survey": {
      "id": 1,
      "status": "active",
      "title": "Fall 2024 Course Evaluation"
    }
  }
}
```

### 6. Close Survey (active → closed)
```bash
curl -X POST http://localhost:5000/api/modules/surveys/1/close \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Update Survey Status
```bash
curl -X PATCH http://localhost:5000/api/modules/surveys/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "analyzed"
  }'
```

### 8. Get Survey Statistics
```bash
curl -X GET http://localhost:5000/api/modules/surveys/1/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Delete Survey
```bash
curl -X DELETE http://localhost:5000/api/modules/surveys/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔗 Collector Management (Public Links)

### 1. Create Collector for Survey
```bash
curl -X POST http://localhost:5000/api/modules/collectors/survey/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collector_type": "web_link",
    "name": "Main Survey Link",
    "allow_multiple_responses": false
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "message": "Collector created successfully",
  "data": {
    "id": 1,
    "type": "web_link",
    "name": "Main Survey Link",
    "token": "a7f8b9c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8",
    "url": "http://localhost:3000/collector/a7f8b9c1d2e3f4g5h6i7j8k9l0m1n2o3...",
    "is_active": true,
    "allow_multiple_responses": false
  }
}
```

### 2. Get Collectors for Survey
```bash
curl -X GET http://localhost:5000/api/modules/collectors/survey/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Collector by Token (Public - No Auth)
```bash
curl -X GET http://localhost:5000/api/modules/collectors/token/a7f8b9c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "collector": {
      "id": 1,
      "type": "web_link",
      "name": "Main Survey Link",
      "allow_multiple_responses": false
    },
    "survey": {
      "id": 1,
      "title": "Fall 2024 Course Evaluation",
      "description": "Please provide feedback...",
      "questions": [...]
    }
  }
}
```

### 4. Update Collector
```bash
curl -X PUT http://localhost:5000/api/modules/collectors/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Link Name",
    "is_active": false
  }'
```

### 5. Delete Collector
```bash
curl -X DELETE http://localhost:5000/api/modules/collectors/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Response Submission

### 1. Submit Response (Authenticated)
```bash
curl -X POST http://localhost:5000/api/modules/responses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "survey_id": 1,
    "answers": [
      {
        "question_id": 1,
        "numeric_answer": 5
      },
      {
        "question_id": 2,
        "answer_text": "The course was excellent and well-structured."
      }
    ]
  }'
```

### 2. Submit Public Response via Collector Token (No Auth)
```bash
curl -X POST http://localhost:5000/api/modules/responses/public/a7f8b9c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8 \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "answers": [
      {
        "question_id": 1,
        "numeric_answer": 4
      },
      {
        "question_id": 2,
        "answer_text": "Good course content"
      }
    ]
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "message": "Response submitted successfully",
  "data": {
    "response_id": 1,
    "survey_id": 1,
    "submitted_at": "2024-12-05T10:30:00.000Z"
  }
}
```

### 3. Get User's Own Responses
```bash
curl -X GET http://localhost:5000/api/modules/responses/my-responses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Response by ID
```bash
curl -X GET http://localhost:5000/api/modules/responses/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get All Responses for Survey (Creator Only)
```bash
curl -X GET "http://localhost:5000/api/modules/responses/survey/1?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Delete Response
```bash
curl -X DELETE http://localhost:5000/api/modules/responses/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📈 Analytics

### 1. Get Dashboard Statistics
```bash
curl -X GET http://localhost:5000/api/modules/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "total_surveys": 5,
    "active_surveys": 2,
    "draft_surveys": 1,
    "total_responses": 47
  }
}
```

### 2. Get Survey Summary
```bash
curl -X GET http://localhost:5000/api/modules/analytics/survey/1/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "survey_id": 1,
    "survey_title": "Fall 2024 Course Evaluation",
    "total_responses": 23,
    "unique_respondents": 23,
    "responses_by_date": [
      { "date": "2024-12-01", "count": 5 },
      { "date": "2024-12-02", "count": 8 }
    ],
    "survey_status": "active",
    "start_date": "2024-12-01T00:00:00.000Z",
    "end_date": "2024-12-31T23:59:59.000Z"
  }
}
```

### 3. Get Question-Level Analytics
```bash
curl -X GET http://localhost:5000/api/modules/analytics/survey/1/questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "survey_id": 1,
    "questions": [
      {
        "question_id": 1,
        "question_text": "Rate the course content",
        "question_type": "likert_scale",
        "total_answers": 23,
        "answer_distribution": [
          { "option_text": "5", "count": 12 },
          { "option_text": "4", "count": 8 },
          { "option_text": "3", "count": 3 }
        ]
      }
    ]
  }
}
```

### 4. Get Response Details with Pagination
```bash
curl -X GET "http://localhost:5000/api/modules/analytics/survey/1/responses?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📥 Export

### 1. Get Export Metadata
```bash
curl -X GET http://localhost:5000/api/modules/export/survey/1/metadata \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "survey_id": 1,
    "survey_title": "Fall 2024 Course Evaluation",
    "response_count": 23,
    "export_formats": ["CSV", "JSON"],
    "can_export": true
  }
}
```

### 2. Export to CSV
```bash
curl -X GET http://localhost:5000/api/modules/export/survey/1/csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output survey_1_responses.csv
```

**Expected**: Downloads `survey_1_responses.csv` file

### 3. Export to JSON
```bash
curl -X GET http://localhost:5000/api/modules/export/survey/1/json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output survey_1_responses.json
```

**Expected**: Downloads `survey_1_responses.json` file

---

## 🤖 LLM Features

### 1. Generate Survey with AI
```bash
curl -X POST http://localhost:5000/api/modules/llm/generate-survey \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a survey about student satisfaction with online learning",
    "description": "Online Learning Feedback",
    "target_audience": "all_users"
  }'
```

**Note**: Requires OpenAI API key configuration

### 2. Analyze Survey Responses with AI
```bash
curl -X POST http://localhost:5000/api/modules/llm/analyze-responses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "survey_id": 1,
    "analysis_type": "sentiment"
  }'
```

**Analysis Types**: `sentiment`, `theme_extraction`, `summary`, `comparison`

### 3. Get All LLM Prompts
```bash
curl -X GET "http://localhost:5000/api/modules/llm/prompts?type=survey_generation" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Create LLM Prompt
```bash
curl -X POST http://localhost:5000/api/modules/llm/prompts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_name": "Course Feedback Generator",
    "prompt_type": "survey_generation",
    "prompt_text": "Create a comprehensive survey for {{course_name}} targeting {{student_level}} students"
  }'
```

### 5. Get Prompt by ID
```bash
curl -X GET http://localhost:5000/api/modules/llm/prompts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Update Prompt
```bash
curl -X PUT http://localhost:5000/api/modules/llm/prompts/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_name": "Updated Prompt Name",
    "prompt_text": "Updated prompt text"
  }'
```

### 7. Delete Prompt
```bash
curl -X DELETE http://localhost:5000/api/modules/llm/prompts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Get Analysis Results for Survey
```bash
curl -X GET http://localhost:5000/api/modules/llm/analysis/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 👥 User Management (Admin)

### 1. Get All Users
```bash
curl -X GET "http://localhost:5000/api/modules/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get User by ID
```bash
curl -X GET http://localhost:5000/api/modules/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Update User
```bash
curl -X PUT http://localhost:5000/api/modules/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name",
    "role": "admin"
  }'
```

### 4. Delete User (Admin Only)
```bash
curl -X DELETE http://localhost:5000/api/modules/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get All Teachers
```bash
curl -X GET http://localhost:5000/api/modules/users/role/teachers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Get All Students
```bash
curl -X GET http://localhost:5000/api/modules/users/role/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔒 RBAC Permissions Summary

| Endpoint | Public | User | Creator | Admin |
|----------|--------|------|---------|-------|
| Register/Login | ✓ | ✓ | ✓ | ✓ |
| View Templates | - | ✓ | ✓ | ✓ |
| Create Templates | - | - | ✓ | ✓ |
| Create Surveys | - | - | ✓ | ✓ |
| Submit Response | - | ✓ | ✓ | ✓ |
| Submit Public Response | ✓ | ✓ | ✓ | ✓ |
| View Own Responses | - | ✓ | ✓ | ✓ |
| View All Survey Responses | - | - | ✓ (own) | ✓ (all) |
| Export Survey Data | - | - | ✓ (own) | ✓ (all) |
| LLM Generate/Analyze | - | - | ✓ | ✓ |
| User Management | - | - | - | ✓ |

---

## ✅ Implementation Status

### Completed Features:
1. ✅ **AUTH-RBAC** - Complete registration, login, JWT refresh, RBAC middleware
2. ✅ **USERS** - Full CRUD with role-based access control
3. ✅ **TEMPLATES** - CRUD for templates, questions, options with relations
4. ✅ **SURVEYS** - Complete lifecycle management with status machine (draft→active→closed→analyzed)
5. ✅ **COLLECTORS** - Token-based public link generation with crypto
6. ✅ **RESPONSES** - Authenticated & anonymous submission with duplicate prevention
7. ✅ **ANALYTICS** - Dashboard stats, survey summary, question-level analytics with Sequelize aggregation
8. ✅ **EXPORT** - CSV and JSON export with proper escaping and streaming
9. ✅ **LLM** - Survey generation, response analysis, prompt management CRUD

### Active Routes:
- `/api/modules/auth` - 5 endpoints
- `/api/modules/users` - 6 endpoints
- `/api/modules/templates` - 7+ endpoints
- `/api/modules/surveys` - 9 endpoints
- `/api/modules/collectors` - 5 endpoints
- `/api/modules/responses` - 6 endpoints
- `/api/modules/analytics` - 4 endpoints
- `/api/modules/export` - 3 endpoints
- `/api/modules/llm` - 8 endpoints

### Total Endpoints: **53+ RESTful API endpoints**

---

## 🚀 Next Steps

1. **Frontend Integration**: Update frontend API calls to use `/api/modules/*` endpoints
2. **Database Migrations**: Run migrations for `survey_collectors` and `survey_responses` updates
3. **OpenAI Setup**: Configure `OPENAI_API_KEY` in `.env` to enable LLM features
4. **Testing**: Run through end-to-end user flows
5. **Cron Jobs**: Implement scheduler for auto-closing expired surveys

---

## 📝 Notes

- All endpoints return consistent JSON format: `{ success, message, data }`
- JWT tokens expire in 24h by default (configurable via `JWT_EXPIRES_IN`)
- LLM features gracefully disabled when OpenAI not configured
- Sequelize logging can be disabled in production by setting `logging: false` in database config
- CORS is configured - update `FRONTEND_URL` in `.env` for production

---

## 🔍 Error Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (no token or invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate entry)
- **500**: Internal Server Error
- **503**: Service Unavailable (LLM not configured)
