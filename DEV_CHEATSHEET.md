# Developer Cheatsheet – NCKH LLM Survey System

**Last Updated:** November 13, 2025

Quick reference for running, testing, and debugging the system.

---

## Quick Start Commands

### Start Both Servers (Recommended)

**PowerShell/Bash (from root `d:\NCKH`):**

```bash
# Terminal 1: Backend
cd Backend
npm install
npm run dev
# Runs on: http://localhost:5000

# Terminal 2: Frontend
cd Frontend
npm install
npm start
# Runs on: http://localhost:3000
```

**Or use provided script:**
```bash
./start-both-servers.ps1   # PowerShell
```

### Setup Database (Docker)

```bash
cd Docker
docker-compose up -d

# Verify:
# MySQL: localhost:3307 (external), 3306 (internal)
# User: llm_survey_user / password123
# Database: llm_survey_db

# Or use local MySQL (port 3306):
# Update Backend/.env:
#   DB_HOST=localhost
#   DB_PORT=3306
```

### Seed Demo Data

```bash
cd Backend
npm run seed
# Creates demo users: admin_demo, creator_demo, user_demo (password: Demo@1234)
# Creates sample templates, surveys, and collectors
```

### Run Tests

```bash
cd Backend
npm run test

cd Frontend
npm test
```

---

## Environment Configuration

### Backend `.env`

**File:** `Backend/.env.example`

```bash
# Server
NODE_ENV=development
PORT=5000

# Database (Docker)
DB_HOST=localhost    # or mysql (in docker network)
DB_PORT=3307         # 3306 for local MySQL
DB_USER=llm_survey_user
DB_PASSWORD=password123
DB_NAME=llm_survey_db

# Database (Local MySQL)
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=allmtags_survey_db

# JWT
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info

# OpenAI (optional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
```

### Frontend Environment

**File:** `Frontend/.env` (or `.env.local` for local override)

```bash
REACT_APP_API_URL=http://localhost:5000/api/modules
REACT_APP_NODE_ENV=development
```

---

## Grep Commands (Find Code Fast)

### Find Route Definition

```bash
# Find all routes in a module
grep -r "router\." Backend/modules/templates/routes/

# Find specific endpoint
grep -r "'/questions'" Backend/modules/

# Find all authenticated routes
grep -r "authenticate" Backend/modules/*/routes/
```

### Find Service Methods

```bash
# Find submitResponse implementation
grep -n "submitResponse" Backend/modules/responses/service/response.service.js

# Find all methods in template service
grep -n "async " Backend/modules/templates/service/template.service.js

# Find model field definitions
grep -n "type: DataTypes" Backend/src/models/survey.model.js
```

### Find FK Constraints

```bash
# Find all foreign keys
grep -r "foreignKey" Backend/src/models/

# Find delete protection
grep -r "TEMPLATE_IN_USE\|in use" Backend/modules/
```

### Find API Calls from Frontend

```bash
# Find all http.get/post calls
grep -r "http\.\(get\|post\|put\|delete\)" Frontend/src/api/services/

# Find all ResponseService calls
grep -r "ResponseService\." Frontend/src/pages/
```

### Find Error Handlers

```bash
# Find all error handlers in controllers
grep -n "catch.*error\|error.*message" Backend/modules/auth-rbac/controller/

# Find status code returns
grep -n "res.status" Backend/modules/surveys/controller/survey.controller.js
```

### Find Middleware Usage

```bash
# Find all authenticate middleware calls
grep -r "authenticate" Backend/modules/*/routes/

# Find role checks
grep -r "isCreatorOrAdmin\|isAdmin" Backend/modules/*/routes/
```

---

## Database Inspection

### Query Users

```sql
SELECT id, username, email, role FROM users;
```

### Query Templates

```sql
SELECT id, title, created_by, is_archived FROM survey_templates;
```

### Query Surveys

```sql
SELECT id, template_id, title, status, created_by FROM surveys;
```

### Query Responses (with Answer Count)

