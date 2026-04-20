// src/utils/cleanupLocalStorage.js - Clean up corrupted localStorage data

export const cleanupLocalStorage = () => {
  const keysToCheck = ['user', 'authToken', 'refreshToken', 'token'];
  
  keysToCheck.forEach(key => {
    const value = localStorage.getItem(key);
    if (value === 'undefined' || value === 'null') {
      console.warn(`Cleaning up corrupted localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
};

export default cleanupLocalStorage;