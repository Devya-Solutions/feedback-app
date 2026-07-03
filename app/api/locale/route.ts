import { NextResponse } from 'next/server';
import { isLocaleCode } from '@/lib/i18n/locales';
import { LOCALE_COOKIE } from '@/lib/i18n/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { locale?: string } | null;
  const locale = body?.locale ?? '';
  if (!isLocaleCode(locale)) {
    return NextResponse.json({ error: 'invalid locale' }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
