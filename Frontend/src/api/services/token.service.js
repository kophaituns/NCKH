// Token management service
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const TokenService = {
  getStoredTokensSync() {
    try {
<<<<<<< HEAD
      const accessToken = sessionStorage.getItem(TOKEN_KEY);
      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
=======
      const accessToken = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
>>>>>>> linh2
      if (accessToken && refreshToken) {
        return { accessToken, refreshToken };
      }
      return null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  },
<<<<<<< HEAD

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

=======
  saveTokens(accessToken, refreshToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  removeTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUserSync() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  removeUser() {
    localStorage.removeItem(USER_KEY);
  },
>>>>>>> linh2
  clearAll() {
    this.removeTokens();
    this.removeUser();
  }
};

export default TokenService;
