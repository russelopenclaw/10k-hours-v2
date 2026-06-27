import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  debug: false,
  
  ignoreErrors: [
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'Invalid login credentials',
    'Email not confirmed',
    'Too Many Requests',
  ],
  
  enabled: process.env.NODE_ENV === 'production',
})