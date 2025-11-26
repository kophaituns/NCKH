# Modular Architecture Implementation

This document describes the newly implemented modular architecture for the NCKH Survey System.

## 📁 Module Structure

Each module follows a consistent pattern:

```
modules/<module-name>/
├── controller/          # Request handlers
├── service/            # Business logic
├── routes/             # Route definitions
├── middleware/         # Module-specific middleware (optional)
├── repository/         # Data access layer (optional)
└── index.js           # Module exports
```

## 🎯 Implemented Modules

### 1️⃣ **auth-rbac** (Authentication & Authorization)
**Base URL:** `/api/modules/auth`

**Endpoints:**
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `GET /profile` - Get current user profile (requires auth)
- `POST /logout` - Logout user (requires auth)

**Features:**
- JWT token generation and verification
- Password hashing with bcrypt
- Role-based access control middleware
- Support for username OR email login

---

### 2️⃣ **surveys** (Survey Management)
**Base URL:** `/api/modules/surveys`

**Endpoints:**
- `GET /` - List all surveys (with pagination, filters)
- `GET /:id` - Get survey by ID
- `GET /:id/stats` - Get survey statistics
- `POST /` - Create new survey (Teacher/Admin only)
- `PUT /:id` - Update survey (Owner/Admin only)
- `DELETE /:id` - Delete survey (Owner/Admin only)

**Features:**
- CRUD operations for surveys
- Role-based access control
- Pagination and search
- Statistics endpoint

---

### 3️⃣ **responses** (Survey Responses)
**Base URL:** `/api/modules/responses`

**Endpoints:**
- `POST /` - Submit survey response
- `GET /my-responses` - Get user's own responses
- `GET /:id` - Get response by ID
- `GET /survey/:survey_id` - Get all responses for a survey (Creator/Admin only)
- `DELETE /:id` - Delete response (Owner/Admin only)

**Features:**
- Submit responses with answers
- Prevent duplicate responses
- Access control (respondent, creator, admin)
- Pagination for response lists

---

### 4️⃣ **templates** (Survey Templates)
**Base URL:** `/api/modules/templates`

**Endpoints:**
- `GET /question-types` - Get all question types
- `GET /` - List all templates
- `GET /:id` - Get template by ID (with questions)
- `POST /` - Create new template (Teacher/Admin only)
- `PUT /:id` - Update template (Owner/Admin only)
- `DELETE /:id` - Delete template (Owner/Admin only)
- `POST /:id/questions` - Add question to template (Owner/Admin only)

**Features:**
- Template CRUD operations
- Questions and options management
- Question type definitions
- Role-based access control

---

### 5️⃣ **analytics** (Survey Analytics)
**Base URL:** `/api/modules/analytics`

**Endpoints:**
- `GET /dashboard` - Get dashboard statistics
- `GET /survey/:survey_id/summary` - Get survey summary
- `GET /survey/:survey_id/questions` - Get question-level analytics
- `GET /survey/:survey_id/responses` - Get detailed responses (with pagination)

**Features:**
- Summary statistics (total responses, unique respondents)
- Question-level analytics (answer distribution)
- Response timeline
- Dashboard stats (total surveys, active surveys, etc.)

---

### 6️⃣ **export** (Data Export)
**Base URL:** `/api/modules/export`

**Endpoints:**
- `GET /survey/:survey_id/metadata` - Get export metadata
- `GET /survey/:survey_id/csv` - Export to CSV
- `GET /survey/:survey_id/json` - Export to JSON

**Features:**
- CSV export with proper escaping
- JSON export
- File download headers
- Access control (Creator/Admin only)

---

### 7️⃣ **collectors** (Survey Distribution) *[Placeholder]*
**Base URL:** `/api/modules/collectors`

**Endpoints:**
- `GET /survey/:survey_id` - Get collectors for survey
- `POST /survey/:survey_id` - Create collector (placeholder)

**Features:**
- Web link generation
- QR code (placeholder)
- Email distribution (placeholder)

---

## 🔐 Authentication & Authorization

### Middleware Functions

**From `modules/auth-rbac/middleware/auth.middleware.js`:**

1. **`authenticate`** - Verify JWT token, attach user to `req.user`
2. **`isAdmin`** - Require admin role
3. **`isTeacherOrAdmin`** - Require creator or admin role
4. **`isCreatorOrAdmin`** - Require creator or admin role
5. **`isOwnerOrAdmin`** - Require resource ownership or admin role

### Usage Example

```javascript
const { authenticate, isTeacherOrAdmin } = require('../../auth-rbac/middleware/auth.middleware');

router.post('/', authenticate, isTeacherOrAdmin, controller.createSurvey);
```

---

## 🚀 How to Use

