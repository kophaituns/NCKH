import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  // Lấy language từ localStorage, mặc định 'vi'
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'vi';
    const saved = localStorage.getItem('language');
    return saved || 'vi';
  });

  // Lưu lại mỗi khi đổi ngôn ngữ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);

  // Hàm dịch: ưu tiên language hiện tại -> fallback sang en -> nếu không có thì trả lại key
  const t = (key) => {
    const current = translations[language] || {};
    const fallback = translations.en || {};
    return current[key] ?? fallback[key] ?? key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
