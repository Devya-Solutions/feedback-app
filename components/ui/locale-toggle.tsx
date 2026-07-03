'use client';

import { useLocale, useSetLocale, useT } from '@/lib/i18n/client';
import { LOCALES } from '@/lib/i18n/locales';

export function LocaleToggle() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t('shell.toggleAria')}
      className="inline-flex items-center rounded-full border border-ink-700 bg-ink-900/60 p-0.5 text-[11px]"
    >
      {LOCALES.map((l) => {
        const active = l.code === locale;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLocale(l.code)}
            aria-pressed={active}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              active ? 'bg-white text-ink-950' : 'text-ink-300 hover:text-white'
            }`}
          >
            {l.code === 'ar' ? 'العربية' : 'EN'}
          </button>
        );
      })}
    </div>
  );
}
