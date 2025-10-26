// API configuration and helper functions
const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Create API request configuration with auth headers
interface ApiRequestConfig extends RequestInit {
  headers: Record<string, string>;
}

const createApiConfig = (config: ApiRequestConfig = {}): RequestInit => {
  const token = getAuthToken();
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }
  
  return {
    ...config,
    headers: {
      ...baseHeaders,
      ...config.headers,
    },
  };
};

// Generic API request function
export const apiRequest = async (
  endpoint,
  config: ApiRequestConfig = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const requestConfig = createApiConfig(config);

  try {
    const response = await fetch(url, requestConfig);
    
    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      
      // Try to parse error message from response
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response isn't JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Handle empty response (204 No Content)
    if (response.status === 204) {
      return {};
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};

// Specific API functions for different endpoints

// Survey API
export const surveyApi = {
  // Get all surveys
  getAll: () => apiRequest('/surveys'),
  
  // Get survey by ID
  getById: (id) => apiRequest(`/surveys/${id}`),
  
  // Create new survey
  create: (surveyData) => 
    apiRequest('/surveys', {
      method: 'POST',
      body: JSON.stringify(surveyData),
    }),
  
  // Update survey
  update: (id, surveyData) =>
    apiRequest(`/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(surveyData),
    }),
  
  // Delete survey
  delete: (id) =>
    apiRequest(`/surveys/${id}`, {
      method: 'DELETE',
    }),
  
  // Get survey responses
  getResponses: (id) => 
    apiRequest(`/surveys/${id}/responses`),
};

// User API
export const userApi = {
  // Get all users (admin only)
  getAll: () => apiRequest('/users'),
  
  // Get user by ID
  getById: (id) => apiRequest(`/users/${id}`),
  
  // Update user
  update: (id, userData) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  // Delete user
  delete: (id) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
  
  // Get current user profile
  getProfile: () => apiRequest('/users/profile'),
  
  // Update current user profile
  updateProfile: (userData) =>
    apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
};

// Response API
export const responseApi = {
  // Submit survey response
  submit: (surveyId, responseData) =>
    apiRequest('/responses', {
      method: 'POST',
      body: JSON.stringify({
        surveyId,
        ...responseData,
      }),
    }),
  
  // Get user's responses
  getUserResponses: () => apiRequest('/responses/user'),
  
  // Get response by ID
  getById: (id) => apiRequest(`/responses/${id}`),
  
  // Update response
  update: (id, responseData) =>
    apiRequest(`/responses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(responseData),
    }),
  
  // Delete response
  delete: (id) =>
    apiRequest(`/responses/${id}`, {
      method: 'DELETE',
    }),
};

// Analytics API
export const analyticsApi = {
  // Get survey analytics
  getSurveyAnalytics: (surveyId) =>
    apiRequest(`/analytics/surveys/${surveyId}`),
  
  // Get user analytics
  getUserAnalytics: () => apiRequest('/analytics/user'),
  
  // Get system analytics (admin only)
  getSystemAnalytics: () => apiRequest('/analytics/system'),
};

// Template API
export const templateApi = {
  // Get all templates
  getAll: () => apiRequest('/templates'),
  
  // Get template by ID
  getById: (id) => apiRequest(`/templates/${id}`),
  
  // Create new template
  create: (templateData) =>
    apiRequest('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    }),
  
  // Update template
  update: (id, templateData) =>
    apiRequest(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    }),
  
  // Delete template
  delete: (id) =>
    apiRequest(`/templates/${id}`, {
      method: 'DELETE',
    }),
};

// API exports for easy importing
const api = {
  surveyApi,
  userApi,
  responseApi,
  analyticsApi,
  templateApi,
};

export default api;