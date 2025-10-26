import React from 'react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Dropdown, Nav, Navbar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOut, faHome, faCog } from '@fortawesome/free-solid-svg-icons';
import styles from './Header.module.scss';

function Header() {
  const { state, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className={`shadow-sm sticky-top ${styles.header}`}>
      <Container fluid className="px-3 px-lg-4">
        <Navbar.Brand 
          onClick={() => navigate('/')}
          className={styles.brand}
        >
          <span className={styles.brandText}>AllMTags</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center">
            {state.isAuthenticated && state.user && (
              <>
                <Nav.Link 
                  onClick={() => navigate('/dashboard')}
                  className={styles.navLink}
                >
                  <FontAwesomeIcon icon={faHome} className="me-2" />
                  Dashboard
                </Nav.Link>

                <Dropdown className="ms-3">
                  <Dropdown.Toggle 
                    variant="link" 
                    id="user-dropdown"
                    className={styles.dropdownToggle}
                  >
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    {state.user.name || state.user.email}
                  </Dropdown.Toggle>

                  <Dropdown.Menu align="end">
                    <Dropdown.Item disabled>
                      <small className={styles.userEmail}>{state.user.email}</small>
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      onClick={() => navigate('/profile')}
                      className={styles.dropdownItem}
                    >
                      <FontAwesomeIcon icon={faCog} className="me-2" />
                      Settings
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={handleLogout}
                      className={styles.dropdownItemLogout}
                    >
                      <FontAwesomeIcon icon={faSignOut} className="me-2" />
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
