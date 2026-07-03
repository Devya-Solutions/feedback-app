import en from '@/messages/en.json';
import ar from '@/messages/ar.json';
import type { LocaleCode } from './locales';

export type Dictionary = typeof en;

const DICTIONARIES: Record<LocaleCode, Dictionary> = { en, ar: ar as Dictionary };

export function getDictionary(locale: LocaleCode): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

export function t(dict: Dictionary, path: string): string {
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
