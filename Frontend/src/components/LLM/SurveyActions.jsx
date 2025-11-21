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

const SurveyActions = ({ survey, onClose }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [linkSettings, setLinkSettings] = useState({
    expiryDays: 30
  });

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const pdfBlob = await LLMService.exportSurveyPDF(survey.survey.id);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-${survey.survey.id}-${survey.survey.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Xuất PDF thành công!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi xuất PDF', 'error');
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
          <p>Xem và phân tích kết quả khảo sát (sẽ có sau khi có phản hồi)</p>
          <Button 
            variant="outline"
            disabled
            className={styles.actionButton}
          >
            Chưa có dữ liệu
          </Button>
        </Card>

        <Card className={styles.actionCard}>
          <div className={styles.actionIcon}>⚙️</div>
          <h4>Chỉnh Sửa</h4>
          <p>Chỉnh sửa câu hỏi và cài đặt survey</p>
          <Button 
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
    </div>
  );
};

export default SurveyActions;