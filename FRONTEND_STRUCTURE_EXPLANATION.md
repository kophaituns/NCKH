# Khác Biệt Giữa `/src/pages` và `/src/components/pages`

## TL;DR (Tóm tắt nhanh)

| Tiêu chí | `/src/pages` | `/src/components/pages` |
|----------|--------------|------------------------|
| **Mục đích** | Page chính toàn màn hình | Component tái sử dụng không phải page |
| **Người dùng** | Router (routes) | Các component khác |
| **Cấu trúc** | Feature folder (Auth, Surveys, ...) | Flat file list |
| **Import** | `lazy()` → route | Direct import |
| **Hiển thị** | Full viewport | Partial UI |
| **Ví dụ** | Login page đầy đủ | Widget/section nhỏ |

---

## Chi Tiết

### 1️⃣ `/src/pages` - FULL PAGE ROUTES

**Vị trí:** `d:\NCKH\Frontend\src\pages\`

**Cấu trúc:**
```
pages/
├── Admin/               # Admin dashboard pages
├── Auth/
│   ├── Login/          # Login page (full screen)
│   │   ├── index.jsx
│   │   └── Login.module.scss
│   └── Register/       # Register page (full screen)
├── Collectors/         # Collector management pages
├── Creator/            # Creator dashboard pages
├── Dashboard/          # Main dashboard pages
├── Landing/            # Landing page
├── Public/             # Public response form page
├── Surveys/            # Survey management pages
└── Templates/          # Template management pages
```

**Đặc điểm:**
- ✅ Được **Router sử dụng** (trong `routes/index.jsx`)
- ✅ Là **full page** (chiếm toàn bộ viewport)
- ✅ Có **code splitting** với `React.lazy()`
- ✅ Mỗi page là một **feature/route riêng**
- ✅ Folder tổ chức theo **chức năng (feature-based)**

**Ví dụ sử dụng:**
```jsx
// routes/index.jsx
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));

const routes = [
  { path: '/login', element: <ProtectedRoute><Login /></ProtectedRoute> },
  { path: '/register', element: <Register /> }
];
```

**Đặc điểm file:**
```jsx
// /src/pages/Auth/Login/index.jsx
export default function Login() {
  // Full page component
  // Gọi useRouter, useAuth, etc
  // Return toàn bộ page layout
}
```

---

### 2️⃣ `/src/components/pages` - REUSABLE PAGE COMPONENTS

**Vị trí:** `d:\NCKH\Frontend\src\components\pages\`

**Danh sách file:**
```
components/pages/
├── AnalyticsPage.jsx      # Analytics widget/section
├── CreateSurveyPage.jsx   # Create survey widget
├── LandingPage.jsx        # Landing page component
├── LandingPage.scss
├── ManageUsersPage.jsx    # User management widget
├── SurveyManagement.jsx   # Survey management widget
└── SurveyResponsePage.jsx # Response display widget
```

**Đặc điểm:**
- ❌ **KHÔNG được Router sử dụng trực tiếp** (đây là component, không route)
- ✅ Có thể là **full page hoặc section/widget**
- ✅ Được **import và sử dụng lại** trong các component khác
- ✅ Flat file structure (không có subfolder)
- ✅ Có thể **nest** vào trong page khác

**Ví dụ sử dụng:**
```jsx
// Sử dụng trong một page khác hoặc component
import AnalyticsPage from '../../components/pages/AnalyticsPage';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <Header />
      <AnalyticsPage />  {/* Import trực tiếp */}
      <Footer />
    </div>
  );
}
```

**Ví dụ file:**
```jsx
// /src/components/pages/LandingPage.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.scss';

const LandingPage = () => {
  // Component được import và sử dụng lại
  // Không là route chính thức
  return (
    <div className="landing-container">
      {/* UI content */}
    </div>
  );
};

export default LandingPage;
```

---

## So Sánh Trực Tiếp

### Ví dụ: LandingPage

**📍 `/src/components/pages/LandingPage.jsx`**
```jsx
// Component có thể import vào các page khác
const LandingPage = () => {
  // Simple component
  // Thường có props, state nội bộ
  // Được sử dụng như một section/widget
};
```

**vs**

**📍 `/src/pages/Landing/index.jsx`** (nếu tồn tại)
```jsx
// Route page chính thức
export default function LandingPage() {
  // Full page component
  // Thường không nhận props
  // Sử dụng hooks: useRouter, useAuth, etc
  // Return toàn bộ layout page
}
```

---

## Quy Tắc Sử Dụng

### 🎯 Khi Nào Dùng `/src/pages`?

✅ **Nên dùng** khi:
1. Thành phần là một **route chính thức** (có URL riêng)
   - `/login` → `pages/Auth/Login`
   - `/surveys` → `pages/Surveys/List`
   - `/templates` → `pages/Templates/Editor`

2. Là **full page** (chiếm toàn màn hình)
3. Được **Router mount** (trong `routes/index.jsx`)
4. Cần **code splitting** (lazy loading)

**Ví dụ:**
```
/src/pages/
├── Auth/Login/
├── Surveys/List/
├── Templates/Editor/
├── Dashboard/
└── Admin/Users/
```

### 🎨 Khi Nào Dùng `/src/components/pages`?

✅ **Nên dùng** khi:
1. Thành phần **không phải route chính thức**
2. Là một **widget/section** có thể tái sử dụng
3. Được **import vào các component/page khác**
4. Không cần **lazy loading riêng**

**Ví dụ:**
```jsx
// Component import AnalyticsPage từ components/pages
import AnalyticsPage from '../components/pages/AnalyticsPage';

