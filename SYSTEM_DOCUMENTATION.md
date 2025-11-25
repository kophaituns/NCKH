# ALLMTAGS System - Complete Documentation

**Project Status:** ✅ FULLY OPERATIONAL (v1.0.0)  
**Last Updated:** November 26, 2025  
**Repository:** https://github.com/kophaituns/NCKH

---

## 📋 Table of Contents

1. [Completed Features](#completed-features)
2. [Architecture Overview](#architecture-overview)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Authentication & Security](#authentication--security)
6. [Real-time Features](#real-time-features)
7. [Deployment](#deployment)

---

## ✅ Completed Features

### 1. **User Management & Authentication**
- ✅ User registration with email validation
- ✅ JWT-based authentication system
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC):
  - **admin**: Full system access
  - **teacher**: Can create/manage surveys and templates
  - **student**: Can respond to surveys
- ✅ User profile management
- ✅ Password change functionality
- ✅ Auto-logout after inactivity

**Implementation Files:**
- `Backend/src/modules/auth-rbac/` - Authentication module
- `Backend/src/models/user.model.js` - User data model
- `Backend/src/middleware/auth.middleware.js` - Auth validation middleware

---

### 2. **Survey Templates Management**
- ✅ Create custom survey templates
- ✅ Template versioning and archiving
- ✅ Multiple question types support:
  - Multiple choice (single select)
  - Multiple response (multi-select)
  - Likert scale (1-5 rating)
  - Short text input
  - Long text input
- ✅ Question ordering and randomization
- ✅ Template duplication and import/export
- ✅ Template access control (private/shared)

**Implementation Files:**
- `Backend/src/modules/templates/` - Template management module
- `Backend/src/models/surveyTemplate.model.js` - Template schema
- `Backend/src/models/question.model.js` - Question schema
- `Backend/src/models/questionOption.model.js` - Question options

---

### 3. **Survey Management**
- ✅ Create surveys from templates
- ✅ Survey lifecycle management:
  - Draft → Active → Closed → Archived
- ✅ Survey scheduling (start/end dates)
- ✅ Target audience definition
- ✅ Survey cloning and versioning
- ✅ Soft delete with restore capability
- ✅ Survey access control and permissions

**Implementation Files:**
- `Backend/src/modules/surveys/` - Survey management module
- `Backend/src/models/survey.model.js` - Survey schema
- `Backend/src/modules/surveys/service/survey.access.service.js` - Access control

---

### 4. **Response Collection & Analytics**
- ✅ Anonymous response mode
- ✅ Tracked response with user identification
- ✅ Response completion tracking
- ✅ Real-time response statistics
- ✅ Response filtering and search
- ✅ Data export (CSV/JSON)
- ✅ Response validation

**Implementation Files:**
- `Backend/src/modules/responses/` - Response handling module
- `Backend/src/models/surveyResponse.model.js` - Response schema
- `Backend/src/models/answer.model.js` - Answer tracking
- `Backend/src/modules/export/` - Data export functionality

---

### 5. **LLM Integration (AI-Powered Features)**
- ✅ AI-powered survey generation from topics
- ✅ Intelligent response analysis using OpenAI API
- ✅ Prompt customization and management
- ✅ LLM interaction history tracking
- ✅ Form auto-fill using AI (Experimental)
- ✅ Cost tracking for LLM API calls

**Implementation Files:**
- `Backend/src/modules/llm/` - LLM integration module
- `Backend/src/modules/llm-form-agent/` - AI form filling agent
- `Backend/src/models/llmPrompt.model.js` - Prompt management
- `Backend/src/models/llmInteraction.model.js` - Interaction tracking

---

### 6. **Survey Distribution & Collectors**
- ✅ Survey collector management
- ✅ Multiple collector types:
  - Direct link collectors
  - Email invitation collectors
  - QR code support
- ✅ Collector permissions:
  - Can view responses
  - Can invite recipients
  - Can modify survey (controlled)
- ✅ Collector performance tracking
- ✅ Invitation management and tracking
- ✅ Invitation status: Pending/Accepted/Cancelled/Expired

**Implementation Files:**
- `Backend/src/modules/collectors/` - Collector management module
- `Backend/src/models/surveyCollector.model.js` - Collector schema
- `Backend/src/models/collectorPermission.model.js` - Permissions
- `Backend/src/models/workspaceInvitation.model.js` - Invitations

---

### 7. **Workspace Management**
- ✅ Multi-workspace support for team collaboration
- ✅ Workspace creation and administration
- ✅ Workspace member management:
  - Owner (full control)
  - Manager (can manage members and surveys)
  - Collaborator (can create surveys)
  - Viewer (read-only access)
- ✅ Workspace invitations and access control
- ✅ Workspace activity logging
- ✅ Bulk member management

**Implementation Files:**
- `Backend/src/modules/workspaces/` - Workspace module
- `Backend/src/models/workspace.model.js` - Workspace schema
- `Backend/src/models/workspaceMember.model.js` - Member roles
- `Backend/src/models/workspaceActivity.model.js` - Activity audit trail

---

### 8. **Real-Time Notifications**
- ✅ WebSocket integration with Socket.IO
- ✅ Push notifications for:
  - New survey responses
  - Invitation status changes
  - Survey status updates
  - Workspace member changes
- ✅ Notification persistence in database
- ✅ Unread notification tracking
- ✅ Notification read/unread status
- ✅ Batch notification retrieval

**Implementation Files:**
- `Backend/src/modules/notifications/` - Notification module
- `Backend/src/models/notification.model.js` - Notification schema
- `Backend/src/config/socket.config.js` - Socket.IO setup
- `Backend/src/utils/notification.service.js` - Notification utilities

---

### 9. **Data Analytics & Visualization**
- ✅ Survey response analytics:
  - Response rate calculation
  - Completion rate tracking
  - Response time analysis
- ✅ Question-level analytics:
  - Answer frequency/percentage
  - Likert scale sentiment analysis
  - Text response categorization
- ✅ Visualizations support:
  - Bar charts (multiple choice)
  - Pie charts (distribution)
  - Likert visualization
  - Time-series data
- ✅ Custom report generation
- ✅ Export analytics to CSV/JSON

**Implementation Files:**
- `Backend/src/modules/analytics/` - Analytics module
- `Backend/src/models/analysisResult.model.js` - Analysis results
- `Backend/src/models/visualization.model.js` - Visualization configs

---

### 10. **Audit & Compliance**
- ✅ Comprehensive audit logging:
  - User activities
  - Survey modifications
  - Response submissions
  - Access logs
- ✅ Data anonymization for privacy
- ✅ GDPR-compliant data deletion
- ✅ Activity timestamp tracking
- ✅ Change history tracking

**Implementation Files:**
- `Backend/src/models/auditLog.model.js` - Audit trail
- `Backend/src/models/workspaceActivity.model.js` - Workspace audit

---

### 11. **Frontend Features**
- ✅ Responsive React UI (React 18.3.1)
- ✅ Dynamic survey rendering
- ✅ Real-time response submission
- ✅ Dashboard with statistics
- ✅ Survey creator with drag-and-drop (experimental)
- ✅ Template browser and preview
- ✅ Response viewer and analytics
- ✅ Mobile-friendly design
- ✅ Multi-language support (Vietnamese/English)
- ✅ Dark mode support

**Implementation Files:**
- `Frontend/src/components/` - React components
- `Frontend/src/pages/` - Page views
- `Frontend/src/api/` - API client
- `Frontend/src/contexts/` - State management

---

## 🏗️ Architecture Overview

### Backend Architecture

```
Backend/src/
├── config/           # Configuration files
│   ├── database.js   # Database connection
│   └── socket.config.js # WebSocket configuration
├── middleware/       # Express middleware
├── models/          # Sequelize ORM models (23 models)
├── modules/         # Feature modules (13 modules)
│   ├── analytics/
│   ├── auth-rbac/
│   ├── collectors/
│   ├── export/
│   ├── health/
│   ├── llm/
│   ├── llm-form-agent/
│   ├── notifications/
│   ├── responses/
│   ├── surveys/
│   ├── templates/
│   ├── users/
│   └── workspaces/
├── routes/          # API route definitions
├── utils/           # Utility functions
├── app.js          # Express app configuration
├── server.js       # Server entry point
└── index.js        # Application start
```

### Database Architecture

- **Database Engine:** MySQL 8.0+
- **ORM:** Sequelize v6
- **Models:** 23 interconnected models with proper relationships
- **Migrations:** 20 versioned migrations
- **Seeds:** Demo data seeding available

---

## 📡 API Documentation

### Base URL
- **Development:** `http://localhost:5000`
- **Production:** `https://api.example.com`

### API Endpoints Summary

| Module | Endpoints | Status |
|--------|-----------|--------|
| Authentication | `/api/modules/auth/*` | ✅ Complete |
| Users | `/api/modules/users/*` | ✅ Complete |
| Templates | `/api/modules/templates/*` | ✅ Complete |
| Surveys | `/api/modules/surveys/*` | ✅ Complete |
| Responses | `/api/modules/responses/*` | ✅ Complete |
| Collectors | `/api/modules/collectors/*` | ✅ Complete |
| Workspaces | `/api/modules/workspaces/*` | ✅ Complete |
| Notifications | `/api/modules/notifications/*` | ✅ Complete |
| Analytics | `/api/modules/analytics/*` | ✅ Complete |
| LLM | `/api/modules/llm/*` | ✅ Complete |
| Export | `/api/modules/export/*` | ✅ Complete |

**See Backend/README.md for detailed endpoint documentation**

---

## 🔐 Authentication & Security

### Security Features
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ CORS protection with whitelist
- ✅ Helmet.js security headers
- ✅ Rate limiting (recommended for production)
- ✅ SQL injection prevention via ORM
- ✅ HTTPS/TLS support
- ✅ Environment variable protection

### Authentication Flow
```
1. User registers/logs in
2. Server validates credentials
3. JWT token generated (expires in 24 hours)
4. Token stored in httpOnly cookie
5. Token sent with each request via Authorization header
6. Server validates token on protected routes
7. Token refreshed on new login
```

---

## 📡 Real-Time Features

### WebSocket Events
- **Survey Response:** `response:new`, `response:updated`
- **Survey Status:** `survey:status-changed`
- **Notifications:** `notification:new`, `notification:read`
- **Workspace:** `workspace:member-added`, `workspace:member-removed`
- **Invitations:** `invitation:sent`, `invitation:accepted`

### Socket.IO Configuration
- **Namespace:** `/`
- **Adapter:** Default (memory)
- **CORS:** Configured for frontend domain
- **Reconnection:** Auto-enabled with exponential backoff

---

## 🚀 Deployment

### Prerequisites
- Node.js v16+
- MySQL 8.0+
- OpenAI API key (for LLM features)

### Docker Deployment
```bash
cd Docker
docker-compose up -d
```

### Manual Deployment
```bash
# Backend
cd Backend
npm install
npm start

# Frontend
cd ../Frontend
npm install
npm start
```

### Environment Variables
See `.env.example` files in Backend and Frontend directories.

---

## 📊 Database Models (23 Total)

1. **User** - User accounts
2. **Survey** - Surveys
3. **SurveyTemplate** - Survey templates
4. **Question** - Survey questions
5. **QuestionOption** - Multiple choice options
6. **QuestionType** - Question type definitions
7. **SurveyResponse** - Survey responses
8. **Answer** - Individual answers
9. **SurveyCollector** - Survey distribution links
10. **CollectorPermission** - Collector permissions
11. **SurveyCollaborator** - Survey collaborators
12. **Workspace** - Workspace containers
13. **WorkspaceMember** - Workspace members
14. **WorkspaceInvitation** - Workspace invitations
15. **WorkspaceActivity** - Workspace audit log
16. **Notification** - Real-time notifications
17. **LLMPrompt** - LLM prompt templates
18. **LLMInteraction** - LLM API call tracking
19. **AnalysisResult** - Survey analysis results
20. **Visualization** - Visualization configurations
21. **AuditLog** - General audit trail
22. **SurveyCollaborator** - Additional collaborators
23. **NotificationLog** - Notification history

---

## 🧪 Testing

### Available Test Scripts
```bash
# Smoke tests
npm run smoke

# Full flow testing
npm run test-full-flow

# Check API endpoints
npm run check-api

# Database schema check
npm run check-schema
```

---

## 📝 Git Workflow

### Current Status
- **Branch:** main
- **Remote Branches:** main, linh, Quân
- **Diverged Commits:** 18 local vs 11 remote

### Before Major Changes
1. Create backup branch: `git checkout -b backup/YYYY-MM-DD-description`
2. Push backup: `git push origin backup/YYYY-MM-DD-description`
3. Make changes on main
4. Test thoroughly
5. Commit with detailed messages
6. Push to main

### Merge/Pull Strategy
- Always pull before pushing
- Use `git merge` for integration (not rebase for safety)
- Create pull requests for major changes
- Get team approval before merging

---

## 📞 Support & Troubleshooting

### Common Issues

**Database Connection Error**
- Check MySQL is running: `mysql --version`
- Verify credentials in `.env`
- Check database exists: `SHOW DATABASES;`

**Port Already in Use**
- Find process: `netstat -ano | findstr :5000`
- Kill process: `taskkill /PID <PID> /F`
- Or change PORT in `.env`

**Node Modules Issues**
- Clean install: `rm -r node_modules package-lock.json && npm install`

**LLM API Errors**
- Verify OpenAI API key: `echo $OPENAI_API_KEY`
- Check API quota and usage
- Ensure internet connectivity

---

## 📄 License

Copyright © 2025 ALLMTAGS Project. All rights reserved.

---

**Last Updated:** November 26, 2025  
**Maintainer:** Development Team  
**Status:** Production Ready ✅

