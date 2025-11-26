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
      showToast(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xuất PDF', 'error');
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
      showToast('Tạo link chia sẻ thành công!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Đã copy link vào clipboard!', 'success');
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
      showToast('Tải kết quả thành công!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tải kết quả', 'error');
    } finally {
      setResultsLoading(false);
    }
  };

  const handleEditSurvey = () => {
    if (onEditSurvey) {
      onEditSurvey(survey.survey.id);
      showToast('Đang chuyển đến chế độ chỉnh sửa...', 'info');
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
        </div>
      </Card>

      <div className={styles.actionGrid}>
        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>📄</div>
          <h4>Xuất PDF</h4>
          <p>Tải xuống survey dưới dạng file PDF để in hoặc chia sẻ offline</p>
          <Button 
            onClick={handleExportPDF}
            loading={loading}
            variant="outline"
            className={styles.actionButton}
          >
            Tải PDF
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>🔗</div>
          <h4>Tạo Link Chia Sẻ</h4>
          <p>Tạo link công khai để chia sẻ survey với người dùng</p>
          <Button 
            onClick={() => setShowLinkModal(true)}
            variant="outline"
            className={styles.actionButton}
          >
            Tạo Link
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>📊</div>
          <h4>Xem Kết Quả</h4>
          <p>Xem và phân tích kết quả khảo sát từ những người đã trả lời</p>
          <Button 
            onClick={handleViewResults}
            loading={resultsLoading}
            variant="outline"
            className={styles.actionButton}
          >
            Xem Kết Quả
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>⚙️</div>
          <h4>Chỉnh Sửa</h4>
          <p>Chỉnh sửa câu hỏi và cài đặt survey</p>
          <Button 
            onClick={handleEditSurvey}
            variant="outline"
            className={styles.actionButton}
          >
            Chỉnh Sửa
          </Button>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card className={styles.questionsPreview}>
        <h4>Câu Hỏi Trong Survey ({survey.totalQuestions})</h4>
        <div className={styles.questionsList}>
          {survey.questions.map((question, index) => (
            <div key={question.id} className={styles.questionPreview}>
              <div className={styles.questionNumber}>{index + 1}</div>
              <div className={styles.questionContent}>
                <p className={styles.questionText}>{question.question_text}</p>
                <div className={styles.questionMeta}>
                  <Badge variant="outline">{question.question_type}</Badge>
                  {question.is_required && <Badge variant="warning">Bắt buộc</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className={styles.bottomActions}>
        <Button onClick={onClose} variant="outline">
          Đóng
        </Button>
        <Button onClick={() => window.open(`/surveys/${survey.survey.id}`, '_blank')}>
          Xem Survey
        </Button>
      </div>

      {/* Generate Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Tạo Link Chia Sẻ"
        size="medium"
      >
        <div className={styles.modalContent}>
          {!generatedLink ? (
            <>
              <div className={styles.formGroup}>
                <label>Thời hạn link (ngày)</label>
                <Select
                  value={linkSettings.expiryDays}
                  onChange={(value) => setLinkSettings({...linkSettings, expiryDays: parseInt(value)})}
                >
                  <option value={7}>1 tuần</option>
                  <option value={30}>1 tháng</option>
                  <option value={90}>3 tháng</option>
                  <option value={180}>6 tháng</option>
                  <option value={365}>1 năm</option>
                </Select>
              </div>

              <div className={styles.modalActions}>
                <Button 
                  onClick={() => setShowLinkModal(false)}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleGenerateLink}
                  loading={loading}
                >
                  Tạo Link
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.linkResult}>
                <h5>Link chia sẻ đã được tạo!</h5>
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
                    <p><strong>Hết hạn:</strong> {formatExpiryDate(generatedLink.expiresAt)}</p>
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
                  Đóng
                </Button>
                <Button 
                  onClick={() => window.open(generatedLink.link, '_blank')}
                  variant="outline"
                >
                  Mở Link
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
        title="Kết Quả Khảo Sát"
        size="large"
      >
        <div className={styles.resultsModal}>
          {surveyResults ? (
            <>
              <div className={styles.resultsSummary}>
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
                  </div>
                </div>
              </div>

              {surveyResults.summary.totalResponses > 0 ? (
                <>
                  <div className={styles.questionsResults}>
                    <h4>Kết Quả Theo Câu Hỏi</h4>
                    {surveyResults.questions.map((question, index) => (
                      <div key={index} className={styles.questionResult}>
                        <h5>{question.question}</h5>
                        <div className={styles.questionMeta}>
                          <span>Loại: {question.type}</span>
                          <span>Trả lời: {question.totalAnswers}</span>
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
                                    và {question.textAnswers.length - 5} câu trả lời khác...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className={styles.noAnswers}>Chưa có câu trả lời nào</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {surveyResults.recentResponses && surveyResults.recentResponses.length > 0 && (
                    <div className={styles.recentResponses}>
                      <h4>Phản Hồi Gần Đây</h4>
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
                              {response.is_completed ? "Hoàn thành" : "Chưa hoàn thành"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noResults}>
                  <p>Chưa có ai trả lời khảo sát này.</p>
                  <p>Hãy chia sẻ link khảo sát để nhận được phản hồi!</p>
                </div>
              )}

              <div className={styles.modalActions}>
                <Button onClick={() => setShowResultsModal(false)}>
                  Đóng
                </Button>
                {surveyResults.summary.totalResponses > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    In Kết Quả
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className={styles.loadingResults}>
              <p>Đang tải kết quả...</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SurveyActions;