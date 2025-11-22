import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './PublicSurveyForm.module.scss';

const PublicSurveyForm = () => {
  const { token } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSurvey();
  }, [token]);

  const loadSurvey = async () => {
    try {
      const response = await fetch(`/api/modules/llm/public/${token}`);
      const data = await response.json();
      
      if (data.success) {
        setSurvey(data.data);
      } else {
        setError('Khảo sát không tồn tại hoặc đã hết hạn');
      }
    } catch (error) {
      setError('Lỗi khi tải khảo sát');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value, optionId = null) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        answer_text: value,
        selected_option_id: optionId
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = {
        answers: Object.values(answers),
        session_token: Date.now().toString()
      };

      const response = await fetch(`/api/modules/llm/public/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
      } else {
        setError('Lỗi khi gửi phản hồi');
      }
    } catch (error) {
      setError('Lỗi khi gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải khảo sát...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <h2>Cảm ơn bạn đã tham gia khảo sát!</h2>
          <p>Phản hồi của bạn đã được ghi nhận thành công.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.survey}>
        <div className={styles.header}>
          <h1>{survey?.title}</h1>
          {survey?.description && (
            <p className={styles.description}>{survey.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {survey?.questions?.map((question, index) => (
            <div key={question.id} className={styles.question}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>{index + 1}.</span>
                <span className={styles.questionText}>{question.text}</span>
                {question.required && <span className={styles.required}>*</span>}
              </div>

              <div className={styles.answerArea}>
                {question.type === 'multiple_choice' && (
                  <div className={styles.options}>
                    {question.options?.map(option => (
                      <label key={option.id} className={styles.option}>
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value={option.text}
                          onChange={() => handleAnswerChange(question.id, option.text, option.id)}
                          required={question.required}
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'yes_no' && (
                  <div className={styles.options}>
                    <label className={styles.option}>
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value="Có"
                        onChange={() => handleAnswerChange(question.id, 'Có')}
                        required={question.required}
                      />
                      <span>Có</span>
                    </label>
                    <label className={styles.option}>
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value="Không"
                        onChange={() => handleAnswerChange(question.id, 'Không')}
                        required={question.required}
                      />
                      <span>Không</span>
                    </label>
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className={styles.rating}>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <label key={rating} className={styles.ratingOption}>
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value={rating}
                          onChange={() => handleAnswerChange(question.id, rating.toString())}
                          required={question.required}
                        />
                        <span className={styles.ratingNumber}>{rating}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'text' && (
                  <textarea
                    className={styles.textInput}
                    placeholder="Nhập câu trả lời của bạn..."
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                    rows={4}
                  />
                )}

                {(question.type === 'email' || question.type === 'date') && (
                  <input
                    type={question.type}
                    className={styles.input}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                  />
                )}
              </div>
            </div>
          ))}

          <div className={styles.submitSection}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicSurveyForm;