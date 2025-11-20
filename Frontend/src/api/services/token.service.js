// Token management service
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const TokenService = {
  getStoredTokensSync() {
    try {
      const accessToken = sessionStorage.getItem(TOKEN_KEY);
      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
      if (accessToken && refreshToken) {
        return { accessToken, refreshToken };
      }
      return null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  },

  saveTokens(accessToken, refreshToken) {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  removeTokens() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  saveUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUserSync() {
    const userStr = sessionStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  removeUser() {
    sessionStorage.removeItem(USER_KEY);
  },

  clearAll() {
    this.removeTokens();
    this.removeUser();
  }
};

export default TokenService;
