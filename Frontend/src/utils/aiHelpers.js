/**
 * AI Generator Utility Functions
 * Helper functions for AI question generation features
 */

/**
 * Format confidence as percentage string
 * @param {number} confidence - Confidence value (0-1)
 * @returns {string} Formatted percentage (e.g., "99.99%")
 */
export const formatConfidence = (confidence) => {
  if (typeof confidence !== 'number' || isNaN(confidence)) {
    return 'N/A';
  }
  return `${(confidence * 100).toFixed(2)}%`;
};

/**
 * Get CSS class based on confidence level
 * @param {number} confidence - Confidence value (0-1)
 * @returns {string} CSS class name
 */
export const getConfidenceClass = (confidence) => {
  if (confidence >= 0.9) return 'confidence-high';
  if (confidence >= 0.7) return 'confidence-medium';
  return 'confidence-low';
};

/**
 * Get confidence color for styling
 * @param {number} confidence - Confidence value (0-1)
 * @returns {string} Color hex code
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.9) return '#22c55e'; // Green
  if (confidence >= 0.7) return '#f59e0b'; // Orange
  return '#ef4444'; // Red
};

/**
 * Get human-readable question type name
 * @param {string} type - Question type key
 * @returns {string} Human-readable name
 */
export const getQuestionTypeName = (type) => {
  const names = {
    open_ended: 'Open Ended',
    single_choice: 'Single Choice',
    multiple_choice: 'Multiple Choice',
    rating: 'Rating Scale',
    likert: 'Likert Scale',
    dropdown: 'Dropdown',
    text: 'Short Text',
    number: 'Number',
    matrix: 'Matrix'
  };
  return names[type] || type || 'Unknown';
};

/**
 * Get icon for question type
 * @param {string} type - Question type key
 * @returns {string} Emoji icon
 */
export const getQuestionTypeIcon = (type) => {
  const icons = {
    open_ended: '📝',
    single_choice: '⭕',
    multiple_choice: '☑️',
    rating: '⭐',
    likert: '📊',
    dropdown: '🔽',
    text: '✏️',
    number: '🔢',
    matrix: '📋'
  };
  return icons[type] || '❓';
};

/**
 * Get form type description
 * @param {string} formType - Form type key
 * @returns {string} Description
 */
export const getFormTypeDescription = (formType) => {
  const descriptions = {
    registration: 'Best for user signup and registration flows',
    application: 'Best for job applications, scholarship forms',
    assessment: 'Best for quizzes, tests, and evaluations',
    survey: 'Best for feedback collection and research'
  };
  return descriptions[formType] || '';
};

/**
 * Get icon for form type
 * @param {string} formType - Form type key
 * @returns {string} Emoji icon
 */
export const getFormTypeIcon = (formType) => {
  const icons = {
    registration: '📋',
    application: '📄',
    assessment: '📝',
    survey: '📊'
  };
  return icons[formType] || '📄';
};

/**
 * Format category with confidence
 * @param {string} category - Category name
 * @param {number} confidence - Confidence value (0-1)
 * @returns {string} Formatted string (e.g., "IT (99.99%)")
 */
export const formatCategoryWithConfidence = (category, confidence) => {
  return `${category} (${formatConfidence(confidence)})`;
};

/**
 * Check if more questions are available for regeneration
 * @param {Object} metadata - Response metadata
 * @returns {boolean} True if can regenerate
 */
export const canRegenerate = (metadata) => {
  return metadata?.can_regenerate || false;
};

/**
 * Calculate next offset for regeneration
 * @param {number} currentOffset - Current offset
 * @param {number} count - Number of questions per batch
 * @returns {number} Next offset
 */
export const getNextOffset = (currentOffset = 0, count = 5) => {
  return currentOffset + count;
};

/**
 * Format generation method for display
 * @param {string} method - Method key
 * @returns {string} Human-readable method
 */
export const formatGenerationMethod = (method) => {
  const methods = {
    keyword_direct: 'Direct Match',
    keyword_similar: 'Similar Match',
    category_adaptation: 'Category Adapted',
    random_sample: 'Random Sample'
  };
  return methods[method] || method || 'Unknown';
};

/**
 * Format similarity score as percentage
 * @param {number} score - Similarity score (0-1)
 * @returns {string} Formatted percentage (e.g., "95%")
 */
export const formatSimilarityScore = (score) => {
  if (typeof score !== 'number' || isNaN(score)) {
    return null;
  }
  return `${(score * 100).toFixed(0)}%`;
};

