import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to redirect authenticated users away from auth pages.
 * Checks for the Supabase auth token cookie server-side,
 * avoiding the client-side race condition in LoginContent.tsx.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user is authenticated by looking for the Supabase auth cookie
  const authCookie = request.cookies.get('sb-rmqrvlhgusuqljsiicnd-auth-token')

  // If user is logged in and trying to access auth pages, redirect to /app
  if (authCookie && (pathname === '/login' || pathname.startsWith('/auth/'))) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // If user is NOT logged in and trying to access protected routes, redirect to /login
  if (!authCookie && pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Match auth pages and app pages
  matcher: ['/login', '/auth/:path*', '/app/:path*'],
}