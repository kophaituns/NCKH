import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Table, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faFileText, 
  faChartLine, 
  faEdit, 
  faEye,
  faRobot,
  faSignOutAlt,
  faChalkboardTeacher,
  faUsers,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { UserRole } from '../../types.jsx';
import { getRoleDisplayName } from '../../utils/roleUtils.jsx';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - sẽ được thay thế bằng API calls
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mySurveys, setMySurveys] = useState([
    { 
      id, 
      title: 'Course Evaluation - Web Development', 
      responses, 
      targetResponses,
      status: 'active',
      createdAt: '2025-09-01',
      endDate: '2025-09-30'
    },
    { 
      id, 
      title: 'Teaching Quality Assessment', 
      responses, 
      targetResponses,
      status: 'draft',
      createdAt: '2025-09-10',
      endDate: '2025-09-25'
    },
    { 
      id, 
      title: 'Student Feedback Q1 2025', 
      responses, 
      targetResponses,
      status: 'completed',
      createdAt: '2025-08-15',
      endDate: '2025-08-30'
    }
  ]);

  const stats = {
    totalSurveys: mySurveys.length,
    activeSurveys: mySurveys.filter(s => s.status === 'active').length,
    totalResponses: mySurveys.reduce((sum, s) => sum + s.responses, 0),
    avgResponseRate: Math.round((mySurveys.reduce((sum, s) => sum + (s.responses / s.targetResponses * 100), 0) / mySurveys.length))
  };

  useEffect(() => {
    if (!state.isAuthenticated || state.user?.role !== UserRole.TEACHER) {
      navigate('/login');
    }
  }, [state.isAuthenticated, state.user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      draft: 'warning',
      completed: 'info',
      closed: 'secondary'
    };
    return <Badge bg={variants[status typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getResponseProgress = (responses, target) => {
    const percentage = Math.round((responses / target) * 100);
    return (
      <div>
        <div className="d-flex justify-content-between mb-1">
          <small>{responses}/{target} responses</small>
          <small>{percentage}%</small>
        </div>
        <ProgressBar 
          now={percentage} 
          variant={percentage >= 80 ? 'success' : percentage >= 50 ? 'info' : 'warning'}
          style={{ height: '6px' }}
        />
      </div>
    );
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="text-primary me-2" size="lg" />
              <h4 className="mb-0 text-primary">Teacher Dashboard</h4>
            </div>
            <div className="d-flex align-items-center">
              <div className="text-end me-3">
                <div className="fw-semibold">Welcome, {state.user?.username}</div>
                <small className="text-muted">{state.user ? getRoleDisplayName(state.user.role) : ''}</small>
              </div>
              <Button variant="outline-primary" size="sm" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                Logout
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container fluid className="py-4">
        <Row>
          {/* Sidebar */}
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      className={activeTab === 'overview' ? 'active' : ''}
                      onClick={() => setActiveTab('overview')}
                    >
                      <FontAwesomeIcon icon={faChartLine} className="me-2" />
                      Overview
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      className={activeTab === 'surveys' ? 'active' : ''}
                      onClick={() => setActiveTab('surveys')}
                    >
                      <FontAwesomeIcon icon={faFileText} className="me-2" />
                      My Surveys
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      className={activeTab === 'create' ? 'active' : ''}
                      onClick={() => setActiveTab('create')}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Create Survey
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      className={activeTab === 'analytics' ? 'active' : ''}
                      onClick={() => setActiveTab('analytics')}
                    >
                      <FontAwesomeIcon icon={faChartLine} className="me-2" />
                      Analytics
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
                        <FontAwesomeIcon icon={faFileText} size="2x" className="text-primary mb-2" />
                        <h3 className="mb-1">{stats.totalSurveys}</h3>
                        <p className="text-muted mb-0">Total Surveys</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <FontAwesomeIcon icon={faClipboardList} size="2x" className="text-success mb-2" />
                        <h3 className="mb-1">{stats.activeSurveys}</h3>
                        <p className="text-muted mb-0">Active Surveys</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <FontAwesomeIcon icon={faUsers} size="2x" className="text-info mb-2" />
                        <h3 className="mb-1">{stats.totalResponses}</h3>
                        <p className="text-muted mb-0">Total Responses</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <FontAwesomeIcon icon={faChartLine} size="2x" className="text-warning mb-2" />
                        <h3 className="mb-1">{stats.avgResponseRate}%</h3>
                        <p className="text-muted mb-0">Avg Response Rate</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={8}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Header className="bg-white">
                        <h5 className="mb-0">Recent Surveys</h5>
                      </Card.Header>
                      <Card.Body>
                        {mySurveys.slice(0, 3).map(survey => (
                          <div key={survey.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                            <div>
                              <h6 className="mb-1">{survey.title}</h6>
                              <small className="text-muted">Created: {survey.createdAt}</small>
                            </div>
                            <div className="text-end">
                              {getStatusBadge(survey.status)}
                              <div className="mt-1">
                                <small>{survey.responses} responses</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-white">
                        <h5 className="mb-0">Quick Actions</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-grid gap-2">
                          <Button 
                            variant="primary"
                            onClick={() => navigate('/create-survey')}
                          >
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Create New Survey
                          </Button>
                          <Button 
                            variant="outline-primary"
                            onClick={() => setActiveTab('analytics')}
                          >
                            <FontAwesomeIcon icon={faChartLine} className="me-2" />
                            View Analytics
                          </Button>
                          <Button 
                            variant="outline-info"
                            onClick={() => setActiveTab('surveys')}
                          >
                            <FontAwesomeIcon icon={faFileText} className="me-2" />
                            Manage Surveys
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {/* Surveys Tab */}
            {activeTab === 'surveys' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">My Surveys</h5>
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
                        <th>Title</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>End Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySurveys.map(survey => (
                        <tr key={survey.id}>
                          <td>
                            <div>
                              <h6 className="mb-1">{survey.title}</h6>
                              <small className="text-muted">ID: {survey.id}</small>
                            </div>
                          </td>
                          <td>{getStatusBadge(survey.status)}</td>
                          <td style={{ minWidth: '150px' }}>
                            {getResponseProgress(survey.responses, survey.targetResponses)}
                          </td>
                          <td>{survey.endDate}</td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1">
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                            <Button variant="outline-secondary" size="sm" className="me-1">
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button variant="outline-info" size="sm">
                              <FontAwesomeIcon icon={faChartLine} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* Create Tab */}
            {activeTab === 'create' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Create New Survey</h5>
                </Card.Header>
                <Card.Body className="text-center py-5">
                  <FontAwesomeIcon icon={faRobot} size="3x" className="text-primary mb-3" />
                  <h5>AI-Powered Survey Creation</h5>
                  <p className="text-muted mb-4">Let AI help you create professional surveys quickly</p>
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate('/create-survey')}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Start Creating Survey
                  </Button>
                </Card.Body>
              </Card>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Survey Analytics</h5>
                </Card.Header>
                <Card.Body className="text-center py-5">
                  <FontAwesomeIcon icon={faChartLine} size="3x" className="text-info mb-3" />
                  <h5>Advanced Analytics</h5>
                  <p className="text-muted mb-4">Detailed insights and reports for your surveys</p>
                  <Button 
                    variant="info" 
                    onClick={() => navigate('/analytics')}
                  >
                    <FontAwesomeIcon icon={faChartLine} className="me-2" />
                    View Detailed Analytics
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TeacherDashboard;