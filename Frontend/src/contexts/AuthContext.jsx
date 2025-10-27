import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TokenService } from '../services/tokenService.js';

// Initial state
const initialState = {
  user: null,
  token: TokenService.getStoredTokensSync()?.accessToken || null,
  refreshToken: TokenService.getStoredTokensSync()?.refreshToken || null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isRefreshing: false
};

// Auth reducer
const authReducer = (state, action) => {
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
const AuthContext = createContext(undefined);

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Refresh token function
  const refreshAuthToken = async () => {
    dispatch({ type: 'REFRESH_TOKEN_START' });
    try {
      const refreshToken = state.refreshToken;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
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
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
      
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
      const userObj = {
        id: data.user.id.toString(),
        username: data.user.username,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role,
        student_id: data.user.student_id,
        faculty: data.user.faculty,
        class_name: data.user.class_name,
        createdAt: new Date(data.user.created_at || data.user.createdAt),
        updatedAt: new Date(data.user.updated_at || data.user.updatedAt),
      };

      TokenService.saveTokens(data.token, data.refreshToken);
      TokenService.saveUser(userObj);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { 
          user: userObj, 
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
    username,
    email,
    password,
    full_name,
    role
  ) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
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
      const userObj = {
        id: data.user.id.toString(),
        username: data.user.username,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role,
        student_id: data.user.student_id,
        faculty: data.user.faculty,
        class_name: data.user.class_name,
        createdAt: new Date(data.user.created_at || data.user.createdAt),
        updatedAt: new Date(data.user.updated_at || data.user.updatedAt),
      };

      TokenService.saveTokens(data.token, data.refreshToken);
      TokenService.saveUser(userObj);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userObj, token: data.token, refreshToken: data.refreshToken },
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
  const logout = () => {
    TokenService.clearAll();
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function
  const clearError = () => {
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
          const userObj = JSON.parse(userStr);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { 
              user: userObj,
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

  const value = {
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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};