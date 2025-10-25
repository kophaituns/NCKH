import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { TokenService } from '../services/tokenService';

// Auth State
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
}

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'REFRESH_TOKEN_START' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { token: string; refreshToken: string } }
  | { type: 'REFRESH_TOKEN_FAILURE' };

// Initial state
const initialState: AuthState = {
  user: null,
  token: TokenService.getStoredTokensSync()?.accessToken || null,
  refreshToken: TokenService.getStoredTokensSync()?.refreshToken || null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isRefreshing: false
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isRefreshing: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'REFRESH_TOKEN_START':
      return {
        ...state,
        isRefreshing: true,
      };
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isRefreshing: false,
      };
    case 'REFRESH_TOKEN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isRefreshing: false,
      };
    default:
      return state;
  }
};

// Auth Context
interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, full_name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Refresh token function
  const refreshAuthToken = async (): Promise<void> => {
    dispatch({ type: 'REFRESH_TOKEN_START' });
    try {
      const refreshToken = state.refreshToken;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      TokenService.saveTokens(data.token, data.refreshToken);

      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: {
          token: data.token,
          refreshToken: data.refreshToken,
        },
      });
    } catch (error) {
      dispatch({ type: 'REFRESH_TOKEN_FAILURE' });
      logout();
    }
  };

  // Token expiration check
  useEffect(() => {
    if (state.token) {
      try {
        const tokenData = JSON.parse(atob(state.token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        if (timeUntilExpiry <= 0) {
          // Token has expired
          refreshAuthToken();
        } else {
          // Set up refresh before token expires
          const refreshTime = timeUntilExpiry - 60000; // Refresh 1 minute before expiry
          const refreshTimer = setTimeout(() => {
            refreshAuthToken();
          }, refreshTime);

          return () => clearTimeout(refreshTimer);
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.token]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }

      // Real API call to backend
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Invalid email or password format');
          case 401:
            throw new Error('Invalid credentials. Please check your email and password');
          case 429:
            throw new Error('Too many login attempts. Please try again later');
          case 503:
            throw new Error('Service is temporarily unavailable. Please try again later');
          default:
            throw new Error(errorData.message || 'Login failed. Please try again');
        }
      }

      const data = await response.json();
      const user: User = {
        id: data.user.id.toString(),
        username: data.user.username,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role as UserRole,
        student_id: data.user.student_id,
        faculty: data.user.faculty,
        class_name: data.user.class_name,
        createdAt: new Date(data.user.created_at || data.user.createdAt),
        updatedAt: new Date(data.user.updated_at || data.user.updatedAt),
      };

      TokenService.saveTokens(data.token, data.refreshToken);
      TokenService.saveUser(user);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { 
          user, 
          token: data.token,
          refreshToken: data.refreshToken
        },
      });
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  };

  // Register function
  const register = async (
    username: string,
    email: string,
    password: string,
    full_name: string,
    role: UserRole
  ): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      // Real API call to backend
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, full_name, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      const user: User = {
        id: data.user.id.toString(),
        username: data.user.username,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role as UserRole,
        student_id: data.user.student_id,
        faculty: data.user.faculty,
        class_name: data.user.class_name,
        createdAt: new Date(data.user.created_at || data.user.createdAt),
        updatedAt: new Date(data.user.updated_at || data.user.updatedAt),
      };

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token: data.token, refreshToken: data.refreshToken },
      });
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration failed',
      });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    TokenService.clearAll();
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Initialize auth state from localStorage
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const tokens = TokenService.getStoredTokensSync();
        
        if (tokens && userStr) {
          const user: User = JSON.parse(userStr);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { 
              user,
              token: tokens.accessToken,
              refreshToken: tokens.refreshToken
            },
          });
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        TokenService.clearAll();
      }
    }
  }, []);

  const value: AuthContextType = {
    state,
    dispatch,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};