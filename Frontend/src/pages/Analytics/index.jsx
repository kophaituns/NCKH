import React, { useEffect, useState, useCallback } from 'react';
import AnalyticsService from '../../api/services/analytics.service';
import Loader from '../../components/common/Loader/Loader';
import { useToast } from '../../contexts/ToastContext';
import styles from './Analytics.module.scss';

const AnalyticsPage = () => {
  const { showToast } = useToast();
  const [surveys, setSurveys] = useState([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [topAnswers, setTopAnswers] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchActiveSurveys = useCallback(async () => {
    try {
      setLoadingSurveys(true);
      const res = await AnalyticsService.getActiveSurveys();
      const data = res.data?.data || [];
      setSurveys(data);
    } catch (error) {
      console.error('[Analytics] Failed to load active surveys', error);
      showToast('Failed to load active surveys list', 'error');
    } finally {
      setLoadingSurveys(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchActiveSurveys();
  }, [fetchActiveSurveys]);

  const handleSelectSurvey = useCallback(
    async (survey) => {
      setSelectedSurvey(survey);
      setTopAnswers(null);
      if (!survey) return;

      try {
        setLoadingDetails(true);
        const res = await AnalyticsService.getSurveyTopAnswers(survey.id);
        const data = res.data?.data || null;
        setTopAnswers(data);
      } catch (error) {
        console.error('[Analytics] Failed to load survey top answers', error);
        showToast('Failed to load analytics data for this survey', 'error');
      } finally {
        setLoadingDetails(false);
      }
    },
    [showToast]
  );

  const formatDate = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  return (
    <div className={styles.analyticsPage}>
      <div className={styles.header}>
        <h1>Survey Analytics</h1>
        <p>
          Select an active survey to see the most frequently chosen options and
          the most common answers.
        </p>
      </div>

      <div className={styles.content}>
        {/* LEFT: active survey list */}
        <div className={styles.surveyList}>
          <div className={styles.surveyListTitle}>Active surveys</div>

          {loadingSurveys && <Loader size="small" />}

          {!loadingSurveys && surveys.length === 0 && (
            <div className={styles.detailsPlaceholder}>
              There are currently no surveys in <strong>Active</strong> status.
            </div>
          )}

          {!loadingSurveys &&
            surveys.map((survey) => (
              <button
                key={survey.id}
                type="button"
                onClick={() => handleSelectSurvey(survey)}
                className={`${styles.surveyItem} ${
                  selectedSurvey && selectedSurvey.id === survey.id
                    ? styles.surveyItemActive
                    : ''
                }`}
              >
                <div className={styles.surveyTitle}>{survey.title}</div>
                <div className={styles.surveyMeta}>
                  <span>
                    {formatDate(survey.start_date)} →{' '}
                    {formatDate(survey.end_date)}
                  </span>
                  <span>
                    {survey.completed_responses ?? 0} completed /{' '}
                    {survey.total_responses ?? 0} responses
                  </span>
                  <span className={styles.surveyTag}>{survey.status}</span>
                </div>
              </button>
            ))}
        </div>

        {/* RIGHT: top answers detail */}
        <div className={styles.details}>
          {!selectedSurvey && (
            <div className={styles.detailsPlaceholder}>
              Select a survey on the left to see detailed analytics.
            </div>
          )}

          {selectedSurvey && (
            <>
              <div>
                <div className={styles.surveyHeaderTitle}>
                  {selectedSurvey.title}
                </div>
                <div className={styles.surveyHeaderMeta}>
                  <span>
                    {formatDate(selectedSurvey.start_date)} →{' '}
                    {formatDate(selectedSurvey.end_date)}
                  </span>
                  <span>
                    {selectedSurvey.completed_responses ?? 0} completed /{' '}
                    {selectedSurvey.total_responses ?? 0} responses
                  </span>
                </div>
              </div>

              {loadingDetails && <Loader size="medium" />}

              {!loadingDetails && topAnswers && (
                <div className={styles.questionList}>
                  {topAnswers.questions && topAnswers.questions.length > 0 ? (
                    topAnswers.questions.map((question) => (
                      <div
                        key={question.questionId}
                        className={styles.questionCard}
                      >
                        <div className={styles.questionHeader}>
                          <div className={styles.questionText}>
                            {question.questionText}
                          </div>
                          <span className={styles.questionTypeTag}>
                            {question.questionType || 'question'}
                          </span>
                        </div>

                        {question.topOptions &&
                          question.topOptions.length > 0 && (
                            <div className={styles.optionList}>
                              {question.topOptions.map((opt) => (
                                <div
                                  key={opt.optionId}
                                  className={styles.optionRow}
                                >
                                  <span className={styles.optionLabel}>
                                    {opt.optionText}
                                  </span>
                                  <span className={styles.optionCount}>
                                    {opt.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                        {question.topTextAnswers &&
                          question.topTextAnswers.length > 0 && (
                            <div className={styles.textAnswers}>
                              <div className={styles.textAnswersTitle}>
                                Popular answers
                              </div>
                              {question.topTextAnswers.map((ans, idx) => (
                                <div
                                  key={idx}
                                  className={styles.textAnswerItem}
                                >
                                  <p>"{ans.text}"</p>
                                  <span
                                    className={styles.textAnswerCount}
                                  >
                                    {ans.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                        {(!question.topOptions ||
                          question.topOptions.length === 0) &&
                          (!question.topTextAnswers ||
                            question.topTextAnswers.length === 0) && (
                            <div className={styles.emptyQuestionState}>
                              There is not enough answer data to summarize this
                              question yet.
                            </div>
                          )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyQuestionState}>
                      There is no analytics data for this survey yet.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
