/**
 * AI Input Validation Utilities
 * Validates and sanitizes user input for AI Generator features
 */

// ============================================================================
// VALIDATION PATTERNS & CONSTANTS
// ============================================================================

// Regex patterns for invalid input detection
const VALIDATION_PATTERNS = {
  // Only special characters (no letters/numbers)
  onlySpecialChars: /^[\W_]+$/,
  
  // Only numbers
  onlyNumbers: /^\d+$/,
  
  // Repeated characters (4+ same chars)
  repeatedChars: /(.)\1{3,}/,
  
  // Test/garbage patterns
  garbagePatterns: /^(test|asdf|qwerty|abc|xyz|aaa|bbb|123|111|sdf|ddd|fff|ggg)\s*\d*$/i,
  
  // Excessive special characters (more than 50%)
  excessiveSpecialChars: /^[^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]*$/,
  
  // Single repeated word spam
  wordSpam: /^(\w+)(\s+\1){2,}$/i,
};

// Minimum requirements
const MIN_KEYWORD_LENGTH = 3;
const MAX_KEYWORD_LENGTH = 200;
const MIN_ALPHABETIC_CHARS = 2;

// Vietnamese and English stop words (không có nghĩa riêng)
const STOP_WORDS = new Set([
  // English
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'or', 'and',
  // Vietnamese
  'và', 'hoặc', 'hay', 'nhưng', 'mà', 'thì', 'là', 'của', 'cho', 'với',
  'trong', 'ngoài', 'trên', 'dưới', 'bên', 'cạnh', 'về', 'tới', 'đến',
  'từ', 'khi', 'nếu', 'thế', 'như', 'vậy', 'được', 'bị', 'làm', 'có',
  'không', 'chưa', 'đã', 'sẽ', 'đang', 'rất', 'lắm', 'quá', 'hơn'
]);

// Known meaningful domain keywords for quick validation
const DOMAIN_KEYWORDS = [
  'marketing', 'sale', 'sales', 'it', 'technology', 'software', 'hardware',
  'business', 'finance', 'economics', 'investment', 'stock', 'crypto',
  'ai', 'machine learning', 'data', 'analytics', 'cloud', 'digital',
  'seo', 'social media', 'advertising', 'branding', 'campaign',
  'product', 'service', 'customer', 'client', 'user', 'market', 'strategy',
  'python', 'javascript', 'java', 'react', 'nodejs', 'database', 'api',
  'security', 'network', 'system', 'server', 'devops', 'education',
  // Vietnamese
  'phần mềm', 'công nghệ', 'kinh doanh', 'tiếp thị', 'bán hàng', 'đầu tư',
  'khách hàng', 'sản phẩm', 'dịch vụ', 'thị trường', 'chiến lược',
  'giáo dục', 'đào tạo', 'nghiên cứu', 'phát triển', 'quản lý'
];

// ============================================================================
// VALIDATION RESULT CLASS
// ============================================================================

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the input is valid
 * @property {string} errorType - Type of error (if invalid)
 * @property {string} errorMessage - User-friendly error message (Vietnamese)
 * @property {string} cleanedInput - Sanitized input
 * @property {string[]} suggestions - Suggested improvements
 */

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate AI input keyword/topic
 * @param {string} input - The user input to validate
 * @returns {ValidationResult}
 */
