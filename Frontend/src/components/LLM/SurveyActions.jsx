import React, { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import styles from './SurveyActions.module.scss';

const SurveyActions = ({ survey, onClose }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const result = await LLMService.exportSurveyPDF(survey.survey.id);

      if (result.success) {
        showToast(result.message, 'success');
      } else {
        throw new Error(result.message || 'Export failed');
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      showToast(error.response?.data?.message || error.message || 'An error occurred while exporting PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.surveyActions}>
      <Card className={styles.header}>
        <div className={styles.titleSection}>
          <h3>{survey.survey.title}</h3>
          <Badge variant="success">
            {survey.totalQuestions} questions
          </Badge>
        </div>
        <p className={styles.description}>
          {survey.survey.description || 'No description'}
        </p>
        <div className={styles.meta}>
          <span>ID: {survey.survey.id}</span>
          <span>Status: {survey.survey.status}</span>
          <span>Created: {new Date(survey.survey.created_at).toLocaleString('en-US')}</span>
        </div>
      </Card>

      <div className={styles.actionGrid}>
        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>📄</div>
          <h4>Export PDF</h4>
          <p>Download survey as PDF file for printing or offline sharing</p>
          <Button
            onClick={handleExportPDF}
            loading={loading}
            variant="outline"
            className={styles.actionButton}
          >
            Download PDF
          </Button>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card className={styles.questionsPreview}>
        <h4>Questions in Survey ({survey.totalQuestions || survey.questions?.length || 0})</h4>
        <div className={styles.questionsList}>
          {(survey.questions || []).map((question, index) => {
            const questionText = question.question_text || question.text || String(question);
            const questionType = question.question_type || question.type || question.QuestionType?.type_name || 'text';
            const isRequired = question.is_required || question.required || false;

            return (
              <div key={question.id || index} className={styles.questionPreview}>
                <div className={styles.questionNumber}>{index + 1}</div>
                <div className={styles.questionContent}>
                  <p className={styles.questionText}>{questionText}</p>
                  <div className={styles.questionMeta}>
                    <Badge variant="outline">{questionType}</Badge>
                    {isRequired && <Badge variant="warning">Required</Badge>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Actions */}
      <div className={styles.bottomActions}>
        <Button onClick={onClose} variant="outline">
          Continue Editing
        </Button>
        <Button onClick={() => window.location.href = '/surveys'}>
          Complete & View List
        </Button>
      </div>
    </div>
  );
};

export default SurveyActions;