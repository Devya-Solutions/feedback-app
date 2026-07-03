export const DEFAULT_LOCALE = 'en' as const;

export const LOCALES = [
  { code: 'en', name: 'English', dir: 'ltr' as const },
  { code: 'ar', name: 'العربية', dir: 'rtl' as const },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

export function isLocaleCode(value: string): value is LocaleCode {
  return LOCALES.some((l) => l.code === value);
}

export function getLocaleConfig(code: string) {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}
