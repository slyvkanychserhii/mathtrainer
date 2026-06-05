import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, SUPPORTED_LOCALES, type Locale } from './translations';

const STORAGE_KEY = 'locale';

type Strings = typeof translations.en;

function tFn(locale: Strings, key: string, params?: Record<string, string | number>): string {
  let value: string | undefined = locale[key as keyof Strings];
  if (value === undefined) {
    value = translations.en[key as keyof Strings];
  }
  if (value === undefined) return key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

interface LocaleContextValue {
  locale: Locale;
  strings: Strings;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  supportedLocales: typeof SUPPORTED_LOCALES;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getSystemLocale(): Locale {
  try {
    const lang = navigator.language || '';
    if (lang.startsWith('ru')) return 'ru';
    if (lang.startsWith('uk')) return 'uk';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('it')) return 'it';
    if (lang.startsWith('pt')) return 'pt';
  } catch {}
  return 'en';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in translations) {
        setLocaleState(stored as Locale);
      } else {
        setLocaleState(getSystemLocale());
      }
    } catch {
      setLocaleState(getSystemLocale());
    }
    setReady(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try { localStorage.setItem(STORAGE_KEY, newLocale); } catch {}
  };

  const strings = translations[locale] || translations.en;

  const ctx: LocaleContextValue = {
    locale,
    strings,
    t: (key: string, params?: Record<string, string | number>) => tFn(strings, key, params),
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
  };

  if (!ready) return null;

  return (
    <LocaleContext.Provider value={ctx}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
