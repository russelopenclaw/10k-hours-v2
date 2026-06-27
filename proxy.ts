import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ──────────────────────────────────────────────
// Rate limiter (in-memory, per-Vercel function instance)
// ──────────────────────────────────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup > 60_000) {
    for (const [key, entry] of rateLimits) {
      if (now > entry.resetAt) rateLimits.delete(key)
    }
    lastCleanup = now
  }
}

const RATE_CONFIGS: { path: string; limit: number; windowMs: number }[] = [
  { path: '/auth', limit: 10, windowMs: 60_000 },
  { path: '/login', limit: 5, windowMs: 60_000 },
  { path: '/api/stripe', limit: 20, windowMs: 60_000 },
  { path: '/api/reports', limit: 5, windowMs: 60_000 },
  { path: '/api/leaderboard/visibility', limit: 10, windowMs: 60_000 },
  { path: '/api/consent', limit: 5, windowMs: 60_000 },
  { path: '/api/notifications', limit: 10, windowMs: 60_000 },
  { path: '/api', limit: 60, windowMs: 60_000 },
]

function getRateConfig(pathname: string) {
  for (const config of RATE_CONFIGS) {
    if (pathname.startsWith(config.path)) return config
  }
  return null
}

export async function proxy(request: NextRequest) {
  cleanup()

  const { pathname } = request.nextUrl

  // ── Rate limiting ──
  const config = getRateConfig(pathname)
  if (config) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip, config.limit, config.windowMs)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(config.windowMs / 1000)) },
      })
    }
  }

  // ── Auth & routing ──
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Prevent bfcache for authenticated pages
  if (pathname.startsWith('/app')) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, must-revalidate')
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // Teacher routes require auth + teacher role
  if (pathname.startsWith('/app/teacher')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || profile.user_type !== 'teacher') {
      return NextResponse.redirect(new URL('/app', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}