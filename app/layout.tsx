import type { Metadata } from 'next';
import { sora, cairo } from './fonts';
import { getLocale } from '@/lib/i18n/server';
import { getLocaleConfig } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionary';
import { LocaleProvider } from '@/lib/i18n/client';
import '../styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    robots: { index: false, follow: false },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      ],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { dir } = getLocaleConfig(locale);
  const fontClass = locale === 'ar' ? 'font-cairo' : 'font-sora';
  return (
    <html lang={locale} dir={dir} className={`${sora.variable} ${cairo.variable}`}>
      <body
        className={`min-h-screen bg-ink-950 text-ink-100 antialiased ${fontClass}`}
        suppressHydrationWarning
      >
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
