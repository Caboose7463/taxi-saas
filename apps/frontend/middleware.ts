import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that are always public — never redirected regardless of auth state
const PUBLIC_PREFIXES = [
  '/driver/',
  '/driver',
  '/login',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let public/driver/admin paths through
  if (PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // For root path, read token and redirect to correct dashboard
  if (pathname === '/') {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      // Edge-safe base64 decode (no Buffer)
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (payload.role === 'hotel_staff') {
        return NextResponse.redirect(new URL(`/hotel/${payload.subdomain || 'caboose'}`, request.url));
      }
      if (payload.role === 'driver') {
        return NextResponse.redirect(new URL('/driver/dashboard', request.url));
      }
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch {
      // invalid token
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
