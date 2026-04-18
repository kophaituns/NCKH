// src/pages/LLM/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import TextArea from '../../components/UI/TextArea';
import Loader from '../../components/common/Loader/Loader';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import WorkspaceService from '../../api/services/workspace.service';
import SurveyCreator from '../../components/LLM/SurveyCreator';
import SurveyActions from '../../components/LLM/SurveyActions';
import SurveyQuestionEditor from '../../components/LLM/SurveyQuestionEditor';
import Modal from '../../components/common/Modal/Modal';
import { useAuth } from '../../contexts/AuthContext';
import UpgradeModal from '../../components/UpgradeToCreator/UpgradeModal';
import UpgradeUpsellModal from '../../components/UI/UpgradeUpsellModal/UpgradeUpsellModal';
import { LuSparkles, LuBrain, LuSettings, LuFileText, LuWand, LuCircleCheck, LuInfo, LuArrowRight, LuLock, LuTriangleAlert, LuWifiOff, LuClock } from 'react-icons/lu';
import { XIcon } from '../../components/Icons';
import styles from './LLM.module.scss';

// Import validation utilities
import {
  validateAIInput,
  sanitizeInput,
  validateCategoryResult,
  getDynamicPlaceholder,
  getCategoryExamples
} from '../../utils/aiInputValidation';

import {
  getQuestionTypeName,
  getQuestionTypeIcon,
  getFormTypeDescription,
  getFormTypeIcon
} from '../../utils/aiHelpers';

