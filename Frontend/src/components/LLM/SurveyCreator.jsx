import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import TextArea from '../UI/TextArea';
import Checkbox from '../UI/Checkbox';
import Switch from '../UI/Switch';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import WorkspaceService from '../../api/services/workspace.service';
import styles from './SurveyCreator.module.scss';

const SurveyCreator = ({ generatedQuestions, onSurveyCreated }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('select');
  const [workspaces, setWorkspaces] = useState([]);

  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    targetAudience: 'public', // Changed default from 'all_users' to 'public'
    targetValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    workspaceId: '', // Add workspaceId to state
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [shareSettings, setShareSettings] = useState({
    isPublic: true, // Default to true for 'public' targetAudience
    allowAnonymous: true,
    requireLogin: false,
    expiryDays: 30
  });

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await WorkspaceService.getMyWorkspaces();
      if (response.ok) {
        setWorkspaces(response.items);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  const handleQuestionSelect = (question, isSelected) => {
    if (isSelected) {
      setSelectedQuestions([...selectedQuestions, {
        ...question,
        id: Date.now() + Math.random(),
        required: false,
        type: getQuestionType(question.question)
      }]);
    } else {
      setSelectedQuestions(selectedQuestions.filter(q => q.question !== question.question));
    }
  };

  const getQuestionType = (questionText) => {
    const text = questionText.toLowerCase();
    if (text.includes('rate') || text.includes('scale') || text.includes('how much')) {
      return 'rating';
    } else if (text.includes('choose') || text.includes('select')) {
      return 'multiple_choice';
    } else if (text.includes('yes') || text.includes('no') || text.includes('do you')) {
      return 'yes_no';
    }
    return 'text';
  };

  const addCustomQuestion = () => {
    setCustomQuestions([...customQuestions, {
      id: Date.now() + Math.random(),
      question_text: '',
      question_type: 'text',
      is_required: false,
      options: []
    }]);
  };

  const updateCustomQuestion = (id, field, value) => {
    setCustomQuestions(customQuestions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeCustomQuestion = (id) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  };

  const addOptionToQuestion = (questionId) => {
    setCustomQuestions(customQuestions.map(q =>
      q.id === questionId ? {
        ...q,
        options: [...(q.options || []), '']
      } : q
    ));
  };

  const updateQuestionOption = (questionId, optionIndex, value) => {
    setCustomQuestions(customQuestions.map(q =>
      q.id === questionId ? {
        ...q,
        options: q.options.map((opt, index) =>
          index === optionIndex ? value : opt
        )
      } : q
    ));
  };

  const removeQuestionOption = (questionId, optionIndex) => {
    setCustomQuestions(customQuestions.map(q =>
      q.id === questionId ? {
        ...q,
        options: q.options.filter((_, index) => index !== optionIndex)
      } : q
    ));
  };

  const handleCreateSurvey = async () => {
    if (!surveyData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề survey', 'error');
      return;
    }

    if (selectedQuestions.length === 0 && customQuestions.length === 0) {
      showToast('Vui lòng chọn hoặc thêm ít nhất một câu hỏi', 'error');
      return;
    }

    if (surveyData.targetAudience === 'internal' && !surveyData.workspaceId) {
      showToast('Vui lòng chọn Workspace cho khảo sát nội bộ', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await LLMService.createSurveyFromQuestions({
        ...surveyData,
        selectedQuestions: selectedQuestions.map(q => ({
          question: q.question,
          type: q.type,
          required: q.required,
          options: q.type === 'multiple_choice' ? ['Option 1', 'Option 2', 'Option 3'] : undefined
        })),
        customQuestions: customQuestions.filter(q => q.question_text.trim()),
        shareSettings
      });

      showToast('Tạo survey thành công!', 'success');
      onSurveyCreated && onSurveyCreated(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo survey', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isQuestionSelected = (question) => {
    return selectedQuestions.some(q => q.question === question.question);
  };

  return (
    <div className={styles.surveyCreator}>
      <Card className={styles.header}>
        <h3>Tạo Survey từ Câu Hỏi AI</h3>
        <p>Chọn câu hỏi và cấu hình survey của bạn</p>
      </Card>

      {/* Survey Basic Info */}
      <Card className={styles.basicInfo}>
        <h4>Thông Tin Cơ Bản</h4>
        <div className={styles.formGroup}>
          <label>Tiêu đề Survey *</label>
          <Input
            value={surveyData.title}
            onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
            placeholder="Nhập tiêu đề survey"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Mô tả</label>
          <TextArea
            value={surveyData.description}
            onChange={(e) => setSurveyData({ ...surveyData, description: e.target.value })}
            placeholder="Mô tả về survey này..."
            rows={3}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Đối tượng khảo sát</label>
            <Select
              value={surveyData.targetAudience}
              onChange={(value) => {
                // Auto-configure share settings based on target audience
                let newShareSettings = { ...shareSettings };

                switch (value) {
                  case 'public':
                    newShareSettings = { ...newShareSettings, isPublic: true, allowAnonymous: true, requireLogin: false };
                    break;
                  case 'public_with_login':
                    newShareSettings = { ...newShareSettings, isPublic: true, allowAnonymous: false, requireLogin: true };
                    break;
                  case 'private':
                    newShareSettings = { ...newShareSettings, isPublic: false, allowAnonymous: false, requireLogin: true };
                    break;
                  case 'internal':
                    newShareSettings = { ...newShareSettings, isPublic: false, allowAnonymous: false, requireLogin: true };
                    break;
                  default:
                    break;
                }

                setSurveyData({ ...surveyData, targetAudience: value });
                setShareSettings(newShareSettings);
              }}
            >
              <option value="public">Công khai (Tất cả mọi người)</option>
              <option value="public_with_login">Công khai (Yêu cầu đăng nhập)</option>
              <option value="private">Riêng tư (Chỉ người được mời)</option>
              <option value="internal">Nội bộ (Thành viên Workspace)</option>
            </Select>
          </div>

          {/* Workspace Selection for Internal Audience */}
          {surveyData.targetAudience === 'internal' && (
            <div className={styles.formGroup}>
              <label>Chọn Workspace *</label>
              <Select
                value={surveyData.workspaceId}
                onChange={(value) => setSurveyData({ ...surveyData, workspaceId: value })}
              >
                <option value="">-- Chọn Workspace --</option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </Select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Ngày bắt đầu</label>
            <Input
              type="date"
              value={surveyData.startDate}
              onChange={(e) => setSurveyData({ ...surveyData, startDate: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Ngày kết thúc (tùy chọn)</label>
            <Input
              type="date"
              value={surveyData.endDate}
              onChange={(e) => setSurveyData({ ...surveyData, endDate: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'select' ? styles.active : ''}`}
          onClick={() => setActiveTab('select')}
        >
          Chọn Câu Hỏi ({selectedQuestions.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'custom' ? styles.active : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Câu Hỏi Tùy Chỉnh ({customQuestions.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'share' ? styles.active : ''}`}
          onClick={() => setActiveTab('share')}
        >
          Cài Đặt Chia Sẻ
        </button>
      </div>

      {/* Tab Content */}
      <Card className={styles.tabContent}>
        {activeTab === 'select' && (
          <div className={styles.questionSelection}>
            <h4>Chọn từ {generatedQuestions.length} câu hỏi được tạo</h4>
            <div className={styles.questionList}>
              {generatedQuestions.map((question, index) => (
                <div key={index} className={styles.questionItem}>
                  <Checkbox
                    checked={isQuestionSelected(question)}
                    onChange={(checked) => handleQuestionSelect(question, checked)}
                  />
                  <div className={styles.questionContent}>
                    <p className={styles.questionText}>{question.question}</p>
                    <small className={styles.questionMeta}>
                      Loại: {getQuestionType(question.question)} • Nguồn: {question.source}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className={styles.customQuestions}>
            <div className={styles.sectionHeader}>
              <h4>Câu Hỏi Tùy Chỉnh</h4>
              <Button onClick={addCustomQuestion} variant="outline">
                + Thêm Câu Hỏi
              </Button>
            </div>

            {customQuestions.map((question) => (
              <div key={question.id} className={styles.customQuestion}>
                <div className={styles.questionHeader}>
                  <Input
                    value={question.question_text}
                    onChange={(e) => updateCustomQuestion(question.id, 'question_text', e.target.value)}
                    placeholder="Nhập câu hỏi..."
                  />
                  <Select
                    value={question.question_type}
                    onChange={(value) => updateCustomQuestion(question.id, 'question_type', value)}
                  >
                    <option value="text">Văn bản</option>
                    <option value="multiple_choice">Trắc nghiệm</option>
                    <option value="yes_no">Có/Không</option>
                    <option value="rating">Đánh giá</option>
                    <option value="date">Ngày tháng</option>
                    <option value="email">Email</option>
                  </Select>
                  <Checkbox
                    checked={question.is_required}
                    onChange={(checked) => updateCustomQuestion(question.id, 'is_required', checked)}
                  />
                  <span className={styles.requiredLabel}>Bắt buộc</span>
                  <Button
                    onClick={() => removeCustomQuestion(question.id)}
                    variant="outline"
                    className={styles.removeBtn}
                  >
                    Xóa
                  </Button>
                </div>

                {question.question_type === 'multiple_choice' && (
                  <div className={styles.options}>
                    <h5>Tùy chọn:</h5>
                    {(question.options || []).map((option, index) => (
                      <div key={index} className={styles.optionRow}>
                        <Input
                          value={option}
                          onChange={(e) => updateQuestionOption(question.id, index, e.target.value)}
                          placeholder={`Tùy chọn ${index + 1}`}
                        />
                        <Button
                          onClick={() => removeQuestionOption(question.id, index)}
                          variant="outline"
                          size="small"
                        >
                          Xóa
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => addOptionToQuestion(question.id)}
                      variant="outline"
                      size="small"
                    >
                      + Thêm tùy chọn
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {customQuestions.length === 0 && (
              <div className={styles.emptyState}>
                <p>Chưa có câu hỏi tùy chỉnh. Nhấn "Thêm Câu Hỏi" để bắt đầu.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'share' && (
          <div className={styles.shareSettings}>
            <h4>Cài Đặt Chia Sẻ</h4>

            <div className={styles.settingGroup}>
              <div className={styles.settingItem}>
                <Switch
                  checked={shareSettings.isPublic}
                  onChange={(checked) => setShareSettings({ ...shareSettings, isPublic: checked })}
                />
                <div className={styles.settingLabel}>
                  <strong>Công khai</strong>
                  <p>Survey có thể được truy cập bởi bất kỳ ai có link</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <Switch
                  checked={shareSettings.allowAnonymous}
                  onChange={(checked) => setShareSettings({ ...shareSettings, allowAnonymous: checked })}
                />
                <div className={styles.settingLabel}>
                  <strong>Cho phép ẩn danh</strong>
                  <p>Người dùng có thể trả lời mà không cần đăng nhập</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <Switch
                  checked={shareSettings.requireLogin}
                  onChange={(checked) => setShareSettings({ ...shareSettings, requireLogin: checked })}
                />
                <div className={styles.settingLabel}>
                  <strong>Yêu cầu đăng nhập</strong>
                  <p>Chỉ người dùng đã đăng nhập mới có thể trả lời</p>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Thời hạn link (ngày)</label>
              <Input
                type="number"
                value={shareSettings.expiryDays}
                onChange={(e) => setShareSettings({ ...shareSettings, expiryDays: parseInt(e.target.value) })}
                min="1"
                max="365"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <Button
          onClick={handleCreateSurvey}
          disabled={loading || !surveyData.title.trim() || (selectedQuestions.length === 0 && customQuestions.length === 0)}
          className={styles.createBtn}
          loading={loading}
        >
          Tạo Survey
        </Button>
      </div>
    </div>
  );
};

export default SurveyCreator;