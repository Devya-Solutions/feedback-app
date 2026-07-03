'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/client';
import { LocaleToggle } from '@/components/ui/locale-toggle';

export default function Home() {
  const t = useT();
  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="absolute top-4 end-4">
        <LocaleToggle />
      </div>
      <div className="max-w-lg text-center">
        <div className="text-xs uppercase tracking-widest text-ink-400 mb-4">
          {t('home.kicker')}
        </div>
        <h1 className="text-3xl font-semibold mb-4">{t('home.headline')}</h1>
        <p className="text-ink-300 mb-8">
          {t('home.bodyBefore')}{' '}
          <a
            className="underline underline-offset-4"
            href="mailto:contact@devya.dev"
          >
            contact@devya.dev
          </a>
          {t('home.bodyAfter')}
        </p>
        <Link
          href="/admin"
          className="inline-block rounded-full bg-white text-ink-950 font-medium px-6 py-3 hover:bg-ink-100 transition-colors"
        >
          {t('home.cta')} →
        </Link>
      </div>
    </main>
  );
}
