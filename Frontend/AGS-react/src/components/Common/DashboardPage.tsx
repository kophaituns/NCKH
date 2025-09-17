import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Nav, Button, Navbar, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faPlus, 
  faChartLine, 
  faUsers, 
  faEye,
  faCog,
  faSignOutAlt,
  faFileText,
  faBrain,
  faUserCheck
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { getRoleDisplayName, canCreateSurveys, canManageUsers } from '../../utils/roleUtils';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const [stats] = useState({
    totalSurveys: 2847,
    totalResponses: 18302,
    completionRate: 94.2,
    activeUsers: 1294,
  });

  const [recentSurveys] = useState([
    { id: 1, title: 'IT Department Satisfaction Survey', responses: 145, status: 'Active' },
    { id: 2, title: 'Marketing Campaign Effectiveness', responses: 89, status: 'Active' },
    { id: 3, title: 'Economic Impact Assessment', responses: 234, status: 'Completed' },
    { id: 4, title: 'User Experience Feedback', responses: 67, status: 'Draft' },
  ]);

  useEffect(() => {
    if (!state.isAuthenticated) {
      navigate('/login');
    }
  }, [state.isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userCanCreateSurveys = state.user ? canCreateSurveys(state.user.role) : false;
  const userCanManageUsers = state.user ? canManageUsers(state.user.role) : false;

  return (
    <div className="min-vh-100 bg-light">
      {/* Top Navigation */}
      <Navbar bg="white" className="shadow-sm px-0">
        <Container fluid>
          <Navbar.Brand className="nav-brand">
            <FontAwesomeIcon icon={faRobot} className="text-primary me-2" />
            Smart <span className="text-gradient-primary">Survey</span> AI
          </Navbar.Brand>
          
          <div className="d-flex align-items-center">
            <div className="text-end me-3">
              <div className="text-dark fw-semibold">Welcome, {state.user?.username}</div>
              <small className="text-muted">{state.user ? getRoleDisplayName(state.user.role) : ''}</small>
            </div>
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                <FontAwesomeIcon icon={faCog} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>
                  <FontAwesomeIcon icon={faUserCheck} className="me-2" />
                  Profile Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col lg={3} xl={2} className="sidebar p-0">
            <Nav className="flex-column p-3">
              <Nav.Item className="mb-2">
                <Nav.Link 
                  className={activeTab === 'overview' ? 'active' : ''}
                  onClick={() => setActiveTab('overview')}
                >
                  <FontAwesomeIcon icon={faChartLine} className="me-2" />
                  Overview
                </Nav.Link>
              </Nav.Item>
              
              {userCanCreateSurveys && (
                <Nav.Item className="mb-2">
                  <Nav.Link 
                    className={activeTab === 'surveys' ? 'active' : ''}
                    onClick={() => setActiveTab('surveys')}
                  >
                    <FontAwesomeIcon icon={faFileText} className="me-2" />
                    My Surveys
                  </Nav.Link>
                </Nav.Item>
              )}

              <Nav.Item className="mb-2">
                <Nav.Link 
                  className={activeTab === 'responses' ? 'active' : ''}
                  onClick={() => setActiveTab('responses')}
                >
                  <FontAwesomeIcon icon={faEye} className="me-2" />
                  Survey Responses
                </Nav.Link>
              </Nav.Item>

              <Nav.Item className="mb-2">
                <Nav.Link 
                  className={activeTab === 'analytics' ? 'active' : ''}
                  onClick={() => setActiveTab('analytics')}
                >
                  <FontAwesomeIcon icon={faBrain} className="me-2" />
                  AI Analytics
                </Nav.Link>
              </Nav.Item>

              {userCanManageUsers && (
                <Nav.Item className="mb-2">
                  <Nav.Link 
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                  >
                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                    Manage Users
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>
          </Col>

          {/* Main Content */}
          <Col lg={9} xl={10} className="main-content">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h2 fw-bold text-dark">Dashboard</h1>
                <p className="text-muted mb-0">Welcome to your AI-powered survey management platform</p>
              </div>
              {userCanCreateSurveys && (
                <Button 
                  className="btn-gradient-primary"
                  onClick={() => navigate('/create-survey')}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Create Survey
                </Button>
              )}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Stats Cards */}
                <Row className="g-4 mb-4">
                  <Col md={3}>
                    <Card className="stats-card border-0">
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <div>
                            <h3 className="h2 fw-bold text-primary mb-1">{stats.totalSurveys.toLocaleString()}</h3>
                            <p className="text-muted mb-0">Total Surveys</p>
                          </div>
                          <FontAwesomeIcon icon={faFileText} className="text-primary" size="2x" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={3}>
                    <Card className="stats-card border-0">
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <div>
                            <h3 className="h2 fw-bold text-success mb-1">{stats.totalResponses.toLocaleString()}</h3>
                            <p className="text-muted mb-0">Total Responses</p>
                          </div>
                          <FontAwesomeIcon icon={faEye} className="text-success" size="2x" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={3}>
                    <Card className="stats-card border-0">
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <div>
                            <h3 className="h2 fw-bold text-warning mb-1">{stats.completionRate}%</h3>
                            <p className="text-muted mb-0">Completion Rate</p>
                          </div>
                          <FontAwesomeIcon icon={faChartLine} className="text-warning" size="2x" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={3}>
                    <Card className="stats-card border-0">
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <div>
                            <h3 className="h2 fw-bold text-info mb-1">{stats.activeUsers.toLocaleString()}</h3>
                            <p className="text-muted mb-0">Active Users</p>
                          </div>
                          <FontAwesomeIcon icon={faUsers} className="text-info" size="2x" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Recent Surveys */}
                <Card className="border-0">
                  <Card.Header className="bg-white border-bottom">
                    <h5 className="mb-0 fw-semibold">Recent Surveys</h5>
                  </Card.Header>
                  <Card.Body>
                    {recentSurveys.map((survey) => (
                      <div key={survey.id} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                        <div>
                          <h6 className="mb-1 fw-semibold">{survey.title}</h6>
                          <small className="text-muted">{survey.responses} responses</small>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className={`badge ${
                            survey.status === 'Active' ? 'bg-success' :
                            survey.status === 'Completed' ? 'bg-primary' : 'bg-secondary'
                          } me-3`}>
                            {survey.status}
                          </span>
                          <Button variant="outline-primary" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Other tabs content */}
            {activeTab === 'surveys' && (
              <Card className="border-0">
                <Card.Body className="text-center py-5">
                  <FontAwesomeIcon icon={faFileText} size="3x" className="text-muted mb-3" />
                  <h5>My Surveys</h5>
                  <p className="text-muted">Manage your created surveys here</p>
                  <Button className="btn-gradient-primary">
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Create Your First Survey
                  </Button>
                </Card.Body>
              </Card>
            )}

            {activeTab === 'responses' && (
              <Card className="border-0">
                <Card.Body className="text-center py-5">
                  <FontAwesomeIcon icon={faEye} size="3x" className="text-muted mb-3" />
                  <h5>Survey Responses</h5>
                  <p className="text-muted">View and analyze survey responses</p>
                </Card.Body>
              </Card>
            )}

            {activeTab === 'analytics' && (
              <Card className="border-0">
                <Card.Body className="text-center py-5">
                  <FontAwesomeIcon icon={faBrain} size="3x" className="text-muted mb-3" />
                  <h5>AI Analytics</h5>
                  <p className="text-muted">Get AI-powered insights from your survey data</p>
                </Card.Body>
              </Card>
            )}

            {activeTab === 'users' && userCanManageUsers && (
              <Card className="border-0">
                <Card.Body className="text-center py-5">
                  <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3" />
                  <h5>User Management</h5>
                  <p className="text-muted">Manage user accounts and permissions</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DashboardPage;