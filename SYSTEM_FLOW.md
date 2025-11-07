# SYSTEM FLOW DOCUMENTATION

**Survey Management System - Monorepo Architecture**

Last Updated: November 3, 2025

---

## 1️⃣ SYSTEM OVERVIEW

### Architecture
This is a **full-stack monorepo** with a clear separation between frontend and backend:

```
┌──────────────┐         HTTP/REST API          ┌──────────────┐
│   FRONTEND   │ ◄────────────────────────────► │   BACKEND    │
│  React CRA   │    JSON (port 3000→5000)       │   Express    │
│  (Port 3000) │                                 │  (Port 5000) │
└──────────────┘                                 └──────┬───────┘
                                                        │
                                                        │ Sequelize ORM
                                                        ▼
                                                 ┌──────────────┐
                                                 │    MySQL     │
                                                 │  Database    │
                                                 └──────────────┘
```

### Monorepo Layout

```
d:\NCKH\
├── Backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── index.js           # Main entry point
│   │   ├── app.js             # Express app configuration
│   │   ├── config/            # Database & env config
│   │   ├── controllers/       # Route handlers (business logic)
│   │   ├── services/          # Business logic layer
│   │   ├── models/            # Sequelize ORM models
│   │   ├── middleware/        # Auth, RBAC, error handlers
│   │   ├── routes/            # API route definitions
│   │   └── utils/             # Helpers (logger, etc)
│   ├── modules/               # Feature modules (future modular structure)
│   │   ├── auth-rbac/
│   │   ├── surveys/
│   │   ├── collectors/
│   │   ├── responses/
│   │   ├── templates/
│   │   ├── analytics/
│   │   └── export/
│   ├── logs/                  # Server logs
│   ├── package.json
│   └── .env                   # Environment variables
│
├── Frontend/                   # React SPA
│   ├── src/
│   │   ├── index.jsx          # React entry point
│   │   ├── App.jsx            # Root component with routing
│   │   ├── routes/            # Route definitions
│   │   ├── pages/             # Page components (Login, Dashboard, etc)
│   │   ├── component/         # Reusable components
│   │   ├── contexts/          # React Context (Auth, etc)
│   │   ├── api/               # API client wrappers
│   │   ├── utils/             # Frontend helpers
│   │   ├── services/          # Token management, etc
│   │   └── styles/            # SCSS modules
│   ├── public/
│   ├── package.json
│   └── .env                   # Frontend env (API_URL)
│
├── Docker/                     # Docker setup
├── docs/                       # Documentation
├── start-servers.ps1          # PowerShell script to start both servers
├── stop-servers.ps1           # PowerShell script to stop servers
└── test-login.html            # Direct API test page (no React)
```

### Configuration & Environment Variables

**Backend (.env)**
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=NCKH
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development
```

**Frontend (.env)**
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

**Loading Sequence:**
1. Backend: `dotenv` loads `.env` at the top of `src/index.js`
2. Frontend: Create React App auto-loads `.env` and exposes `REACT_APP_*` vars

---

## 2️⃣ BACKEND FLOW

### HTTP Request Journey

```
Client Request
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  src/index.js  (Express app initialization)         │
│  • Loads dotenv, connects to MySQL                  │
│  • Sets up middleware: helmet, cors, morgan, json   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Middleware Stack                                    │
│  1. helmet() - Security headers                     │
│  2. cors() - CORS for frontend                      │
│  3. express.json() - Parse JSON body                │
│  4. morgan('dev') - HTTP logger                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Routes Mounting (src/index.js)                     │
│  • /api/auth → auth.routes.js                       │
│  • /api/surveys → survey.routes.js                  │
│  • /api/responses → response.routes.js              │
│  • /api/users → user.routes.js                      │
│  • /api/analysis → analysis.routes.js               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Route Handler (e.g., survey.routes.js)             │
│  • Applies route-specific middleware (authenticate) │
│  • Calls controller method                          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Controller (e.g., survey.controller.js)            │
│  • Extracts req.body, req.params, req.query         │
│  • Validates input                                  │
│  • Calls service layer                              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Service (e.g., survey.service.js)                  │
│  • Business logic (permissions, filtering)          │
│  • Calls repository or directly uses Sequelize      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Sequelize Model (e.g., Survey model)               │
│  • ORM query (findAll, create, update, destroy)     │
│  • Returns data to service                          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  MySQL Database                                      │
│  • Executes SQL query                               │
│  • Returns rows                                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
                Response flows back up:
                Service → Controller → Client (JSON)
