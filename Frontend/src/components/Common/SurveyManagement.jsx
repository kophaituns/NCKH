import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faEye, 
  faChartLine,
  faArrowLeft,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { UserRole } from '../../types.jsx';
import { surveyApi } from '../../utils/api.jsx';

const SurveyManagement: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'paused',
    targetResponses,
    endDate: ''
  });

  // Load surveys from API
  const loadSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await surveyApi.getAll();
      setSurveys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load surveys');
      console.error('Error loading surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication and role
  useEffect(() => {
    const userRole = state.user?.role;
    if (!state.isAuthenticated || (userRole !== UserRole.ADMIN && userRole !== UserRole.TEACHER)) {
      navigate('/dashboard');
      return;
    }
    loadSurveys();
  }, [state.isAuthenticated, state.user, navigate]);

  // Handle create new survey
  const handleCreateSurvey = () => {
    setEditingSurvey(null);
    setFormData({
      title: '',
      description: '',
      status: 'draft',
      targetResponses,
      endDate: ''
    });
    setShowModal(true);
  };

  // Handle edit survey
  const handleEditSurvey = (survey) => {
    setEditingSurvey(survey);
    setFormData({
      title: survey.title,
      description: survey.description,
      status: survey.status,
      targetResponses: survey.targetResponses,
      endDate: survey.endDate
    });
    setShowModal(true);
  };

  // Handle save survey (create or update)
  const handleSaveSurvey = async () => {
    try {
      if (editingSurvey) {
        // Update existing survey
        await surveyApi.update(editingSurvey.id.toString(), formData);
      } else {
        // Create new survey
        await surveyApi.create(formData);
      }
      setShowModal(false);
      loadSurveys(); // Reload surveys
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save survey');
    }
  };

  // Handle delete survey
  const handleDeleteSurvey = async () => {
    if (surveyToDelete) {
      try {
        await surveyApi.delete(surveyToDelete.toString());
        setSurveyToDelete(null);
        loadSurveys(); // Reload surveys
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete survey');
      }
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSurvey(null);
  };

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'completed':
        return 'primary';
      case 'paused':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button 
                variant="link" 
                className="p-0 me-3"
                onClick={() => navigate('/dashboard')}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Back to Dashboard
              </Button>
              <h2 className="mb-0">Survey Management</h2>
            </div>
            <Button
              variant="primary"
              onClick={handleCreateSurvey}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Create New Survey
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">All Surveys</h5>
            </Card.Header>
            <Card.Body>
              {surveys.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No surveys found. Create your first survey to get started.</p>
                  <Button variant="primary" onClick={handleCreateSurvey}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Create Survey
                  </Button>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Created</th>
                      <th>End Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((survey) => (
                      <tr key={survey.id}>
                        <td>
                          <div>
                            <strong>{survey.title}</strong>
                            <br />
                            <small className="text-muted">{survey.description}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={getStatusVariant(survey.status)}>
                            {survey.status}
                          </Badge>
                        </td>
                        <td>
                          <div>
                            <div className="small">
                              {survey.responses} / {survey.targetResponses} responses
                            </div>
                            <div className="progress mt-1" style={{ height: '5px' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${Math.min((survey.responses / survey.targetResponses) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(survey.createdAt)}</td>
                        <td>{formatDate(survey.endDate)}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/surveys/${survey.id}`)}
                              title="View Survey"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => navigate(`/surveys/${survey.id}/analytics`)}
                              title="View Analytics"
                            >
                              <FontAwesomeIcon icon={faChartLine} />
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEditSurvey(survey)}
                              title="Edit Survey"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => setSurveyToDelete(survey.id)}
                              title="Delete Survey"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Survey Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSurvey ? 'Edit Survey' : 'Create New Survey'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Survey Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter survey title"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter survey description"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Responses</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.targetResponses}
                    onChange={(e) => setFormData({ ...formData, targetResponses: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveSurvey}
            disabled={!formData.title.trim()}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {editingSurvey ? 'Update Survey' : 'Create Survey'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={surveyToDelete !== null} onHide={() => setSurveyToDelete(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this survey? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSurveyToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteSurvey}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Delete Survey
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SurveyManagement;