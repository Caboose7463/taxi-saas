import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  const hostname = request.headers.get('host') || '';
  
  // Determine if there is a subdomain
  const hostParts = hostname.split('.');
  const isVercel = hostname.includes('vercel.app');
  const hasSubdomain = hostParts.length > 2 && !hostname.startsWith('localhost') && !hostname.startsWith('www') && !isVercel;

  // Define public routes that don't require authentication
  const isPublicRoute = path === '/login' || path === '/driver/signup' || path === '/driver/login';

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If a valid subdomain exists, rewrite the path to a dynamic route for that hotel
  if (hasSubdomain) {
    const subdomain = hostParts[0];
    return NextResponse.rewrite(new URL(`/hotel/${subdomain}${path}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all routes except API routes, static files, and images
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
