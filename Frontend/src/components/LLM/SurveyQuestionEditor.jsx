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
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'single_choice', label: 'Single Choice' },
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'rating', label: 'Rating' },
    { value: 'boolean', label: 'Yes/No' }
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
        showToast('Could not load survey information', 'error');
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
        showToast('Please enter question content', 'error');
        return;
      }

      // Filter out empty options
      const validOptions = questionForm.options.filter(opt => opt.trim());

      const questionData = {
        ...questionForm,
        options: validOptions.length > 0 ? validOptions : undefined
      };

      if (editingQuestion) {
        await LLMService.updateSurveyQuestion(surveyId, editingQuestion.id, questionData);
        showToast('Question updated', 'success');
      } else {
        await LLMService.addSurveyQuestion(surveyId, questionData);
        showToast('Question added', 'success');
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
      showToast(error.response?.data?.message || 'Error saving question', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete question
  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      setSaving(true);
      await LLMService.deleteSurveyQuestion(surveyId, questionId);
      showToast('Question deleted', 'success');

      // Reload survey data
      const updatedSurvey = await LLMService.getSurveyForEditing(surveyId);
      setSurvey(updatedSurvey.data);

      if (onSurveyUpdated) {
        onSurveyUpdated();
      }
    } catch (error) {
      showToast('Error deleting question', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Update survey settings
  const updateSurveySettings = async () => {
    try {
      setSaving(true);
      await LLMService.updateSurveySettings(surveyId, settingsForm);
      showToast('Survey information updated', 'success');

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
      showToast('Error updating survey information', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.surveyQuestionEditor}>
      <div className={styles.header}>
        <div>
          <h2>Edit Survey: {survey?.title}</h2>
          <p>Manage questions and survey settings</p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="outline"
            onClick={() => setShowSettingsModal(true)}
          >
            Survey Settings
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      <div className={styles.content}>
        <Card>
          <div className={styles.questionsHeader}>
            <h3>Question List ({survey?.questions?.length || 0})</h3>
            <Button onClick={() => setShowAddModal(true)}>
              + Add Question
            </Button>
          </div>

          <div className={styles.questionsList}>
            {survey?.questions?.map((question, index) => (
              <div key={question.id} className={styles.questionItem}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>Question {index + 1}</span>
                  <div className={styles.questionActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditQuestion(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className={styles.questionContent}>
                  <h4>{question.question_text}</h4>
                  <p className={styles.questionType}>
                    Type: {questionTypes.find(t => t.value === question.question_type)?.label}
                    {question.is_required && ' (Required)'}
                  </p>
                  {question.question_options?.length > 0 && (
                    <div className={styles.options}>
                      <strong>Options:</strong>
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
        title={editingQuestion ? 'Edit Question' : 'Add New Question'}
      >
        <div className={styles.questionForm}>
          <Input
            label="Question Content *"
            value={questionForm.question_text}
            onChange={(e) => handleQuestionChange('question_text', e.target.value)}
            placeholder="Enter question content"
          />

          <Select
            label="Question Type"
            value={questionForm.question_type}
            onChange={(e) => handleQuestionChange('question_type', e.target.value)}
            options={questionTypes}
          />

          <TextArea
            label="Description (optional)"
            value={questionForm.description}
            onChange={(e) => handleQuestionChange('description', e.target.value)}
            placeholder="Enter question description"
            rows={3}
          />

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={questionForm.is_required}
                onChange={(e) => handleQuestionChange('is_required', e.target.checked)}
              />
              Required to answer
            </label>
          </div>

          {['multiple_choice', 'single_choice', 'rating'].includes(questionForm.question_type) && (
            <div className={styles.optionsSection}>
              <h4>Answer Options</h4>
              {questionForm.options.map((option, index) => (
                <div key={index} className={styles.optionRow}>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={questionForm.options.length <= 2}
                  >
                    Delete
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addOption}>
                + Add Option
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
              Cancel
            </Button>
            <Button
              onClick={saveQuestion}
              disabled={saving}
            >
              {saving ? 'Saving...' : editingQuestion ? 'Update' : 'Add Question'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Survey Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Survey Settings"
      >
        <div className={styles.settingsForm}>
          <Input
            label="Survey Title *"
            value={settingsForm.title}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter survey title"
          />

          <TextArea
            label="Description"
            value={settingsForm.description}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter survey description"
            rows={4}
          />

          <Select
            label="Status"
            value={settingsForm.status}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'completed', label: 'Completed' }
            ]}
          />

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={updateSurveySettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SurveyQuestionEditor;