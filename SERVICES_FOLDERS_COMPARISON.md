# Khác Biệt Giữa `/src/services` và `/src/api/services`

## 🎯 TL;DR (Tóm tắt nhanh)

| Tiêu chí | `/src/services` | `/src/api/services` |
|----------|-----------------|-------------------|
| **Mục đích** | Helper/Utility services | API communication services |
| **Gọi API?** | ❌ NO | ✅ YES |
| **Nội dung** | Token, validation, security | Auth, surveys, templates, etc. |
| **Dependency** | localStorage, local logic | Backend API |
| **Ví dụ** | `TokenService`, `ValidationService` | `AuthService`, `SurveyService` |
| **Số file** | 3 files | 11 files |

---

## 📁 Chi Tiết Cấu Trúc

### 📍 `/src/services` - Helper Services (Utilities) 🛠️

**Vị trí:** `Frontend/src/services/`

**Nội dung:**
```
services/
├── tokenService.js        # 🔐 Token management (local)
├── validationService.js   # ✓ Input validation
└── securityService.js     # 🔒 Security helpers
```

**Mục đích:**
- ❌ **KHÔNG gọi API**
- ✅ Quản lý **localStorage**
- ✅ Xử lý **validation** & **security**
- ✅ Helper functions (local only)

**Ví dụ nội dung:**

```javascript
// tokenService.js
export const TokenService = {
  getStoredTokensSync() {
    const accessToken = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  },
  saveTokens(accessToken, refreshToken) {
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clearAll() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }
};
```

```javascript
// validationService.js
export const required = (value) => {
  if (!value || value.trim() === '') {
    return 'This field is required';
  }
  return null;
};

export const minLength = (value) => {
  if (!value || value.length < 6) {
    return 'Must be at least 6 characters';
  }
  return null;
};
```

```javascript
// securityService.js
export const securityService = {
  sanitizeInput: (input) => {
    return String(input).trim();
  },
  validateToken: (token) => token && token.length > 0
};
```

**Được sử dụng ở:**
- ✅ `AuthContext.jsx` - Quản lý token & auth state

---

### 📍 `/src/api/services` - API Communication Services 🌐

**Vị trí:** `Frontend/src/api/services/`

**Nội dung:**
```
api/services/
├── index.js                 # Barrel export
├── auth.service.js          # Auth API calls
├── analytics.service.js     # Analytics API calls
├── collector.service.js     # Collector API calls
├── export.service.js        # Export API calls
├── llm.service.js           # LLM API calls
├── question.service.js      # Question API calls
├── response.service.js      # Response API calls
├── survey.service.js        # Survey API calls
├── template.service.js      # Template API calls
└── user.service.js          # User API calls
```

**Mục đích:**
- ✅ **Gọi Backend API**
- ✅ Xử lý **request/response**
- ✅ Quản lý **data transfer** tới server
- ✅ Dùng `/api/http.js` (Axios)

**Ví dụ nội dung:**

```javascript
// auth.service.js
import http from '../http';

const AuthService = {
  async login(email, password) {
    // Gọi backend API
    const response = await http.post('/auth/login', {
      email,
      password
    });
    
    // Trả về dữ liệu từ server
    return response.data;
  },

  async logout() {
    // Gọi backend API
    return await http.post('/auth/logout');
  }
};

export default AuthService;
```

```javascript
// survey.service.js
import http from '../http';

const SurveyService = {
  async getAllSurveys(page, limit) {
    // Gọi backend API
    const response = await http.get('/surveys', {
      params: { page, limit }
    });
    
    return response.data;
  },

  async getSurveyById(id) {
    // Gọi backend API
    const response = await http.get(`/surveys/${id}`);
    
    return response.data;
  }
};

export default SurveyService;
```

**Được sử dụng ở:**
- ✅ Anywhere in components/pages - Gọi API

---

## 📊 So Sánh Chi Tiết

### Comparison Table

