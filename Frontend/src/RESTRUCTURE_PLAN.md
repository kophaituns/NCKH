# FRONTEND RESTRUCTURE: INVENTORY & PLAN

## Current State Analysis

### Existing File Organization
```
Frontend/src/
  ├── component/
  │   └── GlobalStyles/
  │       ├── index.js
  │       └── GlobalStyles.scss
  ├── components/  [NEEDS REFACTORING]
  │   ├── Admin/
  │   │   ├── AdminDashboard.jsx
  │   │   ├── CreateSurveyPage.jsx
  │   │   └── ManageUsersPage.jsx
  │   ├── Common/
  │   │   ├── DashboardPage.jsx
  │   │   ├── DashboardRouter.jsx
  │   │   ├── ErrorBoundary.jsx
  │   │   ├── LandingPage.jsx
  │   │   ├── LoginPage.jsx
  │   │   ├── ProtectedRoute.jsx
  │   │   ├── ResponsiveDashboardLayout.jsx
  │   │   ├── ResponsiveTable.jsx
  │   │   ├── SignUpPage.jsx
  │   │   └── SurveyManagement.jsx
  │   ├── Student/
  │   │   ├── StudentDashboard.jsx
  │   │   └── SurveyResponsePage.jsx
  │   └── Teacher/
  │       ├── AnalyticsPage.jsx
  │       └── TeacherDashboard.jsx
  ├── contexts/
  │   └── AuthContext.jsx
  ├── hooks/
  │   └── useFormValidation.js
  ├── services/
  ├── styles/
  │   ├── auth-enhanced.scss
  │   ├── main.scss
  │   └── responsive.scss
  ├── types/
  │   └── index.js
  ├── utils/
  ├── App.jsx
  ├── App.css
  ├── index.css
  ├── index.jsx
  ├── routes/
  │   └── index.jsx (incomplete scaffold)
  └── logo.svg
```

### Categorization

**PAGES (Route-level components)** - Move to `/pages/`:
- LandingPage.jsx → pages/Landing/
- LoginPage.jsx → pages/Auth/Login/
- SignUpPage.jsx → pages/Auth/Register/
- DashboardPage.jsx → pages/Dashboard/
- DashboardRouter.jsx → pages/Dashboard/ (may merge with Dashboard)
- SurveyManagement.jsx → pages/Surveys/
- CreateSurveyPage.jsx → pages/Surveys/Create/
- ManageUsersPage.jsx → pages/Admin/ManageUsers/
- AnalyticsPage.jsx → pages/Analytics/
- SurveyResponsePage.jsx → pages/Surveys/Response/
- AdminDashboard.jsx → pages/Dashboard/Admin/
- StudentDashboard.jsx → pages/Dashboard/Student/
- TeacherDashboard.jsx → pages/Dashboard/Teacher/

**REUSABLE COMPONENTS** - Move/Extract to `/component/`:
- ErrorBoundary.jsx → component/Common/ErrorBoundary/
- ProtectedRoute.jsx → component/Common/ProtectedRoute/
- ResponsiveDashboardLayout.jsx → component/Layout/DefaultLayout/ (or refactor)
- ResponsiveTable.jsx → component/Table/ResponsiveTable/

**LAYOUT COMPONENTS** - Create under `/component/Layout/`:
- DefaultLayout (wrapping main app pages with Header + Sidebar)
- HeaderOnly (for auth pages - no sidebar)
- Header component
- Sidebar component

**UI COMPONENTS** - Extract from pages as needed:
- Form groups (scan for repeated form patterns)
- Cards (dashboard cards, survey cards)
- Tables/Lists (survey lists, user lists)
- Modals/Dialogs
- Buttons with common styling

**STYLES**:
- Convert auth-enhanced.scss, main.scss, responsive.scss to page/component-level SCSS modules
- Preserve global resets in GlobalStyles/GlobalStyles.scss
- Create one SCSS module per page/component folder

---

## Migration Plan

### Phase 1: Layout Structure
1. Create `src/component/Layout/DefaultLayout/index.jsx` + `DefaultLayout.module.scss`
2. Create `src/component/Layout/DefaultLayout/Header/index.jsx` + `Header.module.scss`
3. Create `src/component/Layout/DefaultLayout/Sidebar/index.jsx` + `Sidebar.module.scss`
4. Create `src/component/Layout/HeaderOnly/index.jsx` + `HeaderOnly.module.scss`
5. Extract header/sidebar logic from ResponsiveDashboardLayout if applicable

