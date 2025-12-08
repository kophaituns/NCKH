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

const SurveyCreator = ({ generatedQuestions, onSurveyCreated, onRemoveQuestion }) => {
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
        selectedQuestions: generatedQuestions.map(q => ({
          question: q.question,
          type: getQuestionType(q.question),
          required: false,
          options: getQuestionType(q.question) === 'multiple_choice'
            ? ['Option 1', 'Option 2', 'Option 3']
            : undefined
        })),
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
                        Type: {getQuestionType(question.question)} • Source: {question.source}
                      </small>
                    </div>

                    {/* Nút X xoá câu hỏi khỏi survey */}
                    <button
                    type="button"
                    onClick={() => onRemoveQuestion && onRemoveQuestion(question)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#ff0000ff',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: 30,
                      lineHeight: 1,
                      padding: 0,
                      marginLeft: 8,
                      transform: 'translateY(-3px)',  
                    }}
                    title="Remove question"
                  >
                    ×
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
