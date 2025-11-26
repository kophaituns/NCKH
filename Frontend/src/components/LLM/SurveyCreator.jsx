// src/components/LLM/SurveyCreator.jsx
import React, { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import TextArea from '../UI/TextArea';
import Checkbox from '../UI/Checkbox';
import Switch from '../UI/Switch';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import styles from './SurveyCreator.module.scss';

const SurveyCreator = ({ generatedQuestions, onSurveyCreated }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('select');
  
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    targetAudience: 'all_users',
    targetValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [shareSettings, setShareSettings] = useState({
    isPublic: false,
    allowAnonymous: true,
    requireLogin: false,
    expiryDays: 30
  });

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
<<<<<<< HEAD
      showToast('Vui lòng nhập tiêu đề survey', 'error');
=======
      showToast('Please enter survey title', 'error');
>>>>>>> linh2
      return;
    }

    if (selectedQuestions.length === 0 && customQuestions.length === 0) {
<<<<<<< HEAD
      showToast('Vui lòng chọn hoặc thêm ít nhất một câu hỏi', 'error');
=======
      showToast('Please select or add at least one question', 'error');
>>>>>>> linh2
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

<<<<<<< HEAD
      showToast('Tạo survey thành công!', 'success');
      onSurveyCreated && onSurveyCreated(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo survey', 'error');
=======
      showToast('Survey created successfully!', 'success');
      onSurveyCreated && onSurveyCreated(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error occurred while creating survey', 'error');
>>>>>>> linh2
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
<<<<<<< HEAD
        <h3>Tạo Survey từ Câu Hỏi AI</h3>
        <p>Chọn câu hỏi và cấu hình survey của bạn</p>
=======
        <h3>Create Survey from AI Questions</h3>
        <p>Select questions and configure your survey</p>
>>>>>>> linh2
      </Card>

      {/* Survey Basic Info */}
      <Card className={styles.basicInfo}>
<<<<<<< HEAD
        <h4>Thông Tin Cơ Bản</h4>
        <div className={styles.formGroup}>
          <label>Tiêu đề Survey *</label>
          <Input
            value={surveyData.title}
            onChange={(e) => setSurveyData({...surveyData, title: e.target.value})}
            placeholder="Nhập tiêu đề survey"
=======
        <h4>Basic Information</h4>
        <div className={styles.formGroup}>
          <label>Survey Title *</label>
          <Input
            value={surveyData.title}
            onChange={(e) => setSurveyData({...surveyData, title: e.target.value})}
            placeholder="Enter survey title"
>>>>>>> linh2
          />
        </div>
        
        <div className={styles.formGroup}>
<<<<<<< HEAD
          <label>Mô tả</label>
          <TextArea
            value={surveyData.description}
            onChange={(e) => setSurveyData({...surveyData, description: e.target.value})}
            placeholder="Mô tả về survey này..."
=======
          <label>Description</label>
          <TextArea
            value={surveyData.description}
            onChange={(e) => setSurveyData({...surveyData, description: e.target.value})}
            placeholder="Description of this survey..."
>>>>>>> linh2
            rows={3}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
<<<<<<< HEAD
            <label>Đối tượng khảo sát</label>
=======
            <label>Target Audience</label>
>>>>>>> linh2
            <Select
              value={surveyData.targetAudience}
              onChange={(value) => setSurveyData({...surveyData, targetAudience: value})}
            >
<<<<<<< HEAD
              <option value="all_users">Tất cả người dùng</option>
              <option value="specific_group">Nhóm cụ thể</option>
              <option value="custom">Tùy chỉnh</option>
=======
              <option value="all_users">All Users</option>
              <option value="specific_group">Specific Group</option>
              <option value="custom">Custom</option>
>>>>>>> linh2
            </Select>
          </div>

          {(surveyData.targetAudience === 'specific_group' || surveyData.targetAudience === 'custom') && (
            <div className={styles.formGroup}>
              <label>
<<<<<<< HEAD
                {surveyData.targetAudience === 'specific_group' ? 'Tên nhóm' : 'Giá trị tùy chỉnh'}
=======
                {surveyData.targetAudience === 'specific_group' ? 'Group Name' : 'Custom Value'}
>>>>>>> linh2
              </label>
              <Input
                value={surveyData.targetValue}
                onChange={(e) => setSurveyData({...surveyData, targetValue: e.target.value})}
                placeholder={
                  surveyData.targetAudience === 'specific_group' 
<<<<<<< HEAD
                    ? 'Ví dụ: Sinh viên IT, Khoa CNTT...' 
=======
                    ? 'Example: IT Students, Computer Science Faculty...' 
>>>>>>> linh2
                    : 'Nhập giá trị tùy chỉnh...'
                }
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Ngày bắt đầu</label>
            <Input
              type="date"
              value={surveyData.startDate}
              onChange={(e) => setSurveyData({...surveyData, startDate: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Ngày kết thúc (tùy chọn)</label>
            <Input
              type="date"
              value={surveyData.endDate}
              onChange={(e) => setSurveyData({...surveyData, endDate: e.target.value})}
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
<<<<<<< HEAD
            <h4>Chọn từ {generatedQuestions.length} câu hỏi được tạo</h4>
=======
            <h4>Select from {generatedQuestions.length} generated questions</h4>
>>>>>>> linh2
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
<<<<<<< HEAD
                + Thêm Câu Hỏi
=======
                + Add Question
>>>>>>> linh2
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
<<<<<<< HEAD
                  <span className={styles.requiredLabel}>Bắt buộc</span>
=======
                  <span className={styles.requiredLabel}>Required</span>
>>>>>>> linh2
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
<<<<<<< HEAD
                      + Thêm tùy chọn
=======
                      + Add Option
>>>>>>> linh2
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {customQuestions.length === 0 && (
              <div className={styles.emptyState}>
<<<<<<< HEAD
                <p>Chưa có câu hỏi tùy chỉnh. Nhấn "Thêm Câu Hỏi" để bắt đầu.</p>
=======
                <p>No custom questions yet. Click "Add Question" to start.</p>
>>>>>>> linh2
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
                  onChange={(checked) => setShareSettings({...shareSettings, isPublic: checked})}
                />
                <div className={styles.settingLabel}>
                  <strong>Công khai</strong>
                  <p>Survey có thể được truy cập bởi bất kỳ ai có link</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <Switch
                  checked={shareSettings.allowAnonymous}
                  onChange={(checked) => setShareSettings({...shareSettings, allowAnonymous: checked})}
                />
                <div className={styles.settingLabel}>
                  <strong>Cho phép ẩn danh</strong>
                  <p>Người dùng có thể trả lời mà không cần đăng nhập</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <Switch
                  checked={shareSettings.requireLogin}
                  onChange={(checked) => setShareSettings({...shareSettings, requireLogin: checked})}
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
                onChange={(e) => setShareSettings({...shareSettings, expiryDays: parseInt(e.target.value)})}
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