import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout imports
import DefaultLayout from '../component/Layout/DefaultLayout/index.jsx';
import HeaderOnly from '../component/Layout/HeaderOnly/index.jsx';

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

// Common components
import ProtectedRoute from '../component/Common/ProtectedRoute/index.jsx';
import { UserRole } from '../types/index.js';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - with HeaderOnly layout */}
      <Route 
        path="/" 
        element={<HeaderOnly><Landing /></HeaderOnly>} 
      />
      <Route 
        path="/login" 
        element={<HeaderOnly><Login /></HeaderOnly>} 
      />
      <Route 
        path="/signup" 
        element={<HeaderOnly><Register /></HeaderOnly>} 
      />

      {/* Protected Routes - with DefaultLayout */}
      
      {/* Dashboard - all authenticated users */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DefaultLayout>
              <Dashboard />
            </DefaultLayout>
          </ProtectedRoute>
        } 
      />

      {/* Surveys - Admin & Teacher */}
      <Route 
        path="/surveys" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
            <DefaultLayout>
              <SurveysList />
            </DefaultLayout>
          </ProtectedRoute>
        } 
      />

      {/* Create Survey - Admin & Teacher */}
      <Route 
        path="/create-survey" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
            <DefaultLayout>
              <CreateSurvey />
            </DefaultLayout>
          </ProtectedRoute>
        } 
      />

      {/* Survey Response - Student */}
      <Route 
        path="/survey/:id" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <DefaultLayout>
              <SurveyResponse />
            </DefaultLayout>
          </ProtectedRoute>
        } 
      />

      {/* Analytics - Admin & Teacher */}
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
            <DefaultLayout>
              <Analytics />
            </DefaultLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics/:surveyId" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
            <DefaultLayout>
              <Analytics />
            </DefaultLayout>
          </ProtectedRoute>
        } 
      />

      {/* Manage Users - Admin only */}
      <Route 
        path="/manage-users" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <DefaultLayout>
              <ManageUsers />
            </DefaultLayout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default AppRoutes;
