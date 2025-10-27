// Layout imports
import DefaultLayout from '../component/Layout/DefaultLayout/index.jsx';

// Page imports
import Landing from '../pages/Landing/index.jsx';
import Login from '../pages/Auth/Login/index.jsx';
import Register from '../pages/Auth/Register/index.jsx';
import Dashboard from '../pages/Dashboard/index.jsx';
import SurveysList from '../pages/Surveys/List/index.jsx';
import CreateSurvey from '../pages/Surveys/Create/index.jsx';
import SurveyResponse from '../pages/Surveys/Response/index.jsx';
import ManageUsers from '../pages/Admin/ManageUsers/index.jsx';
import Analytics from '../pages/Analytics/index.jsx';

import { UserRole } from '../constants/userRoles.js';

// Public routes (không cần đăng nhập)
export const publicRoutes = [
  { path: '/', component: Landing, layout: null },
  { path: '/login', component: Login, layout: null },
  { path: '/register', component: Register, layout: null }
];

// Private routes (cần đăng nhập + kiểm tra role)
export const privateRoutes = [
  { 
    path: '/dashboard', 
    component: Dashboard, 
    layout: DefaultLayout 
  },
  { 
    path: '/surveys', 
    component: SurveysList, 
    layout: DefaultLayout,
    allowedRoles: [UserRole.ADMIN, UserRole.TEACHER]
  },
  { 
    path: '/create-survey', 
    component: CreateSurvey, 
    layout: DefaultLayout,
    allowedRoles: [UserRole.ADMIN, UserRole.TEACHER]
  },
  { 
    path: '/survey/:id', 
    component: SurveyResponse, 
    layout: DefaultLayout,
    allowedRoles: [UserRole.STUDENT]
  },
  { 
    path: '/analytics', 
    component: Analytics, 
    layout: DefaultLayout,
    allowedRoles: [UserRole.ADMIN, UserRole.TEACHER]
  },
  { 
    path: '/analytics/:surveyId', 
    component: Analytics, 
    layout: DefaultLayout,
    allowedRoles: [UserRole.ADMIN, UserRole.TEACHER]
  },
  { 
    path: '/manage-users', 
    component: ManageUsers, 
    layout: DefaultLayout,
    allowedRoles: [UserRole.ADMIN]
  }
];
