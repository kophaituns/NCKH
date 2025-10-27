import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { UserRole } from '../../constants/userRoles.js';
import AdminDashboard from '../Admin/AdminDashboard.jsx';
import TeacherDashboard from '../Teacher/TeacherDashboard.jsx';
import StudentDashboard from '../Student/StudentDashboard.jsx';
import { Navigate } from 'react-router-dom';

const DashboardRouter = () => {
  const { state } = useAuth();

  // Redirect to login if not authenticated
  if (!state.isAuthenticated || !state.user) {
    return <Navigate to="/login" replace />;
  }

  // Route to appropriate dashboard based on user role
  switch (state.user.role) {
    case UserRole.ADMIN:
      return <AdminDashboard />;
    case UserRole.TEACHER:
      return <TeacherDashboard />;
    case UserRole.STUDENT:
      return <StudentDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default DashboardRouter;