const LLM = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [formData, setFormData] = useState({
    keyword: '',
    category: '',
    questionCount: 5,
    prompt: ''
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  // const [categories, setCategories] = useState([]); // Unused
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [createdSurvey, setCreatedSurvey] = useState(null);
  const [editingSurveyId, setEditingSurveyId] = useState(null);

  // Workspace & Target Audience State
  const [workspaces, setWorkspaces] = useState([]);
  const [targetAudience, setTargetAudience] = useState('all_users'); // 'all_users' (public) or 'internal'
  const [targetWorkspace, setTargetWorkspace] = useState('');
  const [showManageMembers, setShowManageMembers] = useState(false);
  const { user } = useAuth(); // Get current user

  // Upgrade & Upsell Modals
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // NEW: Validation & Category State
  const [inputValidation, setInputValidation] = useState({ isValid: false, errorMessage: '' });
  const [categoryPrediction, setCategoryPrediction] = useState(null); // { category, confidence, isValid }
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  // NEW: Regeneration & Metadata State
  const [offset, setOffset] = useState(0);
  const [canRegenerate, setCanRegenerate] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const isLockedForRoleMismatch = () => {
    return user?.role === 'user';
  };

  // ============================================================================
  // INPUT VALIDATION - Real-time validation on input change
  // ============================================================================

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate keyword input in real-time
    if (field === 'keyword') {
      const validation = validateAIInput(value);
      setInputValidation(validation);

      // Reset category prediction and offset when keyword changes significantly
      if (value !== formData.keyword) {
        setCategoryPrediction(null);
        setOffset(0);
        setCanRegenerate(false);
      }
    }
  };

  // Computed: Check if buttons should be disabled
  const isInputValid = useMemo(() => {
    return inputValidation.isValid && formData.keyword.trim().length >= 3;
  }, [inputValidation.isValid, formData.keyword]);

  // Dynamic placeholder based on predicted category
  const dynamicPlaceholder = useMemo(() => {
    return getDynamicPlaceholder(formData.category || categoryPrediction?.category);
  }, [formData.category, categoryPrediction]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Load prompts (categories not currently used)
      const promptsRes = await LLMService.getLlmPrompts();
      setPrompts(promptsRes.data.prompts || []);

      // Load Workspaces for Internal Target
      const workspaceRes = await WorkspaceService.getMyWorkspaces();
      if (workspaceRes.ok) {
        // Filter workspaces where user has role >= Collaborator
        const validWorkspaces = workspaceRes.items.filter(ws =>
          ['owner', 'collaborator', 'admin'].includes(ws.role || ws.current_user_role)
        );
        setWorkspaces(validWorkspaces);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('Error while loading initial data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ============================================================================
  // PREDICT CATEGORY HANDLER - With validation and error handling
  // ============================================================================

  const handlePredictCategory = async () => {
    // Check role permission
    if (isLockedForRoleMismatch()) {
      setShowUpsellModal(true);
      return;
    }

    // Validate input first
    const validation = validateAIInput(formData.keyword);
    setInputValidation(validation);

    if (!validation.isValid) {
      // Show specific error based on error type
      if (validation.errorType === 'INVALID_CHARS') {
        showToast('Keyword contains invalid characters. Please use letters or numbers only.', 'error');
      } else if (validation.errorType === 'TOO_SHORT') {
        showToast('Keyword is too short. Please enter at least 3 characters.', 'error');
      } else {
        showToast(validation.errorMessage || 'Invalid keyword', 'error');
      }
      return;
    }

    try {
      setIsPredicting(true);

      // Sanitize input before sending
      const cleanedKeyword = sanitizeInput(formData.keyword);

      const response = await LLMService.predictCategory({
        keyword: cleanedKeyword
      });

      const { category, confidence } = response.data || {};

      // Validate category result
      const categoryValidation = validateCategoryResult(category, confidence);
      setCategoryPrediction(categoryValidation);

      if (categoryValidation.isValid) {
        // Valid category - update form and show success
        setFormData(prev => ({
          ...prev,
          category: category
        }));
        showToast(
          `Category identified: ${category} (${Math.round(categoryValidation.confidence * 100)}%)`,
          'success'
        );
      } else if (categoryValidation.isUnknownCategory) {
        // Unknown category - show helpful message explaining the limitation
        showToast(
          `"${formData.keyword}" is not in our training dataset. Our AI is trained on IT, Economics, and Marketing topics. Try: "machine learning", "digital marketing", "financial analysis"`,
          'warning'
        );
      } else if (categoryValidation.isLowConfidence) {
        // Low confidence - show warning but allow to continue
        setFormData(prev => ({
          ...prev,
          category: category
        }));
        showToast(
          `Low confidence (${Math.round(categoryValidation.confidence * 100)}%). Results may not be accurate.`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Error predicting category:', error);
      setCategoryPrediction(null);

      // Check for 503 Service Unavailable status
      if (error.response?.status === 503) {
        showToast(
          'AI Server is currently offline. Please try again later.',
          'error'
        );
        return;
      }

      // Check if response contains AI server unavailable error
      const errorData = error.response?.data;
      const reason = errorData?.reason || errorData?.data?.reason;

      if (reason === 'AI_SERVER_UNAVAILABLE') {
        showToast(
          'AI Server is currently offline. Please try again later.',
          'error'
        );
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('Request timed out. The AI server may be overloaded. Please try again.', 'error');
      } else if (!error.response) {
        // Network error - no response received
        showToast('Cannot connect to the server. Please check your internet connection.', 'error');
      } else {
        showToast('Error predicting category. Please try again.', 'error');
      }
    } finally {
      setIsPredicting(false);
    }
  };

  // ============================================================================
  // GENERATE QUESTIONS HANDLER - With validation layers
  // ============================================================================

  const handleGenerateQuestions = async () => {
    // Check role permission
    if (isLockedForRoleMismatch()) {
      setShowUpsellModal(true);
      return;
    }

    // Layer 1: Validate input
    const validation = validateAIInput(formData.keyword);
    setInputValidation(validation);

    if (!validation.isValid) {
      showToast(validation.errorMessage || 'Invalid keyword', 'error');
      return;
    }

    // Layer 2: Check if category has been predicted
    if (!categoryPrediction) {
      // Show guidance modal instead of blocking
      setShowGuidanceModal(true);
      return;
    }

    // Layer 3: Check if category prediction is valid
    if (!categoryPrediction.canGenerate) {
      if (categoryPrediction.isUnknownCategory) {
        showToast(
          `"${formData.keyword}" is not available in our training data. Please use keywords from IT, Economics, or Marketing fields (e.g., "cloud computing", "supply chain", "brand strategy")`,
          'error'
        );
      } else {
        showToast(categoryPrediction.warningMessage || 'Cannot generate questions with this keyword', 'error');
      }
      return;
    }

    try {
      setLoading(true);
      setSelectedIndices(new Set());

      // Sanitize input before sending
      const cleanedKeyword = sanitizeInput(formData.keyword);
      const count = parseInt(formData.questionCount) || 5;

      console.log('Generating questions with:', { keyword: cleanedKeyword, category: formData.category, offset: 0 });

      const response = await LLMService.generateQuestions({
        keyword: cleanedKeyword,
        num_questions: count,
        category_hint: formData.category || categoryPrediction?.category || null,
        offset: 0
      });

      const questions = response.data?.questions || response.questions || [];
      const meta = response.data?.metadata || response.metadata || null;

      if (questions.length === 0) {
        showToast('No questions were generated. Please try again with a different keyword.', 'warning');
        return;
      }

      setGeneratedQuestions(questions);
      setMetadata(meta);
      setOffset(0);
      setCanRegenerate(meta?.can_regenerate || false);

      showToast(`Successfully generated ${questions.length} questions!`, 'success');
    } catch (error) {
      console.error('Error generating questions:', error);

      // Check for 503 Service Unavailable status
      if (error.response?.status === 503) {
        showToast(
          'AI Server is currently offline. Please try again later.',
          'error'
        );
        return;
      }

      // Check if response contains AI server unavailable error
      const errorData = error.response?.data;
      const reason = errorData?.reason || errorData?.data?.reason;

      if (reason === 'AI_SERVER_UNAVAILABLE') {
        showToast(
          'AI Server is currently offline. Please try again later.',
          'error'
        );
        return;
      }

      // Handle specific error types
      if (error.response?.status === 400) {
        if (errorData?.error === 'INVALID_KEYWORD') {
          showToast(errorData.message || 'Invalid keyword', 'error');
        } else if (errorData?.error === 'INVALID_CATEGORY') {
          showToast('Cannot identify category. Please try a different keyword.', 'error');
        } else {
          showToast(errorData?.message || 'Error generating questions', 'error');
        }
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('Request timed out. The AI server may be overloaded. Please try again.', 'error');
      } else if (!error.response) {
        // Network error - no response received
        showToast('Cannot connect to the server. Please check your internet connection.', 'error');
      } else {
        showToast(
          'Error generating questions: ' + (error.response?.data?.message || error.message),
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    // Check role permission
    if (isLockedForRoleMismatch()) {
      setShowUpsellModal(true);
      return;
    }

    if (!canRegenerate) return;

    try {
      setLoading(true);

      const nextOffset = offset + (parseInt(formData.questionCount) || 5);
      const cleanedKeyword = sanitizeInput(formData.keyword);

      console.log('Regenerating questions with:', { keyword: cleanedKeyword, offset: nextOffset });

      const response = await LLMService.generateQuestions({
        keyword: cleanedKeyword,
        num_questions: parseInt(formData.questionCount) || 5,
        category_hint: formData.category || categoryPrediction?.category || null,
        offset: nextOffset
      });

      const questions = response.data?.questions || response.questions || [];
      const meta = response.data?.metadata || response.metadata || null;

      if (questions.length === 0) {
        showToast('No more questions available for this keyword.', 'info');
        setCanRegenerate(false);
        return;
      }

      setGeneratedQuestions(questions);
      setMetadata(meta);
      setOffset(nextOffset);
      setCanRegenerate(meta?.can_regenerate || false);

      showToast(`Got ${questions.length} different questions!`, 'success');
      // Clear selection when new questions arrive
      setSelectedIndices(new Set());
    } catch (error) {
      console.error('Error regenerating questions:', error);

      // Check for 503 Service Unavailable status
      if (error.response?.status === 503) {
        showToast(
          '🔌 AI Server is currently offline. Please contact the administrator or try again later.',
          'error'
        );
        return;
      }

      // Check if response contains AI server unavailable error
      const errorData = error.response?.data;
      const reason = errorData?.reason || errorData?.data?.reason;

      if (reason === 'AI_SERVER_UNAVAILABLE') {
        showToast(
          '🔌 AI Server is currently offline. Please contact the administrator or try again later.',
          'error'
        );
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('⏱️ Request timed out. The AI server may be overloaded. Please try again.', 'error');
      } else if (!error.response) {
        showToast('🔌 Cannot connect to the server. Please check your internet connection.', 'error');
      } else {
        showToast('Error regenerating questions. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (index) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIndices = new Set(generatedQuestions.map((_, i) => i));
    setSelectedIndices(allIndices);
  };

  const handleClearSelection = () => {
    setSelectedIndices(new Set());
  };

  // ============================================================================
  // RENDER: Guidance Modal for better UX
  // ============================================================================

  const renderGuidanceModal = () => (
    <Modal
      isOpen={showGuidanceModal}
      onClose={() => setShowGuidanceModal(false)}
      title="AI Question Generation Guide"
      size="md"
    >
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px',
          background: '#FEF3C7',
          borderRadius: '8px',
          border: '1px solid #F59E0B'
        }}>
          <LuTriangleAlert size={24} color="#D97706" />
          <p style={{ margin: 0, color: '#92400E' }}>
            <strong>For best results</strong>, please click "Predict Category" before generating questions.
          </p>
        </div>

        <h4 style={{ marginBottom: '12px' }}>Supported Categories:</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {getCategoryExamples().map((cat, idx) => (
            <div key={idx} style={{
              padding: '12px',
              background: '#F3F4F6',
              borderRadius: '8px'
            }}>
              <strong style={{ color: '#4F46E5' }}>{cat.category}</strong>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6B7280' }}>
                {cat.examples.join(' • ')}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="secondary"
            onClick={() => setShowGuidanceModal(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              setShowGuidanceModal(false);
              handlePredictCategory();
            }}
          >
            <LuBrain size={16} /> Predict Category
          </Button>
        </div>
      </div>
    </Modal>
  );

  const handleGenerateSurvey = async () => {
    if (isLockedForRoleMismatch()) {
      setShowUpsellModal(true);
      return;
    }
    if (!formData.prompt.trim() && !selectedPrompt) {
      showToast('Please enter a prompt or select an existing one', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await LLMService.generateSurvey({
        prompt: formData.prompt,
        prompt_id: selectedPrompt,
        description: 'Generated by AI',
        target_audience: 'General', // LLM might ignore this, but our survey creation needs it
        access_type: targetAudience === 'internal' ? 'internal' : 'public', // Custom field to pass to createSurvey
        workspace_id: targetAudience === 'internal' ? targetWorkspace : null,
        title: 'AI Generated Survey', // Provide a default or extract from prompt
        course_name: 'AI Course' // Legacy?
      });

      showToast('Survey generated successfully!', 'success');
      console.log('Generated survey:', response.data);
    } catch (error) {
      console.error('Error generating survey:', error);
      showToast(
        'Error while generating survey: ' +
        (error.response?.data?.message || error.message),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditSurvey = (surveyId) => {
    setEditingSurveyId(surveyId);
    setActiveTab('edit');
  };

  const renderQuestionGeneration = () => (
    <div className={styles.tabContent}>
      <Card className={styles.formCard}>
        <h3><LuSparkles /> {activeTab === 'generate' ? 'Generate Questions' : 'Generate Survey'}</h3>

        <div className={styles.formGroup}>
          <label>Topic or Keyword</label>
          <Input
            type="text"
            placeholder={dynamicPlaceholder}
            value={formData.keyword}
            onChange={(e) => handleInputChange('keyword', e.target.value)}
            className={!inputValidation.isValid && formData.keyword.length > 0 ? styles.inputError : ''}
          />

          {/* Validation Feedback */}
          {formData.keyword.length > 0 && !inputValidation.isValid && (
            <p className={styles.errorText} style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LuTriangleAlert size={14} />
              {inputValidation.errorMessage}
            </p>
          )}

          {formData.keyword.length === 0 && (
            <p className={styles.helpText}>Enter keywords from categories: IT, Marketing, Sales, or Education.</p>
          )}

          {/* Category Prediction Status */}
          {categoryPrediction && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: categoryPrediction.canGenerate ? '#D1FAE5' : '#FEE2E2',
              border: `1px solid ${categoryPrediction.canGenerate ? '#10B981' : '#EF4444'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {categoryPrediction.canGenerate ? (
                <LuCircleCheck size={16} color="#059669" />
              ) : (
                <LuTriangleAlert size={16} color="#DC2626" />
              )}

              <span style={{ fontSize: '13px', color: categoryPrediction.canGenerate ? '#065F46' : '#991B1B' }}>
                {categoryPrediction.canGenerate
                  ? (
                    <>
                      Category: <strong>{categoryPrediction.category}</strong>
                    </>
                  )
                  : categoryPrediction.warningMessage
                }
              </span>
            </div>
          )}

          <div className={styles.predictWrapper}>
            <button
              onClick={handlePredictCategory}
              disabled={loading || isPredicting || !isInputValid}
              className={styles.predictBtn}
              title={!isInputValid ? 'Please enter a valid keyword first' : 'Predict category for keyword'}
            >
              {isPredicting ? (
                <>Analyzing...</>
              ) : (
                <><LuBrain size={16} /> Predict Category</>
              )}
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Number of questions</label>
          <Select
            value={formData.questionCount}
            onChange={(value) => handleInputChange('questionCount', parseInt(value))}
          >
            <option value={3}>3 questions</option>
            <option value={5}>5 questions</option>
            <option value={10}>10 questions</option>
            <option value={15}>15 questions</option>
          </Select>
        </div>

        <Button
          onClick={handleGenerateQuestions}
          disabled={loading || !isInputValid}
          className={styles.generateBtn}
          title={
            !isInputValid
              ? 'Please enter a valid keyword'
              : !categoryPrediction
                ? 'Recommended: Click Predict Category first'
                : 'Generate questions with AI'
          }
        >
          {loading ? (
            <>Generating questions...</>
          ) : (
            <>
              {isLockedForRoleMismatch() ? <LuLock size={18} /> : <LuWand size={18} />}
              Generate Questions
              {!categoryPrediction && isInputValid && (
                <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.8 }}>
                  (Not predicted)
                </span>
              )}
            </>
          )}
        </Button>
      </Card >

      <Card className={styles.resultsCard}>
        <header>
          <h3>Generated Results</h3>
          <div className={styles.headerActions}>
            {generatedQuestions.length > 0 && (
              <>
                <button className={styles.textBtn} onClick={handleSelectAll}>Select All</button>
                <button className={styles.textBtn} onClick={handleClearSelection}>Clear</button>
                <span className={styles.metaBadge + ' ' + styles.confidence}>
                  <LuCircleCheck size={12} /> {selectedIndices.size || generatedQuestions.length} Questions
                </span>
              </>
            )}
          </div>
        </header>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <h4>Crafting smart questions...</h4>
            <p>Our AI is analyzing the topic and generating relevant questions for your survey.</p>
          </div>
        ) : generatedQuestions.length > 0 ? (
          <div className={styles.questionsList}>
            {generatedQuestions.map((q, index) => (
              <div
                key={index}
                className={`${styles.questionItem} ${selectedIndices.has(index) ? styles.selected : ''}`}
                onClick={() => toggleQuestionSelection(index)}
              >
                <div className={styles.questionNumber}>
                  {selectedIndices.has(index) ? <LuCircleCheck size={16} /> : index + 1}
                </div>
                <div className={styles.questionContent}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionType}>
                      {getQuestionTypeIcon(q.question_type || q.type)} {getQuestionTypeName(q.question_type || q.type)}
                    </span>
                  </div>
                  <p className={styles.questionText}>{q.question}</p>
                  <div className={styles.questionMeta}>
                    <span className={`${styles.metaBadge} ${styles.category}`}>
                      {q.category || categoryPrediction?.category}
                    </span>
                  </div>
                </div>
                <div className={styles.selectAction}>
                  <button
                    className={`${styles.selectBtn} ${selectedIndices.has(index) ? styles.selected : ''}`}
                  >
                    {selectedIndices.has(index) ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyResults}>
            <LuSparkles size={48} />
            <p>Enter a topic and click generate to see AI magic happen.</p>
          </div>
        )}

        {metadata?.suggested_form_type && (
          <div className={styles.formSuggestion}>
            <div className={styles.suggestionIcon}>
              {getFormTypeIcon(metadata.suggested_form_type.form_type)}
            </div>
            <div className={styles.suggestionContent}>
              <h4>Suggested Form Type: <span>{metadata.suggested_form_type.form_type}</span></h4>
              <p>{metadata.suggested_form_type.reason || getFormTypeDescription(metadata.suggested_form_type.form_type)}</p>
            </div>
          </div>
        )}

        {generatedQuestions.length > 0 && (
          <div className={styles.resultsFooter}>
            <div className={styles.availableCount}>
              {metadata?.total_available && (
                <span>{metadata.total_available} questions available in database</span>
              )}
            </div>
            <button
              className={styles.regenerateBtn}
              onClick={handleRegenerate}
              disabled={loading || !canRegenerate}
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <LuSparkles size={16} /> Get Different Questions
                </>
              )}
            </button>
            {!canRegenerate && metadata?.total_available > 0 && (
              <span className={styles.noMoreText}>End of results</span>
            )}
          </div>
        )}
      </Card>
    </div >
  );

  const renderSurveyGeneration = () => (
    <div className={`${styles.tabContent} ${styles.fullWidth}`}>
      <Card className={styles.formCard} style={{ position: 'relative', top: 0, maxWidth: '100%', margin: '0 auto' }}>
        <h3><LuSettings /> Survey Generation Settings</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <div className={styles.formGroup}>
              <label>Select prompt</label>
              <Select
                value={selectedPrompt}
                onChange={(value) => setSelectedPrompt(value)}
                placeholder="Select prompt"
              >
                <option value="">Custom prompt</option>
                {prompts.map(prompt => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.prompt_name}
                  </option>
                ))}
              </Select>
            </div>

            <div className={styles.formGroup}>
              <label>Custom prompt</label>
              <TextArea
                placeholder="Describe the survey you want to create..."
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                rows={4}
                disabled={selectedPrompt}
                className={styles.textarea}
              />
              {selectedPrompt && (
                <p className={styles.helpText}>
                  Using predefined prompt. Clear selection to type custom prompt.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className={styles.formGroup}>
              <label>Target Audience</label>
              <Select
                value={targetAudience}
                onChange={(val) => setTargetAudience(val)}
              >
                <option value="all_users">Public / All Users</option>
                <option value="internal">Internal Workspace</option>
              </Select>
            </div>

            {targetAudience === 'internal' && (
              <div className={styles.formGroup}>
                <label>Workspace</label>
                {workspaces.length > 0 ? (
                  <div className={styles.workspaceSelector}>
                    <Select
                      value={targetWorkspace}
                      onChange={(val) => setTargetWorkspace(val)}
                    >
                      <option value="">-- Select Workspace --</option>
                      {workspaces.map(ws => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <p className={styles.helpText} style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LuInfo size={14} /> No eligible workspaces found.
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleGenerateSurvey}
              disabled={loading || (!formData.prompt.trim() && !selectedPrompt)}
              className={styles.generateBtn}
              style={{ marginTop: '24px' }}
            >
              {loading ? (
                <>Generating survey...</>
              ) : (
                <>
                  {isLockedForRoleMismatch() ? <LuLock size={18} /> : <LuWand size={18} />}
                  Generate Complete Survey
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  if (loading && activeTab === 'generate' && generatedQuestions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>AI Question &amp; Survey Generator</h1>
          <p>Create smart questions and surveys with AI</p>
        </div>
        <div className={styles.loadingContainer}>
          <Loader />
          <p>Generating content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>AI Question &amp; Survey Generator</h1>
        <p>Create smart questions and surveys with AI</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'generate' ? styles.active : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <LuSparkles size={16} /> Generate Questions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'survey' ? styles.active : ''}`}
          onClick={() => setActiveTab('survey')}
          disabled={generatedQuestions.length === 0}
        >
          <LuFileText size={16} /> Create Survey ({selectedIndices.size || generatedQuestions.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'prompt' ? styles.active : ''}`}
          onClick={() => setActiveTab('prompt')}
        >
          <LuArrowRight size={16} /> Advanced Prompt
        </button>
      </div>

      {activeTab === 'generate' && renderQuestionGeneration()}
      {activeTab === 'survey' && generatedQuestions.length > 0 && (
        <SurveyCreator
          generatedQuestions={generatedQuestions}
          initialSelectedIndices={selectedIndices}
          onSurveyCreated={(survey) => {
            setCreatedSurvey(survey);
            setActiveTab('result');
          }}
        />
      )}
      {activeTab === 'prompt' && renderSurveyGeneration()}
      {activeTab === 'result' && createdSurvey && (
        <SurveyActions
          survey={createdSurvey}
          onClose={() => setActiveTab('generate')}
          onEditSurvey={handleEditSurvey}
        />
      )}
      {activeTab === 'edit' && editingSurveyId && (
        <SurveyQuestionEditor
          surveyId={editingSurveyId}
          onClose={() => setActiveTab('result')}
          onSurveyUpdated={() => {
            // Survey has been updated successfully
            showToast('Survey has been updated', 'success');
          }}
        />
      )}

      {showManageMembers && targetWorkspace && (
        <Modal
          isOpen={showManageMembers}
          onClose={() => setShowManageMembers(false)}
          title="Manage Workspace Members"
          size="lg"
        >
          <div style={{ padding: '20px' }}>
            <p>Redirecting to workspace management...</p>
            <Button onClick={() => window.open(`/workspaces/${targetWorkspace}/invitations`, '_blank')}>
              Go to Member Management
            </Button>
          </div>
        </Modal>
      )}

      {/* Upgrade Modals Integration */}
      <UpgradeUpsellModal
        isOpen={showUpsellModal}
        onClose={() => setShowUpsellModal(false)}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Guidance Modal for AI Generator */}
      {renderGuidanceModal()}
    </div>
  );
};

export default LLM;
