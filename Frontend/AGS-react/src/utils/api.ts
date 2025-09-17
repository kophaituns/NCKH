// API configuration and helper functions
const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Create API request configuration with auth headers
interface ApiRequestConfig extends RequestInit {
  headers?: Record<string, string>;
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
export const apiRequest = async <T>(
  endpoint: string,
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
      return {} as T;
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
  getAll: () => apiRequest<any[]>('/surveys'),
  
  // Get survey by ID
  getById: (id: string) => apiRequest<any>(`/surveys/${id}`),
  
  // Create new survey
  create: (surveyData: any) => 
    apiRequest<any>('/surveys', {
      method: 'POST',
      body: JSON.stringify(surveyData),
    }),
  
  // Update survey
  update: (id: string, surveyData: any) =>
    apiRequest<any>(`/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(surveyData),
    }),
  
  // Delete survey
  delete: (id: string) =>
    apiRequest<void>(`/surveys/${id}`, {
      method: 'DELETE',
    }),
  
  // Get survey responses
  getResponses: (id: string) => 
    apiRequest<any[]>(`/surveys/${id}/responses`),
};

// User API
export const userApi = {
  // Get all users (admin only)
  getAll: () => apiRequest<any[]>('/users'),
  
  // Get user by ID
  getById: (id: string) => apiRequest<any>(`/users/${id}`),
  
  // Update user
  update: (id: string, userData: any) =>
    apiRequest<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  // Delete user
  delete: (id: string) =>
    apiRequest<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
  
  // Get current user profile
  getProfile: () => apiRequest<any>('/users/profile'),
  
  // Update current user profile
  updateProfile: (userData: any) =>
    apiRequest<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
};

// Response API
export const responseApi = {
  // Submit survey response
  submit: (surveyId: string, responseData: any) =>
    apiRequest<any>('/responses', {
      method: 'POST',
      body: JSON.stringify({
        surveyId,
        ...responseData,
      }),
    }),
  
  // Get user's responses
  getUserResponses: () => apiRequest<any[]>('/responses/user'),
  
  // Get response by ID
  getById: (id: string) => apiRequest<any>(`/responses/${id}`),
  
  // Update response
  update: (id: string, responseData: any) =>
    apiRequest<any>(`/responses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(responseData),
    }),
  
  // Delete response
  delete: (id: string) =>
    apiRequest<void>(`/responses/${id}`, {
      method: 'DELETE',
    }),
};

// Analytics API
export const analyticsApi = {
  // Get survey analytics
  getSurveyAnalytics: (surveyId: string) =>
    apiRequest<any>(`/analytics/surveys/${surveyId}`),
  
  // Get user analytics
  getUserAnalytics: () => apiRequest<any>('/analytics/user'),
  
  // Get system analytics (admin only)
  getSystemAnalytics: () => apiRequest<any>('/analytics/system'),
};

// Template API
export const templateApi = {
  // Get all templates
  getAll: () => apiRequest<any[]>('/templates'),
  
  // Get template by ID
  getById: (id: string) => apiRequest<any>(`/templates/${id}`),
  
  // Create new template
  create: (templateData: any) =>
    apiRequest<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    }),
  
  // Update template
  update: (id: string, templateData: any) =>
    apiRequest<any>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    }),
  
  // Delete template
  delete: (id: string) =>
    apiRequest<void>(`/templates/${id}`, {
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