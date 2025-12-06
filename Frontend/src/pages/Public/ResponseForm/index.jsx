import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ResponseService from '../../../api/services/response.service';
import InviteService from '../../../api/services/invite.service';
import Loader from '../../../components/common/Loader/Loader';
import styles from './ResponseForm.module.scss';

const PublicResponseForm = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite_token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(null);
  // const [collectorId, setCollectorId] = useState(null); // Unused
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ResponseService.getSurveyByToken(token);

      console.log('=== DEBUG: API Response ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Survey data:', response.data?.survey);
      console.log('Survey questions:', response.data?.survey?.questions);

      if (!response.ok) {
        setError(response.message || 'Invalid or inactive survey link');
        return;
      }

      const surveyData = response.data.survey;

      // Check if this is a private survey
      if (surveyData.access_type === 'private') {
        // Private surveys REQUIRE invite token
        if (!inviteToken) {
          setError('This is a private survey. You need an invitation to access it. Please use the invitation link sent to your email.');
          setLoading(false);
          return;
        }

        // Validate the invite token
        try {
          const inviteValidation = await InviteService.validateToken(inviteToken);
          if (!inviteValidation || !inviteValidation.valid) {
            setError('Invalid or expired invitation. Please request a new invitation from the survey creator.');
            setLoading(false);
            return;
          }

          // Verify invite is for this survey
          if (inviteValidation.survey && inviteValidation.survey.id !== surveyData.id) {
            setError('This invitation is not valid for this survey.');
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Token validation error:', err);
          setError(err.response?.data?.message || 'Invalid or expired invitation.');
          setLoading(false);
          return;
        }


      }

      setSurvey(surveyData);
      // setCollectorId(response.data.collector_id);

      console.log('=== DEBUG: Survey Questions ===');
      console.log('Questions array:', surveyData.questions);
      console.log('Questions length:', surveyData.questions?.length);
      surveyData.questions?.forEach((q, index) => {
        console.log(`Question ${index + 1}:`, {
          id: q.id,
          type: q.type,
          label: q.label,
          options: q.options,
          hasOptions: q.options && q.options.length > 0
        });
      });
      console.log('=========================');

      // Initialize answers based on question type
      const initialAnswers = {};
      surveyData.questions.forEach(q => {
        // Checkbox needs array, others need empty string or null
        if (q.type === 'checkbox') {
          initialAnswers[q.id] = [];
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching survey:', error);
      setError(error.response?.data?.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  }, [token, inviteToken]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!survey || survey.questions.length === 0) return 0;

    const answeredQuestions = survey.questions.filter(q => {
      const answer = answers[q.id];
      return answer && (Array.isArray(answer) ? answer.length > 0 : answer.toString().trim() !== '');
    });

    return Math.round((answeredQuestions.length / survey.questions.length) * 100);
  };

  // Estimate completion time (Unused)
  // const getEstimatedTime = () => {
  //   if (!survey) return '5-10 min';
  //   const questionCount = survey.questions.length;
  //   const timePerQuestion = 45; // seconds per question
  //   const totalSeconds = questionCount * timePerQuestion;
  //   const minutes = Math.ceil(totalSeconds / 60);
  //   return `${minutes} min`;
  // };

  // Get question type display name with details
  const getQuestionTypeDisplay = (question) => {
    const typeMap = {
      'open_ended': 'Text Response',
      'multiple_choice': 'Multiple Choice',
      'checkbox': 'Multiple Choice',
      'dropdown': 'Dropdown',
      'rating': 'Rating Scale',
      'boolean': 'Yes/No',
      'number': 'Number',
      'email': 'Email',
      'date': 'Date',
      'likert_scale': 'Rating Scale (1-5)'
    };

    const baseType = typeMap[question.type] || 'Response';

    // Add option count for relevant types
    if (['multiple_choice', 'checkbox', 'dropdown'].includes(question.type) && question.options) {
      return `${baseType} (${question.options.length} options)`;
    }

    return baseType;
  };

  const validateAnswers = () => {
    const newErrors = {};

    survey.questions.forEach(question => {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[question.id] = 'This question is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnswerChange = (questionId, value, questionType) => {
    // For checkbox and multiple_choice types - handle multiple selections
    if (questionType === 'checkbox' || questionType === 'multiple_choice') {
      const currentAnswers = answers[questionId] || [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter(v => v !== value)
        : [...currentAnswers, value];
      setAnswers({ ...answers, [questionId]: newAnswers });
    } else {
      // For all other types - single value
      setAnswers({ ...answers, [questionId]: value });
    }

    // Clear error when user interacts
    if (errors[questionId]) {
      setErrors({ ...errors, [questionId]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAnswers()) {
      return;
    }

    try {
      setSubmitting(true);

      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        value: Array.isArray(value) ? value : String(value)
      }));

      const submissionData = {
        answers: formattedAnswers
      };

      // Include invite token if this is a private survey
      if (survey.access_type === 'private' && inviteToken) {
        submissionData.invite_token = inviteToken;
      }

      const response = await ResponseService.submitPublicResponse(token, submissionData);

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(response.message || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      setError(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, index) => {
    const answer = answers[question.id];
    const hasError = errors[question.id];

    console.log(`=== RENDER Question ${index + 1} ===`);
    console.log('Question object:', question);
    console.log('Question type:', question.type);
    console.log('Question options:', question.options);
    console.log('Should render input for type:', question.type);
    console.log('=====================================');

    return (
      <div key={question.id} className={styles.questionBlock}>
        <div className={styles.questionHeader}>
          <div className={styles.questionNumber}>
            {index + 1}
          </div>
          <div className={styles.questionContent}>
            <div className={styles.questionType}>
              {getQuestionTypeDisplay(question)}
            </div>
            <label className={styles.questionLabel}>
              {question.label}
              {question.required && (
                <span className={styles.requiredIndicator}>Required</span>
              )}
            </label>
            {question.description && (
              <div className={styles.questionDescription}>
                {question.description}
              </div>
            )}
          </div>
        </div>

        {/* Open Ended - Text area - Handle multiple type names */}
        {(question.type === 'open_ended' || 
          question.type === 'response' || 
          question.type === 'text' || 
          question.type === 'textarea') && (
          <textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
            className={`${styles.textarea} ${hasError ? styles.inputError : ''}`}
            placeholder="Your answer..."
            rows={4}
          />
        )}

        {/* Checkbox - Multiple selections */}
        {question.type === 'checkbox' && (
          <div className={styles.optionsList}>
            {(question.options || []).map((option) => (
              <label key={option.id} className={styles.optionLabel}>
                <input
                  type="checkbox"
                  value={option.id}
                  checked={(answer || []).includes(option.id)}
                  onChange={(e) => handleAnswerChange(question.id, option.id, question.type)}
                  className={styles.checkboxInput}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        )}

        {/* Dropdown - Select single option */}
        {question.type === 'dropdown' && (
          <select
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
            className={`${styles.select} ${hasError ? styles.inputError : ''}`}
          >
            <option value="">-- Select an option --</option>
            {(question.options || []).map((option) => (
              <option key={option.id} value={option.id}>
                {option.text}
              </option>
            ))}
          </select>
        )}

        {/* Multiple Choice - Checkboxes for multiple selections */}
        {question.type === 'multiple_choice' && (
          <div className={styles.optionsList}>
            {question.options && question.options.length > 0 ? (
              question.options.map((option) => (
                <label key={option.id} className={styles.optionLabel}>
                  <input
                    type="checkbox"
                    value={option.id}
                    checked={(answer || []).includes(option.id)}
                    onChange={(e) => handleAnswerChange(question.id, option.id, question.type)}
                    className={styles.checkboxInput}
                  />
                  <span>{option.text}</span>
                </label>
              ))
            ) : (
              <div style={{padding: '1rem', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '0.5rem', color: '#856404'}}>
                <p><strong>No options available for this multiple choice question.</strong></p>
                <p>Please contact the survey administrator.</p>
              </div>
            )}
          </div>
        )}

        {/* Yes/No Questions */}
        {question.type === 'yes_no' && (
          <div className={styles.yesNoButtons}>
            <button
              type="button"
              onClick={() => handleAnswerChange(question.id, 'yes', question.type)}
              className={`${styles.yesNoButton} ${answer === 'yes' ? styles.yesNoSelected : ''}`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleAnswerChange(question.id, 'no', question.type)}
              className={`${styles.yesNoButton} ${answer === 'no' ? styles.yesNoSelected : ''}`}
            >
              No
            </button>
          </div>
        )}

        {/* Likert Scale - Rating 1-5 - Handle multiple type names */}
        {(question.type === 'likert_scale' || 
          question.type === 'rating_scale' || 
          question.type === 'rating') && (
          <div className={styles.ratingScale}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleAnswerChange(question.id, rating, question.type)}
                className={`${styles.ratingButton} ${String(answer) === String(rating) ? styles.ratingSelected : ''}`}
              >
                {rating}
              </button>
            ))}
          </div>
        )}

        {/* Fallback for unknown types - render as text input */}
        {!['open_ended', 'response', 'text', 'textarea', 'multiple_choice', 'checkbox', 'dropdown', 'likert_scale', 'rating_scale', 'rating', 'yes_no'].includes(question.type) && (
          <div className={styles.fallbackInput}>
            <p style={{color: '#666', fontSize: '0.9em', marginBottom: '8px'}}>
              Unknown question type: {question.type} - defaulting to text input
            </p>
            <textarea
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
              className={`${styles.textarea} ${hasError ? styles.inputError : ''}`}
              placeholder="Your answer..."
              rows={4}
            />
          </div>
        )}

        {hasError && <div className={styles.errorMessage}>{hasError}</div>}
      </div>
    );
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorIcon}>❌</div>
        <h2>Survey Unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successIcon}>✓</div>
        <h2>Thank you!</h2>
        <p>Your response has been submitted successfully.</p>
        <div className={styles.successDetails}>
          <p>We appreciate you taking the time to complete this survey.</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return null;
  }

  return (
    <div className={styles.publicResponse}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{survey.title}</h1>
          {survey.description && (
            <p className={styles.description}>{survey.description}</p>
          )}

          {/* Progress Bar */}
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              <div className={styles.progressText}>
                <span className={styles.progressIcon}>📊</span>
                Progress
              </div>
              <span className={styles.progressPercentage}>
                {calculateProgress()}%
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>

          {/* Survey Statistics */}
          <div className={styles.surveyStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{survey.questions.length}</span>
              <span className={styles.statLabel}>Total Questions</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {new Set(survey.questions.map(q => q.type)).size}
              </span>
              <span className={styles.statLabel}>Question Types</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{calculateProgress()}%</span>
              <span className={styles.statLabel}>Progress</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.questionsContainer}>
            {survey.questions
              .sort((a, b) => a.display_order - b.display_order)
              .map((question, index) => renderQuestion(question, index))}
          </div>

          <div className={styles.submitSection}>
            <button
              type="submit"
              disabled={submitting}
              className={styles.submitButton}
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>

        <div className={styles.footer}>
          <p>Powered by LLM Survey System</p>
          <p>           ALLMTAGS       </p>
        </div>
      </div>
    </div>
  );
};

export default PublicResponseForm;
