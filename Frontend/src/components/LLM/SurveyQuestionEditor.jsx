// src/components/LLM/SurveyQuestionEditor.jsx
import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import TextArea from '../UI/TextArea';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import Loader from '../common/Loader/Loader';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import styles from './SurveyQuestionEditor.module.scss';

const SurveyQuestionEditor = ({ surveyId, onClose, onSurveyUpdated }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form states
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    is_required: false,
    description: '',
    options: ['', '']
  });

  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    status: 'draft'
  });

  const questionTypes = [
    { value: 'multiple_choice', label: 'Trắc nghiệm' },
    { value: 'single_choice', label: 'Chọn 1 đáp án' },
    { value: 'text', label: 'Văn bản' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Số' },
    { value: 'rating', label: 'Đánh giá' },
    { value: 'boolean', label: 'Có/Không' }
  ];

  // Load survey data for editing
  useEffect(() => {
    const loadSurvey = async () => {
      try {
        setLoading(true);
        const response = await LLMService.getSurveyForEditing(surveyId);
        setSurvey(response.data);
        setSettingsForm({
          title: response.data.title || '',
          description: response.data.description || '',
          status: response.data.status || 'draft'
        });
      } catch (error) {
        showToast('Không thể tải thông tin survey', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (surveyId) {
      loadSurvey();
    }
  }, [surveyId, showToast, onClose]);

  // Handle question form changes
  const handleQuestionChange = (field, value) => {
    setQuestionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle option changes
  const handleOptionChange = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  // Add new option
  const addOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  // Remove option
  const removeOption = (index) => {
    if (questionForm.options.length > 2) {
      const newOptions = questionForm.options.filter((_, i) => i !== index);
      setQuestionForm(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  // Start editing question
  const startEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text || '',
      question_type: question.question_type || 'multiple_choice',
      is_required: question.is_required || false,
      description: question.description || '',
      options: question.question_options?.map(opt => opt.option_text) || ['', '']
    });
  };

  // Save question (update or add)
  const saveQuestion = async () => {
    try {
      setSaving(true);

      // Validate form
      if (!questionForm.question_text.trim()) {
        showToast('Vui lòng nhập nội dung câu hỏi', 'error');
        return;
      }

      // Filter out empty options
      const validOptions = questionForm.options.filter(opt => opt.trim());
      
      const questionData = {
        ...questionForm,
        options: validOptions.length > 0 ? validOptions : undefined
      };

      let response;
      if (editingQuestion) {
        // Update existing question
        response = await LLMService.updateSurveyQuestion(surveyId, editingQuestion.id, questionData);
        showToast('Đã cập nhật câu hỏi', 'success');
      } else {
        // Add new question
        response = await LLMService.addSurveyQuestion(surveyId, questionData);
        showToast('Đã thêm câu hỏi mới', 'success');
      }

      // Reload survey data
      const updatedSurvey = await LLMService.getSurveyForEditing(surveyId);
      setSurvey(updatedSurvey.data);
      
      // Reset form
      setEditingQuestion(null);
      setShowAddModal(false);
      setQuestionForm({
        question_text: '',
        question_type: 'multiple_choice',
        is_required: false,
        description: '',
        options: ['', '']
      });

      if (onSurveyUpdated) {
        onSurveyUpdated();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Lỗi khi lưu câu hỏi', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete question
  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;

    try {
      setSaving(true);
      await LLMService.deleteSurveyQuestion(surveyId, questionId);
      showToast('Đã xóa câu hỏi', 'success');
      
      // Reload survey data
      const updatedSurvey = await LLMService.getSurveyForEditing(surveyId);
      setSurvey(updatedSurvey.data);

      if (onSurveyUpdated) {
        onSurveyUpdated();
      }
    } catch (error) {
      showToast('Lỗi khi xóa câu hỏi', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Update survey settings
  const updateSurveySettings = async () => {
    try {
      setSaving(true);
      await LLMService.updateSurveySettings(surveyId, settingsForm);
      showToast('Đã cập nhật thông tin survey', 'success');
      
      // Update local state
      setSurvey(prev => ({
        ...prev,
        ...settingsForm
      }));

      setShowSettingsModal(false);

      if (onSurveyUpdated) {
        onSurveyUpdated();
      }
    } catch (error) {
      showToast('Lỗi khi cập nhật thông tin survey', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.surveyQuestionEditor}>
      <div className={styles.header}>
        <div>
          <h2>Chỉnh sửa Survey: {survey?.title}</h2>
          <p>Quản lý câu hỏi và cài đặt survey</p>
        </div>
        <div className={styles.headerActions}>
          <Button 
            variant="outline" 
            onClick={() => setShowSettingsModal(true)}
          >
            Cài đặt Survey
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </div>

      <div className={styles.content}>
        <Card>
          <div className={styles.questionsHeader}>
            <h3>Danh sách câu hỏi ({survey?.questions?.length || 0})</h3>
            <Button onClick={() => setShowAddModal(true)}>
              + Thêm câu hỏi
            </Button>
          </div>

          <div className={styles.questionsList}>
            {survey?.questions?.map((question, index) => (
              <div key={question.id} className={styles.questionItem}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>Câu {index + 1}</span>
                  <div className={styles.questionActions}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startEditQuestion(question)}
                    >
                      Sửa
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
                <div className={styles.questionContent}>
                  <h4>{question.question_text}</h4>
                  <p className={styles.questionType}>
                    Loại: {questionTypes.find(t => t.value === question.question_type)?.label}
                    {question.is_required && ' (Bắt buộc)'}
                  </p>
                  {question.question_options?.length > 0 && (
                    <div className={styles.options}>
                      <strong>Tùy chọn:</strong>
                      <ul>
                        {question.question_options.map(option => (
                          <li key={option.id}>{option.option_text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add/Edit Question Modal */}
      <Modal
        isOpen={showAddModal || editingQuestion}
        onClose={() => {
          setShowAddModal(false);
          setEditingQuestion(null);
        }}
        title={editingQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
      >
        <div className={styles.questionForm}>
          <Input
            label="Nội dung câu hỏi *"
            value={questionForm.question_text}
            onChange={(e) => handleQuestionChange('question_text', e.target.value)}
            placeholder="Nhập nội dung câu hỏi"
          />

          <Select
            label="Loại câu hỏi"
            value={questionForm.question_type}
            onChange={(e) => handleQuestionChange('question_type', e.target.value)}
            options={questionTypes}
          />

          <TextArea
            label="Mô tả (không bắt buộc)"
            value={questionForm.description}
            onChange={(e) => handleQuestionChange('description', e.target.value)}
            placeholder="Nhập mô tả cho câu hỏi"
            rows={3}
          />

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={questionForm.is_required}
                onChange={(e) => handleQuestionChange('is_required', e.target.checked)}
              />
              Bắt buộc trả lời
            </label>
          </div>

          {['multiple_choice', 'single_choice', 'rating'].includes(questionForm.question_type) && (
            <div className={styles.optionsSection}>
              <h4>Tùy chọn trả lời</h4>
              {questionForm.options.map((option, index) => (
                <div key={index} className={styles.optionRow}>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Tùy chọn ${index + 1}`}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={questionForm.options.length <= 2}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addOption}>
                + Thêm tùy chọn
              </Button>
            </div>
          )}

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingQuestion(null);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={saveQuestion}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : editingQuestion ? 'Cập nhật' : 'Thêm câu hỏi'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Survey Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Cài đặt Survey"
      >
        <div className={styles.settingsForm}>
          <Input
            label="Tiêu đề Survey *"
            value={settingsForm.title}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Nhập tiêu đề survey"
          />

          <TextArea
            label="Mô tả"
            value={settingsForm.description}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Nhập mô tả survey"
            rows={4}
          />

          <Select
            label="Trạng thái"
            value={settingsForm.status}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: 'draft', label: 'Bản thảo' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'paused', label: 'Tạm dừng' },
              { value: 'completed', label: 'Hoàn thành' }
            ]}
          />

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={updateSurveySettings}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Cập nhật'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SurveyQuestionEditor;