# Architecture Overview

## System Architecture

### Tech Stack
- **Frontend**: React 18.2.0 + React Router + SCSS Modules + Axios
- **Backend**: Node.js + Express.js + Sequelize ORM
- **Database**: MySQL 8.0 (port 3306 local, 3307 Docker)
- **Auth**: JWT (access + refresh tokens)
- **Build**: Webpack 5 (via react-app-rewired)

---

## Directory Structure

```
NCKH/
├── Frontend/                   # React SPA
│   ├── src/
│   │   ├── api/
│   │   │   ├── http.js        # Axios instance with JWT interceptors
│   │   │   └── services/      # API service layer
│   │   │       ├── auth.service.js
│   │   │       ├── template.service.js
│   │   │       ├── survey.service.js
│   │   │       ├── response.service.js
│   │   │       ├── collector.service.js
│   │   │       ├── analytics.service.js
│   │   │       └── export.service.js
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── contexts/          # React contexts (Auth, Toast)
│   │   ├── styles/            # Global styles + SCSS modules
│   │   └── utils/             # Utilities (questionTypes.js)
│   └── package.json
│
├── Backend/                    # Express API server
│   ├── src/
│   │   ├── app.js             # Express app config (middleware, CORS, routes)
│   │   ├── server.js          # Server entry point (starts on PORT 5000)
│   │   ├── config/
│   │   │   └── database.js    # Sequelize config (reads DB_HOST/DB_PORT/DB_NAME)
│   │   ├── models/            # Sequelize models + associations
│   │   │   ├── index.js       # Model loader + associations
│   │   │   ├── User.js
│   │   │   ├── Template.js
│   │   │   ├── Question.js
│   │   │   ├── QuestionOption.js
│   │   │   ├── Survey.js
│   │   │   ├── Response.js
│   │   │   ├── Answer.js
│   │   │   └── SurveyCollector.js
│   │   ├── middleware/
│   │   │   ├── auth.js        # authenticate() - JWT verification
│   │   │   └── rbac.js        # isCreatorOrAdmin(), hasRoles()
│   │   ├── routes/
│   │   │   └── modules.routes.js  # Mounts all module routes at /api/modules
│   │   └── utils/
│   │       └── logger.js      # Winston logger
│   ├── modules/               # Modular architecture (feature-based)
│   │   ├── index.js           # Exports all modules
│   │   ├── health/
│   │   │   └── routes/health.routes.js
│   │   ├── auth-rbac/
│   │   │   ├── controller/auth.controller.js
│   │   │   ├── service/auth.service.js
│   │   │   ├── routes/auth.routes.js
│   │   │   └── middleware/    # authenticate, rbac
│   │   ├── users/
│   │   ├── templates/
│   │   │   ├── controller/template.controller.js
│   │   │   ├── service/template.service.js
│   │   │   └── routes/template.routes.js
│   │   ├── surveys/
│   │   ├── responses/
│   │   │   ├── controller/
│   │   │   │   ├── response.controller.js
│   │   │   │   └── public-responses.controller.js
│   │   │   ├── service/
│   │   │   │   ├── response.service.js
│   │   │   │   └── public-responses.service.js
│   │   │   └── routes/
│   │   │       ├── response.routes.js
│   │   │       └── public-responses.routes.js
│   │   ├── collectors/
│   │   ├── analytics/
│   │   └── export/
│   ├── scripts/               # Database scripts
│   │   ├── seed-demo-data.js
│   │   ├── check-users.js
│   │   └── verify-db.js
│   └── package.json
│
├── Docker/
│   ├── docker-compose.yml     # MySQL service (port 3307:3306)
│   └── init.sql               # Database initialization
│
└── docs/
    ├── DATABASE_SCHEMA.md
    └── DATABASE_DESIGN.md
```

---

## Base URL Configuration

### Frontend API Client
**File**: `Frontend/src/api/http.js:5`
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/modules';
```

- **Environment Variable**: `REACT_APP_API_URL`
- **Default**: `http://localhost:5000/api/modules`
- All API calls are prefixed with `/api/modules`

### Backend Route Mounting
**File**: `Backend/src/app.js:43`
```javascript
const moduleRoutes = require('./routes/modules.routes');
app.use('/api/modules', moduleRoutes);
```

**File**: `Backend/src/routes/modules.routes.js:6-17`
```javascript
router.use('/health', modules.health.routes);
router.use('/auth', modules.authRbac.routes);
router.use('/users', modules.users.routes);
router.use('/surveys', modules.surveys.routes);
router.use('/responses', modules.responses.routes);
router.use('/templates', modules.templates.routes);
router.use('/analytics', modules.analytics.routes);
router.use('/export', modules.export.routes);
router.use('/collectors', modules.collectors.routes);
```

