import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, authToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/login' || pathname === '/api/login')
    return NextResponse.next();

  const ok = req.cookies.get(AUTH_COOKIE)?.value === (await authToken());
  if (ok && process.env.APP_PASSWORD) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