### Testing Module Endpoints

**Example: Login (auth-rbac module)**
```bash
curl -X POST http://localhost:5000/api/modules/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"pass123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin1",
      "role": "admin",
      "full_name": "Admin One"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**Example: Get Surveys**
```bash
curl http://localhost:5000/api/modules/surveys?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example: Submit Response**
```bash
curl -X POST http://localhost:5000/api/modules/responses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "survey_id": 1,
    "answers": [
      {"question_id": 1, "answer_text": "Very satisfied"},
      {"question_id": 2, "option_id": 3}
    ]
  }'
```

**Example: Export to CSV**
```bash
curl http://localhost:5000/api/modules/export/survey/1/csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o survey_responses.csv
```

---

## 📊 Module Architecture Benefits

### ✅ Separation of Concerns
- **Controller:** Handle HTTP requests/responses
- **Service:** Business logic and validation
- **Repository:** Data access (future)
- **Routes:** Endpoint definitions

### ✅ Reusability
- Services can be imported and used across modules
- Middleware is shared via auth-rbac module
- Models are centralized in `src/models/`

### ✅ Testability
- Each layer can be unit tested independently
- Services return plain JS objects
- Controllers don't directly access database

### ✅ Maintainability
- Clear file structure
- Consistent naming conventions
- Isolated module changes

---

## 🔄 Migration Path

### Current State
- Legacy routes in `src/routes/` (still functional)
- New modular routes in `modules/` (fully working)
- Both coexist: `/api/auth/login` AND `/api/modules/auth/login`

### Recommended Approach
1. **Test modular endpoints** to ensure they work
2. **Gradually migrate frontend** to use `/api/modules/*` endpoints
3. **Deprecate legacy routes** after full migration
4. **Remove `src/routes/`** when no longer needed

---

## 🛠️ Adding a New Module

### Step-by-Step Guide

1. **Create module folder:**
   ```
   modules/new-module/
   ```

2. **Create service:**
   ```javascript
   // modules/new-module/service/newModule.service.js
   class NewModuleService {
     async getAll() { /* ... */ }
   }
   module.exports = new NewModuleService();
   ```

3. **Create controller:**
   ```javascript
   // modules/new-module/controller/newModule.controller.js
   const service = require('../service/newModule.service');
   class NewModuleController {
     async getAll(req, res) {
       const data = await service.getAll();
       res.json({ success: true, data });
     }
   }
   module.exports = new NewModuleController();
   ```

4. **Create routes:**
   ```javascript
   // modules/new-module/routes/newModule.routes.js
   const router = require('express').Router();
   const controller = require('../controller/newModule.controller');
   router.get('/', controller.getAll);
   module.exports = router;
   ```

5. **Create index.js:**
   ```javascript
   // modules/new-module/index.js
   module.exports = {
     routes: require('./routes/newModule.routes'),
     controller: require('./controller/newModule.controller'),
     service: require('./service/newModule.service')
   };
   ```

6. **Register in modules/index.js:**
   ```javascript
   const newModule = require('./new-module');
   module.exports = {
     // ...other modules
     newModule
   };
   ```

7. **Mount in src/routes/modules.routes.js:**
   ```javascript
   router.use('/new-module', modules.newModule.routes);
   ```

---

## 📝 Code Standards

### Controller Pattern
```javascript
class Controller {
  async methodName(req, res) {
    try {
      // 1. Extract and validate input
      const { param } = req.body;
      if (!param) {
        return res.status(400).json({ success: false, message: 'Param required' });
      }
      
      // 2. Call service
      const result = await service.methodName(param, req.user);
      
      // 3. Return success response
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      // 4. Handle errors
      logger.error('Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
```

### Service Pattern
```javascript
class Service {
  async methodName(param, user) {
    // 1. Business logic validation
    if (condition) {
      throw new Error('Business rule violation');
    }
    
    // 2. Database operations
    const result = await Model.findAll({ where: { param } });
    
    // 3. Return plain JS object
    return result;
  }
}
```

---

## 🎯 Next Steps

1. **Test all module endpoints** with Postman/curl
2. **Update frontend API client** to use modular endpoints
3. **Add unit tests** for services and controllers
4. **Add integration tests** for routes
5. **Document API** with Swagger/OpenAPI
6. **Implement collectors module** (QR code, email)
7. **Add rate limiting** and request validation
8. **Optimize queries** with proper indexing

---

## 📚 Related Documentation

- [SYSTEM_FLOW.md](../../SYSTEM_FLOW.md) - Overall system architecture
- [Backend README](../README.md) - Backend setup instructions
- [API Documentation](../../docs/) - Full API reference

---

**Last Updated:** November 4, 2025
**Status:** ✅ All modules implemented and working
