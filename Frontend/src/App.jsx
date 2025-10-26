import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx';
import LandingPage from './components/Common/LandingPage.jsx';
import LoginPage from './components/Common/LoginPage.jsx';
import SignUpPage from './components/Common/SignUpPage.jsx';
import DashboardRouter from './components/Common/DashboardRouter.jsx';
import ProtectedRoute from './components/Common/ProtectedRoute.jsx';
import SurveyManagement from './components/Common/SurveyManagement.jsx';
import CreateSurveyPage from './components/Admin/CreateSurveyPage.jsx';
import ManageUsersPage from './components/Admin/ManageUsersPage.jsx';
import AnalyticsPage from './components/Teacher/AnalyticsPage.jsx';
import SurveyResponsePage from './components/Student/SurveyResponsePage.jsx';
import { UserRole } from './types.jsx';

// Import Bootstrap CSS and custom SCSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.scss';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            {/* Protected Routes - Role-based Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin & Teacher Routes */}
            <Route 
              path="/surveys" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                  <SurveyManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-survey" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                  <CreateSurveyPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Only Routes */}
            <Route 
              path="/manage-users" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <ManageUsersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Teacher Routes */}
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics/:surveyId" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Student Routes */}
            <Route 
              path="/survey/:id" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                  <SurveyResponsePage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
