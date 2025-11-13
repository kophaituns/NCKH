import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Sidebar.module.scss';

const Sidebar = ({ isOpen, onClose }) => {
  const { state } = useAuth();
  const userRole = state.user?.role;

  // Define menu items based on roles
  const getMenuItems = () => {
    const baseItems = [];

    if (userRole === 'admin') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: '/users', label: 'Users', icon: 'users' },
        { path: '/templates', label: 'Templates', icon: 'templates' },
        { path: '/surveys', label: 'Surveys', icon: 'surveys' },
        { path: '/analytics', label: 'Analytics', icon: 'analytics' },
        { path: '/llm', label: 'AI Generation', icon: 'llm' },
      ];
    }

    if (userRole === 'creator') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: '/templates', label: 'Templates', icon: 'templates' },
        { path: '/surveys', label: 'Surveys', icon: 'surveys' },
        { path: '/collectors', label: 'Collectors', icon: 'collectors' },
        { path: '/analytics', label: 'Analytics', icon: 'analytics' },
      ];
    }

    if (userRole === 'user') {
      return [
        { path: '/surveys', label: 'My Surveys', icon: 'surveys' },
        { path: '/responses', label: 'My Responses', icon: 'responses' },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const getIcon = (iconName) => {
    const icons = {
      dashboard: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      users: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 17a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      templates: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      surveys: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 3h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 7h6M7 10h6M7 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      collectors: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 3h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="7" y="7" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="9" y="9" width="2" height="2" fill="currentColor"/>
        </svg>
      ),
      responses: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M9 17l-5-5 5-5M15 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      analytics: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 17V10M10 17V3M17 17v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      llm: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
    };

    return icons[iconName] || icons.dashboard;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className={styles.overlay}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Navigation</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              onClick={onClose}
            >
              <span className={styles.navIcon}>{getIcon(item.icon)}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Role indicator at bottom */}
        <div className={styles.sidebarFooter}>
          <div className={styles.roleIndicator}>
            <div className={styles.roleIcon}>
              {userRole === 'admin' && '👑'}
              {userRole === 'creator' && '✏️'}
              {userRole === 'user' && '👤'}
            </div>
            <div className={styles.roleInfo}>
              <span className={styles.roleLabel}>Logged in as</span>
              <span className={styles.roleName}>{userRole}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
