import { NextRequest, NextResponse } from 'next/server';

// Mirror admin-app's mechanism: gate everything that isn't explicitly public by
// checking for the shared session cookie. Feedback-app has no local /login page,
// so unauthenticated admin visitors are bounced to the external admin login.
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'devya_session';

// Where to send unauthenticated admins. The admin app owns the real login form.
const ADMIN_LOGIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_LOGIN_URL ??
  'https://admin.devya-solutions.com/login?next=%2Ffeedback';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets and framework internals are always public.
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(COOKIE_NAME)?.value);
  if (hasSession) return NextResponse.next();

  // No session: redirect to the external admin login, preserving where they came from.
  const loginUrl = new URL(ADMIN_LOGIN_URL);
  loginUrl.searchParams.set('from', req.nextUrl.origin + pathname);
  return NextResponse.redirect(loginUrl);
}

// Matcher gates /admin only. Public routes (/, /r/*), all /api/* (proxied to the
// backend, which does its own auth), and static assets are excluded so the public
// review flow and API stay reachable.
export const config = { matcher: ['/admin/:path*'] };
