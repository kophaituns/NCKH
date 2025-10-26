import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { Nav, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt,
  faFileAlt,
  faChartBar,
  faUsers,
  faCog,
  faQuestionnaire,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { UserRole } from '../../../types/index.js';
import styles from './Sidebar.module.scss';

function Sidebar() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const isActive = (path) => location.pathname.startsWith(path);

  const toggleExpanded = (key) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderNavItem = (label, path, icon, badge = null) => (
    <Nav.Link
      onClick={() => navigate(path)}
      className={`${styles.navItem} ${isActive(path) ? styles.active : ''}`}
    >
      <FontAwesomeIcon icon={icon} className={styles.icon} />
      <span className={styles.label}>{label}</span>
      {badge && <span className={`badge bg-primary ms-2`}>{badge}</span>}
    </Nav.Link>
  );

  const renderCollapsibleMenu = (key, label, icon, items) => (
    <div key={key}>
      <button
        onClick={() => toggleExpanded(key)}
        className={`${styles.collapsibleBtn} ${expandedMenus[key] ? styles.expanded : ''}`}
      >
        <FontAwesomeIcon icon={icon} className={styles.icon} />
        <span className={styles.label}>{label}</span>
        <FontAwesomeIcon 
          icon={expandedMenus[key] ? faChevronUp : faChevronDown} 
          className={styles.chevron}
        />
      </button>
      {expandedMenus[key] && (
        <div className={styles.submenu}>
          {items.map((item, idx) => (
            <div key={idx}>
              {renderNavItem(item.label, item.path, item.icon, item.badge)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className={`border-0 shadow-sm ${styles.sidebar}`}>
      <Card.Body className={styles.body}>
        <Nav className="flex-column">
          {/* Dashboard */}
          {renderNavItem('Dashboard', '/dashboard', faTachometerAlt)}

          {/* Surveys */}
          {(state.user?.role === UserRole.ADMIN || state.user?.role === UserRole.TEACHER) && (
            renderCollapsibleMenu(
              'surveys',
              'Surveys',
              faFileAlt,
              [
                { label: 'Browse', path: '/surveys', icon: faFileAlt },
                { label: 'Create', path: '/create-survey', icon: faQuestionnaire }
              ]
            )
          )}

          {/* Student Responses */}
          {(state.user?.role === UserRole.STUDENT) && (
            renderNavItem('My Surveys', '/surveys', faFileAlt)
          )}

          {/* Analytics */}
          {(state.user?.role === UserRole.ADMIN || state.user?.role === UserRole.TEACHER) && (
            renderNavItem('Analytics', '/analytics', faChartBar)
          )}

          {/* Admin Only */}
          {state.user?.role === UserRole.ADMIN && (
            <>
              <hr className={styles.divider} />
              {renderNavItem('Manage Users', '/manage-users', faUsers)}
            </>
          )}

          {/* Settings */}
          <hr className={styles.divider} />
          {renderNavItem('Settings', '/settings', faCog)}
        </Nav>
      </Card.Body>
    </Card>
  );
}

export default Sidebar;
