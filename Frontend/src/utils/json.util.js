// src/utils/json.util.js - Safe JSON parsing utilities

/**
 * Safely parse JSON string, return default value if parsing fails
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed object or default value
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  if (typeof jsonString !== 'string' || jsonString.trim() === '') {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parsing failed:', error.message, 'String:', jsonString);
    return defaultValue;
  }
}

/**
 * Safely stringify object, return empty string if stringifying fails
 * @param {any} obj - Object to stringify
 * @param {string} defaultValue - Default value if stringifying fails
 * @returns {string} JSON string or default value
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('JSON stringifying failed:', error.message, 'Object:', obj);
    return defaultValue;
  }
}

/**
 * Check if string is valid JSON
 * @param {string} jsonString - String to check
 * @returns {boolean} True if valid JSON
 */
export function isValidJson(jsonString) {
  if (typeof jsonString !== 'string' || jsonString.trim() === '') {
    return false;
  }

  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON with error handling and logging
 * @param {string} jsonString - JSON string to parse
 * @param {string} context - Context for error logging
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed object or default value
 */
export function parseJsonWithContext(jsonString, context = 'Unknown', defaultValue = null) {
  try {
    if (typeof jsonString !== 'string' || jsonString.trim() === '') {
      console.warn(`[${context}] Empty or invalid JSON string provided`);
      return defaultValue;
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`[${context}] JSON parsing failed:`, {
      error: error.message,
      jsonString: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''),
      context
    });
    return defaultValue;
  }
}

export default {
  safeJsonParse,
  safeJsonStringify,
  isValidJson,
  parseJsonWithContext
};