```

---

### Key Modules Breakdown

#### Module: **auth-rbac** (Authentication & Role-Based Access Control)

**Files:**
- `src/routes/auth.routes.js` - Routes for login, register, refresh token
- `src/controllers/auth.controller.js` - Handles auth logic
- `src/middleware/auth.middleware.js` - JWT verification, role checks
- `src/models/user.model.js` - User Sequelize model

**Flow: User Login**
1. **Request:** `POST /api/auth/login` with `{username/email, password}`
2. **Route:** `auth.routes.js` → calls `authController.login`
3. **Controller:**
   - Validates input (username/email + password required)
   - Queries `User.findOne()` by username OR email
   - Compares password hash with `bcrypt.compare()`
   - If valid: generates JWT token with `jwt.sign()`
   - Returns: `{success, data: {user, token, refresh_token}}`
4. **Middleware:** For protected routes, `authenticate()` middleware:
   - Extracts token from `Authorization: Bearer <token>` header
   - Verifies token with `jwt.verify()`
   - Finds user by decoded ID
   - Attaches `req.user` for downstream use
5. **RBAC:** `isAdmin()`, `isTeacherOrAdmin()`, `isCreatorOrAdmin()` check `req.user.role`

---

#### Module: **surveys**

**Files:**
- `src/routes/survey.routes.js` - CRUD routes
- `src/controllers/survey.controller.js` - Survey business logic
- `src/services/survey.service.js` - Survey operations
- `src/models/survey.model.js` - Survey Sequelize model

**Flow: Get All Surveys**
1. **Request:** `GET /api/surveys?page=1&limit=10&status=active`
2. **Route:** `survey.routes.js` → applies `authenticate` middleware → calls `surveyController.getAllSurveys`
3. **Controller:**
   - Extracts query params: `page`, `limit`, `status`, `target_audience`
   - Calls `surveyService.getSurveys(options, req.user)`
4. **Service:**
   - Builds `where` clause for filtering
   - Checks user role: if not admin, filter by `created_by = user.id`
   - Calls `Survey.findAndCountAll()` with pagination, includes User as 'creator'
   - Returns: `{surveys: [...], pagination: {total, page, limit, totalPages}}`
5. **Controller:** Wraps in response: `{success: true, data: {...}}`
6. **Response:** JSON sent to frontend

**Flow: Create Survey**
1. **Request:** `POST /api/surveys` with `{template_id, title, description, start_date, end_date, ...}`
2. **Route:** `authenticate` + `isTeacherOrAdmin` middleware → `surveyController.createSurvey`
3. **Controller:** Validates required fields, calls `surveyService.createSurvey(data, req.user)`
4. **Service:**
   - Checks if template exists
   - Creates survey with `Survey.create({...data, created_by: user.id})`
   - Returns created survey object
5. **Response:** `{success: true, message: '...', data: {survey}}`

---

#### Module: **responses**

**Files:**
- `src/routes/response.routes.js`
- `src/controllers/response.controller.js`
- `src/models/surveyResponse.model.js`, `answer.model.js`

**Flow: Submit Response**
1. **Request:** `POST /api/responses` with `{survey_id, answers: [{question_id, answer_text, option_id}]}`
2. **Route:** `authenticate` → `responseController.submitResponse`
3. **Controller:**
   - Validates survey exists and is active
   - Creates `SurveyResponse` record
   - For each answer, creates `Answer` record linked to response
   - Returns: `{success: true, data: {response, answers}}`

**Flow: Get Responses by Survey**
1. **Request:** `GET /api/responses/survey/:survey_id`
2. **Middleware:** `authenticate` + `isCreatorOrAdmin` (only survey creator or admin can view)
3. **Controller:**
   - Verifies user owns survey or is admin
   - Queries `SurveyResponse.findAll({where: {survey_id}, include: [User, Answer]})`
   - Returns list of responses with respondent info

---

#### Module: **templates**

**Files:**
- Located in `Backend/modules/templates/` (modular structure, currently empty)
- Main files: `src/models/surveyTemplate.model.js`, `question.model.js`, `questionOption.model.js`

**Purpose:** Pre-defined survey templates with questions and options.

**Flow:** (if implemented)
- Teacher selects a template
- Frontend calls `GET /api/templates`
- Backend returns list of templates with questions
- Teacher customizes and creates a survey instance

---

#### Module: **analytics**

**Files:**
- `src/routes/analysis.routes.js`
- `src/controllers/analysis.controller.js`

**Purpose:** Generate analytics from survey responses (e.g., summary stats, visualizations).

**Flow:** (example)
1. **Request:** `GET /api/analysis/survey/:survey_id/summary`
2. **Controller:**
   - Aggregates responses using SQL or Sequelize
   - Calculates metrics (response count, average scores, distributions)
   - Returns: `{total_responses, avg_rating, question_distributions: [...]}`

---

#### Module: **export**

**Files:**
- Located in `Backend/modules/export/` (empty, future feature)

**Purpose:** Export survey data as CSV, Excel, or PDF.

---

#### Module: **collectors** (Survey Distribution)

**Files:**
- `Backend/modules/collectors/` (empty)

**Purpose:** Manage how surveys are distributed (e.g., email links, QR codes).

---

### Middleware Explanation

**1. `auth.middleware.js`**
- **`authenticate(req, res, next)`**: Verifies JWT token, attaches `req.user`
- **`isAdmin(req, res, next)`**: Checks if `req.user.role === 'admin'`
- **`isTeacherOrAdmin(req, res, next)`**: Checks if role is 'admin' or 'creator'
- **`isCreatorOrAdmin(req, res, next)`**: Similar, for survey creators

**2. Error Handler** (in `src/index.js`):
```javascript
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.statusCode || 500).json({error: true, message: err.message});
});
```

**3. Logger**: `src/utils/logger.js` uses `winston` to log to console and `logs/combined.log`

---

### MySQL Connection

**File:** `src/config/database.js`

- Creates Sequelize instance with env vars (`DB_HOST`, `DB_NAME`, etc.)
- Configures connection pool (max: 10, idle: 10s)
- Tests connection on startup: `sequelize.authenticate()`

**Models Initialization:** `src/models/index.js`
- Imports all models (User, Survey, SurveyResponse, Question, etc.)
- Defines associations (e.g., `User.hasMany(Survey)`, `Survey.belongsTo(User)`)
- Exports `{sequelize, User, Survey, ...}` for use in controllers/services

---

## 3️⃣ FRONTEND FLOW

### React App Entry

```
Browser loads index.html
     │
     ▼
