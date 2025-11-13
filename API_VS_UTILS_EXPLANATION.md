# Khác Biệt Giữa `/src/api` và `/src/utils`

## TL;DR (Tóm tắt nhanh)

| Tiêu chí | `/src/api` | `/src/utils` |
|----------|-----------|--------------|
| **Mục đích** | API/HTTP communication | Helper functions |
| **Nội dung** | HTTP client + services | Utilities + constants |
| **Imports** | `http.js` từ API | `api.js` từ utils |
| **Sử dụng** | Gọi backend API | Helper functions |
| **Ví dụ** | `auth.service.js`, `template.service.js` | `questionTypes.js`, constants |

---

## Chi Tiết

### 📍 `/src/api` - API Communication Layer

**Vị trí:** `Frontend/src/api/`

**Cấu trúc:**
```
api/
├── http.js              # Axios HTTP client (with interceptors)
└── services/
    ├── index.js                    # Barrel export
    ├── auth.service.js            # Auth API calls
    ├── analytics.service.js        # Analytics API calls
    ├── collector.service.js        # Collector API calls
    ├── export.service.js           # Export API calls
    ├── llm.service.js              # LLM API calls
    ├── question.service.js         # Question API calls
    ├── response.service.js         # Response API calls
    ├── survey.service.js           # Survey API calls
    ├── template.service.js         # Template API calls
    └── user.service.js             # User API calls
```

**Mục đích:**
- ✅ Kết nối với **Backend API**
- ✅ Gửi/nhận **dữ liệu từ server**
- ✅ Xử lý **authentication** (JWT tokens)
- ✅ Quản lý **interceptors** (request/response)

**Ví dụ file:**

```javascript
// /src/api/http.js
import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:5000/api/modules',
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT token to requests
http.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
```

**Ví dụ service:**

```javascript
// /src/api/services/auth.service.js
import http from '../http';

const AuthService = {
  async login(email, password) {
    // Call backend API
    const response = await http.post('/auth/login', {
      email,
      password
    });
    
    // Store token
    localStorage.setItem('token', response.data.token);
    
    return response.data;
  },

  async logout() {
    // Call backend API
    return await http.post('/auth/logout');
  }
};

export default AuthService;
```

**Khi nào dùng:**
- Khi bạn cần **gọi API**
- Khi bạn cần **gửi/nhận dữ liệu** từ backend
- Khi bạn cần **xử lý token**

---

### 🛠️ `/src/utils` - Helper Utilities

**Vị trí:** `Frontend/src/utils/`

**Cấu trúc:**
```
utils/
├── api.js              # DEPRECATED (old API setup)
└── questionTypes.js    # Question type constants
```

**Mục đích:**
- ✅ Chứa **helper functions**
- ✅ Chứa **constants** (enums, types)
- ✅ Chứa **utilities** (formatters, validators)
- ❌ **KHÔNG** gọi backend API trực tiếp

**Ví dụ file:**

```javascript
// /src/utils/questionTypes.js
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 1,
  CHECKBOX: 2,
  LIKERT_SCALE: 3,
  OPEN_ENDED: 4,
  DROPDOWN: 5,
};

export const getQuestionTypeName = (typeId) => {
  const typeMap = {
    1: 'Multiple Choice',
    2: 'Checkbox',
    3: 'Likert Scale',
    4: 'Open Ended',
    5: 'Dropdown',
  };
  return typeMap[typeId] || 'Unknown';
};
```

**Khi nào dùng:**
- Khi bạn cần **helper functions**
- Khi bạn cần **constants/enums**
- Khi bạn cần **formatters/validators**
- Khi bạn cần **logic reusable** (không API)

---

## So Sánh Trực Tiếp

### 📊 Comparison Table

| Khía cạnh | `/src/api` | `/src/utils` |
|-----------|-----------|--------------|
| **Type** | API Service Layer | Helper Utilities |
| **Main Job** | Talk to backend | Reusable functions |
| **Contains** | HTTP clients + Services | Constants + Helpers |
| **Imports** | Axios, HTTP client | Regular JS |
| **Dependency** | Backend API | Nothing |
| **Used by** | Components, Pages | Anywhere |
| **Example** | `AuthService.login()` | `getQuestionTypeName()` |
| **API calls** | ✅ YES | ❌ NO |
| **Local only** | ❌ Needs server | ✅ Pure frontend |

