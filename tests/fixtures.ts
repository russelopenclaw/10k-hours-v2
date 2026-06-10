// Test credentials — Supabase test accounts
// russelopenclaw+test1@gmail.com / TestAccount2026!  (student)
// russelopenclaw+test2@gmail.com / TestAccount2026!  (teacher)
// Override via env vars: PLAYWRIGHT_TEST_EMAIL, PLAYWRIGHT_TEST_PASSWORD

export const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || 'russelopenclaw+test1@gmail.com';
export const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || 'TestAccount2026!';
export const TEST_TEACHER_EMAIL = process.env.PLAYWRIGHT_TEST_TEACHER_EMAIL || 'russelopenclaw+test2@gmail.com';
export const TEST_TEACHER_PASSWORD = process.env.PLAYWRIGHT_TEST_TEACHER_PASSWORD || 'TestAccount2026!';

export const BASE_URL = process.env.BASE_URL || 'https://www.cadent.online';

// Routes
export const routes = {
  home: '/',
  login: '/login',
  app: '/app',
  authCallback: '/auth/callback',
  resetPassword: '/auth/reset-password',
  share: (token: string) => `/share/${token}`,
  robots: '/robots.txt',
  sitemap: '/sitemap.xml',
  manifest: '/manifest.json',
};
