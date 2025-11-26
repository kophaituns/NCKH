import React, { useState, useEffect } from 'react';
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
import { UserRole } from '../../constants/userRoles.js';
import { surveyApi } from '../../utils/api.js';
import './SurveyManagement.scss';

const SurveyManagement = () => {
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
    status: 'draft',
    targetResponses: 0,
    endDate: ''
  });

  // Load surveys from API
  const loadSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await surveyApi.getAll();
      // Response structure: { error: false, data: { surveys: [], pagination: {} } }
      // After interceptor: { error: false, data: { surveys: [], pagination: {} } }
      console.log('API Response:', response);
      const surveysData = response?.data?.surveys || [];
      setSurveys(surveysData);
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
      targetResponses: 0,
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
      <div className="survey-management">
        <div className="loading-container">
          <div className="spinner" role="status"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-management">
      <div className="header-section">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="icon" />
            Back to Dashboard
          </button>
          <h2 className="page-title">Survey Management</h2>
        </div>
        <button
          className="create-button"
          onClick={handleCreateSurvey}
        >
          <FontAwesomeIcon icon={faPlus} />
          Create New Survey
        </button>
      </div>

      {error && (
        <div className="alert">
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5>All Surveys</h5>
        </div>
        <div className="card-body">
          {surveys.length === 0 ? (
            <div className="empty-state">
              <p>No surveys found. Create your first survey to get started.</p>
              <button className="btn btn-primary" onClick={handleCreateSurvey}>
                <FontAwesomeIcon icon={faPlus} />
                Create Survey
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
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
                        <div className="survey-title">
                          <strong>{survey.title}</strong>
                          <small>{survey.description}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusVariant(survey.status)}`}>
                          {survey.status}
                        </span>
                      </td>
                      <td>
                        <div className="progress-info">
                          <div className="small">
                            {survey.responses} / {survey.targetResponses} responses
                          </div>
                          <div className="progress">
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
                        <div className="action-buttons">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate(`/surveys/${survey.id}`)}
                            title="View Survey"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => navigate(`/surveys/${survey.id}/analytics`)}
                            title="View Analytics"
                          >
                            <FontAwesomeIcon icon={faChartLine} />
                          </button>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => handleEditSurvey(survey)}
                            title="Edit Survey"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setSurveyToDelete(survey.id)}
                            title="Delete Survey"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Survey Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSurvey ? 'Edit Survey' : 'Create New Survey'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Survey Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter survey title"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter survey description"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Target Responses</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.targetResponses}
                      onChange={(e) => setFormData({ ...formData, targetResponses: parseInt(e.target.value) || 0 })}
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                <FontAwesomeIcon icon={faTimes} />
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveSurvey}
                disabled={!formData.title.trim()}
              >
                <FontAwesomeIcon icon={faSave} />
                {editingSurvey ? 'Update Survey' : 'Create Survey'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {surveyToDelete !== null && (
        <div className="modal-overlay" onClick={() => setSurveyToDelete(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setSurveyToDelete(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this survey? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSurveyToDelete(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteSurvey}>
                <FontAwesomeIcon icon={faTrash} />
                Delete Survey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyManagement;