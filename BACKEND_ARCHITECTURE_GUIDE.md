# Backend Clean Architecture Guide

## ✅ CURRENT CLEAN STRUCTURE

```
Backend/
├── src/
│   ├── modules/                    # 🎯 NEW MODULAR ARCHITECTURE
│   │   ├── auth-rbac/             # Authentication & Authorization
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── index.js
│   │   ├── surveys/               # Survey Management
│   │   ├── responses/             # Response Collection
│   │   ├── templates/             # Survey Templates
│   │   ├── analytics/             # Analytics & Reports
│   │   ├── export/                # Data Export
│   │   ├── collectors/            # Survey Collectors
│   │   └── index.js               # Central module loader
│   │
│   ├── routes/
│   │   └── modules.routes.js      # Modular routes aggregator
│   │
│   ├── config/                    # Configuration
│   ├── middleware/                # Global middleware
│   ├── models/                    # Sequelize models
│   ├── utils/                     # Utilities (logger, etc)
│   ├── app.js
│   ├── index.js                   # Main entry point
│   └── server.js
│
├── db/                            # Database
│   └── seeds/
├── migrations/
├── package.json
└── .env

❌ REMOVED:
- Backend/modules/ (old location)
- *.OLD.js files
- *.BACKUP.js files
- test-*.js files
```

## 📍 IMPORT PATH REFERENCE

### From Module Files (src/modules/*/):

**Models:**
```javascript
const { Survey, User } = require('../../models');
```

**Logger:**
```javascript
const logger = require('../../utils/logger');
```

**Config:**
```javascript
const sequelize = require('../../config/database');
```

**Auth Middleware (from other modules):**
```javascript
const { authenticate } = require('../../auth-rbac/middleware/auth.middleware');
```

### From Root Files (src/):

**Modules:**
```javascript
const modules = require('./modules');
```

**Models:**
```javascript
const { Survey } = require('./models');
```

## 🚀 API ENDPOINTS

### Modular Endpoints (New Clean Architecture)
Base: `/api/modules/`

**Auth:**
- `POST /api/modules/auth/register`
- `POST /api/modules/auth/login`
- `GET /api/modules/auth/me`
- `POST /api/modules/auth/refresh-token`

**Surveys:**
- `GET /api/modules/surveys` - List all surveys
- `POST /api/modules/surveys` - Create survey
- `GET /api/modules/surveys/:id` - Get survey details
- `PUT /api/modules/surveys/:id` - Update survey
- `DELETE /api/modules/surveys/:id` - Delete survey
- `POST /api/modules/surveys/:id/publish` - Publish survey
- `POST /api/modules/surveys/:id/close` - Close survey

**Responses:**
- `GET /api/modules/responses` - List responses
- `POST /api/modules/responses` - Submit response
- `GET /api/modules/responses/:id` - Get response details
- `PUT /api/modules/responses/:id` - Update response
- `DELETE /api/modules/responses/:id` - Delete response

**Templates:**
- `GET /api/modules/templates` - List templates
- `POST /api/modules/templates` - Create template
- `GET /api/modules/templates/:id` - Get template
- `PUT /api/modules/templates/:id` - Update template
- `DELETE /api/modules/templates/:id` - Delete template

**Analytics:**
- `GET /api/modules/analytics/:surveyId/summary` - Survey summary
- `GET /api/modules/analytics/:surveyId/responses` - Response stats
- `GET /api/modules/analytics/:surveyId/questions/:questionId` - Question analysis

**Export:**
- `GET /api/modules/export/:surveyId/csv` - Export to CSV
- `GET /api/modules/export/:surveyId/json` - Export to JSON

**Collectors:**
- `GET /api/modules/collectors/survey/:surveyId` - List collectors
- `POST /api/modules/collectors` - Create collector
- `GET /api/modules/collectors/:id` - Get collector
- `PUT /api/modules/collectors/:id` - Update collector
- `DELETE /api/modules/collectors/:id` - Delete collector

### Legacy Endpoints (Backward Compatible)
Base: `/api/`

- `/api/auth/*`
- `/api/surveys/*`
- `/api/responses/*`
- `/api/analysis/*`
- `/api/users/*`

## 🔧 COMMON TASKS

### Adding a New Module

1. **Create directory structure:**
```bash
mkdir -p src/modules/YOUR_MODULE/controller
mkdir -p src/modules/YOUR_MODULE/service
mkdir -p src/modules/YOUR_MODULE/routes
```

2. **Create service** (`service/your.service.js`):
```javascript
// src/modules/YOUR_MODULE/service/your.service.js
const { YourModel } = require('../../models');

class YourService {
  async getAll() {
    return await YourModel.findAll();
  }
}

module.exports = new YourService();
```

3. **Create controller** (`controller/your.controller.js`):
```javascript
// src/modules/YOUR_MODULE/controller/your.controller.js
const yourService = require('../service/your.service');
const logger = require('../../utils/logger');

class YourController {
  async getAll(req, res) {
    try {
      const items = await yourService.getAll();
      res.json(items);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new YourController();
```

4. **Create routes** (`routes/your.routes.js`):
```javascript
// src/modules/YOUR_MODULE/routes/your.routes.js
const express = require('express');
const router = express.Router();
const yourController = require('../controller/your.controller');
const { authenticate } = require('../../auth-rbac/middleware/auth.middleware');

router.get('/', authenticate, yourController.getAll);

module.exports = router;
```

5. **Create module index** (`index.js`):
```javascript
// src/modules/YOUR_MODULE/index.js
const routes = require('./routes/your.routes');
const controller = require('./controller/your.controller');
const service = require('./service/your.service');

module.exports = {
  routes,
  controller,
  service
};
```

6. **Register in central loader** (`src/modules/index.js`):
```javascript
const yourModule = require('./YOUR_MODULE');

module.exports = {
  // ...existing modules,
  yourModule
};
```

7. **Mount routes** (`src/routes/modules.routes.js`):
```javascript
router.use('/your-module', modules.yourModule.routes);
```

## 🧪 TESTING

### Start Server:
```bash
cd Backend
npm start
```

### Test Modular Endpoints:
```bash
# Login
curl -X POST http://localhost:5000/api/modules/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123"}'

# Get Surveys
curl http://localhost:5000/api/modules/surveys \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Legacy Endpoints:
```bash
# Legacy login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123"}'
```

## 📦 DEPENDENCIES

All modules use:
- **Express** - Web framework
- **Sequelize** - ORM
- **Winston** - Logging
- **JWT** - Authentication (auth-rbac module)

## 🔐 AUTHENTICATION

All protected routes use the auth middleware:

```javascript
const { authenticate, authorize } = require('../../auth-rbac/middleware/auth.middleware');

// Require authentication only
router.get('/protected', authenticate, controller.method);

// Require admin role
router.delete('/:id', authenticate, authorize('admin'), controller.delete);
```

## 🎯 BEST PRACTICES

1. **Always use relative imports from module files:**
   - Models: `require('../../models')`
   - Utils: `require('../../utils/logger')`
   - Other modules: `require('../../auth-rbac/middleware/...')`

2. **Service layer handles business logic**
   - All database queries
   - Data validation
   - Business rules

3. **Controller layer handles HTTP**
   - Request/response
   - Status codes
   - Error formatting

4. **Routes layer defines endpoints**
   - HTTP methods
   - Middleware
   - Route parameters

5. **Always export via module index.js**
   - Centralized exports
   - Clean imports

---

**Quick Start:** `cd Backend && npm start`
**Documentation:** See individual module README.md files
**API Tests:** See CURL_TESTS.md in each module
