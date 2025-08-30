
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import Spinner from '../components/Spinner';

interface LocalizationContextType {
  language: string;
  setLanguage: (language: string) => void;
  translations: Record<string, string>;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'it', 'es'];
const DEFAULT_LANGUAGE = 'en';

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadTranslations = useCallback(async (lang: string) => {
    setIsLoading(true);
    const langToLoad = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
    
    try {
      const response = await fetch(`./locales/${langToLoad}.json`);
      if (!response.ok) throw new Error(`Failed to fetch translations for ${langToLoad}`);
      const newTranslations = await response.json();
      setTranslations(newTranslations);
    } catch (error) {
      console.error(error);
      try { // Fallback to English
        const response = await fetch(`./locales/${DEFAULT_LANGUAGE}.json`);
        const newTranslations = await response.json();
        setTranslations(newTranslations);
      } catch (fallbackError) {
        console.error("Could not load fallback English translations.", fallbackError);
        setTranslations({}); // Empty on fatal error
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTranslations(language);
  }, [language, loadTranslations]);

  const t = useCallback((key: string): string => {
    // Basic pluralization/interpolation stub
    if (key.includes('{count}')) {
        // This is a placeholder for a real i18n library's feature
        return (translations[key] || key);
    }
    return translations[key] || key;
  }, [translations]);
  
  const value = useMemo(() => ({
    language,
    setLanguage,
    translations,
    t
  }), [language, translations, t]);

  if (isLoading && Object.keys(translations).length === 0) {
    return React.createElement('div', { className: "flex h-screen w-full items-center justify-center bg-primary" }, React.createElement(Spinner, null));
  }

  return React.createElement(LocalizationContext.Provider, { value }, children);
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};