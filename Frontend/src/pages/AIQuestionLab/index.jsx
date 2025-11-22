import React, { useState } from 'react';
import AiFormAgentService from '../../../api/services/aiFormAgent.service';
import styles from './AIQuestionLab.module.scss';

const AIQuestionLab = () => {
  // Form state
  const [keyword, setKeyword] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [category, setCategory] = useState('auto');

  // Status state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Results state
  const [metadata, setMetadata] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  /**
   * Handle generate button click
   */
  const handleGenerate = async () => {
    // Validate keyword
    if (!keyword.trim()) {
      setError('Please enter a keyword.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setMetadata(null);
      setRawData(null);
      setIsFallback(false);

      // Map category: 'auto' -> undefined
      const categoryParam = category === 'auto' ? undefined : category;

      // Call service
      const result = await AiFormAgentService.generateQuestions({
        keyword: keyword.trim(),
        numQuestions: parseInt(numQuestions, 10),
        category: categoryParam
      });

      // Extract and set state
      setMetadata({
        keyword: result.keyword,
        category: result.raw?.category,
        form_type: result.raw?.form_type,
        complexity: result.raw?.complexity,
        estimated_fields: result.raw?.estimated_fields,
        estimated_time: result.raw?.estimated_time
      });
      setQuestions(result.questions || []);
      setRawData(result.raw);
      setIsFallback(result.fallback || false);
    } catch (err) {
      console.error('[AIQuestionLab] Error:', err.message);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setQuestions([]);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle clear/reset
   */
  const handleClear = () => {
    setKeyword('');
    setNumQuestions(5);
    setCategory('auto');
    setError(null);
    setQuestions([]);
    setMetadata(null);
    setRawData(null);
    setIsFallback(false);
  };

  return (
    <div className={styles.aiQuestionLab}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Question Lab</h1>
          <p className={styles.subtitle}>
            Use AI to explore and generate survey questions before adding them to your templates.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.container}>
        {/* Form Section */}
        <div className={styles.formSection}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Generate Questions</h2>

            {/* Keyword Input */}
            <div className={styles.formGroup}>
              <label htmlFor="keyword" className={styles.label}>
                Keyword <span className={styles.required}>*</span>
              </label>
              <input
                id="keyword"
                type="text"
                placeholder="e.g. survey about IT students"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className={styles.input}
                disabled={loading}
              />
            </div>

            {/* Number of Questions */}
            <div className={styles.formGroup}>
              <label htmlFor="numQuestions" className={styles.label}>
                Number of questions
              </label>
              <select
                id="numQuestions"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                className={styles.select}
                disabled={loading}
              >
                <option value="3">3</option>
                <option value="5">5 (default)</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
            </div>

            {/* Category Select */}
            <div className={styles.formGroup}>
              <label htmlFor="category" className={styles.label}>
                Category (optional)
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={styles.select}
                disabled={loading}
              >
                <option value="auto">Auto-detect</option>
                <option value="it">IT</option>
                <option value="economics">Economics</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>

            {/* Buttons */}
            <div className={styles.buttonGroup}>
              <button
                onClick={handleGenerate}
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate with AI'}
              </button>
              <button
                onClick={handleClear}
                className={styles.secondaryButton}
                disabled={loading}
              >
                Clear
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Contacting AI service...</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className={styles.resultsSection}>
          {/* Error Alert */}
          {error && !loading && (
            <div className={styles.errorAlert}>
              <span className={styles.errorIcon}>⚠️</span>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}

          {/* Metadata Card */}
          {metadata && !loading && (
            <div className={styles.metadataCard}>
              <h3 className={styles.metadataTitle}>AI Analysis</h3>
              <div className={styles.metadataGrid}>
                {metadata.category && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Category</span>
                    <span className={styles.metadataValue}>{metadata.category}</span>
                  </div>
                )}
                {metadata.form_type && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Form Type</span>
                    <span className={styles.metadataValue}>{metadata.form_type}</span>
                  </div>
                )}
                {metadata.complexity && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Complexity</span>
                    <span className={styles.metadataValue}>{metadata.complexity}</span>
                  </div>
                )}
                {metadata.estimated_fields && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Estimated Fields</span>
                    <span className={styles.metadataValue}>{metadata.estimated_fields}</span>
                  </div>
                )}
                {metadata.estimated_time && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Estimated Time</span>
                    <span className={styles.metadataValue}>{metadata.estimated_time}</span>
                  </div>
                )}
              </div>
              {isFallback && (
                <p className={styles.fallbackNote}>
                  ℹ️ Questions were synthesized based on AI analysis (fallback mode)
                </p>
              )}
            </div>
          )}

          {/* Questions List */}
          {questions.length > 0 && !loading && (
            <div className={styles.questionsCard}>
              <h3 className={styles.questionsTitle}>
                Generated Questions ({questions.length})
              </h3>
              <div className={styles.questionsList}>
                {questions.map((question, index) => (
                  <div key={index} className={styles.questionItem}>
                    <div className={styles.questionHeader}>
                      <span className={styles.questionNumber}>{index + 1}</span>
                      <p className={styles.questionText}>{question.text}</p>
                      {question.type && (
                        <span className={styles.questionTypeBadge}>
                          {question.type}
                        </span>
                      )}
                    </div>
                    {question.options && question.options.length > 0 && (
                      <div className={styles.questionOptions}>
                        <ul className={styles.optionsList}>
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex} className={styles.optionItem}>
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {questions.length === 0 && !loading && !error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✨</div>
              <h3 className={styles.emptyTitle}>No questions generated yet</h3>
              <p className={styles.emptyText}>
                Enter a keyword and click "Generate with AI" to start exploring questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIQuestionLab;
