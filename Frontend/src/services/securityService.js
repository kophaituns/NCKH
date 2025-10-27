// Simple security service
export const securityService = {
  sanitizeInput: (input) => {
    if (!input) return '';
    return String(input).trim();
  },
  validateToken: (token) => token && token.length > 0
};
export default securityService;
