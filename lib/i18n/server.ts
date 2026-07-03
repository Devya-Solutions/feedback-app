import 'server-only';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from './locales';

export const LOCALE_COOKIE = 'lang';

export async function getLocale(): Promise<LocaleCode> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  if (raw && isLocaleCode(raw)) return raw;
  return DEFAULT_LOCALE;
}