export default function Dashboard() {
  return (
    <>
      <Sidebar />
      <AnalyticsPage />  {/* Sử dụng như widget */}
      <Footer />
    </>
  );
}
```

---

## Cấu Trúc Hiện Tại (NCKH Project)

### `/src/pages` - Route Pages
```
pages/
├── Admin/
│   └── index.jsx          → /admin route
├── Auth/
│   ├── Login/             → /login route
│   └── Register/          → /register route
├── Collectors/            → /collectors route
├── Creator/               → /creator-dashboard route
├── Dashboard/             → /dashboard route
├── Landing/               → / route
├── Public/                → /public/:token route
├── Surveys/
│   ├── List/
│   ├── Editor/
│   ├── Distribute/
│   └── Results/
└── Templates/
    ├── List/
    ├── Editor/
    └── Archive/
```

### `/src/components/pages` - Reusable Widgets
```
components/pages/
├── AnalyticsPage.jsx      # Widget: analytics dashboard
├── CreateSurveyPage.jsx   # Widget: survey creation form
├── LandingPage.jsx        # Widget: landing page display
├── ManageUsersPage.jsx    # Widget: user management table
├── SurveyManagement.jsx   # Widget: survey list & controls
└── SurveyResponsePage.jsx # Widget: response display
```

---

## Flow Ví Dụ

### Scenario 1: User truy cập `/login`

```
URL: /login
   ↓
routes/index.jsx (ProtectedRoute)
   ↓
/src/pages/Auth/Login/index.jsx (full page component)
   ↓
Render: Login form chiếm toàn màn hình
```

### Scenario 2: Analytics widget được embed

```
/src/pages/Dashboard/index.jsx
   ↓
Import: import AnalyticsPage from '../../components/pages/AnalyticsPage'
   ↓
/src/components/pages/AnalyticsPage.jsx (widget)
   ↓
Render: Analytics section trong Dashboard
```

---

## Best Practices

### ✅ DO

```jsx
// ✅ Use /src/pages for routes
const Dashboard = lazy(() => import('../pages/Dashboard'));

// ✅ Use /src/components/pages for reusable widgets
import AnalyticsPage from '../components/pages/AnalyticsPage';
const Dashboard = () => {
  return <AnalyticsPage />;
};

// ✅ Feature-based folder structure in /src/pages
pages/
├── Auth/Login/index.jsx
├── Surveys/List/index.jsx
└── Templates/Editor/index.jsx
```

### ❌ DON'T

```jsx
// ❌ Don't put reusable components in /src/pages
// (They won't be lazy-loaded properly)

// ❌ Don't put routes directly in /src/components/pages
// (They won't be integrated with router)

// ❌ Don't nest too deep in /src/pages
pages/
├── Auth/
│   ├── Login/
│   │   ├── Components/   // ❌ Too deep
│   │   └── Hooks/
```

---

## Tóm Tắt

| Khía Cạnh | `/src/pages` | `/src/components/pages` |
|-----------|--------------|------------------------|
| **Mục đích chính** | Route pages (full screen) | Reusable widgets/sections |
| **Được mount bởi** | React Router (routes) | Manual import |
| **Cấu trúc** | Feature folder (`Auth/`, `Surveys/`) | Flat file list |
| **Code splitting** | ✅ Yes (lazy loaded) | ❌ No (inline) |
| **Tái sử dụng** | ❌ Hiếm khi | ✅ Có thể embed nhiều nơi |
| **Props** | ❌ Không thường dùng | ✅ Thường nhận props |
| **Ví dụ** | Login, Dashboard, Surveys | Analytics widget, User form |

---

**Kết luận:** `/src/pages` là cho **routes chính thức**, `/src/components/pages` là cho **reusable UI components**. Phân biệt rõ giúp code tổ chức hơn và maintainable hơn! 🚀