```sql
SELECT 
  sr.id,
  sr.survey_id,
  sr.respondent_id,
  sr.status,
  COUNT(a.id) as answer_count,
  sr.created_at
FROM survey_responses sr
LEFT JOIN answers a ON sr.id = a.survey_response_id
GROUP BY sr.id
ORDER BY sr.created_at DESC
LIMIT 20;
```

### Query Collectors

```sql
SELECT 
  sc.id,
  sc.survey_id,
  sc.collector_type,
  sc.token,
  COUNT(sr.id) as response_count
FROM survey_collectors sc
LEFT JOIN survey_responses sr ON sc.id = sr.collector_id
GROUP BY sc.id;
```

### Check Foreign Key References

```sql
-- Check surveys referencing template 10
SELECT COUNT(*) FROM surveys WHERE template_id = 10;

-- Check answers for question 5
SELECT COUNT(*) FROM answers WHERE question_id = 5;

-- Check responses for survey 25
SELECT COUNT(*) FROM survey_responses WHERE survey_id = 25;
```

---

## Common Issues & Fixes

### Issue: "Invalid token" at login

**Cause:** JWT_SECRET mismatch between .env and stored token  
**Fix:**
```bash
# Backend
rm Backend/src/models/*.json  # Clear cache (if any)
npm run dev

# Verify token: JWT_SECRET length should be ≥ 32 chars
echo $JWT_SECRET | wc -c
```

### Issue: CORS error when calling API from Frontend

**Cause:** Frontend URL not in CORS_ORIGIN  
**Fix:**
```bash
# Backend/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Issue: "Template in use. Archive instead."

**Cause:** Trying to hard-delete template with surveys  
**Fix:**
```bash
# Use archive endpoint instead
PATCH /api/modules/templates/{id}/archive

# Or delete all surveys first:
DELETE /api/modules/surveys/{id}
```

### Issue: Responses have option_id = NULL but should have values

**Cause:** Text answer stored in text_answer, not option_id  
**Fix:** Check Answer record:
```sql
SELECT question_id, option_id, text_answer, numeric_answer FROM answers WHERE survey_response_id = 500;
```

### Issue: "Database connection failed" at startup

**Cause:** Wrong DB host/port/credentials  
**Fix:**
```bash
# Verify database is running
docker ps | grep mysql
# or
mysql -u root -p -h localhost

# Update Backend/.env and restart
npm run dev
```

---

## Debug Mode

### Enable Verbose Logging

```bash
# Backend
NODE_ENV=development LOG_LEVEL=debug npm run dev

# View logs:
tail -f Backend/logs/error.log
tail -f Backend/logs/combined.log
```

### Test Database Connection Directly

```bash
node << 'EOF'
require('dotenv').config();
const { sequelize, User } = require('./Backend/src/models');

sequelize.authenticate()
  .then(() => {
    console.log('✅ Connected to DB');
    return User.count();
  })
  .then(count => console.log(`📊 Total users: ${count}`))
  .catch(error => console.error('❌ Error:', error.message));
EOF
```

### View JWT Token Contents

```bash
node << 'EOF'
const token = process.argv[2];
const base64 = token.split('.')[1];
const decoded = Buffer.from(base64, 'base64').toString();
console.log(JSON.parse(decoded));
EOF

# Usage:
node << 'EOF'  eyJhbGc...
```

---

## Performance Tips

### 1. Optimize Queries

**Problem:** N+1 queries when fetching templates  
**Solution:** Use eager loading:
```javascript
const templates = await SurveyTemplate.findAll({
  include: [
    { model: Question, as: 'Questions' },  // Eager load
    { model: User }  // Join instead of separate query
  ]
});
```

### 2. Add Indexes

```sql
-- Response queries are slow?
ALTER TABLE survey_responses ADD INDEX idx_survey_id (survey_id);
ALTER TABLE survey_responses ADD INDEX idx_created_at (created_at);

-- Answer queries
ALTER TABLE answers ADD INDEX idx_survey_response_id (survey_response_id);
ALTER TABLE answers ADD INDEX idx_question_id (question_id);
```

### 3. Pagination Always

```javascript
// Bad: Load 100k responses
const responses = await SurveyResponse.findAll({ where: { survey_id } });