export function validateAIInput(input) {
  // Default result
  const result = {
    isValid: false,
    errorType: null,
    errorMessage: '',
    cleanedInput: '',
    suggestions: []
  };

  // 1. Check empty/null
  if (!input || typeof input !== 'string') {
    result.errorType = 'EMPTY_INPUT';
    result.errorMessage = 'Vui lòng nhập từ khóa hoặc chủ đề';
    return result;
  }

  // 2. Sanitize and trim
  const cleaned = sanitizeInput(input);
  result.cleanedInput = cleaned;

  // 3. Check minimum length
  if (cleaned.length < MIN_KEYWORD_LENGTH) {
    result.errorType = 'TOO_SHORT';
    result.errorMessage = `Từ khóa quá ngắn (tối thiểu ${MIN_KEYWORD_LENGTH} ký tự)`;
    result.suggestions = ['Hãy nhập từ khóa chi tiết hơn', 'Ví dụ: "Chất lượng dịch vụ khách hàng"'];
    return result;
  }

  // 4. Check maximum length
  if (cleaned.length > MAX_KEYWORD_LENGTH) {
    result.errorType = 'TOO_LONG';
    result.errorMessage = `Từ khóa quá dài (tối đa ${MAX_KEYWORD_LENGTH} ký tự)`;
    return result;
  }

  // 5. Check only special characters
  if (VALIDATION_PATTERNS.onlySpecialChars.test(cleaned)) {
    result.errorType = 'INVALID_CHARS';
    result.errorMessage = 'Từ khóa chứa ký tự không hợp lệ. Vui lòng sử dụng chữ cái hoặc con số.';
    result.suggestions = ['Tránh sử dụng các ký tự đặc biệt như @, #, !, $, %'];
    return result;
  }

  // 6. Check only numbers
  if (VALIDATION_PATTERNS.onlyNumbers.test(cleaned)) {
    result.errorType = 'ONLY_NUMBERS';
    result.errorMessage = 'Từ khóa không thể chỉ chứa số. Vui lòng thêm mô tả.';
    result.suggestions = ['Ví dụ: "Phân tích năm 2024" thay vì "2024"'];
    return result;
  }

  // 7. Check garbage patterns
  if (VALIDATION_PATTERNS.garbagePatterns.test(cleaned)) {
    result.errorType = 'GARBAGE_INPUT';
    result.errorMessage = 'Từ khóa không có nghĩa. Vui lòng nhập chủ đề thực sự.';
    result.suggestions = ['Ví dụ: "Machine Learning", "Digital Marketing", "Bán hàng online"'];
    return result;
  }

  // 8. Check repeated characters
  if (VALIDATION_PATTERNS.repeatedChars.test(cleaned)) {
    result.errorType = 'SPAM_PATTERN';
    result.errorMessage = 'Từ khóa có dấu hiệu spam. Vui lòng nhập nội dung có nghĩa.';
    return result;
  }

  // 9. Check word spam
  if (VALIDATION_PATTERNS.wordSpam.test(cleaned)) {
    result.errorType = 'WORD_SPAM';
    result.errorMessage = 'Từ khóa lặp lại không tự nhiên. Vui lòng nhập chủ đề cụ thể.';
    return result;
  }

  // 10. Check minimum alphabetic characters
  const alphaCount = (cleaned.match(/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/g) || []).length;
  if (alphaCount < MIN_ALPHABETIC_CHARS) {
    result.errorType = 'INSUFFICIENT_ALPHA';
    result.errorMessage = 'Từ khóa phải chứa ít nhất 2 chữ cái.';
    return result;
  }

  // 11. Check if has at least one meaningful word (not just stop words)
  const words = cleaned.toLowerCase().split(/\s+/);
  const meaningfulWords = words.filter(w => w.length >= 2 && !STOP_WORDS.has(w));
  
  if (meaningfulWords.length === 0) {
    result.errorType = 'NO_MEANINGFUL_WORDS';
    result.errorMessage = 'Từ khóa phải chứa ít nhất một từ có nghĩa.';
    result.suggestions = ['Thêm danh từ hoặc động từ mô tả chủ đề của bạn'];
    return result;
  }

  // 12. Check excessive special characters ratio
  const specialCharCount = (cleaned.match(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g) || []).length;
  if (cleaned.length > 0 && specialCharCount / cleaned.length > 0.3) {
    result.errorType = 'EXCESSIVE_SPECIAL_CHARS';
    result.errorMessage = 'Từ khóa chứa quá nhiều ký tự đặc biệt.';
    return result;
  }

  // All checks passed
  result.isValid = true;
  result.errorType = null;
  result.errorMessage = '';
  
  return result;
}

// ============================================================================
// SANITIZATION FUNCTION
// ============================================================================

/**
 * Sanitize input by removing dangerous characters and normalizing
 * @param {string} input - Raw user input
 * @returns {string} - Cleaned input
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Trim whitespace
    .trim()
    // Remove control characters
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove potential XSS/injection patterns
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Limit consecutive special characters
    .replace(/([!@#$%^&*()_+=[\]{}|\\:";'<>?,./`~-]){3,}/g, '$1$1');
}

// ============================================================================
// CATEGORY VALIDATION
// ============================================================================

/**
 * Check if category prediction result is valid for generating questions
 * @param {string} category - Predicted category
 * @param {number} confidence - Confidence score (0-1 or 0-100)
 * @returns {Object} - Validation result
 */