public/index.html
     │ (loads <div id="root">)
     ▼
src/index.jsx
     │ ReactDOM.createRoot(root).render(<App />)
     ▼
src/App.jsx
     │ • Wraps in <AuthProvider> (global auth state)
     │ • Wraps in <ErrorBoundary> (catches errors)
     │ • Wraps in <Router> (React Router)
     │ • Renders <Routes>
     ▼
src/routes/index.jsx
     │ • Defines publicRoutes (/, /login, /register)
     │ • Defines privateRoutes (/dashboard, /surveys, etc)
     │ • Each route has component, layout, allowedRoles
     ▼
Renders Page Component (e.g., Dashboard, SurveysList)
     │
     ▼
Page calls API via src/api/ or src/utils/api.js
     │
     ▼
HTTP request to Backend → Response updates React state
```

---

### Folder Structure

**`/pages`**: Top-level page components (map to routes)
- `Landing/` - Home page
- `Auth/Login/`, `Auth/Register/` - Auth pages
- `Dashboard/` - User dashboard
- `Surveys/List/`, `Surveys/Create/`, `Surveys/Response/` - Survey management
- `Admin/ManageUsers/` - Admin panel
- `Analytics/` - Analytics dashboard

**`/component`**: Reusable UI components
- `Common/` - Shared components (LoginPage, SurveyManagement, etc)
- `Layout/DefaultLayout/` - App shell (sidebar, header)
- `Admin/`, `Teacher/`, `Student/` - Role-specific components
- `Table/` - Data table component

**`/contexts`**: React Context providers
- `AuthContext.jsx` - Manages auth state (user, token, login/logout functions)

**`/api`**: API client wrappers
- `http.js` - Axios instance with interceptors
- `services/auth.service.js`, `survey.service.js`, etc - API methods

**`/services`**: Frontend utilities
- `tokenService.js` - LocalStorage token management

**`/utils`**: Helpers
- `api.js` - Axios instance with auth token injection

---

### API Communication

**1. API Client Setup** (`src/utils/api.js`):
```javascript
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

