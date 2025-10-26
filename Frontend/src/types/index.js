// User Types
export 

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher', 
  STUDENT = 'student'
}

// Survey Types
export 

export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export 

// Question Types
export 

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

export 

export 

// Response Types
export 

export 

// Analysis Types
export 

export 

export 

export 

// LLM Integration Types
export 

export 

export ;
}

export 

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Authentication Types
export 

export 

export 

// Dashboard Types
export 

export 