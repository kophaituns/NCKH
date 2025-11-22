// Frontend/src/utils/questionTypeMap.js

/**
 * Map question type names to their database IDs
 * These should correspond to entries in the question_types table
 */
export const QUESTION_TYPE_MAP = {
  multiple_choice: 1,
  checkbox: 2,
  likert_scale: 3,
  open_ended: 4,
  dropdown: 5,
};

/**
 * Reverse map from IDs to type names
 */
export const QUESTION_TYPE_ID_MAP = {
  1: 'multiple_choice',
  2: 'checkbox',
  3: 'likert_scale',
  4: 'open_ended',
  5: 'dropdown',
};

/**
 * Get type ID from type name
 */
export const getTypeId = (typeName) => {
  return QUESTION_TYPE_MAP[typeName] || 1;
};

/**
 * Get type name from type ID
 */
export const getTypeName = (typeId) => {
  return QUESTION_TYPE_ID_MAP[typeId] || 'multiple_choice';
};
