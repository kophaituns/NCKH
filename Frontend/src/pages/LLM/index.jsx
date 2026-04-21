// src/pages/LLM/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Select from '../../components/UI/Select';
import Loader from '../../components/common/Loader/Loader';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import TemplateService from '../../api/services/template.service';
import { QUESTION_TYPE_MAP } from '../../utils/questionTypeMap';
import { useAuth } from '../../contexts/AuthContext';
import UpgradeModal from '../../components/UpgradeToCreator/UpgradeModal';
import UpgradeUpsellModal from '../../components/UI/UpgradeUpsellModal/UpgradeUpsellModal';
import { LuSparkles, LuBrain, LuFileText, LuCircleCheck, LuDatabase, LuUpload, LuCheck, LuSearch, LuActivity, LuX, LuLayoutGrid, LuList, LuPencil } from 'react-icons/lu';
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
      'Python', 'Data Science', 'Security', 'React', 'FastAPI', 
      'Cloud Architecture', 'DevOps', 'Machine Learning', 'Database Optimization', 
      'Cybersecurity', 'Microservices', 'API Design', 'Quantum Computing', 
      'Edge Computing', 'NLP'
    ],
    marketing: [
      'SEO', 'Digital Ads', 'Branding', 'Social Media', 'Leads', 
      'Content Strategy', 'Customer Journey', 'Conversion Rate', 'Influencer Marketing', 
      'Market Segmentation', 'Email Automation', 'Public Relations', 'Affiliate Marketing', 
      'Brand Equity', 'CRM'
    ],
    economics: [
      'Inflation', 'GDP', 'Markets', 'Banking', 'Trade', 
      'Microeconomics', 'Macroeconomics', 'Econometrics', 'Fiscal Policy', 
      'Monetary Policy', 'Stock Exchange', 'Interest Rates', 'Economic Growth', 
      'Global South', 'Risk Analysis'
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
        keyword: selectedKeywords.join(', ') || formData.keyword,
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
      // Automatically select all questions by default for faster launch
      setSelectedIndices(new Set(questions.keys()));
      showToast(`Intelligence extracted: ${questions.length} scientific pillars found.`, 'success');
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
        const payload = {
          label: q.question_text,
          question_text: q.question_text,
          question_type_id: QUESTION_TYPE_MAP[q.type] || 3, // fallback to text (short answer)
          required: true,
          display_order: i,
          options: q.options && Array.isArray(q.options) 
            ? q.options.map(opt => (typeof opt === 'object' ? opt.text : opt)).filter(Boolean)
            : []
        };
        
        await TemplateService.addQuestion(templateId, payload);
      }

      // 3. Save to session draft so SurveyEditor can pick it up
      localStorage.setItem('ai_research_draft', JSON.stringify({
        title: title,
        description: metadata?.expected_insights || '',
        template_id: templateId,
        category: formData.category
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
            {loading ? 'Processing...' : 'Execute'}
          </Button>
        </Card>
      </aside>

      <main className={styles.mainPanel}>
        <div className={styles.fineTuneCard}>
          <div className={styles.stepLabel}>
            <LuPencil size={14} /> STEP 5: RESEARCH FINE-TUNING (OPTIONAL)
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
                  <div className={styles.questionNumber}>
                    {selectedIndices.has(index) ? <LuCheck size={20} /> : index + 1}
                  </div>
                  <div className={styles.questionContent}>
                    <div className={styles.questionType}>
                      {getQuestionTypeIcon(q.question_type || q.type)} {getQuestionTypeName(q.question_type || q.type)}
                    </div>
                    <p className={styles.questionText}>{q.question}</p>
                    
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
          <LuDatabase size={18} /> Knowledge Library
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
          <div className={styles.tabContent}>
            <div className={styles.knowledgeHeader}>
              <LuBrain size={48} color="#14B8A6" />
              <h2>Knowledge Synchronization</h2>
              <p>
                Your library currently hosts <strong>{knowledgeStatus?.chromadb_vectors?.toLocaleString() || 0}</strong> intelligence units across <strong>{knowledgeStatus?.storage?.total_files || 0}</strong> research documents.
              </p>
              
              <div className={styles.syncActions}>
                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => handleIngest(Array.from(e.target.files))} 
                  id="file-sync" 
                  className={styles.hiddenInput}
                  hidden
                />
                <Button onClick={() => document.getElementById('file-sync').click()} loading={isIngesting}>
                  <LuUpload /> {isIngesting ? 'Syncing...' : 'Sync New Research Assets'}
                </Button>
              </div>
            </div>
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
