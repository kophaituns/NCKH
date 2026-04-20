// src/pages/LLM/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Select from '../../components/UI/Select';
import Loader from '../../components/common/Loader/Loader';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import { useAuth } from '../../contexts/AuthContext';
import UpgradeModal from '../../components/UpgradeToCreator/UpgradeModal';
import UpgradeUpsellModal from '../../components/UI/UpgradeUpsellModal/UpgradeUpsellModal';
import { LuSparkles, LuBrain, LuFileText, LuCircleCheck, LuDatabase, LuUpload, LuCheck, LuSearch, LuActivity, LuX, LuLayoutGrid, LuList, LuPencil } from 'react-icons/lu';
import Toast from '../../components/common/Toast/Toast';
import styles from './LLM.module.scss';

// Import validation utilities
import {
  getQuestionTypeName,
  getQuestionTypeIcon
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
  const [knowledgeStatus, setKnowledgeStatus] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  // Workspace & Target Audience State
  const [metadata, setMetadata] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // ============================================================================
  // WIZARD & INTELLIGENCE STATE (GAU UPDATE)
  // ============================================================================
  const [activeStep, setActiveStep] = useState(1);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [formType, setFormType] = useState('survey');
  const [customNote, setCustomNote] = useState('');

  // Mock "Hot Keywords" extracted from dataset summary logic
  const hotKeywordsByCat = useMemo(() => ({
    it: ['Python', 'Data Science', 'Security', 'React', 'FastAPI'],
    marketing: ['SEO', 'Digital Ads', 'Branding', 'Social Media', 'Leads'],
    economics: ['Inflation', 'GDP', 'Markets', 'Banking', 'Trade'],
    general: ['Research', 'Quality', 'Performance', 'Strategy', 'Ethics']
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

  useEffect(() => {
    if (activeTab === 'knowledge') {
      fetchKnowledgeStatus();
    }
  }, [activeTab, fetchKnowledgeStatus]);

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
      const payload = {
        keywords: selectedKeywords.length > 0 ? selectedKeywords : (formData.keyword ? [formData.keyword] : []),
        category: formData.category,
        form_type: formType,
        num_questions: parseInt(formData.questionCount) || 5,
        fine_tune_note: customNote,
        language: 'en' // Strictly English for NCKH
      };

      if (payload.keywords.length === 0) {
        showToast('Please select at least one keyword pillar.', 'warning');
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
      showToast('Intelligence extraction complete!', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setIsIngesting(true);
      const res = await LLMService.triggerIngestion();
      if (res.success) {
        showToast('Knowledge synchronization triggered!', 'success');
        fetchKnowledgeStatus();
      }
    } catch (err) {
      showToast('Ingestion failed.', 'error');
    } finally {
      setIsIngesting(false);
    }
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

      <div className={`${styles.stepItem} ${activeStep === 2 ? styles.active : (selectedKeywords.length > 0 ? styles.completed : '')}`}>
        <div className={styles.stepLabel}><LuCircleCheck size={14} /> Step 2: Keyword Pillars ({selectedKeywords.length}/3)</div>
        <div className={styles.searchContainer}>
          <LuSearch className={styles.searchIcon} size={16} />
          <input
            placeholder="Search or add keyword..."
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
        
        <div className={styles.hotTagsContainer}>
          <label>Common in {formData.category}</label>
          <div className={styles.hotTags}>
            {currentHotKeywords.map(kw => (
              <span 
                key={kw} 
                className={`${styles.hotTag} ${selectedKeywords.includes(kw) ? styles.selected : ''}`}
                onClick={() => handleToggleKeyword(kw)}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {selectedKeywords.length > 0 && (
          <div className={styles.tagCloud}>
            {selectedKeywords.map(kw => (
              <span key={kw} className={styles.keywordPill} onClick={() => handleToggleKeyword(kw)}>
                {kw} <LuX size={12} />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`${styles.stepItem} ${activeStep === 3 ? styles.active : styles.completed}`}>
        <div className={styles.stepLabel}><LuLayoutGrid size={14} /> Step 3: Form Architecture</div>
        <Select value={formType} onChange={(val) => { setFormType(val); setActiveStep(4); }}>
          <option value="survey">Research Survey</option>
          <option value="assessment">Academic Assessment</option>
          <option value="registration">Member Registration</option>
          <option value="application">Application Form</option>
          <option value="custom">Custom (Follow Prompt)</option>
        </Select>
      </div>

      <div className={`${styles.stepItem} ${activeStep === 4 ? styles.active : ''}`}>
        <div className={styles.stepLabel}><LuList size={14} /> Step 4: Final Scale</div>
        <Select
          value={formData.questionCount}
          onChange={(value) => handleInputChange('questionCount', parseInt(value))}
        >
          <option value={3}>3 Specific Units</option>
          <option value={5}>5 Standard Units</option>
          <option value={10}>10 Detailed Units</option>
        </Select>
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
            disabled={loading || (selectedKeywords.length === 0 && !formData.keyword)}
            className={styles.generateBtn}
            style={{ marginTop: '24px' }}
          >
            {loading ? <Loader size="sm" /> : <LuSparkles />} 
            {loading ? 'Processing...' : 'Execute Gấu Pipeline'}
          </Button>
        </Card>
      </aside>

      <main className={styles.mainPanel}>
        <div className={styles.fineTuneCard} style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', marginBottom: '24px', border: '1px solid #f1f5f9' }}>
          <div className={styles.stepLabel} style={{ color: '#14B8A6', marginBottom: '16px', fontSize: '12px', fontWeight: 800 }}>
            <LuPencil size={14} /> STEP 5: RESEARCH FINE-TUNING (OPTIONAL)
          </div>
          <div className={styles.fineTuneContainer} style={{ marginTop: 0 }}>
            <textarea
              placeholder="Provide extra instructions, tone requirements, or specific entities to extract... (e.g., 'Make it challenging for senior levels')"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.resultsCard}>
          <div className={styles.resultsHeader}>
            <h3><LuActivity size={20} color="#14B8A6" /> Results Feed (Scrollable)</h3>
            
            {generatedQuestions.length > 0 && (
              <div className={styles.headerActions}>
                <button className={styles.actionBtn} onClick={handleSelectAll}>Select All</button>
                <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
                <button className={styles.actionBtn} onClick={handleClearSelection}>Clear</button>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', padding: '0 8px' }}>
                  {selectedIndices.size || generatedQuestions.length} Items Selected
                </span>
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
                  <div className={styles.questionNumber}>
                    {selectedIndices.has(index) ? <LuCheck size={20} /> : index + 1}
                  </div>
                  <div className={styles.questionContent}>
                    <div className={styles.questionType}>
                      {getQuestionTypeIcon(q.question_type || q.type)} {getQuestionTypeName(q.question_type || q.type)}
                    </div>
                    <p className={styles.questionText}>{q.question}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <span className={`${styles.metaBadge} ${styles.category}`}>
                        {q.category || formData.category}
                      </span>
                      {q.confidence && (
                        <span className={`${styles.metaBadge} ${styles.confidence}`}>
                          {Math.round(q.confidence * 100)}% Fidelity
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.selectionIndicator}>
                    <LuCheck size={18} />
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
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>SIR-AG <span className={styles.brand}>Intelligence Hub</span></h1>
          <div className={`${styles.statusDot} ${isReady ? styles.online : styles.offline}`} title="AI System Status" />
        </div>
        <p>Scientific Intelligent Retrieval & AI Generation Platform</p>
      </header>

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
          <LuDatabase size={18} /> Knowledge Library
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'monitoring' ? styles.active : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <LuActivity size={18} /> AI Pulse
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        {activeTab === 'generate' && renderContentWorkspace()}
        {activeTab === 'knowledge' && (
          <div className={styles.tabContent}>
            <div className={styles.knowledgeHeader} style={{ marginBottom: '24px', textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <LuBrain size={48} color="#14B8A6" style={{ marginBottom: '16px' }} />
              <h2>Knowledge Synchronization</h2>
              <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                Your library currently hosts <strong>{knowledgeStatus?.chromadb_vectors?.toLocaleString() || 0}</strong> intelligence units across <strong>{knowledgeStatus?.storage?.total_files || 0}</strong> research documents.
              </p>
              
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => handleIngest(Array.from(e.target.files))} 
                  id="file-sync" 
                  className={styles.hiddenInput}
                  style={{ display: 'none' }}
                />
                <Button onClick={() => document.getElementById('file-sync').click()} loading={isIngesting}>
                  <LuUpload /> {isIngesting ? 'Syncing...' : 'Sync New Research Assets'}
                </Button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'monitoring' && (
          <div className={styles.tabContent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <Card>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><LuActivity /> System Health</h3>
              <div style={{ padding: '24px', background: '#f0fdfa', borderRadius: '16px', border: '1px solid #14B8A6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#0F766E', fontWeight: 800 }}>
                  <div className={styles.pulseIndicator} />   AI SERVER ONLINE
                </div>
                <p style={{ color: '#0F766E', fontSize: '13px', marginTop: '10px', opacity: 0.8 }}>
                  Latency: 120ms • Model: Gemini Flash 1.5
                </p>
              </div>
            </Card>
            <Card>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><LuDatabase /> Memory Usage</h3>
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b' }}>
                  {knowledgeStatus?.storage?.total_size_mb || 0} <span style={{ fontSize: '14px', color: '#64748b' }}>MB</span>
                </div>
                <div style={{ height: '8px', width: '100%', background: '#e2e8f0', borderRadius: '4px', marginTop: '16px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${knowledgeStatus?.storage?.sync_percent || 0}%`, background: '#14B8A6' }} />
                </div>
                <p style={{ color: '#64748b', fontSize: '12px', marginTop: '12px' }}>
                  Knowledge synchronization is {knowledgeStatus?.storage?.sync_percent || 0}% optimized.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

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
      <Toast message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, message: '' })} />
    </div>
  );
};

export default LLM;
