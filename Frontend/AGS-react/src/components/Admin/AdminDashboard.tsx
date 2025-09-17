import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faUsers, 
  faFileText, 
  faChartLine, 
  faEdit, 
  faTrash,
  faCog,
  faUserShield,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { getRoleDisplayName } from '../../utils/roleUtils';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - sẽ được thay thế bằng API calls
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', status: 'active' },
    { id: 2, username: 'teacher1', email: 'teacher1@example.com', role: 'teacher', status: 'active' },
    { id: 3, username: 'student1', email: 'student1@example.com', role: 'student', status: 'active' },
  ]);

  const [surveys, setSurveys] = useState([
    { id: 1, title: 'Course Evaluation Q1 2025', creator: 'teacher1', responses: 45, status: 'active' },
    { id: 2, title: 'Teaching Quality Assessment', creator: 'teacher1', responses: 23, status: 'draft' },
  ]);

  const stats = {
    totalUsers: users.length,
    totalSurveys: surveys.length,
    totalResponses: 68,
    activeUsers: users.filter(u => u.status === 'active').length
  };

  useEffect(() => {
    if (!state.isAuthenticated || state.user?.role !== UserRole.ADMIN) {
      navigate('/login');
    }
  }, [state.isAuthenticated, state.user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleDeleteSurvey = (surveyId: number) => {
    setSurveys(surveys.filter(s => s.id !== surveyId));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'success',
      draft: 'warning',
      inactive: 'secondary'
    };
    return <Badge bg={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="min-vh-100 bg-light dashboard-responsive">
      {/* Header */}
      <div className="bg-white shadow-sm dashboard-header">
        <Container fluid className="px-3 px-lg-4">
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faUserShield} className="text-danger me-2" size="lg" />
              <h4 className="mb-0 text-danger dashboard-title">
                <span className="hidden-mobile">Admin </span>Dashboard
              </h4>
            </div>
            <div className="d-flex align-items-center">
              <div className="text-end me-3 hidden-mobile">
                <div className="fw-semibold">Welcome, {state.user?.username}</div>
                <small className="text-muted">{state.user ? getRoleDisplayName(state.user.role) : ''}</small>
              </div>
              <Button variant="outline-danger" size="sm" className="btn-responsive">
                <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                <span className="hidden-mobile">Logout</span>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container fluid className="py-3 py-lg-4 px-3 px-lg-4">
        <Row>
          {/* Sidebar */}
          <Col lg={3} className="mb-4 mb-lg-0">
            <Card className="border-0 shadow-sm card-responsive">
              <Card.Body>
                <Nav variant="pills" className="flex-column flex-lg-column flex-row d-lg-block overflow-auto">
                  <Nav.Item className="mb-2 flex-shrink-0">
                    <Nav.Link 
                      className={`${activeTab === 'overview' ? 'active' : ''} text-nowrap`}
                      onClick={() => setActiveTab('overview')}
                    >
                      <FontAwesomeIcon icon={faChartLine} className="me-2" />
                      <span className="hidden-mobile">Overview</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2 flex-shrink-0">
                    <Nav.Link 
                      className={`${activeTab === 'users' ? 'active' : ''} text-nowrap`}
                      onClick={() => setActiveTab('users')}
                    >
                      <FontAwesomeIcon icon={faUsers} className="me-2" />
                      <span className="hidden-mobile">Users</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      className={activeTab === 'surveys' ? 'active' : ''}
                      onClick={() => setActiveTab('surveys')}
                    >
                      <FontAwesomeIcon icon={faFileText} className="me-2" />
                      Survey Management
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      className={activeTab === 'settings' ? 'active' : ''}
                      onClick={() => setActiveTab('settings')}
                    >
                      <FontAwesomeIcon icon={faCog} className="me-2" />
                      System Settings
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col md={9}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <FontAwesomeIcon icon={faUsers} size="2x" className="text-primary mb-2" />
                        <h3 className="mb-1">{stats.totalUsers}</h3>
                        <p className="text-muted mb-0">Total Users</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <FontAwesomeIcon icon={faFileText} size="2x" className="text-success mb-2" />
                        <h3 className="mb-1">{stats.totalSurveys}</h3>
                        <p className="text-muted mb-0">Total Surveys</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <FontAwesomeIcon icon={faChartLine} size="2x" className="text-warning mb-2" />
                        <h3 className="mb-1">{stats.totalResponses}</h3>
                        <p className="text-muted mb-0">Total Responses</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <FontAwesomeIcon icon={faUsers} size="2x" className="text-info mb-2" />
                        <h3 className="mb-1">{stats.activeUsers}</h3>
                        <p className="text-muted mb-0">Active Users</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white">
                    <h5 className="mb-0">System Activity</h5>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted">Recent system activities and statistics will be displayed here.</p>
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">User Management</h5>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => navigate('/admin/users/create')}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    Add User
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{getRoleDisplayName(user.role as UserRole)}</td>
                          <td>{getStatusBadge(user.status)}</td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1">
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* Surveys Tab */}
            {activeTab === 'surveys' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Survey Management</h5>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => navigate('/create-survey')}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    Create Survey
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Creator</th>
                        <th>Responses</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surveys.map(survey => (
                        <tr key={survey.id}>
                          <td>{survey.id}</td>
                          <td>{survey.title}</td>
                          <td>{survey.creator}</td>
                          <td>{survey.responses}</td>
                          <td>{getStatusBadge(survey.status)}</td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1">
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteSurvey(survey.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">System Settings</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">System configuration and settings will be available here.</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;