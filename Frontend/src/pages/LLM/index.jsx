// src/pages/LLM/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Select from '../../components/UI/Select';
import Loader from '../../components/common/Loader/Loader';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import TemplateService from '../../api/services/template.service';
import WorkspaceService from '../../api/services/workspace.service';
import { QUESTION_TYPE_MAP } from '../../utils/questionTypeMap';
import { useAuth } from '../../contexts/AuthContext';
import UpgradeModal from '../../components/UpgradeToCreator/UpgradeModal';
import UpgradeUpsellModal from '../../components/UI/UpgradeUpsellModal/UpgradeUpsellModal';
import { LuSparkles, LuBrain, LuFileText, LuCircleCheck, LuDatabase, LuUpload, LuCheck, LuSearch, LuActivity, LuX, LuLayoutGrid, LuList, LuPencil, LuTrash2, LuRotateCcw, LuPlus, LuArrowLeft } from 'react-icons/lu';
import styles from './LLM.module.scss';

// Import validation utilities
import {
  getQuestionTypeName,
  getQuestionTypeIcon
} from '../../utils/aiHelpers';

const LLM = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [resultsOffset, setResultsOffset] = useState(0); // For shuffling results
  const [formData, setFormData] = useState({
    keyword: '',
    category: 'general',
    questionCount: 5,
    prompt: ''
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [knowledgeStatus, setKnowledgeStatus] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  // Workspace & Target Audience State
  const [metadata, setMetadata] = useState(null);
  const [launching, setLaunching] = useState(false);

  // PROJECT OMEGA: Ingestion States
  const [ingestMode, setIngestMode] = useState('file'); // file, url, text
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [promoteToGlobal, setPromoteToGlobal] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState(null);
  const [renamingName, setRenamingName] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [isNotebookShelf, setIsNotebookShelf] = useState(true);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [knowledgeHistory, setKnowledgeHistory] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [ingestCategory, setIngestCategory] = useState('general');

  // Inline Editing State
  const [editingIdx, setEditingIdx] = useState(null);
  const [tempText, setTempText] = useState('');

  // ============================================================================
  // WIZARD & INTELLIGENCE STATE (GAU UPDATE)
  // ============================================================================
  const [activeStep, setActiveStep] = useState(1);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [formType, setFormType] = useState('survey');
  const [customNote, setCustomNote] = useState('');

  const [showLibraryModal, setShowLibraryModal] = useState(false);

  // Mock "Hot Keywords" expanded to a full research dataset
  const hotKeywordsByCat = useMemo(() => ({
    it: [
      'Data Science', 'Cloud Computing', 'Cybersecurity', 'Machine Learning', 'Web Development',
      'Python', 'FastAPI', 'React', 'Cloud Architecture', 'Microservices', 
      'DevOps', 'Security', 'Database Optimization', 'API Design', 'NLP'
    ],
    marketing: [
      'Brand Management', 'Digital Marketing', 'Social Media', 'Content Marketing', 
      'SEO', 'Digital Ads', 'Branding', 'Content Strategy', 'Leads', 
      'Customer Journey', 'Conversion Rate', 'Influencer Marketing', 'Email Automation', 
      'Market Segmentation', 'CRM'
    ],
    economics: [
      'Financial Modeling', 'Investment Planning', 'Market Analysis', 'Portfolio Management',
      'Inflation', 'GDP', 'Markets', 'Banking', 'Trade', 
      'Microeconomics', 'Macroeconomics', 'Econometrics', 'Fiscal Policy', 
      'Monetary Policy', 'Stock Exchange'
    ],
    general: [
      'Research', 'Quality', 'Performance', 'Strategy', 'Ethics', 
      'Decision Making', 'Sustainability', 'Innovation', 'Critical Thinking', 
      'Methodology', 'Analytical Skills', 'Collaborative Research', 'Peer Review', 
      'Survey Design', 'Case Studies'
    ]
  }), []);

  const currentHotKeywords = useMemo(() => 
    hotKeywordsByCat[formData.category] || hotKeywordsByCat.general,
  [formData.category, hotKeywordsByCat]);

  const handleToggleKeyword = (kw) => {
    setSelectedKeywords(prev => {
      if (prev.includes(kw)) return prev.filter(k => k !== kw);
      if (prev.length >= 3) {
        showToast('Maximum 3 keywords for focused intelligence.', 'warning');
        return prev;
      }
      return [...prev, kw];
    });
  };

  // Load knowledge status
  const fetchKnowledgeStatus = useCallback(async () => {
    try {
      const res = await LLMService.getKnowledgeStatus();
      setKnowledgeStatus(res.data);
    } catch (err) {
      console.warn('Could not fetch knowledge status:', err);
    }
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const wsRes = await WorkspaceService.getMyWorkspaces();
      if (wsRes.ok) {
        setWorkspaces(wsRes.items);
        // If no workspace is selected yet, pick the first one
        if (!selectedWorkspaceId && wsRes.items.length > 0) {
          setSelectedWorkspaceId(String(wsRes.items[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const fetchKnowledgeHistory = useCallback(async () => {
    if (!selectedWorkspaceId) return;
    try {
      const res = await LLMService.getKnowledgeSources(selectedWorkspaceId);
      if (res.success) setKnowledgeHistory(res.data);
    } catch (err) {
      console.warn('History fetch failed:', err);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchKnowledgeStatus();
      fetchKnowledgeHistory();
    }
  }, [selectedWorkspaceId, activeTab, fetchKnowledgeStatus, fetchKnowledgeHistory]);

  const { user } = useAuth();
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
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
  };


  const loadInitialData = useCallback(async () => {
    // Currently no dynamic initial data required post-cleanup
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ============================================================================
  // GENERATE QUESTIONS HANDLER - With validation layers
  // ============================================================================

  // ============================================================================
  // EXECUTE GẤU INTELLIGENCE - Hierarchical RAG Pipeline
  // ============================================================================

  const handleExecuteIntelligence = async () => {
    if (isLockedForRoleMismatch()) {
      setShowUpsellModal(true);
      return;
    }

    try {
      setLoading(true);
      setSelectedIndices(new Set());
      // Bundle hierarchical data for the unified pipeline
      const finalKeywords = selectedKeywords.length > 0 ? selectedKeywords : (formData.keyword ? [formData.keyword] : []);
      
      const payload = {
        keyword: finalKeywords.join(', ') || customNote || 'General Research',
        keywords: finalKeywords.length > 0 ? finalKeywords : (customNote ? [customNote] : []),
        category: formData.category,
        form_type: formType,
        num_questions: parseInt(formData.questionCount) || 5,
        fine_tune_note: customNote,
        workspaceId: activeTab === 'knowledge' ? selectedWorkspaceId : null,
        visibility_scope: activeTab === 'knowledge' ? 'private' : 'all',
        language: 'en' // Strictly English for NCKH
      };

      // Validation: In global mode, keywords are mandatory. In notebook mode, either keywords OR a prompt note is needed.
      const hasContent = payload.keywords.length > 0 || (activeTab === 'knowledge' && customNote);
      
      if (!hasContent) {
        showToast(activeTab === 'knowledge' ? 'Please provide a research prompt or select keywords.' : 'Please select at least one keyword pillar.', 'warning');
        setLoading(false);
        return;
      }

      console.log('>>> [GAU PIPELINE] Executing Intelligence Sequence:', payload);

      const response = await LLMService.generateQuestions(payload);
      
      const questions = response.data?.questions || response.questions || [];
      const meta = response.data?.metadata || response.metadata || null;

      if (questions.length === 0) {
        showToast('No specific intel found. Try broader keywords or check AI Server.', 'warning');
        return;
      }

      setGeneratedQuestions(questions);
      setMetadata(meta);
      
      // Automatically select all questions by default for faster launch
      const allIndices = new Set();
      questions.forEach((_, i) => allIndices.add(i));
      setSelectedIndices(allIndices);
      
      showToast(`Extraction complete: ${questions.length} research pillars identified.`, 'success');
    } catch (error) {
      console.error('>>> [GAU PIPELINE] Fatal Chain Error:', error);
      showToast('AI Pipeline Interruption. Check server logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchProject = async () => {
    if (selectedIndices.size === 0) {
      showToast('Select at least one pillar to launch the project.', 'warning');
      return;
    }

    try {
      setLaunching(true);
      const finalQuestions = generatedQuestions.filter((_, idx) => selectedIndices.has(idx));
      
      // 0. AI Learning Loop: Ingest selected/refined questions back to ChromaDB
      try {
        const learnPayload = finalQuestions.map(q => q.question || q.question_text || '');
        await LLMService.learnFromFeedback(learnPayload);
        console.log('>>> [GAU EVOLUTION] AI has learned from this selection.');
      } catch (learnErr) {
        console.warn('>>> [GAU EVOLUTION] Learning loop skipped:', learnErr.message);
        // Don't block launch if learning fails
      }

      const topicLabel = formData.keyword || selectedKeywords.join(', ');
      const title = `${topicLabel} Research Project`;

      // 1. Create Template (Research Blueprint)
      showToast('Creating Research Blueprint...', 'info');
      const tplResponse = await TemplateService.create({
        title: title,
        description: metadata?.expected_insights || `Intelligence blueprint for ${topicLabel}.`
      });

      if (!tplResponse || !tplResponse.ok || !tplResponse.id) {
        throw new Error('Failed to create template blueprint.');
      }

      const templateId = tplResponse.id;

      // 2. Add Questions to Template
      showToast(`Syncing ${finalQuestions.length} research pillars...`, 'info');
      
      // Sequential addition to maintain order and prevent server overwhelm
      for (let i = 0; i < finalQuestions.length; i++) {
        const q = finalQuestions[i];
        
        // Data Alignment: AI output fields -> Backend validation fields
        const qText = q.question || q.question_text || '';
        const qType = q.type || 'text';
        
        const payload = {
          label: qText,
          question_text: qText,
          question_type_id: QUESTION_TYPE_MAP[qType] || 3, // fallback to text (short answer)
          is_required: q.required !== undefined ? q.required : true,
          display_order: i,
          options: q.options && Array.isArray(q.options) 
            ? q.options.map(opt => (typeof opt === 'object' ? (opt.text || opt.option_text) : opt)).filter(Boolean)
            : []
        };
        
        try {
          await TemplateService.addQuestion(templateId, payload);
        } catch (addError) {
          console.error(`>>> [GAU LAUNCH] Question Sync Failed [${i}]:`, addError);
          // Re-throw with more context if available from backend
          const serverMsg = addError.response?.data?.message || addError.message;
          throw new Error(`Sync Error on Pillar #${i+1}: ${serverMsg}`);
        }
      }

      // 3. Save to session draft so SurveyEditor can pick it up
      localStorage.setItem('ai_research_draft', JSON.stringify({
        title: title,
        description: metadata?.expected_insights || '',
        template_id: templateId,
        category: formData.category,
        ui_hint: metadata?.ui_hint || 'stepper_scroll'
      }));

      showToast('Intelligence Blueprint ready! Finalizing Survey...', 'success');
      navigate('/surveys/new');
    } catch (error) {
      console.error('>>> [GAU LAUNCH] Fatal Error:', error);
      showToast(error.message || 'Workflow interruption during project launch.', 'error');
    } finally {
      setLaunching(false);
    }
  };

  const handleIngest = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setIsIngesting(true);
      const res = await LLMService.ingestDocuments(files, ingestCategory);
      if (res.success) {
        showToast(`Research assets synchronized [${ingestCategory.toUpperCase()}]`, 'success');
        fetchKnowledgeHistory();
      }
    } catch (error) {
      console.error('Ingest error:', error);
      showToast('Synchronization failed.', 'error');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestUrl = async () => {
    if (!urlInput) return;
    try {
      setIsIngesting(true);
      const res = await LLMService.ingestUrl(urlInput, selectedWorkspaceId, promoteToGlobal, ingestCategory);
      if (res.success) {
        showToast(`URL Ingested [${ingestCategory.toUpperCase()}]! Quality: ${res.quality_report?.overall_score || 100}%`, 'success');
        setUrlInput('');
        fetchKnowledgeHistory();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'URL Ingestion failed', 'error');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestText = async () => {
    if (!textInput || !titleInput) return;
    try {
      setIsIngesting(true);
      const res = await LLMService.ingestText(titleInput, textInput, selectedWorkspaceId, promoteToGlobal, ingestCategory);
      if (res.success) {
        showToast(`Text Pillar Added [${ingestCategory.toUpperCase()}]!`, 'success');
        setTextInput('');
        setTitleInput('');
        fetchKnowledgeHistory();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Text Ingestion failed', 'error');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this source? This will remove associated vectors.')) return;
    try {
      const res = await LLMService.deleteKnowledgeSource(id);
      if (res.success) {
        showToast('Source deleted successfully', 'success');
        fetchKnowledgeHistory();
      }
    } catch (err) {
      showToast('Failed to delete source', 'error');
    }
  };

  const handleRenameSource = async (id) => {
    if (!renamingName.trim()) return;
    try {
      const res = await LLMService.updateKnowledgeSource(id, { name: renamingName });
      if (res.success) {
        showToast('Source renamed', 'success');
        setEditingSourceId(null);
        fetchKnowledgeHistory();
      }
    } catch (err) {
      showToast('Rename failed', 'error');
    }
  };

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return;
    try {
      setIsCreatingNotebook(true);
      const res = await WorkspaceService.createWorkspace({ name: newNotebookName });
      if (res.ok) {
        showToast('New notebook created!', 'success');
        setNewNotebookName('');
        fetchWorkspaces();
      }
    } catch (err) {
      showToast('Failed to create notebook', 'error');
    } finally {
      setIsCreatingNotebook(false);
    }
  };

  const handleDeleteNotebook = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this entire notebook? This cannot be undone.')) return;
    try {
      const res = await WorkspaceService.deleteWorkspace(id);
      if (res.ok) {
        showToast('Notebook deleted', 'success');
        fetchWorkspaces();
      }
    } catch (err) {
      showToast('Failed to delete notebook', 'error');
    }
  };

  const handleResetMemory = async () => {
    if (!window.confirm('WARNING: This will permanently delete all human-refined questions from AI Priority Memory. Baseline knowledge will be preserved. Proceed?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete('http://localhost:5000/api/memory');
      if (response.data.success) {
        showToast('AI Priority Memory cleared successfully', 'success');
        setGeneratedQuestions([]);
      } else {
        showToast('Memory reset failed', 'error');
      }
    } catch (error) {
      console.error('Reset error:', error);
      showToast('Error communicating with AI Server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (e, index, text) => {
    e.stopPropagation();
    setEditingIdx(index);
    setTempText(text);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (editingIdx !== null) {
      const updated = [...generatedQuestions];
      updated[editingIdx] = { 
        ...updated[editingIdx], 
        question: tempText 
      };
      setGeneratedQuestions(updated);
      setEditingIdx(null);
      showToast('Pillar refined and saved locally.', 'success');
    }
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingIdx(null);
  };

  const handleRegenerate = () => {
    const nextOffset = resultsOffset + formData.numQuestions;
    setResultsOffset(nextOffset);
    handleExecuteIntelligence(nextOffset); // Pass directly to avoid stale state in async call
  };

  const toggleQuestionSelection = (index) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
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

  const renderWizardSidebar = () => (
    <div className={styles.wizardContainer}>
      {/* Step 1: Domain (Global Only) */}
      {activeTab !== 'knowledge' && (
        <div className={`${styles.stepItem} ${activeStep === 1 ? styles.active : styles.completed}`}>
          <div className={styles.stepLabel}><LuActivity size={14} /> Step 1: Knowledge Domain</div>
          <Select
            value={formData.category}
            onChange={(value) => {
              handleInputChange('category', value);
              setActiveStep(2);
            }}
          >
            <option value="it">Information Technology</option>
            <option value="economics">Economics & Finance</option>
            <option value="marketing">Marketing & Sales</option>
            <option value="general">General Research</option>
          </Select>
        </div>
      )}

      {/* Step 2: Keyword Library (Global Only) */}
      {activeTab !== 'knowledge' && (
        <div className={`${styles.stepItem} ${activeStep === 2 ? styles.active : (selectedKeywords.length > 0 ? styles.completed : '')}`}>
          <div className={styles.stepLabel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span><LuCircleCheck size={14} /> Step 2: Keyword Library</span>
              <button className={styles.browseLink} onClick={() => setShowLibraryModal(true)}>
                <LuDatabase size={12} /> Browse Full Library
              </button>
            </div>
          </div>
          
          {/* Selected Tray */}
          <div className={styles.selectedTray}>
            <div className={styles.trayHeader}>
              <span className={styles.slotText}>Selected Pillars ({selectedKeywords.length}/3)</span>
            </div>
            <div className={styles.trayContent}>
              {selectedKeywords.length === 0 ? (
                <div className={styles.emptyTray}>No keywords selected yet.</div>
              ) : (
                selectedKeywords.map(kw => (
                  <span key={kw} className={`${styles.keywordPill} ${styles.selected}`} onClick={() => handleToggleKeyword(kw)}>
                    {kw} <LuX size={12} className={styles.removeIcon} />
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Search Filter */}
          <div className={styles.searchContainer}>
            <LuSearch className={styles.searchIcon} size={16} />
            <input
              placeholder="Search or add custom keyword..."
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && keywordSearch.trim()) {
                  handleToggleKeyword(keywordSearch.trim());
                  setKeywordSearch('');
                }
              }}
            />
          </div>
          
          {/* Scrollable Library Pool */}
          <div className={styles.libraryPool}>
            {currentHotKeywords
              .filter(kw => !selectedKeywords.includes(kw))
              .filter(kw => kw.toLowerCase().includes(keywordSearch.toLowerCase()))
              .length === 0 ? (
                <div className={styles.emptyPool}>No keywords found in library.</div>
            ) : (
              currentHotKeywords
                .filter(kw => !selectedKeywords.includes(kw))
                .filter(kw => kw.toLowerCase().includes(keywordSearch.toLowerCase()))
                .map(kw => (
                  <span 
                    key={kw} 
                    className={styles.poolTag}
                    onClick={() => handleToggleKeyword(kw)}
                  >
                    + {kw}
                  </span>
                ))
            )}
          </div>
        </div>
      )}

      {/* Step 3: Form Architecture (Always Visible) */}
      <div className={`${styles.stepItem} ${activeStep === 3 ? styles.active : styles.completed}`}>
        <div className={styles.stepLabel}><LuLayoutGrid size={14} /> {activeTab === 'knowledge' ? 'Step 1: Research Type' : 'Step 3: Form Architecture'}</div>
        <Select value={formType} onChange={(val) => { setFormType(val); setActiveStep(4); }}>
          <option value="survey">Research Survey</option>
          <option value="assessment">Academic Assessment</option>
          <option value="registration">Member Registration</option>
          <option value="application">Application Form</option>
          <option value="custom">Custom (Follow Prompt)</option>
        </Select>
      </div>

      {/* Step 4: Pillar Depth (Always Visible) */}
      <div className={`${styles.stepItem} ${activeStep === 4 ? styles.active : (formData.questionCount ? styles.completed : '')}`}>
        <div className={styles.stepLabel}><LuList size={14} /> {activeTab === 'knowledge' ? 'Step 2: Pillar Depth' : 'Step 4: Extraction Volume'}</div>
        <Select
          value={formData.questionCount}
          onChange={(value) => {
            handleInputChange('questionCount', value);
            setActiveStep(5);
          }}
        >
          <option value="3">3 Pillars (Fast Scan)</option>
          <option value="5">5 Pillars (Standard)</option>
          <option value="10">10 Pillars (Deep Extract)</option>
          <option value="15">15 Pillars (Comprehensive)</option>
          <option value="20">20 Pillars (Giga-Research)</option>
        </Select>
        <p className={styles.contextHint}>Define target depth for AI synthesis.</p>
      </div>

      {/* Step 5: Notebook Integrity (Always Visible) */}
      <div className={`${styles.stepItem} ${activeStep === 5 ? styles.active : ''}`}>
        <div className={styles.stepLabel}><LuSparkles size={14} /> {activeTab === 'knowledge' ? 'Step 3: Notebook Integrity' : 'Step 5: Master Alignment'}</div>
        <div className={styles.autoStatus}>
          <LuCheck size={12} /> {activeTab === 'knowledge' ? 'Strict Private Grounding' : 'ChromaDB Global Bank Active'}
        </div>
        <p className={styles.contextHint}>
          {activeTab === 'knowledge' 
            ? 'AI is strictly isolated to your notebook memory. No external leakage.'
            : 'AI is grounded in the full 275k+ record library.'}
        </p>
      </div>
    </div>
  );

  const renderContentWorkspace = () => (
    <div className={styles.layoutWizard}>
      <aside className={styles.sidePanel}>
        <Card className={styles.formCard}>
          <h3><LuFileText /> Knowledge Configuration</h3>
          {renderWizardSidebar()}
          
          <Button
            onClick={handleExecuteIntelligence}
            disabled={loading || 
              (activeTab !== 'knowledge' && selectedKeywords.length === 0) || 
              (activeTab === 'knowledge' && selectedKeywords.length === 0 && !customNote.trim())
            }
            className={styles.generateBtn}
            style={{ marginTop: '24px' }}
          >
            {loading ? <Loader size="sm" /> : <LuSparkles />} 
            {loading ? 'Processing...' : 'Execute'}
          </Button>
        </Card>
      </aside>

      <main className={styles.mainPanel}>
        <div className={styles.fineTuneCard}>
          <div className={styles.stepLabel}>
            <LuPencil size={14} /> RESEARCH FINE-TUNING & PROMPT ALIGNMENT (OPTIONAL)
          </div>
          <div className={styles.fineTuneContainer}>
            <textarea
              placeholder="Provide extra instructions, tone requirements, or specific entities to extract... (e.g., 'Make it challenging for senior levels')"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.resultsCard}>
          <div className={styles.resultsHeader}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ margin: 0 }}><LuActivity size={20} color="#14B8A6" /> Results Feed</h3>
              {generatedQuestions.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={styles.archBadge}>
                    <LuLayoutGrid size={12} /> {formType.toUpperCase()} MODE
                  </span>
                  {metadata?.ratio_applied && (
                    <span className={styles.ratioTag}>Ratio: {metadata.ratio_applied}</span>
                  )}
                </div>
              )}
            </div>
            
            {generatedQuestions.length > 0 && (
              <div className={styles.headerActions}>
                <button className={styles.actionBtn} onClick={handleRegenerate} disabled={loading}>
                  <LuRotateCcw size={14} className={loading ? styles.spinning : ''} /> 
                  {loading ? 'Shuffling...' : 'Regenerate'}
                </button>
                <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
                <button className={styles.actionBtn} onClick={handleSelectAll}>Select All</button>
                <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
                <button className={styles.actionBtn} onClick={handleClearSelection}>Clear</button>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={styles.selectionCount}>
                    {selectedIndices.size || generatedQuestions.length} Items Selected
                  </span>
                  <Button 
                    size="small" 
                    variant="primary" 
                    onClick={handleLaunchProject}
                    disabled={launching}
                    style={{ padding: '6px 16px', borderRadius: '8px' }}
                  >
                    {launching ? 'Launching...' : 'Launch Project'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.resultsBody}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <Loader />
                <h4>Synthesizing Intelligence...</h4>
                <p>Analyzing library correlations for {selectedKeywords.join(', ')}.</p>
              </div>
            ) : generatedQuestions.length > 0 ? (
              generatedQuestions.map((q, index) => (
                <div
                  key={index}
                  className={`${styles.questionItem} ${selectedIndices.has(index) ? styles.selected : ''}`}
                  onClick={() => toggleQuestionSelection(index)}
                >
                  <div className={styles.selectionCheckbox}>
                    {selectedIndices.has(index) && <LuCheck size={14} />}
                  </div>
                  <div className={styles.questionContent}>
                    <div className={styles.questionType}>
                      {getQuestionTypeIcon(q.question_type || q.type)} {getQuestionTypeName(q.question_type || q.type)}
                      <div className={styles.editTrigger} onClick={(e) => handleStartEdit(e, index, q.question)}>
                        <LuPencil size={12} /> Refine
                      </div>
                    </div>

                    {editingIdx === index ? (
                      <div className={styles.editContainer} onClick={(e) => e.stopPropagation()}>
                        <textarea 
                          className={styles.editArea}
                          value={tempText}
                          onChange={(e) => setTempText(e.target.value)}
                          autoFocus
                        />
                        <div className={styles.editActions}>
                          <button className={styles.saveBtn} onClick={handleSaveEdit}>Save Refinement</button>
                          <button className={styles.cancelBtn} onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.questionText}>{q.question}</p>
                    )}
                    
                    {/* Render Options if available (for MCQ/Likert) */}
                    {q.options && q.options.length > 0 && (
                      <div className={styles.optionsPreview}>
                        {q.options.map((opt, i) => (
                          <div key={i} className={styles.optItem}>
                            <div className={styles.optDot} /> {opt.text || opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <span className={`${styles.metaBadge} ${styles.category}`}>
                        {q.category || formData.category}
                      </span>
                      {q.grounded !== undefined && (
                        <span className={`${styles.metaBadge} ${q.grounded ? styles.groundedBadge : styles.aiBadge}`}>
                          {q.grounded ? <LuFileText size={10} /> : <LuSparkles size={10} />}
                          {q.grounded ? 'Dữ liệu gốc' : 'AI Bổ sung'}
                        </span>
                      )}
                      {q.confidence && (
                        <span className={`${styles.metaBadge} ${styles.confidence}`}>
                          {Math.round(q.confidence * 100)}% Fidelity
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemIndex}>
                    #{index + 1}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyResults}>
                <div className={styles.iconContainer}>
                  <LuSparkles size={40} />
                </div>
                <h4>Ready for Instruction</h4>
                <p>Select a domain and keywords to begin extraction process.</p>
              </div>
            )}
          </div>

          {generatedQuestions.length > 0 && metadata?.expected_insights && (
            <div className={styles.insightBox} style={{ padding: '20px 32px', background: '#f0fdfa', borderTop: '1px solid #14B8A6', borderRadius: '0 0 24px 24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#14B8A6', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LuSparkles size={12} /> Expected Research Insights
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#0F766E', fontWeight: 500, lineHeight: 1.5 }}>
                {metadata.expected_insights}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );

  const isReady = knowledgeStatus?.status === 'ready' || knowledgeStatus?.status === 'healthy';
  return (
    <div className={styles.pageContent}>
      <div className={styles.dashboardHeader}>
        <div className={styles.titleArea}>
          <div className={styles.pageTitle}>
            <h1>SIR-AG <span className={styles.brand}>Intelligence Hub</span></h1>
            <div className={`${styles.statusDot} ${isReady ? styles.online : styles.offline}`} title="AI System Status" />
          </div>
          <p className={styles.pageSubtile}>Scientific Intelligent Retrieval & AI Generation Platform</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'generate' ? styles.active : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <LuSparkles size={18} /> Intelligence Hub
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'knowledge' ? styles.active : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          <LuBrain size={18} /> Notebook & Knowledge
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'monitoring' ? styles.active : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <LuActivity size={18} /> AI Pulse
        </button>
      </div>

      <div className={styles.tabWrapper}>
        {activeTab === 'generate' && renderContentWorkspace()}
        {activeTab === 'knowledge' && (
          <div className={styles.notebookTabWrapper}>
            {isNotebookShelf ? (
              <div className={styles.notebookShelf}>
                <div className={styles.shelfHeader}>
                  <div className={styles.shelfTitle}>
                    <h2>Your Notebooks</h2>
                    <p>Manage your research projects and private knowledge bases.</p>
                  </div>
                  <div className={styles.shelfActions}>
                    <div className={styles.createGroup}>
                      <input 
                        placeholder="Notebook Name..." 
                        value={newNotebookName} 
                        onChange={e => setNewNotebookName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateNotebook()}
                      />
                      <Button onClick={handleCreateNotebook} loading={isCreatingNotebook}>
                        <LuPlus /> New Notebook
                      </Button>
                    </div>
                  </div>
                </div>

                <div className={styles.shelfGrid}>
                  {workspaces.map(ws => (
                    <div 
                      key={ws.id} 
                      className={`${styles.notebookCard} ${selectedWorkspaceId === String(ws.id) ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedWorkspaceId(String(ws.id));
                        setIsNotebookShelf(false);
                      }}
                    >
                      <div className={styles.cardIcon}><LuBrain size={32} /></div>
                      <div className={styles.cardContent}>
                        <h3>{ws.name}</h3>
                        <p>{ws.description || 'Private research notebook'}</p>
                        <div className={styles.cardMeta}>
                           <span>Created: {new Date(ws.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className={styles.cardActions}>
                        <button onClick={(e) => handleDeleteNotebook(ws.id, e)}><LuTrash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  
                  {workspaces.length === 0 && (
                    <div className={styles.emptyShelf}>
                       <LuDatabase size={48} />
                       <p>No notebooks found. Create your first research project to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.notebookLayout}>
                {/* LEFT SIDEBAR: Source Management (NotebookLM Style) */}
                <aside className={styles.notebookSidebar}>
                  <div className={styles.sidebarHeader}>
                    <button className={styles.backBtn} onClick={() => setIsNotebookShelf(true)}>
                      <LuArrowLeft size={16} />
                    </button>
                    <h3>Source Guide</h3>
                  </div>
                  
                  <div className={styles.activeNotebookInfo}>
                     <div className={styles.nbLabel}>Current Notebook</div>
                     <div className={styles.nbName}>{workspaces.find(w => String(w.id) === selectedWorkspaceId)?.name || 'Notebook'}</div>
                  </div>

                  <div className={styles.sourceStats}>
                    <div className={styles.statLine}>
                      <LuFileText size={14} /> 
                      <span>{knowledgeHistory.length} Documents</span>
                    </div>
                    <div className={styles.statLine}>
                      <LuCircleCheck size={14} /> 
                      <span>{knowledgeHistory.reduce((sum, item) => sum + (item.vector_count || 0), 0).toLocaleString()} Vectors</span>
                    </div>
                  </div>

                  <div className={styles.ingestSection}>
                    <div className={styles.ingestTabs}>
                      <button className={ingestMode === 'file' ? styles.active : ''} onClick={() => setIngestMode('file')}>Upload</button>
                      <button className={ingestMode === 'url' ? styles.active : ''} onClick={() => setIngestMode('url')}>Link</button>
                      <button className={ingestMode === 'text' ? styles.active : ''} onClick={() => setIngestMode('text')}>Text</button>
                    </div>
                    
                    <div className={styles.ingestBody}>
                      {ingestMode === 'file' && (
                        <div className={styles.miniDropzone} onClick={() => document.getElementById('file-sync').click()}>
                          <LuUpload size={20} />
                          <span>Click to upload PDF/CSV</span>
                          <input type="file" multiple id="file-sync" hidden onChange={(e) => handleIngest(Array.from(e.target.files))} />
                        </div>
                      )}
                      {ingestMode === 'url' && (
                        <div className={styles.miniInputGroup}>
                          <input placeholder="Enter URL..." value={urlInput} onChange={e => setUrlInput(e.target.value)} />
                          <button onClick={handleIngestUrl} disabled={isIngesting}>{isIngesting ? '...' : <LuCheck />}</button>
                        </div>
                      )}
                      {ingestMode === 'text' && (
                        <div className={styles.miniInputGroup}>
                          <input placeholder="Title..." value={titleInput} onChange={e => setTitleInput(e.target.value)} />
                          <textarea placeholder="Paste content..." value={textInput} onChange={e => setTextInput(e.target.value)} />
                          <Button size="small" onClick={handleIngestText} loading={isIngesting}>Add Pillar</Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.historyList}>
                    <div className={styles.listHeader}>Ingested Sources</div>
                    {knowledgeHistory.length === 0 ? (
                      <div className={styles.emptyList}>No sources added yet.</div>
                    ) : (
                      knowledgeHistory.map(item => (
                        <div key={item.id} className={styles.sourceItem}>
                          <div className={styles.sourceIcon}><LuFileText size={14} /></div>
                          <div className={styles.sourceInfo}>
                            {editingSourceId === item.id ? (
                              <div className={styles.inlineEdit}>
                                <input 
                                  autoFocus
                                  value={renamingName} 
                                  onChange={e => setRenamingName(e.target.value)}
                                  onBlur={() => handleRenameSource(item.id)}
                                  onKeyDown={e => e.key === 'Enter' && handleRenameSource(item.id)}
                                />
                              </div>
                            ) : (
                              <div className={styles.sourceName} onDoubleClick={() => { setEditingSourceId(item.id); setRenamingName(item.name); }}>
                                {item.name}
                              </div>
                            )}
                            <div className={styles.sourceMeta}>{Math.round(item.quality_score)}% Quality • {item.vector_count} Pillars</div>
                          </div>
                          <div className={styles.sourceActions}>
                            <button onClick={() => { setEditingSourceId(item.id); setRenamingName(item.name); }} title="Rename"><LuPencil size={12} /></button>
                            <button onClick={() => handleDeleteSource(item.id)} title="Delete"><LuTrash2 size={12} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </aside>

                {/* MAIN AREA: Private Intelligence Hub */}
                <main className={styles.notebookMain}>
                  <div className={styles.notebookHeader}>
                    <div className={styles.badge}>
                      <LuSparkles size={12} /> Grounded in Private Knowledge
                    </div>
                    <h2>Intelligence Studio</h2>
                    <p>Generate research questions using only the sources in your notebook.</p>
                  </div>

                  <div className={styles.notebookContent}>
                    {renderContentWorkspace()}
                  </div>
                </main>
              </div>
            )}
          </div>
        )}
        {activeTab === 'monitoring' && (
          <div className={styles.monitoringGrid}>
            <Card>
              <h3 className={styles.cardHeader}><LuActivity size={18} /> System Health</h3>
              <div className={styles.healthCard}>
                <div className={styles.statusLabel}>
                  <div className={styles.pulseIndicator} /> AI SERVER ONLINE
                </div>
                <p className={styles.meta}>
                  Latency: 120ms • Model: Gemini Flash 1.5
                </p>
              </div>
            </Card>
            <Card>
              <h3 className={styles.cardHeader}><LuDatabase size={18} /> Memory Usage</h3>
              <div className={styles.memoryCard}>
                <div className={styles.usageValue}>
                  {knowledgeStatus?.storage?.total_size_mb || 0} <span>MB</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.fill} style={{ width: `${knowledgeStatus?.storage?.sync_percent || 0}%` }} />
                </div>
                <p className={styles.note}>
                  Knowledge synchronization is {knowledgeStatus?.storage?.sync_percent || 0}% optimized.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Keyword Library Modal Overlay */}
      {showLibraryModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLibraryModal(false)}>
          <div className={styles.libraryModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.headerTitle}>
                <h2>📚 Intelligence Keyword Library</h2>
                <p>Browse and select up to 3 pillars from our scientific dataset</p>
              </div>
              <button className={styles.closeModal} onClick={() => setShowLibraryModal(false)}>
                <LuX size={24} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {Object.entries(hotKeywordsByCat).map(([cat, keywords]) => (
                <div key={cat} className={styles.libraryCategory}>
                  <h3>{cat.toUpperCase()}</h3>
                  <div className={styles.modalTagGrid}>
                    {keywords.map(kw => (
                      <div 
                        key={kw} 
                        className={`${styles.modalKeyword} ${selectedKeywords.includes(kw) ? styles.selected : ''}`}
                        onClick={() => handleToggleKeyword(kw)}
                      >
                        {selectedKeywords.includes(kw) && <LuCheck size={14} />} {kw}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.modalFooter}>
              <div className={styles.selectionCount}>
                <strong>{selectedKeywords.length} / 3</strong> Pillars Selected
              </div>
              <Button onClick={() => setShowLibraryModal(false)}>Finish Selection</Button>
            </div>
          </div>
        </div>
      )}

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