**Result**: All module routes are accessible at:
- `/api/modules/health/*`
- `/api/modules/auth/*`
- `/api/modules/templates/*`
- `/api/modules/surveys/*`
- `/api/modules/responses/*`
- `/api/modules/collectors/*`
- etc.

---

## Database Configuration

### Environment Variables
**File**: `Backend/src/config/database.js:5-11`
```javascript
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'llm_survey_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};
```

### Connection Logging
**File**: `Backend/src/config/database.js:14-18`
```javascript
logger.info('Attempting MySQL connection...', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  username: dbConfig.username
});
```

### Port Configuration
- **Local MySQL**: Port `3306` (default)
- **Docker MySQL**: Port `3307` (mapped to container's 3306)
- **Current Backend**: Uses `DB_PORT` env var or defaults to `3306`
- **To use Docker**: Set `DB_PORT=3307` in `.env`

**Connection Test**:
```javascript
// Backend/src/config/database.js:47-63
sequelize.authenticate()
  .then(() => logger.info('✅ MySQL connection established successfully'))
  .catch((err) => {
    logger.error('❌ Unable to connect to MySQL database', {
      host: dbConfig.host,
      port: dbConfig.port,
      error: err.message
    });
  });
```

---

## CORS Configuration

### Allowed Origins
**File**: `Backend/src/app.js:16-20`
```javascript
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Authorization']
}));
```

**Environment Variables**:
- `CORS_ORIGIN`: Comma-separated list of allowed origins
- `FRONTEND_URL`: Fallback single origin (default: `http://localhost:3000`)

---

## Authentication Flow

### JWT Configuration
**File**: `Backend/modules/auth-rbac/service/auth.service.js:12-13`
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'unsafe-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
```

### Token Storage (Frontend)
**File**: `Frontend/src/api/services/auth.service.js:35-42`
```javascript
// On login success:
localStorage.setItem('token', token);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(user));
setAuthToken(token);
```

### Request Interceptor
**File**: `Frontend/src/api/http.js:16-27`
```javascript
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Token Refresh Flow
**File**: `Frontend/src/api/http.js:48-77`
```javascript
// On 401 response:
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
  
  localStorage.setItem('token', newToken);
  if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
  
  // Retry original request with new token
  originalRequest.headers.Authorization = `Bearer ${newToken}`;
  return http(originalRequest);
}
```

---

## Error Handling

### Global Error Handler
**File**: `Backend/src/app.js:73-89`
```javascript
app.use((err, req, res, next) => {
  console.error('[API ERROR]', err);
  logger.error(err.stack);
  
  const status = err.status || err.statusCode || 500;
  const payload = {
    success: false,
    ok: false,
    error: true,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  
  res.status(status).json(payload);
});
```

### Error Response Shape
```json
{
  "success": false,
  "ok": false,
  "error": true,
  "code": "TEMPLATE_IN_USE",
  "message": "This template is used by existing surveys",
  "stack": "Error: ...\n  at ..." // Only in development
}
```

### Known Error Translations
**File**: `Backend/modules/templates/controller/template.controller.js:186-194`
```javascript
// FK constraint → TEMPLATE_IN_USE
if (error.name === 'SequelizeForeignKeyConstraintError') {
  return res.status(400).json({
    success: false,
    ok: false,
    code: 'TEMPLATE_IN_USE',
    message: 'This template is used by existing surveys or responses and cannot be deleted.'
  });
}
```

---

## Logging

### Logger Configuration
**File**: `Backend/src/utils/logger.js`
- Uses Winston logger
- Logs to console with colorized output
- Log levels: error, warn, info, debug

### Usage Examples
```javascript
logger.info('Server started', { port: 5000 });
logger.error('Database connection failed', { host, port, error: err.message });
logger.warn('Using default JWT_SECRET');
logger.debug('SQL: SELECT * FROM users');
```

---

## Server Startup

### Entry Point
**File**: `Backend/src/server.js:1-92`

**Environment Validation** (lines 7-36):
```javascript
const requiredEnvVars = {
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: '',
  DB_NAME: 'allmtags_survey_db',
  JWT_SECRET: 'unsafe-dev-secret-please-change-in-production',
  PORT: '5000',
  FRONTEND_URL: 'http://localhost:3000',
  NODE_ENV: 'development'
};

// Sets defaults for missing vars, exits if critical vars missing in production
```

