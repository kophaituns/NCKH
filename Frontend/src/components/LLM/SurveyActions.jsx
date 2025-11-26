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
<<<<<<< HEAD
      showToast(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xuất PDF', 'error');
=======
      showToast(error.response?.data?.message || error.message || 'Error occurred while exporting PDF', 'error');
>>>>>>> linh2
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
<<<<<<< HEAD
      showToast('Tạo link chia sẻ thành công!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo link', 'error');
=======
      showToast('Share link created successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error occurred while creating link', 'error');
>>>>>>> linh2
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
<<<<<<< HEAD
      showToast('Đã copy link vào clipboard!', 'success');
=======
      showToast('Link copied to clipboard!', 'success');
>>>>>>> linh2
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
<<<<<<< HEAD
      showToast('Tải kết quả thành công!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tải kết quả', 'error');
=======
      showToast('Results loaded successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error occurred while loading results', 'error');
>>>>>>> linh2
    } finally {
      setResultsLoading(false);
    }
  };

  const handleEditSurvey = () => {
    if (onEditSurvey) {
      onEditSurvey(survey.survey.id);
<<<<<<< HEAD
      showToast('Đang chuyển đến chế độ chỉnh sửa...', 'info');
=======
      showToast('Switching to edit mode...', 'info');
>>>>>>> linh2
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
<<<<<<< HEAD
            {survey.totalQuestions} câu hỏi
          </Badge>
        </div>
        <p className={styles.description}>
          {survey.survey.description || 'Không có mô tả'}
        </p>
        <div className={styles.meta}>
          <span>ID: {survey.survey.id}</span>
          <span>Trạng thái: {survey.survey.status}</span>
          <span>Tạo lúc: {new Date(survey.survey.created_at).toLocaleString('vi-VN')}</span>
=======
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
>>>>>>> linh2
        </div>
      </Card>

      <div className={styles.actionGrid}>
        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>📄</div>
<<<<<<< HEAD
          <h4>Xuất PDF</h4>
          <p>Tải xuống survey dưới dạng file PDF để in hoặc chia sẻ offline</p>
=======
          <h4>Export PDF</h4>
          <p>Download survey as PDF file for printing or offline sharing</p>
>>>>>>> linh2
          <Button 
            onClick={handleExportPDF}
            loading={loading}
            variant="outline"
            className={styles.actionButton}
          >
<<<<<<< HEAD
            Tải PDF
=======
            Download PDF
>>>>>>> linh2
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>🔗</div>
<<<<<<< HEAD
          <h4>Tạo Link Chia Sẻ</h4>
          <p>Tạo link công khai để chia sẻ survey với người dùng</p>
=======
          <h4>Create Share Link</h4>
          <p>Create a public link to share the survey with users</p>
>>>>>>> linh2
          <Button 
            onClick={() => setShowLinkModal(true)}
            variant="outline"
            className={styles.actionButton}
          >
<<<<<<< HEAD
            Tạo Link
=======
            Create Link
>>>>>>> linh2
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>📊</div>
<<<<<<< HEAD
          <h4>Xem Kết Quả</h4>
          <p>Xem và phân tích kết quả khảo sát từ những người đã trả lời</p>
=======
          <h4>View Results</h4>
          <p>View and analyze survey results from respondents</p>
>>>>>>> linh2
          <Button 
            onClick={handleViewResults}
            loading={resultsLoading}
            variant="outline"
            className={styles.actionButton}
          >
<<<<<<< HEAD
            Xem Kết Quả
=======
            View Results
>>>>>>> linh2
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>⚙️</div>
<<<<<<< HEAD
          <h4>Chỉnh Sửa</h4>
          <p>Chỉnh sửa câu hỏi và cài đặt survey</p>
=======
          <h4>Edit</h4>
          <p>Edit questions and survey settings</p>
>>>>>>> linh2
          <Button 
            onClick={handleEditSurvey}
            variant="outline"
            className={styles.actionButton}
          >
<<<<<<< HEAD
            Chỉnh Sửa
=======
            Edit
>>>>>>> linh2
          </Button>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card className={styles.questionsPreview}>
<<<<<<< HEAD
        <h4>Câu Hỏi Trong Survey ({survey.totalQuestions})</h4>
=======
        <h4>Questions in Survey ({survey.totalQuestions})</h4>
>>>>>>> linh2
        <div className={styles.questionsList}>
          {survey.questions.map((question, index) => (
            <div key={question.id} className={styles.questionPreview}>
              <div className={styles.questionNumber}>{index + 1}</div>
              <div className={styles.questionContent}>
                <p className={styles.questionText}>{question.question_text}</p>
                <div className={styles.questionMeta}>
                  <Badge variant="outline">{question.question_type}</Badge>
<<<<<<< HEAD
                  {question.is_required && <Badge variant="warning">Bắt buộc</Badge>}
=======
                  {question.is_required && <Badge variant="warning">Required</Badge>}
>>>>>>> linh2
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className={styles.bottomActions}>
        <Button onClick={onClose} variant="outline">
<<<<<<< HEAD
          Đóng
=======
          Close
>>>>>>> linh2
        </Button>
        <Button onClick={() => window.open(`/surveys/${survey.survey.id}`, '_blank')}>
          Xem Survey
        </Button>
      </div>

      {/* Generate Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
<<<<<<< HEAD
        title="Tạo Link Chia Sẻ"
=======
        title="Create Share Link"
>>>>>>> linh2
        size="medium"
      >
        <div className={styles.modalContent}>
          {!generatedLink ? (
            <>
              <div className={styles.formGroup}>
<<<<<<< HEAD
                <label>Thời hạn link (ngày)</label>
=======
                <label>Link expiry (days)</label>
>>>>>>> linh2
                <Select
                  value={linkSettings.expiryDays}
                  onChange={(value) => setLinkSettings({...linkSettings, expiryDays: parseInt(value)})}
                >
<<<<<<< HEAD
                  <option value={7}>1 tuần</option>
                  <option value={30}>1 tháng</option>
                  <option value={90}>3 tháng</option>
                  <option value={180}>6 tháng</option>
                  <option value={365}>1 năm</option>
=======
                  <option value={7}>1 week</option>
                  <option value={30}>1 month</option>
                  <option value={90}>3 months</option>
                  <option value={180}>6 months</option>
                  <option value={365}>1 year</option>
>>>>>>> linh2
                </Select>
              </div>

              <div className={styles.modalActions}>
                <Button 
                  onClick={() => setShowLinkModal(false)}
                  variant="outline"
                >
<<<<<<< HEAD
                  Hủy
=======
                  Cancel
>>>>>>> linh2
                </Button>
                <Button 
                  onClick={handleGenerateLink}
                  loading={loading}
                >
<<<<<<< HEAD
                  Tạo Link
=======
                  Create Link
>>>>>>> linh2
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.linkResult}>
<<<<<<< HEAD
                <h5>Link chia sẻ đã được tạo!</h5>
=======
                <h5>Share link has been created!</h5>
>>>>>>> linh2
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
<<<<<<< HEAD
                    <p><strong>Hết hạn:</strong> {formatExpiryDate(generatedLink.expiresAt)}</p>
=======
                    <p><strong>Expires:</strong> {formatExpiryDate(generatedLink.expiresAt)}</p>
>>>>>>> linh2
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
<<<<<<< HEAD
                  Đóng
=======
                  Close
>>>>>>> linh2
                </Button>
                <Button 
                  onClick={() => window.open(generatedLink.link, '_blank')}
                  variant="outline"
                >
<<<<<<< HEAD
                  Mở Link
=======
                  Open Link
>>>>>>> linh2
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
<<<<<<< HEAD
        title="Kết Quả Khảo Sát"
=======
        title="Survey Results"
>>>>>>> linh2
        size="large"
      >
        <div className={styles.resultsModal}>
          {surveyResults ? (
            <>
              <div className={styles.resultsSummary}>
<<<<<<< HEAD
                <h4>Tổng Quan</h4>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryNumber}>{surveyResults.summary.totalResponses}</div>
                    <div className={styles.summaryLabel}>Tổng Phản Hồi</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryNumber}>{surveyResults.summary.completedResponses}</div>
                    <div className={styles.summaryLabel}>Hoàn Thành</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryNumber}>{surveyResults.summary.completionRate}%</div>
                    <div className={styles.summaryLabel}>Tỷ Lệ Hoàn Thành</div>
=======
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
>>>>>>> linh2
                  </div>
                </div>
              </div>

              {surveyResults.summary.totalResponses > 0 ? (
                <>
                  <div className={styles.questionsResults}>
<<<<<<< HEAD
                    <h4>Kết Quả Theo Câu Hỏi</h4>
=======
                    <h4>Results by Question</h4>
>>>>>>> linh2
                    {surveyResults.questions.map((question, index) => (
                      <div key={index} className={styles.questionResult}>
                        <h5>{question.question}</h5>
                        <div className={styles.questionMeta}>
<<<<<<< HEAD
                          <span>Loại: {question.type}</span>
                          <span>Trả lời: {question.totalAnswers}</span>
=======
                          <span>Type: {question.type}</span>
                          <span>Answers: {question.totalAnswers}</span>
>>>>>>> linh2
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
<<<<<<< HEAD
                                    và {question.textAnswers.length - 5} câu trả lời khác...
=======
                                    and {question.textAnswers.length - 5} other answers...
>>>>>>> linh2
                                  </div>
                                )}
                              </div>
                            ) : (
<<<<<<< HEAD
                              <p className={styles.noAnswers}>Chưa có câu trả lời nào</p>
=======
                              <p className={styles.noAnswers}>No answers yet</p>
>>>>>>> linh2
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {surveyResults.recentResponses && surveyResults.recentResponses.length > 0 && (
                    <div className={styles.recentResponses}>
<<<<<<< HEAD
                      <h4>Phản Hồi Gần Đây</h4>
=======
                      <h4>Recent Responses</h4>
>>>>>>> linh2
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
<<<<<<< HEAD
                              {response.is_completed ? "Hoàn thành" : "Chưa hoàn thành"}
=======
                              {response.is_completed ? "Completed" : "Incomplete"}
>>>>>>> linh2
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noResults}>
<<<<<<< HEAD
                  <p>Chưa có ai trả lời khảo sát này.</p>
                  <p>Hãy chia sẻ link khảo sát để nhận được phản hồi!</p>
=======
                  <p>No one has responded to this survey yet.</p>
                  <p>Share the survey link to get responses!</p>
>>>>>>> linh2
                </div>
              )}

              <div className={styles.modalActions}>
                <Button onClick={() => setShowResultsModal(false)}>
<<<<<<< HEAD
                  Đóng
=======
                  Close
>>>>>>> linh2
                </Button>
                {surveyResults.summary.totalResponses > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => window.print()}
                  >
<<<<<<< HEAD
                    In Kết Quả
=======
                    Print Results
>>>>>>> linh2
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className={styles.loadingResults}>
<<<<<<< HEAD
              <p>Đang tải kết quả...</p>
=======
              <p>Loading results...</p>
>>>>>>> linh2
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SurveyActions;