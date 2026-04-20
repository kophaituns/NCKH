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
import { LuSparkles, LuBrain, LuSettings, LuFileText, LuWand, LuCircleCheck, LuInfo, LuArrowRight, LuLock, LuTriangleAlert, LuDatabase, LuUpload, LuCheck, LuSearch, LuActivity } from 'react-icons/lu';
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
    category: 'general',
    questionCount: 5,
    prompt: ''
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  // Knowledge Base State
  const [knowledgeStatus, setKnowledgeStatus] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
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

  // Load knowledge status
  const fetchKnowledgeStatus = useCallback(async () => {
    try {
      const res = await LLMService.getKnowledgeStatus();
      setKnowledgeStatus(res.data);
    } catch (err) {
      console.warn('Could not fetch knowledge status:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'knowledge') {
      fetchKnowledgeStatus();
    }
  }, [activeTab, fetchKnowledgeStatus]);

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

  // Predict category is now handled AUTOMATICALLY within generateQuestions
  // or explicitly if the user wants but removed from the main flow for "SIR-AG v2 Gấu" speed.

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

    // PREDICT CATEGORY is now implicit
    let currentCategory = formData.category || 'general';

    try {
      setLoading(true);
      setSelectedIndices(new Set());

      // Sanitize input before sending
      const cleanedKeyword = sanitizeInput(formData.keyword);
      const count = parseInt(formData.questionCount) || 5;

      console.log('>>> [RAG REQUEST] Sending data to AI Server:', { 
        keyword: cleanedKeyword, 
        category: currentCategory, 
        num_questions: count 
      });

      const response = await LLMService.generateQuestions({
        keyword: cleanedKeyword,
        num_questions: count,
        category_hint: currentCategory || null,
        offset: 0
      });

      console.log('<<< [RAG RESPONSE] Received from AI Server:', response.data);

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
            onClick={() => setShowGuidanceModal(false)}
          >
            I Understand
          </Button>
        </div>
      </div>
    </Modal>
  );

  const handleIngest = async (filesToIngest) => {
    if (!filesToIngest || filesToIngest.length === 0) return;
    try {
      setIsIngesting(true);
      console.log('>>> [INGESTION REQUEST] Sending files to pipeline:', filesToIngest.map(f => f.name));
      
      const response = await LLMService.ingestDocuments(filesToIngest);
      console.log('<<< [INGESTION RESPONSE] Pipeline result:', response);
      
      showToast('Knowledge synchronized successfully!', 'success');
      setSelectedFiles([]);
      fetchKnowledgeStatus();
    } catch (err) {
      showToast('Sync failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsIngesting(false);
    }
  };

  const renderKnowledgeBase = () => {
    const syncPercent = knowledgeStatus?.storage?.sync_percent || 0;
    const isReady = (knowledgeStatus?.status === 'ready' || knowledgeStatus?.status === 'healthy');

    return (
      <div className={styles.knowledgeContainer}>
        <div className={styles.dashboardGrid}>
          <Card className={styles.progressCard}>
            <div className={styles.circleContainer}>
              <svg viewBox="0 0 36 36" className={styles.circularChart}>
                <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={styles.circle} strokeDasharray={`${syncPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className={styles.percentage}>{syncPercent}%</div>
            </div>
            <div className={styles.progressLabel}>
              <h4>Library Sync</h4>
              <p>{isReady ? 'System fully optimized' : 'Processing units...'}</p>
            </div>
          </Card>

          <Card className={styles.quickStats}>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span className={styles.label}>Documents</span>
                <span className={styles.value}>{knowledgeStatus?.storage?.total_files || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.label}>Disk Usage</span>
                <span className={styles.value}>{knowledgeStatus?.storage?.total_size_mb || 0} MB</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.label}>Synced Units</span>
                <span className={styles.value}>{knowledgeStatus?.chromadb_vectors?.toLocaleString() || 0}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.mainKnowledgeArea}>
          <Card 
            className={`${styles.uploadCard} ${isDragging ? styles.activeDrag : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { 
                e.preventDefault(); 
                setIsDragging(false); 
                const files = Array.from(e.dataTransfer.files);
                setSelectedFiles(prev => [...prev, ...files]);
            }}
          >
            <div className={styles.uploadInner}>
              <LuUpload size={40} className={styles.uploadIcon} />
              <h4>Feed Your Assistant</h4>
              <p>Drag & drop or click to upload research assets.</p>
              <input 
                type="file" 
                multiple 
                onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])} 
                id="file-upload" 
                className={styles.hiddenInput}
                accept=".pdf,.docx,.xlsx,.txt"
              />
              <Button onClick={() => document.getElementById('file-upload').click()} variant="secondary" className={styles.browseBtn}>
                Browse Files
              </Button>

              {selectedFiles.length > 0 && (
                <div className={styles.selectedQueue}>
                  <div className={styles.queueHeader}>
                    <span>{selectedFiles.length} files pending</span>
                    <button onClick={() => setSelectedFiles([])}>Clear All</button>
                  </div>
                  <div className={styles.queueList}>
                    {selectedFiles.map((f, i) => (
                      <div key={i} className={styles.queueItem}>
                        <LuFileText size={14} /> <span>{f.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => handleIngest(selectedFiles)} loading={isIngesting} className={styles.ingestAction}>
                    <LuBrain /> Sync to Library
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className={styles.recentHistory}>
            <h4>Recently Processed</h4>
            <ul>
              {knowledgeStatus?.processed_files?.length > 0 ? (
                knowledgeStatus.processed_files.slice(-8).map((f, i) => (
                  <li key={i}><LuCircleCheck size={14} /> {f}</li>
                ))
              ) : (
                <div className={styles.emptyFeed}>
                  <LuBrain size={32} />
                  <p>Processing queue is empty.</p>
                </div>
              )}
            </ul>
          </Card>
        </div>
      </div>
    );
  };

  const handleEditSurvey = (surveyId) => {
    setEditingSurveyId(surveyId);
    setActiveTab('edit');
  };

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
        target_audience: 'General',
        access_type: targetAudience === 'internal' ? 'internal' : 'public',
        workspace_id: targetAudience === 'internal' ? targetWorkspace : null,
        title: 'AI Generated Survey',
        course_name: 'AI Course'
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

  const renderQuestionGeneration = () => (
    <div className={styles.tabContent}>
      <Card className={styles.formCard}>
        <h3><LuSparkles /> Content Intelligence</h3>

        <div className={styles.formGroup}>
          <label>Inquiry Goal or Topic</label>
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
            <p className={styles.helpText}>Enter keywords or a research topic to generate context-aware questions.</p>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Knowledge Category</label>
            <Select
              value={formData.category}
              onChange={(value) => handleInputChange('category', value)}
            >
              <option value="general">General (Broad knowledge)</option>
              <option value="it">Information Technology (Dev, Infrastructure)</option>
              <option value="economics">Economics & Finance (Market, Investment)</option>
              <option value="marketing">Marketing & Sales (Behavior, Branding)</option>
            </Select>
          </div>
          
          <div className={styles.formGroup} style={{display:'block'}} >
            <label>Quantity</label>
            <Select
              value={formData.questionCount}
              onChange={(value) => handleInputChange('questionCount', parseInt(value))}
            >
              <option value={3}>3 questions</option>
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerateQuestions}
          disabled={loading || !isInputValid}
          className={styles.generateBtn}
          title={
            !isInputValid
              ? 'Please enter a valid keyword'
              : 'Execute AI sequence'
          }
        >
          {loading ? (
            <>Processing Intel...</>
          ) : (
            <>
              {isLockedForRoleMismatch() ? <LuLock size={18} /> : <LuWand size={18} />}
              Generate Insightful Content
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
        <h3><LuSettings /> Form Architect</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <div className={styles.formGroup}>
              <label>Select Template</label>
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
              <label>Custom Objective</label>
              <TextArea
                placeholder="Define your research goals or custom survey structure..."
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
                <>Deploying system...</>
              ) : (
                <>
                  {isLockedForRoleMismatch() ? <LuLock size={18} /> : <LuWand size={18} />}
                  Execute Form Deployment
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const isReady = knowledgeStatus?.status === 'ready' || knowledgeStatus?.status === 'healthy';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>AI <span className={styles.brand}>Assistant</span> System</h1>
          <div className={`${styles.statusDot} ${isReady ? styles.online : styles.offline}`} title="AI System Status" />
        </div>
        <p>Scientific Intelligent Retrieval & AI Generation Platform</p>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'generate' ? styles.active : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <LuSparkles size={18} /> Generation
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'survey' ? styles.active : ''}`}
          onClick={() => setActiveTab('survey')}
        >
          <LuFileText size={18} /> Builder
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'knowledge' ? styles.active : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          <LuDatabase size={18} /> Library
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'edit' ? styles.active : ''}`}
          onClick={() => setActiveTab('edit')}
          disabled={!editingSurveyId}
        >
          <LuSettings size={18} /> Editor
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        {activeTab === 'generate' && renderQuestionGeneration()}
        {activeTab === 'survey' && renderSurveyGeneration()}
        {activeTab === 'knowledge' && renderKnowledgeBase()}
        {activeTab === 'edit' && editingSurveyId && (
          <SurveyQuestionEditor
            surveyId={editingSurveyId}
            onClose={() => {
              setEditingSurveyId(null);
              setActiveTab('generate');
            }}
          />
        )}
      </div>

      {renderGuidanceModal()}

      {/* Upgrade Modals Integration */}
      <UpgradeUpsellModal
        isOpen={showUpsellModal}
        onClose={() => setShowUpsellModal(false)}
        onUpgrade={() => {
          setShowUpsellModal(false);
          setShowUpgradeModal(true);
        }}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default LLM;