// Request interceptor: Add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: Handle 401 (redirect to login)
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**2. Example API Call** (from a page):
```javascript
import api from '../../utils/api.js';

// In component
const [surveys, setSurveys] = useState([]);

useEffect(() => {
  const fetchSurveys = async () => {
    try {
      const response = await api.get('/surveys');
      setSurveys(response.data.surveys);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };
  fetchSurveys();
}, []);
```

---

### Token Handling & Route Guards

**Token Storage:** `tokenService.js` (LocalStorage)
- `saveTokens(accessToken, refreshToken)` - Store tokens
- `getStoredTokensSync()` - Retrieve tokens
- `clearTokens()` - Remove tokens on logout

**AuthContext** (`src/contexts/AuthContext.jsx`):
- **State:** `{user, token, isAuthenticated, isLoading, error}`
- **Actions:** `login(loginData)`, `logout()`, `register(...)`
- **Login Flow:**
  1. Dispatch `LOGIN_START`
  2. Fetch `POST /api/auth/login` with credentials
  3. On success: save tokens, dispatch `LOGIN_SUCCESS` with user data
  4. On error: dispatch `LOGIN_FAILURE`

**Protected Routes** (`src/component/Common/ProtectedRoute/`):
```javascript
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  
  return children;
}
```

---

### SCSS Organization

- **Global styles:** `src/styles/main.scss` (imported in `index.jsx`)
- **Component styles:** Each component has `.module.scss` file
  - Example: `LoginPage.module.scss`, `Dashboard.module.scss`
  - CSS Modules ensure scoped styles (no class name collisions)

---

## 4️⃣ DATA FLOW EXAMPLE

### End-to-End: User Creates Survey

**Step-by-Step Journey:**

#### 1. Frontend: User Navigates to "Create Survey" Page

**File:** `Frontend/src/pages/Surveys/Create/index.jsx`
- User fills out form: title, description, start/end dates, template selection
- Clicks "Create Survey" button

#### 2. Frontend: Form Submission

**Code:**
```javascript
const handleSubmit = async (formData) => {
  try {
    const response = await api.post('/surveys', {
      template_id: formData.template_id,
      title: formData.title,
      description: formData.description,
      start_date: formData.start_date,
      end_date: formData.end_date,
      target_audience: formData.target_audience
    });
    
    if (response.success) {
      navigate('/surveys'); // Redirect to surveys list
    }
  } catch (error) {
    console.error('Create survey failed:', error);
  }
};
```

**HTTP Request:**
```http
POST http://localhost:5000/api/surveys
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "template_id": 1,
  "title": "Course Feedback Survey",
  "description": "Evaluate the course quality",
  "start_date": "2025-11-10",
  "end_date": "2025-12-10",
  "target_audience": "all_users"
}
```

#### 3. Backend: Request Hits Route

**File:** `Backend/src/routes/survey.routes.js`
```javascript
router.post('/', authenticate, isTeacherOrAdmin, surveyController.createSurvey);
```

**Middleware Flow:**
1. **`authenticate`**: Verifies JWT, sets `req.user`
2. **`isTeacherOrAdmin`**: Checks if `req.user.role` is 'admin' or 'creator'
3. If pass → calls `surveyController.createSurvey(req, res)`

#### 4. Backend: Controller Handles Request

