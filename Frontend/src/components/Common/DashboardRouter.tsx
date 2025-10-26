import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import AdminDashboard from '../Admin/AdminDashboard';
import TeacherDashboard from '../Teacher/TeacherDashboard';
import StudentDashboard from '../Student/StudentDashboard';
import { Navigate } from 'react-router-dom';

const DashboardRouter: React.FC = () => {
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