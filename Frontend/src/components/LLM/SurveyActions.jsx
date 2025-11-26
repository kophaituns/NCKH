// src/components/LLM/SurveyActions.jsx
import React, { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Badge from '../UI/Badge';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import styles from './SurveyActions.module.scss';

const SurveyActions = ({ survey, onClose, onEditSurvey }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [surveyResults, setSurveyResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [linkSettings, setLinkSettings] = useState({
    expiryDays: 30
  });

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
      showToast(error.response?.data?.message || error.message || 'Error occurred while exporting PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const response = await LLMService.generatePublicLink(
        survey.survey.id, 
        linkSettings.expiryDays
      );
      setGeneratedLink(response.data);
      showToast('Share link created successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error occurred while creating link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Link copied to clipboard!', 'success');
    });
  };

  const handleViewResults = async () => {
    if (surveyResults) {
      setShowResultsModal(true);
      return;
    }

    setResultsLoading(true);
    try {
      const response = await LLMService.getSurveyResults(survey.survey.id);
      setSurveyResults(response.data);
      setShowResultsModal(true);
      showToast('Results loaded successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error occurred while loading results', 'error');
    } finally {
      setResultsLoading(false);
    }
  };

  const handleEditSurvey = () => {
    if (onEditSurvey) {
      onEditSurvey(survey.survey.id);
      showToast('Switching to edit mode...', 'info');
    }
  };

  const formatExpiryDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>🔗</div>
          <h4>Create Share Link</h4>
          <p>Create a public link to share the survey with users</p>
          <Button 
            onClick={() => setShowLinkModal(true)}
            variant="outline"
            className={styles.actionButton}
          >
            Create Link
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>📊</div>
          <h4>View Results</h4>
          <p>View and analyze survey results from respondents</p>
          <Button 
            onClick={handleViewResults}
            loading={resultsLoading}
            variant="outline"
            className={styles.actionButton}
          >
            View Results
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>⚙️</div>
          <h4>Edit</h4>
          <p>Edit questions and survey settings</p>
          <Button 
            onClick={handleEditSurvey}
            variant="outline"
            className={styles.actionButton}
          >
            Edit
          </Button>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card className={styles.questionsPreview}>
        <h4>Questions in Survey ({survey.totalQuestions})</h4>
        <div className={styles.questionsList}>
          {survey.questions.map((question, index) => (
            <div key={question.id} className={styles.questionPreview}>
              <div className={styles.questionNumber}>{index + 1}</div>
              <div className={styles.questionContent}>
                <p className={styles.questionText}>{question.question_text}</p>
                <div className={styles.questionMeta}>
                  <Badge variant="outline">{question.question_type}</Badge>
                  {question.is_required && <Badge variant="warning">Required</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className={styles.bottomActions}>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
        <Button onClick={() => window.open(`/surveys/${survey.survey.id}`, '_blank')}>
          Xem Survey
        </Button>
      </div>

      {/* Generate Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Create Share Link"
        size="medium"
      >
        <div className={styles.modalContent}>
          {!generatedLink ? (
            <>
              <div className={styles.formGroup}>
                <label>Link expiry (days)</label>
                <Select
                  value={linkSettings.expiryDays}
                  onChange={(value) => setLinkSettings({...linkSettings, expiryDays: parseInt(value)})}
                >
                  <option value={7}>1 week</option>
                  <option value={30}>1 month</option>
                  <option value={90}>3 months</option>
                  <option value={180}>6 months</option>
                  <option value={365}>1 year</option>
                </Select>
              </div>

              <div className={styles.modalActions}>
                <Button 
                  onClick={() => setShowLinkModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateLink}
                  loading={loading}
                >
                  Create Link
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.linkResult}>
                <h5>Share link has been created!</h5>
                <div className={styles.linkInfo}>
                  <p><strong>Link:</strong></p>
                  <div className={styles.linkContainer}>
                    <Input
                      value={generatedLink.link}
                      readOnly
                      className={styles.linkInput}
                    />
                    <Button 
                      onClick={() => copyToClipboard(generatedLink.link)}
                      variant="outline"
                      size="small"
                    >
                      Copy
                    </Button>
                  </div>
                  
                  <div className={styles.linkMeta}>
                    <p><strong>Expires:</strong> {formatExpiryDate(generatedLink.expiresAt)}</p>
                    <p><strong>Token:</strong> {generatedLink.token}</p>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <Button 
                  onClick={() => {
                    setShowLinkModal(false);
                    setGeneratedLink(null);
                  }}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => window.open(generatedLink.link, '_blank')}
                  variant="outline"
                >
                  Open Link
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Survey Results Modal */}
      <Modal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        title="Survey Results"
        size="large"
      >
        <div className={styles.resultsModal}>
          {surveyResults ? (
            <>
              <div className={styles.resultsSummary}>
                <h4>Overview</h4>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryNumber}>{surveyResults.summary.totalResponses}</div>
                    <div className={styles.summaryLabel}>Total Responses</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryNumber}>{surveyResults.summary.completedResponses}</div>
                    <div className={styles.summaryLabel}>Completed</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryNumber}>{surveyResults.summary.completionRate}%</div>
                    <div className={styles.summaryLabel}>Completion Rate</div>
                  </div>
                </div>
              </div>

              {surveyResults.summary.totalResponses > 0 ? (
                <>
                  <div className={styles.questionsResults}>
                    <h4>Results by Question</h4>
                    {surveyResults.questions.map((question, index) => (
                      <div key={index} className={styles.questionResult}>
                        <h5>{question.question}</h5>
                        <div className={styles.questionMeta}>
                          <span>Type: {question.type}</span>
                          <span>Answers: {question.totalAnswers}</span>
                        </div>

                        {question.type === 'multiple_choice' ? (
                          <div className={styles.optionsResults}>
                            {Object.entries(question.answers).map(([option, count]) => (
                              <div key={option} className={styles.optionResult}>
                                <div className={styles.optionText}>{option}</div>
                                <div className={styles.optionBar}>
                                  <div 
                                    className={styles.optionFill}
                                    style={{ 
                                      width: question.totalAnswers > 0 
                                        ? `${(count / question.totalAnswers) * 100}%` 
                                        : '0%' 
                                    }}
                                  ></div>
                                </div>
                                <div className={styles.optionCount}>{count}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.textAnswers}>
                            {question.textAnswers && question.textAnswers.length > 0 ? (
                              <div className={styles.answersList}>
                                {question.textAnswers.slice(0, 5).map((answer, idx) => (
                                  <div key={idx} className={styles.textAnswer}>
                                    "{answer}"
                                  </div>
                                ))}
                                {question.textAnswers.length > 5 && (
                                  <div className={styles.moreAnswers}>
                                    and {question.textAnswers.length - 5} other answers...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className={styles.noAnswers}>No answers yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {surveyResults.recentResponses && surveyResults.recentResponses.length > 0 && (
                    <div className={styles.recentResponses}>
                      <h4>Recent Responses</h4>
                      <div className={styles.responsesList}>
                        {surveyResults.recentResponses.map((response) => (
                          <div key={response.id} className={styles.responseItem}>
                            <div className={styles.respondentInfo}>
                              <strong>{response.respondent_name}</strong>
                              <span className={styles.responseTime}>
                                {new Date(response.submitted_at).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <Badge variant={response.is_completed ? "success" : "warning"}>
                              {response.is_completed ? "Completed" : "Incomplete"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noResults}>
                  <p>No one has responded to this survey yet.</p>
                  <p>Share the survey link to get responses!</p>
                </div>
              )}

              <div className={styles.modalActions}>
                <Button onClick={() => setShowResultsModal(false)}>
                  Close
                </Button>
                {surveyResults.summary.totalResponses > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    Print Results
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className={styles.loadingResults}>
              <p>Loading results...</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SurveyActions;