| Khía cạnh | `/src/services` | `/src/api/services` |
|-----------|-----------------|-------------------|
| **Type** | Helper/Utility | API Service |
| **Main Job** | Local logic | Talk to backend |
| **HTTP calls** | ❌ NO | ✅ YES |
| **Depends on** | localStorage | Backend API |
| **Folder structure** | Flat files | Organized by module |
| **Imports** | Regular JS | Axios (http.js) |
| **Example** | TokenService | AuthService |
| **Used by** | AuthContext | Any component |
| **Access** | Sync/local | Async/API |

---

## 🔀 Sự Khác Biệt Cụ Thể

### `/src/services` - LOCAL ONLY (No API)
```javascript
// ✅ Chỉ dùng localStorage
// ✅ Không gọi backend
// ✅ Sync operations

const token = TokenService.getStoredTokensSync();
TokenService.saveTokens(accessToken, refreshToken);
TokenService.removeTokens();
```

### `/src/api/services` - API ONLY (Calls Backend)
```javascript
// ✅ Gọi backend API
// ✅ Async operations
// ✅ Data from server

const surveys = await SurveyService.getAllSurveys();
const response = await ResponseService.submitResponse(data);
```

---

## ❓ Có Thể Gộp Lại Không?

### ❌ NO - Không nên gộp

**Lý do:**
1. **Khác mục đích hoàn toàn**
   - `/services` = Local utilities
   - `/api/services` = API calls

2. **Khác cách dùng**
   - `/services` = Sync, local
   - `/api/services` = Async, server

3. **Khác dependency**
   - `/services` = localStorage
   - `/api/services` = HTTP client

4. **Khác tổ chức**
   - `/services` = Utility helpers
   - `/api/services` = Backend modules (auth, surveys, etc.)

---

## 🎯 Best Practices

### ✅ DO

```javascript
// ✅ Use /services for local logic
import { TokenService } from '../services/tokenService';
import { validationService } from '../services/validationService';

// ✅ Use /api/services for API calls
import AuthService from '../api/services/auth.service';
import SurveyService from '../api/services/survey.service';

// ✅ Combine both if needed
async function handleLogin(email, password) {
  // 1. Call API service
  const response = await AuthService.login(email, password);
  
  // 2. Use local service to store token
  TokenService.saveTokens(response.token, response.refreshToken);
  
  return response;
}
```

### ❌ DON'T

```javascript
// ❌ Don't mix them together
// They serve different purposes!

// ❌ Don't put API calls in /services
export const SurveyService = {
  async getSurveys() {
    // This belongs in /api/services
  }
};

// ❌ Don't put local logic in /api/services
export const AuthService = {
  sanitizeInput(input) {
    // This belongs in /services
  }
};
```

---

## 📋 Current Status

### `/src/services` Status
```
✅ tokenService.js         - Used in AuthContext
⚠️ validationService.js    - Defined but NOT used
⚠️ securityService.js      - Defined but NOT used
```

### `/src/api/services` Status
```
✅ auth.service.js         - Used
✅ template.service.js     - Used
✅ survey.service.js       - Used
✅ response.service.js     - Used
✅ All others              - Active
```

---

## 💡 Recommendation

### Current Setup: ✅ GOOD

Keep them separate!

**File Organization:**
```
src/
├── services/              # ✅ Local utilities & helpers
│   ├── tokenService.js    # Token management
│   ├── validationService.js
│   └── securityService.js
│
└── api/                   # ✅ API communication
    ├── http.js            # HTTP client
    └── services/          # Backend services
        ├── auth.service.js
        ├── survey.service.js
        └── ...
```

**Why:**
- Clear separation of concerns
- Easy to understand
- Easy to maintain
- No confusion about dependencies

---

## ⚠️ Optional Cleanup

If you want to clean up `/src/services`:
- ⚠️ `validationService.js` - NOT USED anywhere
- ⚠️ `securityService.js` - NOT USED anywhere
- ✅ `tokenService.js` - USED in AuthContext

**Option:** Consider deleting unused files if you don't plan to use them.

But current setup is fine! 🎉

---

## Summary

| Folder | Mục đích | Nên giữ? |
|--------|---------|----------|
| `/src/services` | Local utilities (token, validation) | ✅ YES |
| `/src/api/services` | API calls to backend | ✅ YES |

**Không nên gộp** - They're fundamentally different! 🚫

Keep them separate for better organization! 👍
