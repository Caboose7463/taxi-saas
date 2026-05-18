import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// These paths must NEVER be intercepted by the root redirect logic
const DRIVER_PATHS = ['/driver/signup', '/driver/login', '/driver/dashboard'];
const ADMIN_PATHS = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // If visiting a driver-specific page, always allow through
  // Never let a hotel session redirect away from driver pages
  if (DRIVER_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // If visiting admin page, always allow through
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // If visiting root and logged in as hotel, redirect to hotel dashboard
  if (pathname === '/' && token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.role === 'hotel_staff') {
        const subdomain = payload.subdomain || 'caboose';
        return NextResponse.redirect(new URL(`/hotel/${subdomain}`, request.url));
      }
      if (payload.role === 'driver') {
        return NextResponse.redirect(new URL('/driver/dashboard', request.url));
      }
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch { /* invalid token, fall through to login */ }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If visiting root with no token, redirect to login
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