**File:** `Backend/src/controllers/survey.controller.js`
```javascript
exports.createSurvey = async (req, res) => {
  try {
    const { template_id, title, description, start_date, end_date, target_audience, target_value } = req.body;
    
    // Validate
    if (!template_id || !title) {
      return res.status(400).json({success: false, message: 'Template ID and title required'});
    }
    
    // Call service
    const survey = await surveyService.createSurvey({...data}, req.user);
    
    res.status(201).json({success: true, message: 'Survey created successfully', data: {survey}});
  } catch (error) {
    logger.error('Create survey error:', error);
    res.status(500).json({success: false, message: 'Error creating survey'});
  }
};
```

#### 5. Backend: Service Layer (Business Logic)

**File:** `Backend/src/services/survey.service.js`
```javascript
exports.createSurvey = async (surveyData, user) => {
  try {
    // Verify template exists
    const template = await SurveyTemplate.findByPk(surveyData.template_id);
    if (!template) throw new Error('Template not found');
    
    // Create survey
    const survey = await Survey.create({
      template_id: surveyData.template_id,
      title: surveyData.title,
      description: surveyData.description,
      start_date: surveyData.start_date,
      end_date: surveyData.end_date,
      target_audience: surveyData.target_audience,
      created_by: user.id,  // Link to creator
      status: 'draft'
    });
    
    return survey;
  } catch (error) {
    throw error;
  }
};
```

#### 6. Backend: Sequelize ORM → MySQL Query

**Generated SQL:**
```sql
INSERT INTO surveys (
  template_id, title, description, start_date, end_date,
  target_audience, created_by, status, created_at, updated_at
) VALUES (
  1, 'Course Feedback Survey', 'Evaluate the course quality',
  '2025-11-10', '2025-12-10', 'all_users', 13, 'draft', NOW(), NOW()
);
```

**Database:** Inserts row into `surveys` table, returns new record with auto-generated `id`

#### 7. Backend: Response Flows Back Up

**Service → Controller:**
```javascript
{
  id: 5,
  template_id: 1,
  title: 'Course Feedback Survey',
  description: 'Evaluate the course quality',
  start_date: '2025-11-10',
  end_date: '2025-12-10',
  target_audience: 'all_users',
  created_by: 13,
  status: 'draft',
  created_at: '2025-11-03T10:30:00.000Z',
  updated_at: '2025-11-03T10:30:00.000Z'
}
```

**Controller → HTTP Response:**
```json
{
  "success": true,
  "message": "Survey created successfully",
  "data": {
    "survey": {
      "id": 5,
      "title": "Course Feedback Survey",
      ...
    }
  }
}
```

#### 8. Frontend: Receives Response

**Code:**
```javascript
// In handleSubmit (continued)
if (response.success) {
  toast.success('Survey created!');
  navigate('/surveys'); // Redirect to list page
}
```

**React State Update:**
- Redirects to `/surveys` page
- Surveys list page fetches updated list via `GET /api/surveys`
- New survey appears in table

---

### Summary: Complete Round Trip

```
User fills form
    ↓
React state updated
    ↓
POST /api/surveys (with JWT token)
    ↓
Express routes → authenticate middleware → isTeacherOrAdmin middleware
    ↓
surveyController.createSurvey()
    ↓
surveyService.createSurvey() (business logic)
    ↓
Survey.create() (Sequelize ORM)
    ↓
MySQL INSERT INTO surveys
    ↓
Returns new survey record
    ↓
Service → Controller → HTTP JSON response
    ↓
Frontend receives success response
    ↓
React navigates to surveys list page
    ↓
Page fetches surveys via GET /api/surveys
    ↓
Renders updated list with new survey
```

---

## 5️⃣ DEPENDENCY GRAPH (TEXT)

### Backend Dependencies

#### Routes → Controllers → Services → Models

**Auth Flow:**
```
auth.routes.js
  → auth.controller.js
    → (no service layer, direct model access)
    → User model (user.model.js)
      → Sequelize → MySQL
```

**Survey Flow:**
```
survey.routes.js
  → middleware: authenticate, isTeacherOrAdmin (auth.middleware.js)
  → survey.controller.js
    → survey.service.js
      → Survey model (survey.model.js)
      → User model (for associations)
        → Sequelize → MySQL
```

