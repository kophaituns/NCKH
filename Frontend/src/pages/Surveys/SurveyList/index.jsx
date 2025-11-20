import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SurveyService from '../../../api/services/survey.service';
import Loader from '../../../components/common/Loader/Loader';
import Pagination from '../../../components/common/Pagination/Pagination';
import StatusBadge from '../../../components/UI/StatusBadge';
import ConfirmModal from '../../../components/UI/ConfirmModal';
import { useToast } from '../../../contexts/ToastContext';
import styles from './SurveyList.module.scss';

const SurveyList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const itemsPerPage = 10;

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SurveyService.getAll();
      // Ensure data is always an array
      setSurveys(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      setSurveys([]); // Set empty array on error
      showToast(error.response?.data?.message || 'Failed to fetch surveys', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handleDelete = async () => {
    if (!surveyToDelete) return;

    try {
      await SurveyService.delete(surveyToDelete.id);
      showToast('Survey deleted successfully', 'success');
      setShowDeleteModal(false);
      setSurveyToDelete(null);
      fetchSurveys();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete survey', 'error');
    }
  };

  const handleStatusChange = async (survey, newStatus) => {
    try {
      await SurveyService.updateStatus(survey.id, newStatus);
      showToast(`Survey ${newStatus} successfully`, 'success');
      fetchSurveys();
    } catch (error) {
      showToast(error.response?.data?.message || `Failed to ${newStatus} survey`, 'error');
    }
  };

  const openDeleteModal = (survey) => {
    setSurveyToDelete(survey);
    setShowDeleteModal(true);
  };

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch = 
      survey.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSurveys = filteredSurveys.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <Loader />;

  return (
    <div className={styles.surveyList}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Surveys</h1>
          <p className={styles.subtitle}>Manage your survey campaigns</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={() => navigate('/surveys/new')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Survey
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search surveys..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
            style={{ paddingLeft: '4rem' }}
          />
        </div>

        <div className={styles.statusFilter}>
          <label>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.select}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <span className={styles.resultCount}>
          {filteredSurveys.length} {filteredSurveys.length === 1 ? 'survey' : 'surveys'} found
        </span>
      </div>

      {currentSurveys.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <h3>No surveys found</h3>
          <p>Create your first survey to start collecting responses</p>
          <button 
            className={styles.emptyButton}
            onClick={() => navigate('/surveys/new')}
          >
            Create Survey
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Questions</th>
                  <th>Responses</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSurveys.map((survey) => {
                  const questionCount = survey.questionCount ?? survey.template?.Questions?.length ?? 0;
                  return (
                  <tr key={survey.id}>
                    <td>
                      <div className={styles.surveyTitle}>
                        <span className={styles.title}>{survey.title}</span>
                        {survey.description && (
                          <span className={styles.description}>{survey.description}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={survey.status} />
                    </td>
                    <td>
                      <span className={styles.questionCount}>
                        {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.responseCount}>
                        {survey.response_count || 0}
                      </span>
                    </td>
                    <td>{survey.start_date ? new Date(survey.start_date).toLocaleDateString() : '-'}</td>
                    <td>{survey.end_date ? new Date(survey.end_date).toLocaleDateString() : '-'}</td>
                    <td>{new Date(survey.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        {survey.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(survey, 'active')}
                            className={styles.publishButton}
                            title="Publish survey"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polygon points="10 8 16 12 10 16 10 8" />
                            </svg>
                          </button>
                        )}
                        {survey.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(survey, 'closed')}
                            className={styles.closeButton}
                            title="Close survey"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                          className={styles.editButton}
                          title="Edit survey"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/surveys/${survey.id}/distribute`)}
                          className={styles.distributeButton}
                          title="Distribute survey"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/surveys/${survey.id}/results`)}
                          className={styles.resultsButton}
                          title="View results"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="20" x2="12" y2="10" />
                            <line x1="18" y1="20" x2="18" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(survey)}
                          className={styles.deleteButton}
                          title="Delete survey"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSurveyToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Survey"
        message={`Are you sure you want to delete "${surveyToDelete?.title}"? This action cannot be undone and will delete all associated responses.`}
        confirmText="Delete"
        confirmColor="danger"
      />
    </div>
  );
};

export default SurveyList;
