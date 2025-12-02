import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TokenService } from '../api/services/token.service.js';
import AuthService from '../api/services/auth.service.js';
import SettingsService from '../api/services/settings.service.js';

// Initial state
const initialState = {
  user: null,
  token: TokenService.getStoredTokensSync()?.accessToken || null,
  refreshToken: TokenService.getStoredTokensSync()?.refreshToken || null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isRefreshing: false,
  systemName: 'ALLMTAGS'
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
    case 'SET_SYSTEM_NAME':
      return {
        ...state,
        systemName: action.payload
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

  // ===== Refresh token =====
  const refreshAuthToken = async () => {
    dispatch({ type: 'REFRESH_TOKEN_START' });
    try {
      const refreshToken = state.refreshToken;
      if (!refreshToken) throw new Error('No refresh token available');

      const data = await AuthService.refreshToken(refreshToken);
      TokenService.saveTokens(data.data.token, data.data.refreshToken);

      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: {
          token: data.data.token,
          refreshToken: data.data.refreshToken,
        },
      });
    } catch (error) {
      dispatch({ type: 'REFRESH_TOKEN_FAILURE' });
      logout();
    }
  };

  // ===== Token expiration =====
  useEffect(() => {
    if (state.token) {
      try {
        const tokenData = JSON.parse(atob(state.token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        if (timeUntilExpiry <= 0) {
          refreshAuthToken();
        } else {
          const refreshTime = timeUntilExpiry - 60000;
          const timer = setTimeout(refreshAuthToken, refreshTime);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, [state.token]);

  // ===== LOGIN =====
  const login = async (loginData) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      if (!loginData || (!loginData.email && !loginData.username) || !loginData.password) {
        throw new Error('Username/Email and password are required');
      }

      const identifier = loginData.email || loginData.username;
      const data = await AuthService.login(identifier, loginData.password);

      const responseData = data.data;
      const user = responseData.user;

      const userObj = {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        createdAt: new Date(user.created_at || user.createdAt),
        updatedAt: new Date(user.updated_at || user.updatedAt),
      };

      TokenService.saveTokens(responseData.token, responseData.refreshToken);
      TokenService.saveUser(userObj);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userObj, token: responseData.token, refreshToken: responseData.refreshToken },
      });

      // ========= LOAD SYSTEM NAME WHEN LOGIN =========
      const settings = await SettingsService.getAdminSettings();
      if (settings.ok) {
        dispatch({
          type: 'SET_SYSTEM_NAME',
          payload: settings.data.system_name
        });
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      throw new Error(errorMessage);
    }
  };

  // ===== REGISTER =====
  const register = async (username, email, password, full_name, role) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const data = await AuthService.register({
        username,
        email,
        password,
        full_name,
        role
      });

      const user = data.data.user;

      const userObj = {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        createdAt: new Date(user.created_at || user.createdAt),
        updatedAt: new Date(user.updated_at || user.updatedAt),
      };

      TokenService.saveTokens(data.data.token, data.data.refreshToken);
      TokenService.saveUser(userObj);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userObj, token: data.data.token, refreshToken: data.data.refreshToken },
      });

      // ========= LOAD SYSTEM NAME AFTER REGISTER =========
      const settings = await SettingsService.getAdminSettings();
      if (settings.ok) {
        dispatch({
          type: 'SET_SYSTEM_NAME',
          payload: settings.data.system_name
        });
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      throw new Error(errorMessage);
    }
  };

  // ===== LOGOUT =====
  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenService.clearAll();
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Clear error
  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  // ===== INIT FROM LOCAL STORAGE =====
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const tokens = TokenService.getStoredTokensSync();

        if (tokens && userStr) {
          const userObj = JSON.parse(userStr);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: userObj, token: tokens.accessToken, refreshToken: tokens.refreshToken },
          });

          // ===== LOAD SYSTEM NAME AFTER PAGE RELOAD =====
          SettingsService.getAdminSettings().then((res) => {
            if (res.ok) {
              dispatch({
                type: 'SET_SYSTEM_NAME',
                payload: res.data.system_name
              });
            }
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

// Custom hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