### Phase 2: Move Root-Level Pages
Move these to `/pages/` folder with exact structure:
- `pages/Landing/index.jsx` + `Landing.module.scss`
- `pages/Auth/Login/index.jsx` + `Login.module.scss`
- `pages/Auth/Register/index.jsx` + `Register.module.scss`
- `pages/Dashboard/index.jsx` + `Dashboard.module.scss` (merge DashboardPage + DashboardRouter)
- `pages/Surveys/index.jsx` + `Surveys.module.scss`
- `pages/Surveys/Create/index.jsx` + `Create.module.scss`
- `pages/Surveys/Response/index.jsx` + `Response.module.scss`
- `pages/Admin/ManageUsers/index.jsx` + `ManageUsers.module.scss`
- `pages/Analytics/index.jsx` + `Analytics.module.scss`

### Phase 3: Extract Reusable Components
Move to `/component/<ComponentName>/` with structure:
- `component/Common/ErrorBoundary/index.jsx` + `ErrorBoundary.module.scss`
- `component/Common/ProtectedRoute/index.jsx` + `ProtectedRoute.module.scss`
- `component/Table/ResponsiveTable/index.jsx` + `ResponsiveTable.module.scss`

Scan pages for repeated UI:
- Form components (inputs, validation, labels)
- Dashboard cards (analytics, survey preview)
- List items (survey row, user row)
- Navigation/menu items

### Phase 4: Style Migration
- Convert `styles/auth-enhanced.scss` → distributed to `pages/Auth/**/*.module.scss`
- Convert `styles/main.scss` → distributed to relevant pages/components + global reset in `component/GlobalStyles/`
- Convert `styles/responsive.scss` → merge into relevant SCSS modules or GlobalStyles
- Delete orphaned .css files (App.css, index.css)

### Phase 5: Routing Centralization
Update `src/routes/index.js`:
```jsx
// Import all page components
import Landing from '../pages/Landing';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
// ...etc

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HeaderOnly><Landing /></HeaderOnly>} />
      <Route path="/login" element={<HeaderOnly><Login /></HeaderOnly>} />
      <Route path="/signup" element={<HeaderOnly><Register /></HeaderOnly>} />
      <Route path="/dashboard" element={<DefaultLayout><Dashboard /></DefaultLayout>} />
      // ...etc
    </Routes>
  );
}
```

### Phase 6: Update App.jsx
- Import GlobalStyles from `component/GlobalStyles`
- Import AppRoutes from `routes`
- Remove scattered route definitions
- Wrap with GlobalStyles and AuthProvider

### Phase 7: Cleanup & Validation
- Delete orphaned files from `components/` (old folder)
- Delete `App.css`, `index.css` (replaced by SCSS modules)
- Fix all import paths (search for broken relative imports)
- Run npm start and verify all routes work
- Check browser console for style/import errors

---

## Acceptance Checklist

- [ ] All pages under `src/pages/**` with `index.jsx` + `.module.scss`
- [ ] All reusable components under `src/component/**` with `index.jsx` + `.module.scss`
- [ ] Layouts centralized: `DefaultLayout`, `HeaderOnly`, `Header`, `Sidebar`
- [ ] All CSS converted to SCSS modules (except GlobalStyles)
- [ ] Routing centralized in `src/routes/index.js`
- [ ] App.jsx wraps with GlobalStyles and AppRoutes
- [ ] No TypeScript, styled-components, Tailwind, MUI
- [ ] All imports updated and valid
- [ ] npm start runs without errors
- [ ] All routes navigate correctly (same behavior as before)
- [ ] No broken styles (className → styles.*)
- [ ] FRONTEND_RESTRUCTURE_REPORT.md generated

---

## Notes

- Preserve AuthContext, hooks, services, contexts (no changes needed there)
- Preserve types/ folder and its constants
- Bootstrap remains as external dependency (not removed)
- FontAwesome remains as external dependency
- DashboardRouter logic may merge into main Dashboard page
- ResponsiveDashboardLayout will inform the DefaultLayout structure

---

## Total Files to Move/Create: ~50+
## Estimated Impact: High (structural) + Low (behavioral)
## Risk Level: Low (no logic changes, only organization)
