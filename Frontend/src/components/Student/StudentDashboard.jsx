import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardCheck,
  faHistory,
  faPlay,
  faCheck,
  faClock,
  faSignOutAlt,
  faGraduationCap,
  faChartBar,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { UserRole } from '../../types.jsx';
import { getRoleDisplayName } from '../../utils/roleUtils.jsx';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('available');

  // Mock data - sẽ được thay thế bằng API calls
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableSurveys, setAvailableSurveys] = useState([
    {
      id,
      title: 'Course Evaluation - Web Development',
      description: 'Please evaluate the quality of our Web Development course',
      teacher: 'Prof. Nguyễn Văn A',
      deadline: '2025-09-30',
      estimatedTime: '10-15 minutes',
      status: 'not_started'
    },
    {
      id,
      title: 'Teaching Quality Assessment',
      description: 'Help us improve our teaching methods',
      teacher: 'Dr. Trần Thị B',
      deadline: '2025-09-25',
      estimatedTime: '5-10 minutes',
      status: 'not_started'
    }
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [completedSurveys, setCompletedSurveys] = useState([
    {
      id,
      title: 'Student Feedback Q1 2025',
      description: 'Feedback about student services',
      teacher: 'Admin',
      completedAt: '2025-09-05',
      canViewResults: true
    }
  ]);

  const stats = {
    availableSurveys: availableSurveys.length,
    completedSurveys: completedSurveys.length,
    pendingSurveys: availableSurveys.filter(s => s.status === 'not_started').length,
    totalParticipated: completedSurveys.length
  };

  useEffect(() => {
    if (!state.isAuthenticated || state.user?.role !== UserRole.STUDENT) {
      navigate('/login');
    }
  }, [state.isAuthenticated, state.user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartSurvey = (surveyId) => {
    navigate(`/survey/${surveyId}`);
  };

  const getDaysRemaining = (deadline) => {
    const now = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (deadline) => {
    const days = getDaysRemaining(deadline);
    if (days <= 1) return 'danger';
    if (days <= 3) return 'warning';
    return 'info';
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-success me-2" size="lg" />
              <h4 className="mb-0 text-success">Student Dashboard</h4>
            </div>
            <div className="d-flex align-items-center">
              <div className="text-end me-3">
                <div className="fw-semibold">Welcome, {state.user?.username}</div>
                <small className="text-muted">{state.user ? getRoleDisplayName(state.user.role) : ''}</small>
              </div>
              <Button variant="outline-success" size="sm" onClick={handleLogout}>
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
                      className={activeTab === 'available' ? 'active' : ''}
                      onClick={() => setActiveTab('available')}
                    >
                      <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
                      Available Surveys
                      {stats.availableSurveys > 0 && (
                        <Badge bg="primary" className="ms-2">{stats.availableSurveys}</Badge>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      className={activeTab === 'completed' ? 'active' : ''}
                      onClick={() => setActiveTab('completed')}
                    >
                      <FontAwesomeIcon icon={faHistory} className="me-2" />
                      Completed Surveys
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      className={activeTab === 'profile' ? 'active' : ''}
                      onClick={() => setActiveTab('profile')}
                    >
                      <FontAwesomeIcon icon={faGraduationCap} className="me-2" />
                      My Profile
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-sm mt-3">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Your Stats</h6>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <FontAwesomeIcon icon={faChartBar} size="2x" className="text-success mb-2" />
                  <h4 className="mb-1">{stats.totalParticipated}</h4>
                  <small className="text-muted">Surveys Completed</small>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Pending:</small>
                  <strong>{stats.pendingSurveys}</strong>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col md={9}>
            {/* Available Surveys Tab */}
            {activeTab === 'available' && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">Available Surveys</h5>
                  <Badge bg="primary">{stats.availableSurveys} surveys available</Badge>
                </div>

                {availableSurveys.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                      <FontAwesomeIcon icon={faClipboardCheck} size="3x" className="text-muted mb-3" />
                      <h5>No Surveys Available</h5>
                      <p className="text-muted">Check back later for new surveys to participate in.</p>
                    </Card.Body>
                  </Card>
                ) : (
                  <Row>
                    {availableSurveys.map(survey => {
                      const daysRemaining = getDaysRemaining(survey.deadline);
                      return (
                        <Col md={6} key={survey.id} className="mb-4">
                          <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                              <h6 className="mb-0">{survey.title}</h6>
                              <Badge bg={getDeadlineColor(survey.deadline)}>
                                <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Due today'}
                              </Badge>
                            </Card.Header>
                            <Card.Body>
                              <p className="text-muted mb-2">{survey.description}</p>
                              <div className="mb-3">
                                <small className="text-muted">
                                  <strong>Teacher:</strong> {survey.teacher}<br />
                                  <strong>Estimated time:</strong> {survey.estimatedTime}<br />
                                  <strong>Deadline:</strong> {survey.deadline}
                                </small>
                              </div>
                              
                              {daysRemaining <= 1 && (
                                <Alert variant="warning" className="py-2 mb-3">
                                  <FontAwesomeIcon icon={faClock} className="me-1" />
                                  <small>Deadline approaching!</small>
                                </Alert>
                              )}

                              <div className="d-grid">
                                <Button 
                                  variant="success"
                                  onClick={() => handleStartSurvey(survey.id)}
                                >
                                  <FontAwesomeIcon icon={faPlay} className="me-2" />
                                  Start Survey
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </>
            )}

            {/* Completed Surveys Tab */}
            {activeTab === 'completed' && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">Completed Surveys</h5>
                  <Badge bg="success">{stats.completedSurveys} completed</Badge>
                </div>

                {completedSurveys.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                      <FontAwesomeIcon icon={faHistory} size="3x" className="text-muted mb-3" />
                      <h5>No Completed Surveys</h5>
                      <p className="text-muted">Your completed surveys will appear here.</p>
                    </Card.Body>
                  </Card>
                ) : (
                  <Row>
                    {completedSurveys.map(survey => (
                      <Col md={6} key={survey.id} className="mb-4">
                        <Card className="border-0 shadow-sm">
                          <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">{survey.title}</h6>
                            <Badge bg="success">
                              <FontAwesomeIcon icon={faCheck} className="me-1" />
                              Completed
                            </Badge>
                          </Card.Header>
                          <Card.Body>
                            <p className="text-muted mb-2">{survey.description}</p>
                            <div className="mb-3">
                              <small className="text-muted">
                                <strong>Teacher:</strong> {survey.teacher}<br />
                                <strong>Completed:</strong> {survey.completedAt}
                              </small>
                            </div>
                            
                            {survey.canViewResults && (
                              <div className="d-grid">
                                <Button variant="outline-info" size="sm">
                                  <FontAwesomeIcon icon={faChartBar} className="me-2" />
                                  View Results
                                </Button>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Student Profile</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={8}>
                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <div className="form-control-plaintext">{state.user?.username}</div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <div className="form-control-plaintext">{state.user?.email}</div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <div className="form-control-plaintext">
                          <Badge bg="success">{state.user ? getRoleDisplayName(state.user.role) : ''}</Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center">
                        <FontAwesomeIcon icon={faGraduationCap} size="4x" className="text-success mb-3" />
                        <h6>Survey Participation</h6>
                        <div className="row text-center">
                          <div className="col-6">
                            <h4 className="text-primary">{stats.totalParticipated}</h4>
                            <small className="text-muted">Completed</small>
                          </div>
                          <div className="col-6">
                            <h4 className="text-warning">{stats.pendingSurveys}</h4>
                            <small className="text-muted">Pending</small>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StudentDashboard;