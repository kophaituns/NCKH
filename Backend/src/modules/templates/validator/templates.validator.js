// src/modules/templates/validator/templates.validator.js
const { QuestionType } = require('../../../models');

/**
 * Question types that require options array
 */
const QUESTION_TYPES_WITH_OPTIONS = ['multiple_choice', 'multiple_select', 'dropdown', 'checkbox'];

/**
 * Question types that should NOT have options
 */
const QUESTION_TYPES_WITHOUT_OPTIONS = ['text', 'rating'];

/**
 * Question types that have predefined options
 */
const QUESTION_TYPES_WITH_PREDEFINED_OPTIONS = {
  'yes_no': ['Yes', 'No']
};

/**
 * Validate question data based on question type
 */
const validateQuestion = async (questionData) => {
  const { question_type_id, question_text, options, maxScore } = questionData;

  // Get question type name
  const questionType = await QuestionType.findByPk(question_type_id);
  if (!questionType) {
    throw new Error('Invalid question type');
  }

  const typeName = questionType.type_name;

  // Validate question text
  if (!question_text || typeof question_text !== 'string' || question_text.trim().length === 0) {
    throw new Error('Question text is required');
  }

  // Validate based on question type
  switch (typeName) {
    case 'text':
      // Text: no options needed
      if (options && Array.isArray(options) && options.length > 0) {
        throw new Error('Text questions should not have options');
      }
      break;

    case 'multiple_choice':
    case 'multiple_select':
    case 'dropdown':
      // These types require at least 2 options
      if (!options || !Array.isArray(options) || options.length < 2) {
        throw new Error(`${typeName} questions require at least 2 options`);
      }
      // Validate each option
      const validOptions = options.filter(opt => {
        if (typeof opt === 'string') {
          return opt.trim().length > 0;
        }
        if (opt && typeof opt === 'object') {
          const optionText = opt.option_text || opt.text || opt.label || opt.value;
          return optionText && typeof optionText === 'string' && optionText.trim().length > 0;
        }
        return false;
      });
      if (validOptions.length < 2) {
        throw new Error(`${typeName} questions require at least 2 valid options`);
      }
      break;

    case 'checkbox':
      // Checkbox: multiple checkboxes with options (similar to multiple_select)
      // In this system, checkbox is used as multiple selection with checkboxes
      if (!options || !Array.isArray(options) || options.length < 2) {
        throw new Error('Checkbox questions require at least 2 options');
      }
      // Validate each option
      const validCheckboxOptions = options.filter(opt => {
        if (typeof opt === 'string') {
          return opt.trim().length > 0;
        }
        if (opt && typeof opt === 'object') {
          const optionText = opt.option_text || opt.text || opt.label || opt.value;
          return optionText && typeof optionText === 'string' && optionText.trim().length > 0;
        }
        return false;
      });
      if (validCheckboxOptions.length < 2) {
        throw new Error('Checkbox questions require at least 2 valid options');
      }
      break;

    case 'rating':
      // Rating: requires maxScore, no options
      if (options && Array.isArray(options) && options.length > 0) {
        throw new Error('Rating questions should not have options. They use maxScore property instead.');
      }
      if (!maxScore || typeof maxScore !== 'number' || maxScore < 1) {
        throw new Error('Rating questions require maxScore property (default: 5)');
      }
      break;

    case 'yes_no':
      // Yes/No: predefined options ["Yes", "No"]
      // Options will be auto-generated, but if provided, validate them
      if (options && Array.isArray(options) && options.length > 0) {
        // Allow custom options but validate
        const validOptions = options.filter(opt => {
          if (typeof opt === 'string') {
            return opt.trim().length > 0;
          }
          if (opt && typeof opt === 'object') {
            const optionText = opt.option_text || opt.text || opt.label || opt.value;
            return optionText && typeof optionText === 'string' && optionText.trim().length > 0;
          }
          return false;
        });
        if (validOptions.length < 2) {
          throw new Error('Yes/No questions require at least 2 options');
        }
      }
      break;

    default:
      throw new Error(`Unknown question type: ${typeName}`);
  }

  return true;
};

/**
 * Normalize question data based on type
 */
const normalizeQuestionData = async (questionData) => {
  const { question_type_id, options, maxScore } = questionData;

  // Get question type name
  const questionType = await QuestionType.findByPk(question_type_id);
  if (!questionType) {
    throw new Error('Invalid question type');
  }

  const typeName = questionType.type_name;
  const normalized = { ...questionData };

  // Handle predefined options
  if (QUESTION_TYPES_WITH_PREDEFINED_OPTIONS[typeName]) {
    normalized.options = QUESTION_TYPES_WITH_PREDEFINED_OPTIONS[typeName];
  }

  // Handle rating maxScore default
  if (typeName === 'rating' && !maxScore) {
    normalized.maxScore = 5; // Default maxScore for rating
  }

  // Normalize options format
  if (normalized.options && Array.isArray(normalized.options)) {
    normalized.options = normalized.options.map((opt, index) => {
      if (typeof opt === 'string') {
        return {
          option_text: opt.trim(),
          display_order: index + 1
        };
      }
      if (opt && typeof opt === 'object') {
        return {
          option_text: (opt.option_text || opt.text || opt.label || opt.value || '').trim(),
          display_order: opt.display_order !== undefined ? opt.display_order : index + 1
        };
      }
      return null;
    }).filter(opt => opt && opt.option_text.length > 0);
  }

  return normalized;
};

module.exports = {
  validateQuestion,
  normalizeQuestionData,
  QUESTION_TYPES_WITH_OPTIONS,
  QUESTION_TYPES_WITHOUT_OPTIONS,
  QUESTION_TYPES_WITH_PREDEFINED_OPTIONS
};

