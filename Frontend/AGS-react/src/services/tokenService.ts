import { User } from '../types';
import { securityService } from './securityService';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export const TokenService = {
  // Synchronous version for initial state - returns raw encrypted tokens
  getStoredTokensSync(): StoredTokens | null {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!accessToken || !refreshToken) {
      return null;
    }
    
    // Return encrypted tokens - they will be decrypted on first use
    return {
      accessToken,
      refreshToken
    };
  },

  // Async version for decryption when needed
  async getStoredTokens(): Promise<StoredTokens | null> {
    const encryptedTokens = this.getStoredTokensSync();
    
    if (!encryptedTokens) {
      return null;
    }
    
    try {
      // Decrypt tokens
      const [accessToken, refreshToken] = await Promise.all([
        securityService.decryptData(encryptedTokens.accessToken),
        securityService.decryptData(encryptedTokens.refreshToken)
      ]);
      
      if (!accessToken || !refreshToken) {
        this.removeTokens(); // Clear invalid tokens
        return null;
      }
      
      return {
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('Error decrypting tokens:', error);
      this.removeTokens(); // Clear invalid tokens
      return null;
    }
  },

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Encrypt tokens before storing
      const [encryptedAccessToken, encryptedRefreshToken] = await Promise.all([
        securityService.encryptData(accessToken),
        securityService.encryptData(refreshToken)
      ]);
      
      localStorage.setItem(TOKEN_KEY, encryptedAccessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, encryptedRefreshToken);
    } catch (error) {
      console.error('Error encrypting tokens:', error);
      throw new Error('Failed to save tokens securely');
    }
  },

  removeTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  async saveUser(user: User): Promise<void> {
    try {
      const userStr = JSON.stringify(user);
      const encryptedUser = await securityService.encryptData(userStr);
      localStorage.setItem(USER_KEY, encryptedUser);
    } catch (error) {
      console.error('Error encrypting user data:', error);
      throw new Error('Failed to save user data securely');
    }
  },

  // Synchronous version for initial state - returns raw encrypted user
  getUserSync(): User | null {
    const encryptedUserStr = localStorage.getItem(USER_KEY);
    if (!encryptedUserStr) return null;
    
    // For initial state, we'll return null and load it async
    // Or we could store user data unencrypted if it doesn't contain sensitive info
    return null;
  },

  async getUser(): Promise<User | null> {
    const encryptedUserStr = localStorage.getItem(USER_KEY);
    if (!encryptedUserStr) return null;
    
    try {
      const decryptedUserStr = await securityService.decryptData(encryptedUserStr);
      if (!decryptedUserStr) {
        this.removeUser();
        return null;
      }
      return JSON.parse(decryptedUserStr);
    } catch (error) {
      console.error('Error decrypting user data:', error);
      this.removeUser(); // Clear invalid data
      return null;
    }
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  clearAll(): void {
    this.removeTokens();
    this.removeUser();
  }
};