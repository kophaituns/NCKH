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
  const [categories, setCategories] = useState([]);
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

      setCategories(categoriesRes.data.categories || []);
      setPrompts(promptsRes.data.prompts || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
<<<<<<< HEAD
      showToast('Lỗi khi tải dữ liệu ban đầu', 'error');
=======
      showToast('Error loading initial data', 'error');
>>>>>>> linh2
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
<<<<<<< HEAD
      showToast('Vui lòng nhập từ khóa', 'error');
=======
      showToast('Please enter a keyword', 'error');
>>>>>>> linh2
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
<<<<<<< HEAD
      showToast('Tạo câu hỏi thành công!', 'success');
    } catch (error) {
      console.error('Error generating questions:', error);
      showToast('Lỗi khi tạo câu hỏi: ' + (error.response?.data?.message || error.message), 'error');
=======
      showToast('Questions generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating questions:', error);
      showToast('Error generating questions: ' + (error.response?.data?.message || error.message), 'error');
>>>>>>> linh2
    } finally {
      setLoading(false);
    }
  };

  const handlePredictCategory = async () => {
    if (!formData.keyword.trim()) {
<<<<<<< HEAD
      showToast('Vui lòng nhập từ khóa', 'error');
=======
      showToast('Please enter a keyword', 'error');
>>>>>>> linh2
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
<<<<<<< HEAD
        showToast(`Dự đoán danh mục: ${response.data.category} (${response.data.confidence}%)`, 'success');
      }
    } catch (error) {
      console.error('Error predicting category:', error);
      showToast('Lỗi khi dự đoán danh mục', 'error');
=======
        showToast(`Predicted category: ${response.data.category} (${response.data.confidence}%)`, 'success');
      }
    } catch (error) {
      console.error('Error predicting category:', error);
      showToast('Error predicting category', 'error');
>>>>>>> linh2
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSurvey = async () => {
    if (!formData.prompt.trim() && !selectedPrompt) {
<<<<<<< HEAD
      showToast('Vui lòng nhập prompt hoặc chọn prompt có sẵn', 'error');
=======
      showToast('Please enter a prompt or select an existing prompt', 'error');
>>>>>>> linh2
      return;
    }

    try {
      setLoading(true);
      const response = await LLMService.generateSurvey({
        prompt: formData.prompt,
        prompt_id: selectedPrompt,
        description: 'AI generated survey',
        target_audience: 'General',
        course_name: 'AI Course'
      });

<<<<<<< HEAD
      showToast('Tạo khảo sát thành công!', 'success');
      console.log('Generated survey:', response.data);
    } catch (error) {
      console.error('Error generating survey:', error);
      showToast('Lỗi khi tạo khảo sát: ' + (error.response?.data?.message || error.message), 'error');
=======
      showToast('Survey created successfully!', 'success');
      console.log('Generated survey:', response.data);
    } catch (error) {
      console.error('Error generating survey:', error);
      showToast('Error creating survey: ' + (error.response?.data?.message || error.message), 'error');
>>>>>>> linh2
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
<<<<<<< HEAD
        <h3>Tạo Câu Hỏi Từ AI</h3>
        
        <div className={styles.formGroup}>
          <label>Từ khóa *</label>
          <div className={styles.inputWithButton}>
            <Input
              type="text"
              placeholder="Nhập từ khóa (ví dụ: machine learning, digital marketing...)"
=======
        <h3>Generate Questions with AI</h3>
        
        <div className={styles.formGroup}>
          <label>Keywords *</label>
          <div className={styles.inputWithButton}>
            <Input
              type="text"
              placeholder="Enter keywords (e.g.: machine learning, digital marketing...)"
>>>>>>> linh2
              value={formData.keyword}
              onChange={(e) => handleInputChange('keyword', e.target.value)}
            />
            <Button 
              onClick={handlePredictCategory}
              disabled={loading || !formData.keyword.trim()}
              variant="outline"
            >
<<<<<<< HEAD
              Dự đoán danh mục
=======
              Predict Category
>>>>>>> linh2
            </Button>
          </div>
        </div>

        <div className={styles.formGroup}>
<<<<<<< HEAD
          <label>Danh mục</label>
          <Select
            value={formData.category}
            onChange={(value) => handleInputChange('category', value)}
            placeholder="Chọn danh mục"
          >
            <option value="">Tự động</option>
=======
          <label>Category</label>
          <Select
            value={formData.category}
            onChange={(value) => handleInputChange('category', value)}
            placeholder="Select category"
          >
            <option value="">Automatic</option>
>>>>>>> linh2
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </div>

        <div className={styles.formGroup}>
<<<<<<< HEAD
          <label>Số lượng câu hỏi</label>
=======
          <label>Number of Questions</label>
>>>>>>> linh2
          <Select
            value={formData.questionCount}
            onChange={(value) => handleInputChange('questionCount', parseInt(value))}
          >
<<<<<<< HEAD
            <option value={3}>3 câu hỏi</option>
            <option value={5}>5 câu hỏi</option>
            <option value={10}>10 câu hỏi</option>
            <option value={15}>15 câu hỏi</option>
=======
            <option value={3}>3 questions</option>
            <option value={5}>5 questions</option>
            <option value={10}>10 questions</option>
            <option value={15}>15 questions</option>
>>>>>>> linh2
          </Select>
        </div>

        <Button 
          onClick={handleGenerateQuestions}
          disabled={loading || !formData.keyword.trim()}
          className={styles.generateBtn}
        >
<<<<<<< HEAD
          {loading ? <Loader size="small" /> : 'Tạo Câu Hỏi'}
=======
          {loading ? <Loader size="small" /> : 'Generate Questions'}
>>>>>>> linh2
        </Button>
      </Card>

      {generatedQuestions.length > 0 && (
        <Card className={styles.resultsCard}>
<<<<<<< HEAD
          <h3>Câu Hỏi Được Tạo ({generatedQuestions.length})</h3>
=======
          <h3>Generated Questions ({generatedQuestions.length})</h3>
>>>>>>> linh2
          <div className={styles.questionsList}>
            {generatedQuestions.map((q, index) => (
              <div key={index} className={styles.questionItem}>
                <div className={styles.questionNumber}>{index + 1}</div>
                <div className={styles.questionContent}>
                  <p className={styles.questionText}>{q.question}</p>
                  <small className={styles.questionSource}>
<<<<<<< HEAD
                    Nguồn: {q.source} {q.confidence && `• Độ tin cậy: ${q.confidence}%`}
=======
                    Source: {q.source} {q.confidence && `• Confidence: ${q.confidence}%`}
>>>>>>> linh2
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
<<<<<<< HEAD
        <h3>Tạo Khảo Sát Từ AI</h3>
        
        <div className={styles.formGroup}>
          <label>Chọn prompt có sẵn</label>
          <Select
            value={selectedPrompt}
            onChange={(value) => setSelectedPrompt(value)}
            placeholder="Chọn prompt"
          >
            <option value="">Tùy chỉnh prompt</option>
=======
        <h3>Create Survey with AI</h3>
        
        <div className={styles.formGroup}>
          <label>Select preset prompt</label>
          <Select
            value={selectedPrompt}
            onChange={(value) => setSelectedPrompt(value)}
            placeholder="Select prompt"
          >
            <option value="">Custom prompt</option>
>>>>>>> linh2
            {prompts.map(prompt => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.prompt_name} ({prompt.prompt_type})
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.formGroup}>
<<<<<<< HEAD
          <label>Prompt tùy chỉnh</label>
          <TextArea
            placeholder="Nhập yêu cầu tạo khảo sát (ví dụ: Tạo khảo sát về satisfaction của sinh viên với môn học machine learning...)"
=======
          <label>Custom prompt</label>
          <TextArea
            placeholder="Enter survey creation request (e.g., Create a survey about student satisfaction with machine learning course...)"
>>>>>>> linh2
            value={formData.prompt}
            onChange={(e) => handleInputChange('prompt', e.target.value)}
            rows={4}
            disabled={selectedPrompt}
          />
          {selectedPrompt && (
            <small className={styles.helpText}>
<<<<<<< HEAD
              Bạn đang sử dụng prompt có sẵn. Bỏ chọn để nhập prompt tùy chỉnh.
=======
              You are using a preset prompt. Uncheck to enter custom prompt.
>>>>>>> linh2
            </small>
          )}
        </div>

        <Button 
          onClick={handleGenerateSurvey}
          disabled={loading || (!formData.prompt.trim() && !selectedPrompt)}
          className={styles.generateBtn}
        >
<<<<<<< HEAD
          {loading ? <Loader size="small" /> : 'Tạo Khảo Sát'}
=======
          {loading ? <Loader size="small" /> : 'Create Survey'}
>>>>>>> linh2
        </Button>
      </Card>
    </div>
  );

  if (loading && activeTab === 'generate' && generatedQuestions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader />
<<<<<<< HEAD
          <p>Đang tải...</p>
=======
          <p>Loading...</p>
>>>>>>> linh2
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>AI Question & Survey Generator</h1>
<<<<<<< HEAD
        <p>Tạo câu hỏi và khảo sát thông minh với công nghệ AI</p>
=======
        <p>Generate intelligent questions and surveys with AI technology</p>
>>>>>>> linh2
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'generate' ? styles.active : ''}`}
          onClick={() => setActiveTab('generate')}
        >
<<<<<<< HEAD
          Tạo Câu Hỏi
=======
          Generate Questions
>>>>>>> linh2
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'survey' ? styles.active : ''}`}
          onClick={() => setActiveTab('survey')}
          disabled={generatedQuestions.length === 0}
        >
<<<<<<< HEAD
          Tạo Survey ({generatedQuestions.length})
=======
          Create Survey ({generatedQuestions.length})
>>>>>>> linh2
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'prompt' ? styles.active : ''}`}
          onClick={() => setActiveTab('prompt')}
        >
<<<<<<< HEAD
          Tạo Khảo Sát Từ Prompt
=======
          Create Survey from Prompt
>>>>>>> linh2
        </button>
        {createdSurvey && (
          <button 
            className={`${styles.tab} ${activeTab === 'result' ? styles.active : ''}`}
            onClick={() => setActiveTab('result')}
          >
<<<<<<< HEAD
            Kết Quả Survey
=======
            Survey Results
>>>>>>> linh2
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
<<<<<<< HEAD
            Chỉnh Sửa Survey
=======
            Edit Survey
>>>>>>> linh2
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
<<<<<<< HEAD
            showToast('Survey đã được cập nhật', 'success');
=======
            showToast('Survey has been updated', 'success');
>>>>>>> linh2
          }}
        />
      )}
    </div>
  );
};

export default LLM;