// Good: Paginate
const { count, rows } = await SurveyResponse.findAndCountAll({
  where: { survey_id },
  limit: 20,
  offset: 0
});
```

---

## Useful File Locations

| Task | File |
|------|------|
| **Add new endpoint** | `Backend/modules/{module}/routes/{module}.routes.js` |
| **Add service logic** | `Backend/modules/{module}/service/{module}.service.js` |
| **Add model** | `Backend/src/models/{model}.model.js` |
| **Update frontend UI** | `Frontend/src/pages/{Page}/index.jsx` |
| **Add API service** | `Frontend/src/api/services/{service}.service.js` |
| **Fix middleware issue** | `Backend/modules/auth-rbac/middleware/auth.middleware.js` |
| **Fix CORS issue** | `Backend/src/app.js` (line 13–24) |
| **Check routes** | `Backend/src/routes/modules.routes.js` |
| **View all models** | `Backend/src/models/index.js` |
| **Configure DB** | `Backend/src/config/database.js` |

---

## Git Workflow Cheatsheet

```bash
# Check status
git status

# See recent commits
git log --oneline -10

# Check current branch
git branch -v

# Stash unsaved changes
git stash

# View file history
git log -p Backend/modules/surveys/routes/survey.routes.js

# Compare with main
git diff main..HEAD
```

---

## Docker Commands

```bash
# Start MySQL
docker-compose -f Docker/docker-compose.yml up -d

# Stop MySQL
docker-compose -f Docker/docker-compose.yml down

# View MySQL logs
docker-compose -f Docker/docker-compose.yml logs mysql

# Connect to MySQL container
docker exec -it llm-survey-mysql mysql -u root -p

# Backup database
docker exec llm-survey-mysql mysqldump -u llm_survey_user -p llm_survey_db > backup.sql

# Restore database
docker exec -i llm-survey-mysql mysql -u llm_survey_user -p llm_survey_db < backup.sql
```

---

## Verification Checklist

Before deploying, verify:

- [ ] Backend runs: `npm run dev` (no errors)
- [ ] Frontend runs: `npm start` (no errors)
- [ ] Health check passes: `GET /api/modules/health` → 200 OK
- [ ] Can login with demo user: `POST /auth/login` → token returned
- [ ] Can create template: `POST /templates` → 201 Created
- [ ] Can create survey: `POST /surveys` → 201 Created
- [ ] Can publish survey: `PATCH /surveys/:id/status` → 200 OK
- [ ] Can create collector: `POST /collectors` → token generated
- [ ] Can submit public response: `POST /responses/public/:token` → 201 Created
- [ ] Can view results: `GET /analytics/survey/:id/summary` → 200 OK
- [ ] Database tables exist: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE();` → 14+ tables
- [ ] No TypeErrors in logs: `grep -i "error\|failed" Backend/logs/combined.log`

---

**End of Developer Cheatsheet**

### 1. Create New Survey End-to-End

```powershell
# Step 1: Login
$response = curl -X POST http://localhost:5000/api/modules/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"Admin@123"}' | ConvertFrom-Json
$token = $response.data.accessToken

# Step 2: Create template
$template = curl -X POST http://localhost:5000/api/modules/templates `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"title":"Test Survey","description":"Test","questions":[{"question_text":"Rate us?","question_type_id":3,"required":true}]}' | ConvertFrom-Json
$templateId = $template.data.id

# Step 3: Create survey
$survey = curl -X POST http://localhost:5000/api/modules/surveys `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{\"title\":\"Test Survey Instance\",\"template_id\":$templateId}" | ConvertFrom-Json
$surveyId = $survey.data.id

# Step 4: Activate survey
curl -X PATCH http://localhost:5000/api/modules/surveys/$surveyId/status `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"status":"active"}'

