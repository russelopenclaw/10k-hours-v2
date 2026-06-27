import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: false,
  
  // Replay configurations
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'Can\'t find variable: ZiteReader',
    'jigsaw is not defined',
    'ComboSearch is not defined',
    // Network errors that user can't control
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // Auth errors (user will see UI feedback)
    'Invalid login credentials',
    'Email not confirmed',
    // Rate limit
    'Too Many Requests',
  ],
  
  // Don't send errors from localhost
  enabled: process.env.NODE_ENV === 'production',
})