**Response Flow:**
```
response.routes.js
  → middleware: authenticate, isCreatorOrAdmin
  → response.controller.js
    → (service layer not yet implemented)
    → SurveyResponse model (surveyResponse.model.js)
    → Answer model (answer.model.js)
      → Sequelize → MySQL
```

**Analysis Flow:**
```
analysis.routes.js
  → authenticate middleware
  → analysis.controller.js
    → (aggregates data from Survey, SurveyResponse, Answer models)
    → Sequelize aggregation queries
      → MySQL
```

#### Shared Utilities

```
All controllers import:
  → logger (utils/logger.js) - Winston logger
  → models (models/index.js) - Sequelize models
  
All routes import:
  → express.Router
  → middleware (auth.middleware.js)
  → respective controllers
  
middleware/auth.middleware.js imports:
  → jsonwebtoken (jwt)
  → User model
  → process.env.JWT_SECRET
```

---

### Frontend Dependencies

#### Pages → Components → API → Contexts

**Login Flow:**
```
pages/Auth/Login/index.jsx
  → component/Common/LoginPage.jsx (reusable login form)
    → contexts/AuthContext.jsx (useAuth hook)
      → API fetch (POST /api/auth/login)
        → tokenService.js (save tokens to LocalStorage)
```

**Surveys List Flow:**
```
pages/Surveys/List/index.jsx
  → component/Common/SurveyManagement.jsx
    → utils/api.js (axios instance)
      → API call: GET /api/surveys (with auth token in header)
        → Receives JSON response
          → Updates React state (useState)
            → Re-renders table with surveys
```

**Create Survey Flow:**
```
pages/Surveys/Create/index.jsx
  → (form with useState for form data)
  → utils/api.js
    → API call: POST /api/surveys
      → On success: navigate('/surveys') via react-router
```

**Protected Routes:**
```
App.jsx
  → routes/index.jsx (privateRoutes array)
    → component/Common/ProtectedRoute.jsx
      → contexts/AuthContext.jsx (checks isAuthenticated & user.role)
        → If not authenticated → Navigate to /login
        → If wrong role → Navigate to /unauthorized
```

#### API Client Chain

```
Any page component
  → import api from 'utils/api.js'
  → api.get('/surveys') or api.post('/surveys', data)
    → axios instance:
      • Request interceptor: adds Authorization header (Bearer token)
      • Sends HTTP request to backend
      • Response interceptor: handles 401 errors (logout)
    → Returns response.data (unwrapped by interceptor)
```

---

## 6️⃣ EXECUTION STARTUP SEQUENCE

### Backend Startup (`npm start` in Backend/)

**Command:** `node src/index.js`

**Sequence:**
1. **Load Environment:**
   - `require('dotenv').config()` loads `.env` file
   - Sets `process.env.DB_HOST`, `DB_NAME`, `JWT_SECRET`, etc.

2. **Initialize Express:**
   - Create Express app: `const app = express()`
   - Apply middleware:
     - `helmet()` - Security headers
     - `cors()` - Enable CORS for frontend origins
     - `express.json()` - Parse JSON body
     - `morgan('dev')` - HTTP request logger

3. **Connect to MySQL:**
   - Import Sequelize instance from `config/database.js`
   - `sequelize.authenticate()` tests connection
   - Logs success or error via Winston logger

4. **Load Models:**
   - `require('./models')` imports all Sequelize models
   - Defines associations (User.hasMany(Survey), etc.)

5. **Mount Routes:**
   - `app.use('/api/auth', authRoutes)`
   - `app.use('/api/surveys', surveyRoutes)`
   - etc.

6. **Error Handler:**
   - Global error middleware catches unhandled errors
   - Logs to `logs/combined.log`
   - Returns 500 JSON response

7. **Start Server:**
   - `app.listen(PORT, callback)` starts HTTP server
   - Logs: "Server running on port 5000"
   - Backend ready to accept requests

**Console Output:**
```
info: Server running on port 5000
debug: Executing (default): SELECT 1+1 AS result
info: Kết nối MySQL thành công
info: Database connection has been established successfully.
```

---

### Frontend Startup (`npm start` in Frontend/)

**Command:** `react-scripts start` (Create React App dev server)

