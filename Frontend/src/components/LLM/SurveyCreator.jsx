import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import TextArea from '../UI/TextArea';
import Checkbox from '../UI/Checkbox';
import Switch from '../UI/Switch';
import Modal from '../UI/Modal';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import WorkspaceService from '../../api/services/workspace.service';
import styles from './SurveyCreator.module.scss';

const SurveyCreator = ({
  generatedQuestions,
  onSurveyCreated,
  onRemoveQuestion,
  onUpdateQuestion = () => {},
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('select');
  const [workspaces, setWorkspaces] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    targetAudience: 'public', // Changed default from 'all_users' to 'public'
    targetValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    workspaceId: '', // Add workspaceId to state
  });

  // ❌ Bỏ selectedQuestions nội bộ – danh sách câu hỏi đã chọn
  // được truyền từ ngoài qua prop generatedQuestions
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

  // Question types that require options array (min 2 options)
  const questionTypesWithOptions = ['multiple_choice', 'multiple_select', 'dropdown', 'checkbox'];
  
  // Question types that should NOT have options
  // - text: single line input
  // - rating: uses maxScore instead of options
  // - yes_no: auto-generates ["Yes", "No"] options (handled separately)

  const handleOpenEditQuestion = (question, index) => {
    const questionType = question.type || getQuestionType(question.question);
    const needsOptions = questionTypesWithOptions.includes(questionType);
    
    // Initialize options based on question type
    let initialOptions = [];
    if (needsOptions) {
      // Multiple choice, multiple select, dropdown, checkbox: need options
      initialOptions = question.options || ['Option 1', 'Option 2'];
    } else if (questionType === 'yes_no') {
      // Yes/No: predefined options
      initialOptions = question.options || ['Yes', 'No'];
    }
    // text, rating: no options needed
    
    setEditingQuestion({
      ...question,
      index,
      question_text: question.question,
      question_type: questionType,
      required: question.required ?? false,
      options: initialOptions,
      maxScore: question.maxScore || (questionType === 'rating' ? 5 : undefined),
    });
    setShowEditModal(true);
  };

  const handleAddOption = () => {
    if (!editingQuestion) return;
    setEditingQuestion(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const handleUpdateOption = (index, value) => {
    if (!editingQuestion) return;
    setEditingQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleRemoveOption = (index) => {
    if (!editingQuestion || !editingQuestion.options) return;
    if (editingQuestion.options.length <= 2) {
      showToast('At least 2 options are required', 'error');
      return;
    }
    setEditingQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSaveEditedQuestion = () => {
    if (!editingQuestion?.question_text?.trim()) {
      showToast('Please enter question text', 'error');
      return;
    }

    // Validate options for question types that require them
    if (questionTypesWithOptions.includes(editingQuestion.question_type) || editingQuestion.question_type === 'yes_no') {
      const validOptions = (editingQuestion.options || []).filter(opt => opt && opt.trim && opt.trim().length > 0);
      if (validOptions.length < 2) {
        showToast('At least 2 options are required for this question type', 'error');
        return;
      }
    }
    
    // Validate rating maxScore
    if (editingQuestion.question_type === 'rating') {
      if (!editingQuestion.maxScore || editingQuestion.maxScore < 1) {
        showToast('Rating questions require maxScore (default: 5)', 'error');
        return;
      }
    }

    const { index, ...rest } = editingQuestion;
    const updated = {
      ...rest,
      question: editingQuestion.question_text.trim(),
      type: editingQuestion.question_type,
      required: !!editingQuestion.required,
      options: (questionTypesWithOptions.includes(editingQuestion.question_type) || editingQuestion.question_type === 'yes_no')
        ? (editingQuestion.options || []).filter(opt => opt && opt.trim && opt.trim().length > 0)
        : undefined,
      maxScore: editingQuestion.question_type === 'rating' ? editingQuestion.maxScore : undefined,
    };

    onUpdateQuestion(index, updated);
    setShowEditModal(false);
    setEditingQuestion(null);
    showToast('Question updated', 'success');
  };

  const handleCreateSurvey = async () => {
    if (!surveyData.title.trim()) {
      showToast('Please enter survey title', 'error');
      return;
    }

    // ✅ Kiểm tra theo generatedQuestions (câu đã chọn từ tab trước)
    if (generatedQuestions.length === 0 && customQuestions.length === 0) {
      showToast('Please select or add at least one question', 'error');
      return;
    }

    if (surveyData.targetAudience === 'internal' && !surveyData.workspaceId) {
      showToast('Please select a Workspace for internal survey', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await LLMService.createSurveyFromQuestions({
        ...surveyData,
        // ✅ Dùng generatedQuestions để tạo survey
        selectedQuestions: generatedQuestions.map(q => {
          const questionType = q.type || getQuestionType(q.question);
          const needsOptions = questionTypesWithOptions.includes(questionType) || questionType === 'yes_no';
          
          let options = undefined;
          if (needsOptions) {
            if (questionType === 'yes_no') {
              // Yes/No: predefined options
              options = q.options && q.options.length > 0 ? q.options : ['Yes', 'No'];
            } else {
              // Multiple Choice, Multiple Select, Dropdown, Checkbox: use provided options or defaults
              options = q.options && q.options.length > 0 ? q.options : ['Option 1', 'Option 2', 'Option 3'];
            }
          }
          
          return {
            question: q.question,
            type: questionType,
            required: q.required ?? false,
            options: options
          };
        }),
        customQuestions: customQuestions.filter(q => q.question_text.trim()),
        shareSettings
      });

      showToast('Survey created successfully!', 'success');
      onSurveyCreated && onSurveyCreated(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'An error occurred while creating survey', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.surveyCreator}>
      <Card className={styles.header}>
        <h3>Create Survey from AI Questions</h3>
        <p>Select questions and configure your survey</p>
      </Card>

      {/* Survey Basic Info */}
      <Card className={styles.basicInfo}>
        <h4>Basic Information</h4>
        <div className={styles.formGroup}>
          <label>Survey Title *</label>
          <Input
            value={surveyData.title}
            onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
            placeholder="Enter survey title"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <TextArea
            value={surveyData.description}
            onChange={(e) => setSurveyData({ ...surveyData, description: e.target.value })}
            placeholder="Description about this survey..."
            rows={3}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Survey Target</label>
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
              <option value="public">Public (Everyone)</option>
              <option value="public_with_login">Public (Requires Login)</option>
              <option value="private">Private (Invited Only)</option>
              <option value="internal">Internal (Workspace Members)</option>
            </Select>
          </div>

          {/* Workspace Selection for Internal Audience */}
          {surveyData.targetAudience === 'internal' && (
            <div className={styles.formGroup}>
              <label>Select Workspace *</label>
              <Select
                value={surveyData.workspaceId}
                onChange={(value) => setSurveyData({ ...surveyData, workspaceId: value })}
              >
                <option value="">-- Select Workspace --</option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </Select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Start Date</label>
            <Input
              type="date"
              value={surveyData.startDate}
              onChange={(e) => setSurveyData({ ...surveyData, startDate: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>End Date (optional)</label>
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
          Select Questions ({generatedQuestions.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'custom' ? styles.active : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Custom Questions ({customQuestions.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'share' ? styles.active : ''}`}
          onClick={() => setActiveTab('share')}
        >
          Share Settings
        </button>
      </div>

      {/* Tab Content */}
      <Card className={styles.tabContent}>
        {/* 🔹 Tab Select: chỉ hiển thị danh sách câu đã chọn + nút X xoá */}
        {activeTab === 'select' && (
          <div className={styles.questionSelection}>
            <h4>Select from {generatedQuestions.length} generated questions</h4>
            <div className={styles.questionList}>
              {generatedQuestions.map((question, index) => (
                <div key={index} className={styles.questionItem}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <div
                      className={styles.questionContent}
                      style={{ flex: 1 }}
                    >
                      <p className={styles.questionText}>{question.question}</p>
                      <small className={styles.questionMeta}>
                        Type: {question.type || getQuestionType(question.question)} • Source: {question.source || 'AI'}
                      </small>
                    </div>

                    {/* Edit question icon */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditQuestion(question, index)}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        marginLeft: 4,
                      }}
                      title="Edit question"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>

                    {/* Delete question icon */}
                    <button
                      type="button"
                      onClick={() => onRemoveQuestion && onRemoveQuestion(question)}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        marginLeft: 4,
                      }}
                      title="Remove question"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>


                  </div>
                </div>
              ))}

              {generatedQuestions.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No AI questions selected. Go back to "Generate Questions" to choose more.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className={styles.customQuestions}>
            <div className={styles.sectionHeader}>
              <h4>Custom Questions</h4>
              <Button onClick={addCustomQuestion} variant="outline">
                + Add Question
              </Button>
            </div>

            {customQuestions.map((question) => (
              <div key={question.id} className={styles.customQuestion}>
                <div className={styles.questionHeader}>
                  <Input
                    value={question.question_text}
                    onChange={(e) => updateCustomQuestion(question.id, 'question_text', e.target.value)}
                    placeholder="Enter question..."
                  />
                  <Select
                    value={question.question_type}
                    onChange={(value) => updateCustomQuestion(question.id, 'question_type', value)}
                  >
                    <option value="text">Text</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="yes_no">Yes/No</option>
                    <option value="rating">Rating</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                  </Select>
                  <Checkbox
                    checked={question.is_required}
                    onChange={(checked) => updateCustomQuestion(question.id, 'is_required', checked)}
                  />
                  <span className={styles.requiredLabel}>Required</span>
                  <Button
                    onClick={() => removeCustomQuestion(question.id)}
                    variant="outline"
                    className={styles.removeBtn}
                  >
                    Delete
                  </Button>
                </div>

                {question.question_type === 'multiple_choice' && (
                  <div className={styles.options}>
                    <h5>Options:</h5>
                    {(question.options || []).map((option, index) => (
                      <div key={index} className={styles.optionRow}>
                        <Input
                          value={option}
                          onChange={(e) => updateQuestionOption(question.id, index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          onClick={() => removeQuestionOption(question.id, index)}
                          variant="outline"
                          size="small"
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => addOptionToQuestion(question.id)}
                      variant="outline"
                      size="small"
                    >
                      + Add Option
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {customQuestions.length === 0 && (
              <div className={styles.emptyState}>
                <p>No custom questions yet. Click "Add Question" to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'share' && (
          <div className={styles.shareSettings}>
            <h4>Share Settings</h4>

            <div className={styles.settingGroup}>
              <div className={styles.settingItem}>
                <Switch
                  checked={shareSettings.isPublic}
                  onChange={(checked) => setShareSettings({ ...shareSettings, isPublic: checked })}
                />
                <div className={styles.settingLabel}>
                  <strong>Public</strong>
                  <p>Survey can be accessed by anyone with the link</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <Switch
                  checked={shareSettings.allowAnonymous}
                  onChange={(checked) => setShareSettings({ ...shareSettings, allowAnonymous: checked })}
                />
                <div className={styles.settingLabel}>
                  <strong>Allow Anonymous</strong>
                  <p>Users can respond without logging in</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <Switch
                  checked={shareSettings.requireLogin}
                  onChange={(checked) => setShareSettings({ ...shareSettings, requireLogin: checked })}
                />
                <div className={styles.settingLabel}>
                  <strong>Requires Login</strong>
                  <p>Only logged-in users can respond</p>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Link Expiry (days)</label>
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

      {/* Edit Question Modal */}
      {showEditModal && editingQuestion && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Question"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Question Text *
              </label>
              <TextArea
                value={editingQuestion.question_text}
                onChange={(e) => setEditingQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                rows={3}
                placeholder="Enter question text"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Question Type *
              </label>
              <Select
                value={editingQuestion.question_type}
                onChange={(value) => {
                  const needsOptions = questionTypesWithOptions.includes(value);
                  let newOptions = [];
                  
                  if (needsOptions) {
                    // Multiple choice, multiple select, dropdown, checkbox: need options
                    newOptions = editingQuestion.options && editingQuestion.options.length > 0 
                      ? editingQuestion.options 
                      : ['Option 1', 'Option 2'];
                  } else if (value === 'yes_no') {
                    // Yes/No: predefined options
                    newOptions = ['Yes', 'No'];
                  }
                  // text, rating: no options
                  
                  setEditingQuestion(prev => ({
                    ...prev,
                    question_type: value,
                    options: newOptions,
                    maxScore: value === 'rating' ? (prev.maxScore || 5) : undefined,
                  }));
                }}
              >
                <option value="text">Text</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="multiple_select">Multiple Select</option>
                <option value="checkbox">Checkbox</option>
                <option value="dropdown">Dropdown</option>
                <option value="rating">Rating</option>
                <option value="yes_no">Yes/No</option>
              </Select>
            </div>

            {/* Options Section - show for types that need options or yes_no */}
            {(questionTypesWithOptions.includes(editingQuestion.question_type) || editingQuestion.question_type === 'yes_no') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  {editingQuestion.question_type === 'yes_no' 
                    ? 'Options (predefined)' 
                    : 'Options * (at least 2 required)'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                  {(editingQuestion.options || []).map((option, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Input
                        value={option}
                        onChange={(e) => handleUpdateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        style={{ flex: 1 }}
                      />
                      {(editingQuestion.options || []).length > 2 && editingQuestion.question_type !== 'yes_no' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '20px',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Remove option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {editingQuestion.question_type !== 'yes_no' && (
                  <Button
                    variant="outline"
                    onClick={handleAddOption}
                    style={{ width: 'fit-content' }}
                  >
                    + Add Option
                  </Button>
                )}
              </div>
            )}

            {/* Rating: show maxScore input */}
            {editingQuestion.question_type === 'rating' && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Max Score *
                </label>
                <Input
                  type="number"
                  value={editingQuestion.maxScore || 5}
                  onChange={(e) => setEditingQuestion(prev => ({ 
                    ...prev, 
                    maxScore: parseInt(e.target.value) || 5 
                  }))}
                  min="1"
                  max="10"
                  placeholder="5"
                />
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={!!editingQuestion.required}
                onChange={(e) => setEditingQuestion(prev => ({ ...prev, required: e.target.checked }))}
              />
              Required question
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditedQuestion}>
                Update Question
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <Button
          onClick={handleCreateSurvey}
          disabled={
            loading ||
            !surveyData.title.trim() ||
            (generatedQuestions.length === 0 && customQuestions.length === 0)
          }
          className={styles.createBtn}
          loading={loading}
        >
          Create Survey
        </Button>
      </div>
    </div>
  );
};

export default SurveyCreator;
