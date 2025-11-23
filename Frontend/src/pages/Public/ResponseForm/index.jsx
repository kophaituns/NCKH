import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ResponseService from '../../../api/services/response.service';
import Loader from '../../../components/common/Loader/Loader';
import styles from './ResponseForm.module.scss';

const PublicResponseForm = () => {
  const { token } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [collectorId, setCollectorId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ResponseService.getSurveyByToken(token);
      
      if (!response.ok && !response.success) {
        setError(response.message || 'Invalid or inactive survey link');
        return;
      }

      // Backend returns data directly, not wrapped in 'survey'
      const surveyData = response.data || response;
      console.log('Survey data received:', surveyData); // Debug log
      setSurvey(surveyData);
      setCollectorId(response.data?.collector_id || null);

      // Initialize answers based on question type
      const initialAnswers = {};
      if (surveyData.questions && Array.isArray(surveyData.questions)) {
        console.log('Questions found:', surveyData.questions.length); // Debug log
        surveyData.questions.forEach(q => {
          // Checkbox needs array, others need empty string or null
          if (q.type === 'checkbox') {
            initialAnswers[q.id] = [];
          } else {
            initialAnswers[q.id] = '';
          }
        });
      } else {
        console.log('No questions found or questions is not an array'); // Debug log
      }
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching survey:', error);
      setError(error.response?.data?.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

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
    // For checkbox type - handle multiple selections
    if (questionType === 'checkbox') {
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

      const response = await ResponseService.submitPublicResponse(token, {
        answers: formattedAnswers
      });

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

  const renderQuestion = (question) => {
    const answer = answers[question.id];
    const hasError = errors[question.id];

    return (
      <div key={question.id} className={styles.questionBlock}>
        <label className={styles.questionLabel}>
          {question.text}
          {question.required && <span className={styles.required}>*</span>}
        </label>

        {/* Text/Open Ended - Text area */}
        {(question.type === 'text' || question.type === 'open_ended') && (
          <textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
            className={`${styles.textarea} ${hasError ? styles.inputError : ''}`}
            placeholder="Your answer..."
            rows={4}
          />
        )}

        {/* Yes/No - Radio buttons */}
        {question.type === 'yes_no' && (
          <div className={styles.optionsList}>
            <label className={styles.optionLabel}>
              <input
                type="radio"
                name={`question-${question.id}`}
                value="yes"
                checked={answer === 'yes'}
                onChange={(e) => handleAnswerChange(question.id, 'yes', question.type)}
                className={styles.radioInput}
              />
              <span>Yes</span>
            </label>
            <label className={styles.optionLabel}>
              <input
                type="radio"
                name={`question-${question.id}`}
                value="no"
                checked={answer === 'no'}
                onChange={(e) => handleAnswerChange(question.id, 'no', question.type)}
                className={styles.radioInput}
              />
              <span>No</span>
            </label>
          </div>
        )}

        {/* Multiple Choice - Radio buttons (single selection) */}
        {question.type === 'multiple_choice' && (
          <div className={styles.optionsList}>
            {(question.options || []).map((option) => (
              <label key={option.id} className={styles.optionLabel}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answer === option.id}
                  onChange={(e) => handleAnswerChange(question.id, option.id, question.type)}
                  className={styles.radioInput}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
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

        {/* Likert Scale - Rating 1-5 */}
        {(question.type === 'likert_scale' || question.type === 'rating') && (
          <div className={styles.ratingScale}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleAnswerChange(question.id, rating, question.type)}
                className={`${styles.ratingButton} ${answer === rating ? styles.ratingSelected : ''}`}
              >
                {rating}
              </button>
            ))}
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
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.questionsContainer}>
            {console.log('Survey data:', survey)}
            {console.log('Questions:', survey.questions)}
            {console.log('Questions length:', survey.questions?.length)}
            {survey.questions && survey.questions.length > 0 ? (
              survey.questions
                .sort((a, b) => (a.order || a.display_order || 0) - (b.order || b.display_order || 0))
                .map(renderQuestion)
            ) : (
              <div className={styles.noQuestions}>
                <p>No questions available for this survey.</p>
                <p>Debug: {JSON.stringify(survey, null, 2)}</p>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
};

export default PublicResponseForm;
