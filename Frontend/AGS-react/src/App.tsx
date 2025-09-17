import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/Common/LandingPage';
import LoginPage from './components/Common/LoginPage';
import SignUpPage from './components/Common/SignUpPage';
import DashboardRouter from './components/Common/DashboardRouter';
import ProtectedRoute from './components/Common/ProtectedRoute';
import SurveyManagement from './components/Common/SurveyManagement';
import CreateSurveyPage from './components/Admin/CreateSurveyPage';
import ManageUsersPage from './components/Admin/ManageUsersPage';
import AnalyticsPage from './components/Teacher/AnalyticsPage';
import SurveyResponsePage from './components/Student/SurveyResponsePage';
import { UserRole } from './types';

// Import Bootstrap CSS and custom SCSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.scss';

function App() {
  return (
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
  );
}

export default App;
