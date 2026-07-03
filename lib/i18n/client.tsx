'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';
import { DEFAULT_LOCALE, getLocaleConfig, isLocaleCode, type LocaleCode } from './locales';
import type { Dictionary } from './dictionary';

const DICTIONARIES: Record<LocaleCode, Dictionary> = { en, ar: ar as Dictionary };

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (next: LocaleCode) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function LocaleProvider({
  locale: initial,
  children,
}: {
  locale: LocaleCode;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(initial);
  const localeRef = useRef(initial);

  useEffect(() => {
    localeRef.current = locale;
    if (typeof document === 'undefined') return;
    const { dir } = getLocaleConfig(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((next: LocaleCode) => {
    if (localeRef.current === next) return;
    localeRef.current = next;
    setLocaleState(next);
    fetch('/api/locale', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {});
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleCode {
  return useContext(LocaleContext).locale;
}

export function useSetLocale(): (next: LocaleCode) => void {
  return useContext(LocaleContext).setLocale;
}

export function useDict(): Dictionary {
  const locale = useLocale();
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

export function tClient(dict: Dictionary, path: string): string {
  const parts = path.split('.');
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof cur === 'string' ? cur : path;
}

export function useT(): (path: string) => string {
  const dict = useDict();
  return useCallback((path: string) => tClient(dict, path), [dict]);
}

export { isLocaleCode };
export type { LocaleCode };
