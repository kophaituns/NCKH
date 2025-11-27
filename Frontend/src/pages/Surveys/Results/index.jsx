import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import SurveyService from '../../../api/services/survey.service';
import ResponseService from '../../../api/services/response.service';
import Loader from '../../../components/common/Loader/Loader';
import StatusBadge from '../../../components/UI/StatusBadge';
import SurveyAccess from '../../../components/SurveyAccess';
import { getQuestionTypeLabel } from '../../../utils/questionTypes';
import styles from './Results.module.scss';

const SurveyResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { state } = useAuth();

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [expandedResponse, setExpandedResponse] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[Results] Fetching data for survey:', id);

      // Fetch survey data
      const surveyData = await SurveyService.getById(id);
      console.log('[Results] Survey data loaded:', surveyData?.title);
      setSurvey(surveyData);

      // Fetch responses
      let responsesData = null;
      try {
        responsesData = await ResponseService.getResponsesBySurvey(id);
        console.log('[Results] Responses loaded:', {
          ok: responsesData?.ok,
          total: responsesData?.total,
          count: responsesData?.responses?.length
        });
      } catch (responseError) {
        console.error('[Results] Failed to load responses:', responseError);
        // Don't fail the entire page if responses fail to load
        showToast(responseError?.response?.data?.message || responseError?.message || 'Failed to load responses', 'error');
        responsesData = { ok: false, responses: [], total: 0 };
      }

      // Handle response data
      if (responsesData?.ok) {
        const responses = responsesData.responses || responsesData.data?.responses || [];

        console.log('[Results] Setting responses:', responses.length);
        setResponses(responses);

        // Calculate stats
        calculateStats(surveyData, responses);
      } else {
        console.warn('[Results] No valid response data, using empty array');
        setResponses([]);
        calculateStats(surveyData, []);
        if (responsesData?.message) {
          showToast(responsesData.message, 'error');
        }
      }
    } catch (error) {
      console.error('[Results] Load error:', error);
      showToast(error?.response?.data?.message || error?.message || 'Failed to load results', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateStats = (surveyData, responsesData) => {
    const questionStats = {};

    // Handle empty or invalid responses
    if (!responsesData || !Array.isArray(responsesData) || responsesData.length === 0) {
      setStats({
        totalResponses: 0,
        questionStats: {}
      });
      return;
    }

    // Process each response
    responsesData.forEach(response => {
      const answersData = response.Answers || response.answers;
      if (!answersData) return;

      const answers = typeof answersData === 'string'
        ? JSON.parse(answersData)
        : answersData;

      if (!Array.isArray(answers)) return;

      answers.forEach(answer => {
        // Debug log
        console.log('[Results] Processing answer:', answer);

        // Handle both structure types (direct value or object with value)
        const qId = parseInt(answer.question_id || answer.questionId);

        // Get answer value: check text_answer, numeric_answer, value, option text, or option_id
        let val = answer.text_answer;
        if (val === null || val === undefined) val = answer.numeric_answer;
        if (val === null || val === undefined) val = answer.value;
        if ((val === null || val === undefined) && answer.QuestionOption) val = answer.QuestionOption.option_text;
        if (val === null || val === undefined) val = answer.option_id;

        if (!qId) return;

        if (!questionStats[qId]) {
          questionStats[qId] = {
            total: 0,
            values: []
          };
        }
        questionStats[qId].total++;
        if (val !== null && val !== undefined) {
          questionStats[qId].values.push(val);
        }
      });
    });

    setStats({
      totalResponses: responsesData.length,
      questionStats
    });
  };

  const toggleResponse = (responseId) => {
    setExpandedResponse(expandedResponse === responseId ? null : responseId);
  };

  const formatAnswer = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  const renderQuestionStats = (question) => {
    if (!stats || !stats.questionStats[question.id]) {
      return <div className={styles.noData}>No responses yet</div>;
    }

    const questionStat = stats.questionStats[question.id];
    const values = questionStat.values;

    // For rating questions, calculate average
    if (question.type === 'rating' || question.type === 'number' || question.type === 'likert_scale') {
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (numericValues.length > 0) {
        const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);

        return (
          <div className={styles.numericStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Average:</span>
              <span className={styles.statValue}>{avg.toFixed(2)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Min:</span>
              <span className={styles.statValue}>{min}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Max:</span>
              <span className={styles.statValue}>{max}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Responses:</span>
              <span className={styles.statValue}>{numericValues.length}</span>
            </div>
          </div>
        );
      }
    }

    // For choice questions, count occurrences
    if (question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'dropdown' || question.type === 'checkbox') {
      const counts = {};
      values.forEach(value => {
        const vals = Array.isArray(value) ? value : [value];
        vals.forEach(v => {
          counts[v] = (counts[v] || 0) + 1;
        });
      });

      const total = ['single_choice', 'dropdown'].includes(question.type) ? values.length : Object.values(counts).reduce((a, b) => a + b, 0);

      return (
        <div className={styles.choiceStats}>
          {Object.entries(counts).map(([optionKey, count]) => {
            // Try to find option text if key is ID
            let optionText = optionKey;
            const optionId = parseInt(optionKey);
            if (!isNaN(optionId)) {
              const option = question.options?.find(o => o.id === optionId);
              if (option) optionText = option.text;
            }

            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

            return (
              <div key={optionKey} className={styles.choiceItem}>
                <div className={styles.choiceLabel}>
                  <span>{optionText}</span>
                  <span className={styles.choiceCount}>{count} ({percentage}%)</span>
                </div>
                <div className={styles.choiceBar}>
                  <div
                    className={styles.choiceBarFill}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // For text questions, show response count
    return (
      <div className={styles.textStats}>
        <span className={styles.responseCount}>{values.length} text responses</span>
        <div className={styles.recentResponses}>
          {values.slice(0, 5).map((val, idx) => (
            <div key={idx} className={styles.textResponseItem}>"{val}"</div>
          ))}
        </div>
      </div>
    );
  };

  // Export PDF function
  const handleExportPDF = async () => {
    try {
      // Dynamically import libraries to avoid load issues if not installed yet
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.querySelector(`.${styles.results}`);
      if (!element) return;

      // Show loading toast
      const toastId = showToast('Generating PDF...', 'info');

      // Create canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#1a1d21' // Match dark theme background
      });

      // Calculate dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      // Add title
      pdf.setFontSize(18);
      pdf.text(survey.title, 10, 20);
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 10, 28);

      // Add image (scaled to fit)
      // For long content, we might need multi-page logic, but for now simple fit
      // A better approach for long content is to capture sections individually

      // Simple single page fit for now
      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // If content is longer than one page
      if (pdfImgHeight > pdfHeight) {
        // Multi-page logic could be added here
        // For now, just add the image and let it be
        pdf.addImage(imgData, 'PNG', 0, 40, pdfWidth, pdfImgHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 40, pdfWidth, pdfImgHeight);
      }

      pdf.save(`${survey.title.replace(/\s+/g, '_')}_results.pdf`);

      // Dismiss loading toast
      // (Assuming showToast returns an ID or handle to dismiss/update)

    } catch (error) {
      console.error('Export PDF error:', error);
      showToast('Failed to export PDF. Please ensure libraries are installed.', 'error');
    }
  };

  if (loading) return <Loader />;

  if (!survey) {
    return (
      <div className={styles.error}>
        <h2>Survey not found</h2>
        <button onClick={() => navigate('/surveys')}>Back to Surveys</button>
      </div>
    );
  }

  return (
    <div className={styles.results}>
      <div className={styles.header}>
        <button onClick={() => navigate('/surveys')} className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className={styles.titleSection}>
          <div>
            <h1>{survey.title}</h1>
            <p className={styles.subtitle}>Survey Results & Analytics</p>
          </div>
          <StatusBadge status={survey.status} />
        </div>
      </div>

      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats?.totalResponses || 0}</div>
            <div className={styles.statLabel}>Total Responses</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{survey.template?.Questions?.length || survey.questions?.length || 0}</div>
            <div className={styles.statLabel}>Questions</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>
              {new Date(survey.start_date).toLocaleDateString()}
            </div>
            <div className={styles.statLabel}>Start Date</div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          {/* Question Statistics */}
          <div className={styles.section}>
            <h2>Question Statistics</h2>

            {survey.template?.Questions?.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No questions in this survey</p>
              </div>
            ) : (
              <div className={styles.questionsList}>
                {survey.template?.Questions?.sort((a, b) => a.display_order - b.display_order).map((question, index) => (
                  <div key={question.id} className={styles.questionCard}>
                    <div className={styles.questionHeader}>
                      <span className={styles.questionNumber}>Q{index + 1}</span>
                      <h3>{question.label || question.question_text || 'Untitled question'}</h3>
                      <span className={styles.questionType}>{getQuestionTypeLabel(question)}</span>
                    </div>
                    <div className={styles.questionStats}>
                      {renderQuestionStats(question)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Individual Responses */}
          <div className={styles.section}>
            <h2>Individual Responses ({responses.length})</h2>

            {responses.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <p>No responses yet</p>
                <button
                  onClick={() => navigate(`/surveys/${id}/distribute`)}
                  className={styles.primaryButton}
                >
                  Distribute Survey
                </button>
              </div>
            ) : (
              <div className={styles.responsesList}>
                {responses.map((response, index) => {
                  const answersData = response.Answers || response.answers || [];
                  const answers = typeof answersData === 'string'
                    ? JSON.parse(answersData)
                    : answersData;
                  const isExpanded = expandedResponse === response.id;

                  return (
                    <div key={response.id} className={styles.responseCard}>
                      <div
                        className={styles.responseHeader}
                        onClick={() => toggleResponse(response.id)}
                      >
                        <div className={styles.responseInfo}>
                          <span className={styles.responseNumber}>
                            {response.User ? (
                              <>
                                {response.User.full_name || response.User.username}
                                {response.User.email && (
                                  <span className={styles.respondentEmail}> ({response.User.email})</span>
                                )}
                              </>
                            ) : (
                              `Response #${responses.length - index}`
                            )}
                          </span>
                          <span className={styles.responseDate}>
                            {new Date(response.created_at).toLocaleString()}
                          </span>
                        </div>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={isExpanded ? styles.iconExpanded : ''}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>

                      {isExpanded && (
                        <div className={styles.responseContent}>
                          {Array.isArray(answers) && answers.map((answer, idx) => {
                            // Adapt to backend structure
                            const qId = parseInt(answer.question_id || answer.questionId);

                            // Get answer value: check text_answer, numeric_answer, value, option text, or option_id
                            let val = answer.text_answer;
                            if (val === null || val === undefined) val = answer.numeric_answer;
                            if (val === null || val === undefined) val = answer.value;
                            if ((val === null || val === undefined) && answer.QuestionOption) val = answer.QuestionOption.option_text;
                            if (val === null || val === undefined) val = answer.option_id;

                            // Find question label: try from answer association first, then survey template
                            let label = answer.Question?.label || answer.Question?.question_text;
                            if (!label) {
                              const question = survey.template?.Questions?.find(q => q.id === qId);
                              label = question?.label || question?.question_text || `Question ${qId}`;
                            }

                            return (
                              <div key={idx} className={styles.answerItem}>
                                <div className={styles.answerQuestion}>
                                  {label}
                                </div>
                                <div className={styles.answerValue}>
                                  {formatAnswer(val)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.actionCard}>
            <h3>Actions</h3>
            <button
              onClick={() => navigate(`/surveys/${id}/distribute`)}
              className={styles.actionButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Distribute Survey
            </button>
            <button
              onClick={() => navigate(`/surveys/${id}/edit`)}
              className={styles.actionButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Survey
            </button>
            <button
              onClick={fetchData}
              className={styles.actionButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh Data
            </button>
            <button
              onClick={handleExportPDF}
              className={styles.actionButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Export PDF
            </button>
          </div>

          <div className={styles.infoCard}>
            <h3>Export Options</h3>
            <p className={styles.comingSoon}>CSV and Excel export coming soon!</p>
          </div>

          {/* Survey Access Management */}
          {(survey?.created_by === state.user?.id || state.user?.role === 'admin') && (
            <div className={styles.accessCard}>
              <SurveyAccess
                surveyId={id}
                isOwner={survey?.created_by === state.user?.id || state.user?.role === 'admin'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyResults;