export function validateCategoryResult(category, confidence) {
  // Normalize confidence to 0-1 scale
  const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;
  
  // Categories that indicate keyword is not in training data
  const invalidCategories = ['unknown', 'n/a', 'none', 'null', '', 'undefined', 'other', 'nan'];
  const categoryLower = category ? category.toLowerCase().trim() : '';
  const isInvalidCategory = !category || invalidCategories.includes(categoryLower);
  
  // Also check if confidence is 0 (which means unknown keyword)
  const isLowConfidence = normalizedConfidence < 0.5;
  const isZeroConfidence = normalizedConfidence === 0 || normalizedConfidence < 0.01;

  // Build helpful warning message
  let warningMessage = null;
  if (isInvalidCategory || isZeroConfidence) {
    warningMessage = 'This keyword is not available in our AI training data. Our model is trained on IT, Economics, and Marketing topics. Try keywords like: "machine learning", "digital marketing", "financial analysis"';
  } else if (isLowConfidence) {
    warningMessage = `Low confidence (${Math.round(normalizedConfidence * 100)}%). The keyword may not be well-represented in our training data. Results may vary in quality.`;
  }

  return {
    isValid: !isInvalidCategory && !isLowConfidence && !isZeroConfidence,
    isUnknownCategory: isInvalidCategory || isZeroConfidence,
    isLowConfidence: isLowConfidence,
    category: category,
    confidence: normalizedConfidence,
    canGenerate: !isInvalidCategory && !isZeroConfidence,
    warningMessage: warningMessage
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if input contains any domain-specific keywords
 * @param {string} input - User input
 * @returns {boolean}
 */
export function hasDomainKeywords(input) {
  if (!input) return false;
  const lowerInput = input.toLowerCase();
  return DOMAIN_KEYWORDS.some(keyword => lowerInput.includes(keyword));
}

/**
 * Get dynamic placeholder based on context
 * @param {string} category - Current selected/predicted category
 * @returns {string} - Placeholder text
 */
export function getDynamicPlaceholder(category) {
  const placeholders = {
    it: 'Ví dụ: "Machine Learning trends 2024", "Cloud Security best practices"...',
    marketing: 'Ví dụ: "Social Media ROI", "Customer engagement strategies"...',
    sale: 'Ví dụ: "B2B sales techniques", "Customer retention methods"...',
    sales: 'Ví dụ: "Chiến lược bán hàng online", "Chăm sóc khách hàng"...',
    economics: 'Ví dụ: "Investment portfolio", "Market analysis 2024"...',
    education: 'Ví dụ: "E-learning effectiveness", "Student engagement"...',
    general: 'Ví dụ: "Customer satisfaction", "Workplace productivity"...',
    default: 'Nhập từ khóa thuộc lĩnh vực: IT, Marketing, Sale, hoặc Giáo dục...'
  };

  return placeholders[category?.toLowerCase()] || placeholders.default;
}

/**
 * Get suggestion examples for the guidance modal
 * @returns {Object[]} - Array of category examples
 */
export function getCategoryExamples() {
  return [
    {
      category: 'IT / Công nghệ',
      examples: ['Machine Learning', 'Cloud Computing', 'Cybersecurity', 'DevOps practices']
    },
    {
      category: 'Marketing',
      examples: ['Digital Marketing', 'Brand awareness', 'SEO strategies', 'Content marketing']
    },
    {
      category: 'Sale / Bán hàng',
      examples: ['Customer retention', 'Sales funnel', 'B2B selling', 'CRM effectiveness']
    },
    {
      category: 'Giáo dục',
      examples: ['Online learning', 'Student engagement', 'Teaching methods', 'Curriculum design']
    }
  ];
}

const aiInputValidation = {
  validateAIInput,
  sanitizeInput,
  validateCategoryResult,
  hasDomainKeywords,
  getDynamicPlaceholder,
  getCategoryExamples
};

export default aiInputValidation;
