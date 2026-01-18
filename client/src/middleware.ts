import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userMode = request.cookies.get('userMode')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/(auth)');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/(protected)');

  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    const redirectUrl = userMode === 'tenant' ? '/properties' : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 