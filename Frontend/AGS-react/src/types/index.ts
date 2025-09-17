// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  student_id?: string;
  faculty?: string;
  class_name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher', 
  STUDENT = 'student'
}

// Survey Types
export interface Survey {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  status: SurveyStatus;
  isPublic: boolean;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  settings: SurveySettings;
}

export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export interface SurveySettings {
  allowAnonymous: boolean;
  requireLogin: boolean;
  showResults: boolean;
  collectEmail: boolean;
  maxResponses?: number;
  expiresAt?: Date;
}

// Question Types
export interface Question {
  id: string;
  surveyId: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  aiGenerated: boolean;
  aiContext?: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_CHOICE = 'single_choice',
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  DATE = 'date',
  RATING = 'rating',
  BOOLEAN = 'boolean'
}

export interface QuestionOption {
  id: string;
  text: string;
  value: string;
  order: number;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

// Response Types
export interface SurveyResponse {
  id: string;
  surveyId: string;
  responderId?: string;
  answers: Answer[];
  isComplete: boolean;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface Answer {
  questionId: string;
  value: string | string[] | number | boolean;
  textValue?: string;
}

// Analysis Types
export interface SurveyAnalysis {
  id: string;
  surveyId: string;
  totalResponses: number;
  completionRate: number;
  averageTime: number;
  sentimentAnalysis?: SentimentAnalysis;
  keyInsights: string[];
  questionAnalytics: QuestionAnalytics[];
  generatedAt: Date;
}

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  keywords: string[];
  themes: string[];
}

export interface QuestionAnalytics {
  questionId: string;
  responseCount: number;
  answers: AnswerAnalytics[];
  sentiment?: SentimentAnalysis;
}

export interface AnswerAnalytics {
  value: string;
  count: number;
  percentage: number;
}

// LLM Integration Types
export interface LLMRequest {
  prompt: string;
  context?: string;
  parameters?: LLMParameters;
}

export interface LLMParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface QuestionGenerationRequest {
  topic: string;
  domain: string; // IT, Marketing, Economics
  questionCount: number;
  questionTypes: QuestionType[];
  targetAudience?: string;
  context?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Dashboard Types
export interface DashboardStats {
  totalSurveys: number;
  totalResponses: number;
  activeUsers: number;
  completionRate: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'survey_created' | 'response_submitted' | 'analysis_generated';
  description: string;
  timestamp: Date;
  userId?: string;
  surveyId?: string;
}