**Startup Sequence** (lines 40-92):
1. Start Express server on `process.env.PORT` (default 5000)
2. Test database connection with `sequelize.authenticate()`
3. Log connection details (host, port, database)
4. Sync models (if `FORCE_SYNC=true`)
5. Listen for termination signals (SIGTERM, SIGINT)

**Startup Log Output**:
```
🚀 Server running on port 5000
📍 Environment: development
Attempting MySQL connection...
  host: 127.0.0.1
  port: 3306
  database: llm_survey_db
  username: root
✅ MySQL connection established successfully
✅ Database connection established successfully.
💡 DB Info: { host: '127.0.0.1', port: 3306, database: 'llm_survey_db' }
```

---

## Middleware Stack

### Order of Execution
**File**: `Backend/src/app.js:11-42`

1. `helmet()` - Security headers
2. `cors()` - CORS with credentials
3. `express.json()` - Parse JSON bodies
4. `express.urlencoded()` - Parse URL-encoded bodies
5. `morgan('dev')` - HTTP request logging
6. **Route handlers** (`/api/modules/*`)
7. **Error handler** (4-param middleware)
8. **404 handler** (catch-all)

### Authentication Middleware
**File**: `Backend/modules/auth-rbac/middleware/auth.js:8-40`
```javascript
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    
    req.user = user; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
```

### RBAC Middleware
**File**: `Backend/modules/auth-rbac/middleware/rbac.js:8-17`
```javascript
function isCreatorOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  
  const role = req.user.role;
  if (role === 'admin' || role === 'creator') {
    return next();
  }
  
  return res.status(403).json({ success: false, message: 'Access denied. Creator or Admin role required.' });
}
```

---

## Scripts & Utilities

### Database Scripts
**Location**: `Backend/scripts/`

1. **seed-demo-data.js**: Creates demo users (admin, creator, student)
2. **check-users.js**: Lists all users with roles
3. **verify-db.js**: Verifies database structure and counts
4. **check-schema.js**: Displays table schemas
5. **fix-all-passwords.js**: Resets passwords for demo accounts

### Health Check Scripts
**Location**: Root directory

- `check-health.ps1`: PowerShell script to hit `/api/modules/health`
- Tests backend and database connectivity

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                      │
│                    (React SPA - Port 3000)              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ Axios requests
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Backend API                    │
│                      (Port 5000)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/modules/*  (Module Router)                 │  │
│  │  - JWT Authentication                            │  │
│  │  - RBAC Authorization                            │  │
│  │  - Request/Response Logging                      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Sequelize ORM
                         │ MySQL Driver
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    MySQL Database                        │
│                (Port 3306/3307)                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tables: Users, Templates, Questions,            │  │
│  │          Surveys, Responses, Answers             │  │
│  │  Relations: FK constraints + Sequelize assoc.    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Security Features

1. **Helmet.js**: Security headers (XSS, CSP, etc.)
2. **CORS**: Restricts cross-origin requests to allowed origins
3. **JWT**: Stateless authentication with refresh tokens
4. **RBAC**: Role-based access control (admin, creator, student)
5. **Password Hashing**: bcrypt with salt rounds (in auth.service.js)
6. **SQL Injection Prevention**: Sequelize parameterized queries
7. **Request Body Limiting**: Express body-parser limits

---

## Key Design Patterns

1. **Modular Architecture**: Feature-based modules (auth, templates, surveys, etc.)
2. **Service Layer Pattern**: Controllers → Services → Models
3. **Repository Pattern**: Services interact with Sequelize models
4. **Middleware Composition**: Layered authentication & authorization
5. **Error Normalization**: Consistent error response shape
6. **Token Refresh Strategy**: Automatic token refresh on 401 responses
7. **Centralized Configuration**: Environment-based config loading

---

## Performance Considerations

1. **Connection Pooling**: Sequelize pool (max: 10, idle: 10s)
2. **Query Optimization**: Eager loading with `include` for relations
3. **Index Usage**: Primary keys, foreign keys indexed
4. **Request Timeout**: 30s timeout on axios client
5. **Database Timeout**: 60s connection timeout
6. **Response Normalization**: Minimal data transformation overhead

---

## Development vs Production

### Development Mode
- Stack traces exposed in error responses
- SQL query logging enabled
- Default values for missing env vars
- Detailed console logging

### Production Mode
- No stack traces in errors
- SQL logging disabled
- Required env vars enforced (JWT_SECRET, DB_PASSWORD)
- Log levels adjusted (info, warn, error only)

---

*This architecture follows a clean separation of concerns with clear boundaries between layers.*