# Step 5: Create public link
$collector = curl -X POST http://localhost:5000/api/modules/collectors `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{\"survey_id\":$surveyId,\"collector_type\":\"public_link\",\"name\":\"Main Link\"}" | ConvertFrom-Json
$collectorToken = $collector.data.token

Write-Host "Public survey link: http://localhost:3000/public-survey/$collectorToken"
```

### 2. Test Public Response Flow

```powershell
# Step 1: Get survey by token (no auth)
$survey = curl -X GET http://localhost:5000/api/modules/responses/public/$collectorToken | ConvertFrom-Json

# Step 2: Submit response (no auth)
curl -X POST http://localhost:5000/api/modules/responses/public `
  -H "Content-Type: application/json" `
  -d "{\"collector_token\":\"$collectorToken\",\"answers\":[{\"question_id\":1,\"numeric_answer\":5}]}"

# Step 3: View results (with auth)
curl -X GET http://localhost:5000/api/modules/responses/survey/$surveyId `
  -H "Authorization: Bearer $token"
```

### 3. Debug Authentication Issues

```powershell
# Check user exists
mysql -u root -p -e "SELECT id, username, email, role FROM Users WHERE username='admin';" survey_system

# Test login
curl -X POST http://localhost:5000/api/modules/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"Admin@123"}' `
  -v

# Verify token
curl -X GET http://localhost:5000/api/modules/auth/profile `
  -H "Authorization: Bearer $token" `
  -v
```

---

## Troubleshooting

### Backend Won't Start

```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process using port 5000
$processId = (Get-NetTCPConnection -LocalPort 5000).OwningProcess
Stop-Process -Id $processId -Force

# Check environment variables
cd Backend
Get-Content .env

# Test database connection
node scripts/test-db-connection.js
```

### Frontend Won't Start

```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Clear React cache
cd Frontend
Remove-Item -Recurse -Force node_modules/.cache

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install
```

### Database Connection Failed

```powershell
# Check MySQL service
Get-Service -Name MySQL*

# Start MySQL service
Start-Service MySQL80  # Adjust service name

# Test connection
mysql -u root -p -h localhost -P 3306 -e "SELECT 1;"

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### CORS Errors

Check `Backend/src/app.js:16-20`:
```javascript
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  process.env.FRONTEND_URL || 'http://localhost:3000'
];
```

Verify `Backend/.env`:
```env
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### JWT Token Expired

```powershell
# Login again to get fresh token
curl -X POST http://localhost:5000/api/modules/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"Admin@123"}'

# Or use refresh token
curl -X POST http://localhost:5000/api/modules/auth/refresh `
  -H "Content-Type: application/json" `
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Template Delete Fails (TEMPLATE_IN_USE)

```sql
-- Check which surveys use this template
SELECT id, title, status FROM Surveys WHERE template_id = 1;

-- Option 1: Delete surveys first (if safe)
DELETE FROM Surveys WHERE template_id = 1 AND status = 'draft';

-- Option 2: Change survey template
UPDATE Surveys SET template_id = 2 WHERE template_id = 1;

-- Option 3: Archive instead of delete
-- Use PATCH /templates/:id/archive endpoint
```

---

## Quick Reference

### Question Type IDs
```
1 = multiple_choice
2 = checkbox
3 = likert_scale
4 = open_ended
5 = dropdown
```

### Survey Status Values
```
draft    → Initial state
active   → Accepting responses
paused   → Temporarily stopped
closed   → No longer accepting
```

### User Roles
```
admin    → Full system access
creator  → Create/manage surveys
student  → Response only
```

### HTTP Status Codes
```
200 OK                    → Success
201 Created               → Resource created
400 Bad Request           → Validation error
401 Unauthorized          → No/invalid token
403 Forbidden             → Insufficient permissions
404 Not Found             → Resource doesn't exist
409 Conflict              → TEMPLATE_IN_USE, duplicate, etc.
500 Internal Server Error → Server error
```

---

*For more details, see: ARCHITECTURE_OVERVIEW.md, REQUEST_FLOWS.md, API_SURFACE.md, DB_SCHEMA_MAP.md*
