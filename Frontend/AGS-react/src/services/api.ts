import axios, { AxiosResponse, AxiosError } from 'axios';
import { 
  User, 
  Survey, 
  SurveyResponse, 
  SurveyAnalysis,
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  PaginatedResponse,
  QuestionGenerationRequest,
  LLMRequest,
  LLMResponse,
  DashboardStats
} from '../types';

// API base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }
};

// Survey API
export const surveyAPI = {
  // Get all surveys
  getSurveys: async (page = 1, limit = 10): Promise<PaginatedResponse<Survey>> => {
    const response = await api.get<PaginatedResponse<Survey>>(`/surveys?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get survey by ID
  getSurvey: async (id: string): Promise<Survey> => {
    const response = await api.get<Survey>(`/surveys/${id}`);
    return response.data;
  },

  // Create new survey
  createSurvey: async (survey: Partial<Survey>): Promise<Survey> => {
    const response = await api.post<Survey>('/surveys', survey);
    return response.data;
  },

  // Update survey
  updateSurvey: async (id: string, survey: Partial<Survey>): Promise<Survey> => {
    const response = await api.put<Survey>(`/surveys/${id}`, survey);
    return response.data;
  },

  // Delete survey
  deleteSurvey: async (id: string): Promise<void> => {
    await api.delete(`/surveys/${id}`);
  },

  // Get surveys by creator
  getSurveysByCreator: async (creatorId: string): Promise<Survey[]> => {
    const response = await api.get<Survey[]>(`/surveys/creator/${creatorId}`);
    return response.data;
  },

  // Publish survey
  publishSurvey: async (id: string): Promise<Survey> => {
    const response = await api.patch<Survey>(`/surveys/${id}/publish`);
    return response.data;
  },

  // Pause survey
  pauseSurvey: async (id: string): Promise<Survey> => {
    const response = await api.patch<Survey>(`/surveys/${id}/pause`);
    return response.data;
  }
};

// Response API
export const responseAPI = {
  // Submit survey response
  submitResponse: async (response: Partial<SurveyResponse>): Promise<SurveyResponse> => {
    const result = await api.post<SurveyResponse>('/responses', response);
    return result.data;
  },

  // Get responses for a survey
  getSurveyResponses: async (surveyId: string): Promise<SurveyResponse[]> => {
    const response = await api.get<SurveyResponse[]>(`/responses/survey/${surveyId}`);
    return response.data;
  },

  // Get response by ID
  getResponse: async (id: string): Promise<SurveyResponse> => {
    const response = await api.get<SurveyResponse>(`/responses/${id}`);
    return response.data;
  },

  // Delete response
  deleteResponse: async (id: string): Promise<void> => {
    await api.delete(`/responses/${id}`);
  }
};

// LLM API
export const llmAPI = {
  // Generate survey questions
  generateQuestions: async (request: QuestionGenerationRequest): Promise<any[]> => {
    const response = await api.post<any[]>('/llm/generate-questions', request);
    return response.data;
  },

  // Analyze survey responses
  analyzeResponses: async (surveyId: string): Promise<SurveyAnalysis> => {
    const response = await api.post<SurveyAnalysis>(`/llm/analyze/${surveyId}`);
    return response.data;
  },

  // Chat with LLM
  chatWithLLM: async (request: LLMRequest): Promise<LLMResponse> => {
    const response = await api.post<LLMResponse>('/llm/chat', request);
    return response.data;
  },

  // Improve survey questions
  improveSurvey: async (surveyId: string, context?: string): Promise<any> => {
    const response = await api.post(`/llm/improve-survey/${surveyId}`, { context });
    return response.data;
  },

  // Generate survey summary
  generateSummary: async (surveyId: string): Promise<string> => {
    const response = await api.post<{ summary: string }>(`/llm/summarize/${surveyId}`);
    return response.data.summary;
  }
};

// Analysis API
export const analysisAPI = {
  // Get survey analysis
  getSurveyAnalysis: async (surveyId: string): Promise<SurveyAnalysis> => {
    const response = await api.get<SurveyAnalysis>(`/analysis/${surveyId}`);
    return response.data;
  },

  // Generate analysis report
  generateReport: async (surveyId: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
    const response = await api.get(`/analysis/${surveyId}/report?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/analysis/dashboard');
    return response.data;
  }
};

// User API
export const userAPI = {
  // Get all users (Admin only)
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  // Get user by ID
  getUser: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Change user role (Admin only)
  changeUserRole: async (id: string, role: string): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/role`, { role });
    return response.data;
  }
};

// Export default api instance for custom requests
export default api;