**Sequence:**
1. **Load Environment:**
   - CRA auto-loads `.env` and exposes `REACT_APP_*` vars
   - `process.env.REACT_APP_API_URL` available in code

2. **Webpack Dev Server:**
   - Compiles JSX → JS
   - Bundles all `src/` files
   - Starts dev server on port 3000 (or 3001 if 3000 is busy)

3. **Serve `public/index.html`:**
   - Loads HTML with `<div id="root"></div>`
   - Injects bundled JS via `<script>` tag

4. **React Initialization:**
   - `src/index.jsx` runs:
     - `ReactDOM.createRoot(document.getElementById('root'))`
     - `root.render(<App />)`

5. **App Component:**
   - `src/App.jsx` renders:
     - `<AuthProvider>` wraps entire app (auth context)
     - `<Router>` sets up React Router
     - `<Routes>` maps paths to page components

6. **Route Resolution:**
   - Browser URL (e.g., `/login`) matches route
   - Renders corresponding page component
   - If protected route: checks auth via `ProtectedRoute` wrapper

7. **API Calls:**
   - Components call `api.get('/surveys')` etc.
   - Axios sends requests to backend (`http://localhost:5000/api`)
   - Responses update React state → re-render

**Console Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

---

## 7️⃣ HOW TO TRACE REQUESTS

### Manual Debugging Guide for Developers

#### Example: Tracing `GET /api/surveys/:id`

**1. Start at the Route Definition**

**File:** `Backend/src/routes/survey.routes.js`
```javascript
router.get('/:id', authenticate, surveyController.getSurveyById);
```

**Notes:**
- Path: `/api/surveys/:id` (`:id` is route param)
- Middleware: `authenticate` (must have valid JWT)
- Handler: `surveyController.getSurveyById`

---

**2. Check Middleware**

**File:** `Backend/src/middleware/auth.middleware.js`
```javascript
exports.authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({message: 'No token'});
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(decoded.id);
  if (!user) return res.status(401).json({message: 'User not found'});
  
  req.user = user; // Attach user to request
  next();
};
```

