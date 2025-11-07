import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TemplateService from '../../../api/services/template.service';
import QuestionService from '../../../api/services/question.service';
import Loader from '../../../components/common/Loader/Loader';
import Modal from '../../../components/common/Modal/Modal';
import QuestionCard from '../../../components/UI/QuestionCard';
import { useToast } from '../../../contexts/ToastContext';
import styles from './TemplateEditor.module.scss';

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditMode = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState({ title: '', description: '' });
  const [questions, setQuestions] = useState([]);
  
  // Question modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    is_required: false,
    display_order: 0,
  });

  // Option modal state
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [optionForm, setOptionForm] = useState({ option_text: '', display_order: 0 });
  const [editingOption, setEditingOption] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchTemplateData();
    }
  }, [id]);

  const fetchTemplateData = async () => {
    try {
      setLoading(true);
      const templateData = await TemplateService.getById(id);
      setTemplate({ title: templateData.title, description: templateData.description });
      
      const questionsData = await TemplateService.getQuestions(id);
      setQuestions(questionsData);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch template', 'error');
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!template.title.trim()) {
      showToast('Template title is required', 'error');
      return;
    }

    try {
      setSaving(true);
      if (isEditMode) {
        await TemplateService.update(id, template);
        showToast('Template updated successfully', 'success');
      } else {
        const newTemplate = await TemplateService.create(template);
        showToast('Template created successfully', 'success');
        navigate(`/templates/${newTemplate.id}/edit`);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openAddQuestionModal = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      is_required: false,
      display_order: questions.length,
    });
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      display_order: question.display_order,
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim()) {
      showToast('Question text is required', 'error');
      return;
    }

    if (!isEditMode || !id) {
      showToast('Please save the template first before adding questions', 'error');
      return;
    }

    try {
      const payload = { ...questionForm, template_id: parseInt(id) };
      
      if (editingQuestion) {
        await QuestionService.update(editingQuestion.id, payload);
        showToast('Question updated successfully', 'success');
      } else {
        await QuestionService.create(payload);
        showToast('Question added successfully', 'success');
      }
      
      setShowQuestionModal(false);
      fetchTemplateData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save question', 'error');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await QuestionService.delete(questionId);
      showToast('Question deleted successfully', 'success');
      fetchTemplateData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete question', 'error');
    }
  };

  const openAddOptionModal = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    const optionCount = question?.options?.length || 0;
    setCurrentQuestionId(questionId);
    setEditingOption(null);
    setOptionForm({ option_text: '', display_order: optionCount });
    setShowOptionModal(true);
  };

  const openEditOptionModal = (option, questionId) => {
    setCurrentQuestionId(questionId);
    setEditingOption(option);
    setOptionForm({ option_text: option.option_text, display_order: option.display_order });
    setShowOptionModal(true);
  };

  const handleSaveOption = async () => {
    if (!optionForm.option_text.trim()) {
      showToast('Option text is required', 'error');
      return;
    }

    try {
      const payload = { ...optionForm, question_id: currentQuestionId };
      
      if (editingOption) {
        await QuestionService.updateOption(editingOption.id, payload);
        showToast('Option updated successfully', 'success');
      } else {
        await QuestionService.addOption(payload);
        showToast('Option added successfully', 'success');
      }
      
      setShowOptionModal(false);
      fetchTemplateData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save option', 'error');
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (!window.confirm('Are you sure you want to delete this option?')) return;

    try {
      await QuestionService.deleteOption(optionId);
      showToast('Option deleted successfully', 'success');
      fetchTemplateData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete option', 'error');
    }
  };

  // Note: questionTypesWithOptions logic is handled inline in the UI components
  // const questionTypesWithOptions = ['multiple_choice', 'checkbox', 'dropdown'];

  if (loading) return <Loader />;

  return (
    <div className={styles.templateEditor}>
      <div className={styles.header}>
        <button onClick={() => navigate('/templates')} className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Templates
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.templateInfo}>
            <h2 className={styles.sectionTitle}>Template Details</h2>
            
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input
                type="text"
                value={template.title}
                onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                placeholder="Enter template title"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                placeholder="Enter template description"
                rows={4}
              />
            </div>

            <button 
              onClick={handleSaveTemplate}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </div>

        <div className={styles.main}>
          <div className={styles.questionsHeader}>
            <h2 className={styles.sectionTitle}>Questions ({questions.length})</h2>
            <button 
              onClick={openAddQuestionModal}
              disabled={!isEditMode}
              className={styles.addQuestionButton}
              title={!isEditMode ? 'Save template first to add questions' : ''}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className={styles.emptyQuestions}>
              <div className={styles.emptyIcon}>❓</div>
              <p>No questions added yet</p>
              <p className={styles.emptyHint}>
                {!isEditMode ? 'Save the template first, then add questions' : 'Click "Add Question" to get started'}
              </p>
            </div>
          ) : (
            <div className={styles.questionsList}>
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  options={question.options || []}
                  editable
                  onEdit={openEditQuestionModal}
                  onDelete={handleDeleteQuestion}
                  onEditOption={(option) => openEditOptionModal(option, question.id)}
                  onDeleteOption={handleDeleteOption}
                  onAddOption={() => openAddOptionModal(question.id)}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question Modal */}
      <Modal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        title={editingQuestion ? 'Edit Question' : 'Add Question'}
      >
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Question Text *</label>
            <textarea
              value={questionForm.question_text}
              onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
              placeholder="Enter question text"
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Question Type *</label>
            <select
              value={questionForm.question_type}
              onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="checkbox">Checkbox</option>
              <option value="dropdown">Dropdown</option>
              <option value="likert_scale">Likert Scale</option>
              <option value="open_ended">Open Ended</option>
            </select>
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={questionForm.is_required}
                onChange={(e) => setQuestionForm({ ...questionForm, is_required: e.target.checked })}
              />
              Required question
            </label>
          </div>

          <div className={styles.modalActions}>
            <button onClick={() => setShowQuestionModal(false)} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSaveQuestion} className={styles.submitButton}>
              {editingQuestion ? 'Update' : 'Add'} Question
            </button>
          </div>
        </div>
      </Modal>

      {/* Option Modal */}
      <Modal
        isOpen={showOptionModal}
        onClose={() => setShowOptionModal(false)}
        title={editingOption ? 'Edit Option' : 'Add Option'}
      >
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Option Text *</label>
            <input
              type="text"
              value={optionForm.option_text}
              onChange={(e) => setOptionForm({ ...optionForm, option_text: e.target.value })}
              placeholder="Enter option text"
            />
          </div>

          <div className={styles.modalActions}>
            <button onClick={() => setShowOptionModal(false)} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSaveOption} className={styles.submitButton}>
              {editingOption ? 'Update' : 'Add'} Option
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TemplateEditor;
