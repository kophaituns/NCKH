import { UserRole } from '../types';

/**
 * Get display name for user role
 * @param role - The user role enum value
 * @returns Human readable role name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.TEACHER:
      return 'Teacher';
    case UserRole.STUDENT:
      return 'Student';
    default:
      return 'Unknown';
  }
};

/**
 * Get role description for user interface
 * @param role - The user role enum value
 * @returns Role description
 */
export const getRoleDescription = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Full system access and user management';
    case UserRole.TEACHER:
      return 'Can create and manage surveys';
    case UserRole.STUDENT:
      return 'Can participate in surveys';
    default:
      return 'No description available';
  }
};

/**
 * Get role icon for UI display
 * @param role - The user role enum value
 * @returns FontAwesome icon name
 */
export const getRoleIcon = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'fa-user-shield';
    case UserRole.TEACHER:
      return 'fa-chalkboard-teacher';
    case UserRole.STUDENT:
      return 'fa-graduation-cap';
    default:
      return 'fa-user';
  }
};

/**
 * Check if role can create surveys
 * @param role - The user role enum value
 * @returns boolean
 */
export const canCreateSurveys = (role: UserRole): boolean => {
  return role === UserRole.ADMIN || role === UserRole.TEACHER;
};

/**
 * Check if role can manage users
 * @param role - The user role enum value
 * @returns boolean
 */
export const canManageUsers = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

/**
 * Check if role can analyze responses
 * @param role - The user role enum value
 * @returns boolean
 */
export const canAnalyzeResponses = (role: UserRole): boolean => {
  return role === UserRole.ADMIN || role === UserRole.TEACHER;
};