// src/pages/LLM/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import TextArea from '../../components/UI/TextArea';
import Loader from '../../components/common/Loader/Loader';
import { useToast } from '../../contexts/ToastContext';
import LLMService from '../../api/services/llm.service';
import SurveyCreator from '../../components/LLM/SurveyCreator';
import SurveyActions from '../../components/LLM/SurveyActions';
import SurveyQuestionEditor from '../../components/LLM/SurveyQuestionEditor';
import styles from './LLM.module.scss';

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
  const [createdSurvey, setCreatedSurvey] = useState(null);
  const [editingSurveyId, setEditingSurveyId] = useState(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Load categories and prompts
      const [categoriesRes, promptsRes] = await Promise.all([
        LLMService.getCategories(),
        LLMService.getLlmPrompts()
      ]);

      // setCategories(categoriesRes.data.categories || []);
      setPrompts(promptsRes.data.prompts || []);
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateQuestions = async () => {
    if (!formData.keyword.trim()) {
      showToast('Please enter a keyword', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await LLMService.generateQuestions({
        keyword: formData.keyword,
        category: formData.category,
        count: formData.questionCount
      });

      setGeneratedQuestions(response.data.questions || []);
      showToast('Questions generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating questions:', error);
      showToast(
        'Error while generating questions: ' +
        (error.response?.data?.message || error.message),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePredictCategory = async () => {
    if (!formData.keyword.trim()) {
      showToast('Please enter a keyword', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await LLMService.predictCategory({
        keyword: formData.keyword
      });

      if (response.data.category) {
        setFormData(prev => ({
          ...prev,
          category: response.data.category
        }));
        showToast(
          `Predicted category: ${response.data.category} (${response.data.confidence}%)`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error predicting category:', error);
      showToast('Error while predicting category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSurvey = async () => {
    if (!formData.prompt.trim() && !selectedPrompt) {
      showToast('Please enter a prompt or select an existing one', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await LLMService.generateSurvey({
        prompt: formData.prompt,
        prompt_id: selectedPrompt,
        description: 'erated survey',
        target_audience: 'General',
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

  const handleEditSurvey = (surveyId) => {
    setEditingSurveyId(surveyId);
    setActiveTab('edit');
  };

  const renderQuestionGeneration = () => (
    <div className={styles.tabContent}>
      <Card className={styles.formCard}>
        <h3>Generate Questions from AI</h3>

        <div className={styles.formGroup}>
          <label>Keyword *</label>
          <div className={styles.inputWithButton}>
            <Input
              type="text"
              placeholder="Enter a keyword (e.g. machine learning, digital marketing...)"
              value={formData.keyword}
              onChange={(e) => handleInputChange('keyword', e.target.value)}
            />
            <Button
              onClick={handlePredictCategory}
              disabled={loading || !formData.keyword.trim()}
              variant="outline"
            >
              Predict Category
            </Button>
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
          disabled={loading || !formData.keyword.trim()}
          className={styles.generateBtn}
        >
          {loading ? <Loader size="small" /> : 'Generate Questions'}
        </Button>
      </Card>

      {generatedQuestions.length > 0 && (
        <Card className={styles.resultsCard}>
          <h3>Generated Questions ({generatedQuestions.length})</h3>
          <div className={styles.questionsList}>
            {generatedQuestions.map((q, index) => (
              <div key={index} className={styles.questionItem}>
                <div className={styles.questionNumber}>{index + 1}</div>
                <div className={styles.questionContent}>
                  <p className={styles.questionText}>{q.question}</p>
                  <small className={styles.questionMeta}>
                    Type: {q.type || 'text'} • Source: {q.source}{' '}
                    {q.confidence && `• Confidence: ${q.confidence}%`}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderSurveyGeneration = () => (
    <div className={styles.tabContent}>
      <Card className={styles.formCard}>
        <h3>Generate Survey from AI</h3>

        <div className={styles.formGroup}>
          <label>Select existing prompt</label>
          <Select
            value={selectedPrompt}
            onChange={(value) => setSelectedPrompt(value)}
            placeholder="Select prompt"
          >
            <option value="">Custom prompt</option>
            {prompts.map(prompt => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.prompt_name} ({prompt.prompt_type})
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.formGroup}>
          <label>Custom prompt</label>
          <TextArea
            placeholder="Enter survey generation instructions (e.g. Create a survey about students' satisfaction with the machine learning course...)"
            value={formData.prompt}
            onChange={(e) => handleInputChange('prompt', e.target.value)}
            rows={4}
            disabled={selectedPrompt}
          />
          {selectedPrompt && (
            <small className={styles.helpText}>
              You are using a predefined prompt. Clear the selection to type a custom prompt.
            </small>
          )}
        </div>

        <Button
          onClick={handleGenerateSurvey}
          disabled={loading || (!formData.prompt.trim() && !selectedPrompt)}
          className={styles.generateBtn}
        >
          {loading ? <Loader size="small" /> : 'Generate Survey'}
        </Button>
      </Card>
    </div>
  );

  if (loading && activeTab === 'generate' && generatedQuestions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>AI Question &amp; Survey Generator</h1>
        <p>Create smart questions and surveys with AI.</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'generate' ? styles.active : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Questions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'survey' ? styles.active : ''}`}
          onClick={() => setActiveTab('survey')}
          disabled={generatedQuestions.length === 0}
        >
          Generate Survey ({generatedQuestions.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'prompt' ? styles.active : ''}`}
          onClick={() => setActiveTab('prompt')}
        >
          Generate Survey from Prompt
        </button>
        {createdSurvey && (
          <button
            className={`${styles.tab} ${activeTab === 'result' ? styles.active : ''}`}
            onClick={() => setActiveTab('result')}
          >
            Survey Result
          </button>
        )}
        {createdSurvey && (
          <button
            className={`${styles.tab} ${activeTab === 'edit' ? styles.active : ''}`}
            onClick={() => {
              setEditingSurveyId(createdSurvey.id);
              setActiveTab('edit');
            }}
          >
            Edit Survey
          </button>
        )}
      </div>

      {activeTab === 'generate' && renderQuestionGeneration()}
      {activeTab === 'survey' && generatedQuestions.length > 0 && (
        <SurveyCreator
          generatedQuestions={generatedQuestions}
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
    </div>
  );
};

export default LLM;