**Notes:**
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token signature
- Finds user by ID from decoded token
- Attaches `req.user` for controller to use
- If any step fails → 401 error (stops here, doesn't reach controller)

---

**3. Follow to Controller**

**File:** `Backend/src/controllers/survey.controller.js`
```javascript
exports.getSurveyById = async (req, res) => {
  try {
    const surveyId = req.params.id; // Extract :id from URL
    
    const survey = await surveyService.getSurveyById(surveyId, req.user);
    
    if (!survey) {
      return res.status(404).json({success: false, message: 'Survey not found'});
    }
    
    res.status(200).json({success: true, data: {survey}});
  } catch (error) {
    logger.error('Get survey error:', error);
    res.status(500).json({success: false, message: 'Error fetching survey'});
  }
};
```

**Notes:**
- Gets `surveyId` from `req.params.id`
- Calls service layer with `surveyId` and `req.user` (from middleware)
- Returns 404 if not found, 200 with data if found

---

**4. Dive into Service**

**File:** `Backend/src/services/survey.service.js`
```javascript
exports.getSurveyById = async (surveyId, user) => {
  try {
    const where = { id: surveyId };
    
    // Permission check: non-admin can only see own surveys
    if (user.role !== 'admin') {
      where.created_by = user.id;
    }
    
    const survey = await Survey.findOne({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name', 'email'] }
      ]
    });
    
    return survey; // Returns null if not found
  } catch (error) {
    throw error;
  }
};
```

**Notes:**
- Builds `where` clause for Sequelize
- If user is not admin: adds `created_by` filter (can only see own surveys)
- Calls `Survey.findOne()` with associations (includes creator info)
- Returns survey object or `null`

---

**5. Sequelize → MySQL**

**Sequelize Query:**
```javascript
Survey.findOne({
  where: { id: 5, created_by: 13 },
  include: [{ model: User, as: 'creator' }]
})
```

**Generated SQL:**
```sql
SELECT 
  surveys.id, surveys.template_id, surveys.title, surveys.description,
  surveys.start_date, surveys.end_date, surveys.status, surveys.created_by,
  creator.id AS "creator.id", creator.username AS "creator.username",
  creator.full_name AS "creator.full_name", creator.email AS "creator.email"
FROM surveys
LEFT JOIN users AS creator ON surveys.created_by = creator.id
WHERE surveys.id = 5 AND surveys.created_by = 13
LIMIT 1;
```

**Database:**
- Executes query
- Returns row if found, or empty result

---

**6. Response Flows Back**

**Service → Controller:**
```javascript
{
  id: 5,
  template_id: 1,
  title: 'Course Feedback Survey',
  created_by: 13,
  creator: {
    id: 13,
    username: 'creator1',
    full_name: 'Creator One',
    email: 'creator1@example.com'
  },
  ...
}
```

**Controller → HTTP Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": 5,
      "title": "Course Feedback Survey",
      "creator": {
        "username": "creator1",
        ...
      }
    }
  }
}
```

---

### General Debugging Tips

1. **Add Console Logs:**
   ```javascript
   // In controller
   console.log('Survey ID:', req.params.id);
   console.log('User:', req.user);
   ```

2. **Check Backend Logs:**
   ```powershell
   Get-Content Backend\logs\combined.log -Tail 50 -Wait
   ```

3. **Use Postman or test-login.html:**
   - Test APIs directly without frontend
   - Verify response structure

4. **Check Network Tab (Frontend):**
   - Open DevTools → Network tab
   - See request URL, headers, body, response

5. **React DevTools:**
   - Inspect component state
   - Check context values (AuthContext)

---

## 8️⃣ GLOSSARY

**Route:**
- URL path definition (e.g., `/api/surveys/:id`)
- Maps HTTP method + path to handler function

**Controller:**
- Handles HTTP requests
- Extracts data from `req` (body, params, query)
- Calls service layer
- Formats response

**Service:**
- Business logic layer
- Contains reusable logic (permissions, calculations)
- Calls repository or ORM models
- Returns data to controller

**Repository:**
- Data access layer (not fully implemented in this project)
- Encapsulates database queries
- Separates DB logic from business logic

**Middleware:**
- Function that runs before route handler
- Examples: authentication, logging, validation
- Can modify `req`/`res` or call `next()` to proceed

**Component (React):**
- Reusable UI element
- Can be a page or a smaller widget
- Uses JSX to render HTML

**Page (React):**
- Top-level component for a route
- Rendered when user navigates to specific URL

**Hook (React):**
- Function that lets you use React features
- Examples: `useState`, `useEffect`, `useAuth`

**Context (React):**
- Global state management
- Avoids prop drilling
- Example: `AuthContext` for user/token state

**ORM (Object-Relational Mapping):**
- Sequelize in this project
- Maps JavaScript objects to database tables
- Simplifies SQL queries

**JWT (JSON Web Token):**
- Stateless authentication token
- Contains user ID, role, expiration
- Signed with secret key

**RBAC (Role-Based Access Control):**
- Restricts access based on user role (admin, creator, user)
- Middleware checks `req.user.role` before allowing access

**CORS (Cross-Origin Resource Sharing):**
- Allows frontend (port 3000) to call backend (port 5000)
- Configured in `cors()` middleware

---

## ✅ CONCLUSION

**SYSTEM_FLOW.md generated successfully!**

### What You Now Understand:

1. **Architecture:** Frontend (React) ↔ Backend (Express) ↔ Database (MySQL)
2. **Backend Flow:** Request → Routes → Middleware → Controller → Service → Model → Database
3. **Frontend Flow:** User interaction → API call → Response → State update → Re-render
4. **Data Example:** Complete "Create Survey" journey from form to database
5. **Dependencies:** How files import and call each other
6. **Startup:** What happens when you run `npm start` on both servers
7. **Debugging:** How to trace a request step-by-step

### Next Steps for Developers:

- **Add New Feature:** Follow the pattern (route → controller → service → model)
- **Debug Issue:** Check logs, trace request path, verify middleware
- **Understand Code:** Use dependency graph to see file relationships
- **Extend System:** Create new modules following existing structure

---

**This document is your roadmap to navigate the codebase with confidence!** 🚀

Read it alongside the source code to build a mental model of how everything connects.
