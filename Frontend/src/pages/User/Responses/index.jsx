// src/pages/User/Responses/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ResponseService from '../../../api/services/response.service';
import { useToast } from '../../../contexts/ToastContext';
import { generateResponsePDF, generateAdvancedResponsePDF } from '../../../utils/pdfGenerator';
import Pagination from '../../../components/common/Pagination/Pagination';
import ConfirmModal from '../../../components/UI/ConfirmModal';
import Loader from '../../../components/common/Loader/Loader';
import styles from './UserResponses.module.scss';

const UserResponses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // State management
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  // Filter and search state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'DESC'
  });

  // UI state
  const [expandedResponse, setExpandedResponse] = useState(null);
  const [responseDetail, setResponseDetail] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    responseId: null,
    surveyTitle: ''
  });

  // Fetch responses
  const fetchResponses = useCallback(async () => {
    try {
      setLoading(true);
      const page = parseInt(searchParams.get('page')) || 1;
      
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const result = await ResponseService.getUserResponses(params);

      if (result.success) {
        setResponses(result.data.responses);
        setPagination(result.data.pagination);
      } else {
        showToast(result.message || 'Failed to load responses', 'error');
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      showToast(error?.response?.data?.message || 'Failed to load responses', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchParams, pagination.limit, filters, showToast]);

  // Fetch response detail
  const fetchResponseDetail = async (responseId) => {
    try {
      const result = await ResponseService.getUserResponseDetail(responseId);
      if (result.success) {
        setResponseDetail(result.data.response);
      }
    } catch (error) {
      console.error('Error fetching response detail:', error);
      showToast('Failed to load response details', 'error');
    }
  };

  // Handle search and filters
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.delete('page'); // Reset to first page when filtering
    setSearchParams(params);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
  };

  // Handle response expansion
  const toggleResponseDetail = async (responseId) => {
    if (expandedResponse === responseId) {
      setExpandedResponse(null);
      setResponseDetail(null);
    } else {
      setExpandedResponse(responseId);
      await fetchResponseDetail(responseId);
    }
  };

  // Handle delete response
  const handleDeleteResponse = async (responseId) => {
    try {
      const result = await ResponseService.deleteResponse(responseId);
      if (result.success) {
        showToast('Response deleted successfully', 'success');
        fetchResponses(); // Refresh the list
        setDeleteModal({ isOpen: false, responseId: null, surveyTitle: '' });
      }
    } catch (error) {
      console.error('Error deleting response:', error);
      showToast(error?.response?.data?.message || 'Failed to delete response', 'error');
    }
  };

  // Handle download PDF
  const handleDownloadPDF = async (response) => {
    try {
      // First get detailed response data if we don't have answers
      let fullResponse = response;
      if (!response.Answers || response.Answers.length === 0) {
        const detailResult = await ResponseService.getUserResponseDetail(response.id);
        if (detailResult.success) {
          fullResponse = detailResult.data.response;
        }
      }

      // Try advanced PDF generation first, fall back to simple version
      try {
        await generateAdvancedResponsePDF(fullResponse);
        showToast('PDF downloaded successfully', 'success');
      } catch (advancedError) {
        console.warn('Advanced PDF generation failed, using fallback:', advancedError);
        generateResponsePDF(fullResponse);
        showToast('PDF generated (print version)', 'success');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    }
  };

  // Format answer display
  const formatAnswer = (answer) => {
    if (answer.QuestionOption) {
      return answer.QuestionOption.option_text;
    }
    if (answer.numeric_answer !== null) {
      return answer.numeric_answer.toString();
    }
    return answer.text_answer || 'No answer';
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusClass = (status) => {
      switch (status) {
        case 'completed': return styles.statusCompleted;
        case 'started': return styles.statusInProgress;
        case 'abandoned': return styles.statusAbandoned;
        default: return '';
      }
    };

    return (
      <span className={`${styles.statusBadge} ${getStatusClass(status)}`}>
        {status === 'completed' ? 'Completed' : 
         status === 'started' ? 'In Progress' : 
         'Abandoned'}
      </span>
    );
  };

  // Effects
  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Render loading state
  if (loading && responses.length === 0) {
    return (
      <div className={styles.container}>
        <Loader message="Loading your responses..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>My Survey Responses</h1>
        <p>View and manage your survey participation history</p>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by survey name..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="started">In Progress</option>
            <option value="abandoned">Abandoned</option>
          </select>

          <select
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(':');
              handleFilterChange({ sortBy, sortOrder });
            }}
            className={styles.filterSelect}
          >
            <option value="created_at:DESC">Newest First</option>
            <option value="created_at:ASC">Oldest First</option>
            <option value="updated_at:DESC">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className={styles.summary}>
          Showing {responses.length} of {pagination.total} responses
        </div>
      )}

      {/* Responses List */}
      <div className={styles.responsesList}>
        {responses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3>No survey responses found</h3>
            <p>You haven't participated in any surveys yet, or no surveys match your current filters.</p>
          </div>
        ) : (
          responses.map((response) => (
            <div key={response.id} className={styles.responseCard}>
              <div className={styles.responseHeader}>
                <div className={styles.responseInfo}>
                  <h3>{response.Survey.title}</h3>
                  <div className={styles.responseMeta}>
                    <span className={styles.responseDate}>
                      Responded on {new Date(response.created_at).toLocaleDateString()}
                    </span>
                    <StatusBadge status={response.status || 'completed'} />
                  </div>
                  {response.Survey.description && (
                    <p className={styles.responseDescription}>
                      {response.Survey.description}
                    </p>
                  )}
                </div>

                <div className={styles.responseActions}>
                  <button
                    onClick={() => toggleResponseDetail(response.id)}
                    className={styles.viewButton}
                    disabled={loading}
                  >
                    {expandedResponse === response.id ? 'Hide Details' : 'View Details'}
                  </button>

                  <button
                    onClick={() => handleDownloadPDF(response)}
                    className={styles.downloadButton}
                    title="Download as PDF"
                  >
                    📄 PDF
                  </button>

                  <button
                    onClick={() => setDeleteModal({
                      isOpen: true,
                      responseId: response.id,
                      surveyTitle: response.Survey.title
                    })}
                    className={styles.deleteButton}
                    title="Delete this response"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Expanded response details */}
              {expandedResponse === response.id && responseDetail && (
                <div className={styles.responseDetails}>
                  <h4>Your Answers</h4>
                  {responseDetail.Answers && responseDetail.Answers.length > 0 ? (
                    <div className={styles.answersGrid}>
                      {responseDetail.Answers.map((answer, index) => (
                        <div key={index} className={styles.answerItem}>
                          <div className={styles.questionText}>
                            {answer.Question.label || answer.Question.question_text}
                          </div>
                          <div className={styles.answerText}>
                            {formatAnswer(answer)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noAnswers}>No answers recorded</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={styles.paginationSection}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Response"
        message={`Are you sure you want to delete your response to "${deleteModal.surveyTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass={styles.dangerButton}
        onConfirm={() => handleDeleteResponse(deleteModal.responseId)}
        onCancel={() => setDeleteModal({ isOpen: false, responseId: null, surveyTitle: '' })}
      />

      {/* Loading overlay */}
      {loading && responses.length > 0 && (
        <div className={styles.loadingOverlay}>
          <Loader message="Updating responses..." />
        </div>
      )}
    </div>
  );
};

export default UserResponses;