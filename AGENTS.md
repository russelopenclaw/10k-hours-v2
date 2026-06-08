---
name: 10k-hours-v2
description: Cadent — Practice tracker app for music students. Show your teacher what you've been practicing.
---

# Cadent (10k-hours-v2)

## Overview
A Next.js practice tracker for music students — log practice sessions, share progress with teachers via magic links, track streaks, and view analytics. Currently live at **cadent.online** (Vercel). Uses Supabase for auth and data. Revenue model: student-freemium + teacher-premium ($3.99/mo students, $9.99/mo teachers).

## Tech Stack
- **Language:** TypeScript
- **Framework:** Next.js 16.2.5 (App Router)
- **Auth & DB:** Supabase (auth-helpers, SSR client, service role for API routes)
- **Styling:** Tailwind CSS v4, shadcn/ui components
- **Deployment:** Vercel (domain: cadent.online)
- **Key dependencies:** `next`, `@supabase/ssr`, `@supabase/auth-helpers-nextjs`, `@dnd-kit`, `lucide-react`, `class-variance-authority`

## Project Structure
```
10k-hours-v2/
├── app/
│   ├── page.tsx                    # Landing page (marketing, CTA)
│   ├── layout.tsx                  # Root layout + ErrorBoundary
│   ├── login/page.tsx              # Auth form (sign in / sign up)
│   ├── app/page.tsx                # Dashboard (auth-gated + onboarding)
│   ├── auth/callback/route.ts      # Supabase auth callback
│   ├── auth/reset-password/page.tsx # Password reset
│   ├── share/[token]/page.tsx      # Teacher view (magic link)
│   └── api/share/[token]/route.ts  # Share API (service role)
├── components/
│   ├── Dashboard.tsx               # Main app (186 lines)
│   ├── PracticeTimer.tsx           # Timer with wake lock (201 lines)
│   ├── PracticeAnalytics.tsx       # Stats & charts (250 lines)
│   ├── TeacherDashboard.tsx        # Teacher read-only view (289 lines)
│   ├── AuthForm.tsx                # Sign in/up form (381 lines)
│   ├── OnboardingFlow.tsx          # 3-step onboarding (209 lines)
│   ├── SongLibrary.tsx             # Song list (67 lines)
│   ├── ShareWithTeacher.tsx        # Magic link generation
│   ├── SongCard.tsx, EditSongDialog.tsx, AddSongDialog.tsx
│   ├── MetronomeControl.tsx        # BPM control
│   ├── DayStreakAchievement.tsx    # Streak tracking
│   ├── ChangeEmailDialog.tsx, ChangePasswordDialog.tsx
│   ├── UserMenu.tsx, Header.tsx
│   └── ui/                         # shadcn/ui primitives (14 files)
├── hooks/
│   ├── usePracticeTimer.ts         # Timer logic (167 lines)
│   ├── usePracticeSession.ts       # Session state (67 lines)
│   ├── useScreenWakeLock.ts        # Screen wake lock (native + media hack)
│   ├── useTabVisibility.ts         # Tab visibility tracking
│   ├── useMetronome.ts             # Metronome audio
│   ├── useDebouncedSlider.ts       # Slider debounce
│   └── useErrorHandler.ts          # Error handling
├── lib/
│   ├── supabase.ts                 # Browser client + DB types
│   ├── supabase-server.ts          # Server client
│   ├── utils.ts                    # cn() helper
│   └── errors.ts                   # Error types
├── PLAN-OF-ATTACK.md              # Master plan with task checklist
├── CLAUDE.md                       # Next.js agent rules
├── components.json                 # shadcn config
└── package.json
```

## Development

### Setup
```bash
npm install
# Create .env.local with:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...  (for API routes)
```

### Build & Test
```bash
npm run dev          # Dev server on port 3002
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

### Database
Supabase tables: `profiles`, `songs`, `practice_sessions`, `teacher_shares`
- **Migration needed:** `profiles` needs `instrument TEXT` and `onboarding_complete BOOLEAN DEFAULT false` columns
- RPC function `get_student_practice_data(share_token)` powers the teacher share view

## Key Conventions
- **App Router:** All routes use Next.js App Router (not Pages Router)
- **Auth Pattern:** `AuthProvider` wraps the app; `createBrowserClient` from `@supabase/ssr` for client; `createServerClient` for API routes
- **Wake Lock:** Native Screen Wake Lock API + silent video fallback for practice timer
- **Tab Visibility:** Built-in hook detects tab switching during practice (prevents cheating timer)
- **Onboarding Detection:** Checks `profile.onboarding_complete` flag; skips if already done
- **Share System:** Student generates a token via `ShareWithTeacher`; teacher visits `/share/[token]` for read-only view
- **Component Library:** shadcn/ui with custom theme (Tailwind v4)

## Important Notes
- **Live at cadent.online** — deployed via Vercel with automatic deploys from main
- **Build verification:** Last build had Vercel errors fixed (lazy Supabase client + Suspense boundary)
- **No .env files in repo** — all secrets in Vercel environment variables
- **next.config.ts** has `allowedDevOrigins: ['192.168.1.28']` for HP1 dev access
- **Supabase service role key** is required for API routes (`/api/share/`)
- **No PWA config yet** — service worker, manifest, and install prompt are P1 tasks (not started)
- **No Stripe integration** — P2 post-launch
- **No Capacitor wrapper** — P2 post-launch
- **PLAN-OF-ATTACK.md** tracks all P0/P1/P2 tasks with detailed progress
- **P0 tasks complete:** Wake Lock, Tab Visibility, Landing Page, Onboarding, Error Boundary
- **P1 tasks remaining:** PWA Support, Practice Reminders
- **P2 tasks remaining:** Stripe, Capacitor, Teacher Dashboard expansion

## Current Blockers (as of 2026-06-08)
1. **No PWA** — can't "install" on phones, no offline, no push notifications
2. **No Stripe** — no revenue path yet
3. **No database migration** — `instrument` and `onboarding_complete` columns not yet added to Supabase
4. **No tests** — zero test files in the repo
5. **No error monitoring** — no Sentry or similar
6. **No SEO/social** — no meta tags, Open Graph, or sitemap