---

## Ví Dụ Cụ Thể

### Scenario 1: User Login

**Flow:**
```
Component Login
    ↓
Import AuthService from /api/services/
    ↓
AuthService.login(email, password)  ← Call backend API
    ↓
/api/http.js (with interceptors)
    ↓
Backend API
    ↓
Return token
    ↓
Store in localStorage
    ↓
Update component state
```

**Code:**
```javascript
// Login component
import AuthService from '../api/services/auth.service.js';

async function handleLogin(email, password) {
  const result = await AuthService.login(email, password);
  // result comes from backend API
}
```

### Scenario 2: Format Question Type

**Flow:**
```
Component QuestionCard
    ↓
Import getQuestionTypeName from /utils/
    ↓
getQuestionTypeName(typeId)  ← Pure JS function
    ↓
Return formatted string
    ↓
Display in component
```

**Code:**
```javascript
// QuestionCard component
import { getQuestionTypeName } from '../utils/questionTypes.js';

function QuestionCard({ typeId }) {
  const typeName = getQuestionTypeName(typeId);
  return <div>{typeName}</div>;
}
```

---

## Current Status

### ⚠️ Issue: Duplicate API Setup

**Problem:**
```
/utils/api.js          ← OLD API setup (DEPRECATED)
    ↓
/api/http.js           ← NEW API setup (IN USE)
```

Hiện tại có **2 chỗ setup HTTP client** ⚠️

**Current imports:**
- ✅ Services dùng `/api/http.js` (mới)
- ⚠️ Một số files cũ còn dùng `/utils/api.js` (cũ)

---

## Recommendation: Clean Up Plan

### ✅ Option 1: Keep Only `/src/api` (RECOMMENDED)

**Action:**
1. Delete `/src/utils/api.js` (deprecated, duplicate)
2. Keep `/src/api/http.js` (modern, in use)
3. Keep `/src/utils/questionTypes.js` (utility, not API)

**Result:**
```
api/
├── http.js       ← Only HTTP client setup
└── services/     ← All API services

utils/
└── questionTypes.js  ← Only utilities
```

### ❌ Option 2: Keep Both (Not recommended)
- Confusing: 2 different API setups
- Maintenance nightmare: Which one to update?
- Duplicate code

---

## Best Practices

### ✅ DO

```javascript
// ✅ Import services from /api for API calls
import AuthService from '../api/services/auth.service';
import TemplateService from '../api/services/template.service';

// ✅ Import utils for helpers
import { getQuestionTypeName } from '../utils/questionTypes';
import { formatDate } from '../utils/formatters';

// ✅ Use /api/http for custom API calls
import http from '../api/http';

async function someApiCall() {
  return await http.get('/some-endpoint');
}
```

### ❌ DON'T

```javascript
// ❌ Don't mix - don't use /utils/api.js
import api from '../utils/api';

// ❌ Don't put API calls in /utils
// (they belong in /api/services)

// ❌ Don't put constants in /api/services
// (they belong in /utils)
```

---

## Summary

### `/src/api` - Backend Communication 🌐
- **Quản lý HTTP client** (Axios setup)
- **Quản lý Services** (Auth, Template, Survey, etc.)
- **Quản lý tokens + interceptors**
- **Gọi backend API**

### `/src/utils` - Frontend Helpers 🛠️
- **Chứa constants** (Question types, status, etc.)
- **Chứa helper functions** (Formatters, validators)
- **Chứa utilities** (Pure JS, không API)
- **Local logic only**

---

## Next Steps (Optional)

Bạn có muốn tôi dọn dẹp `/src/utils/api.js` (xóa file cũ, chỉ giữ `/src/api/http.js`) để tránh nhầm lẫn không?

Nếu có, tôi sẽ:
1. ✅ Xác nhận không file nào dùng `/utils/api.js`
2. ✅ Xóa file deprecated
3. ✅ Commit thay đổi

**Recommendation:** Yes, delete `/utils/api.js` để codebase sạch hơn! 🧹
