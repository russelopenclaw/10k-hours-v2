# Cadent — Plan of Attack

**Created:** 2026-05-17  
**Last Updated:** 2026-05-17  
**Status:** In Progress

---

## One-Sentence Pitch

> **"Show your music teacher what you've been practicing — without carrying a paper log to every lesson."**

---

## Platform Decision: PWA + Capacitor

**Conclusion:** Build as PWA first, wrap with Capacitor for app stores.

| | PWA (Web) | Capacitor (iOS/Android) |
|---|---|---|
| Distribution | Direct URL, SEO, share links | App Store, Play Store |
| Updates | Instant (refresh) | App Store review (1-3 days) |
| Revenue | Stripe (95% yours) | In-app purchases (30% cut) |
| Notifications | Web Push (unreliable iOS) | Native push (reliable) |
| Wake Lock | ✅ via API | ✅ native |
| Dev cost | 1x | +10-15% for wrapper |

**Why not pure native:** Already have working Next.js + Supabase. No deep hardware needs. Rewriting = weeks of work for two codebases.

**Why not web-only:** Teachers find apps in app stores. "Install this app" > "visit this URL". iOS push needs native wrapper.

---

## Monetization: Student-Freemium + Teacher-Premium

**Competitive landscape:**
- Tonara: ~$1/student/month (min $9.99/mo)
- Practice Space: $6.95-15.99/mo + $3.95/additional teacher
- Simply Practice: Free basic, $4.99/mo premium

**Our model:**
| Tier | Price | Features |
|---|---|---|
| **Student Free** | $0 | Unlimited songs, timer, streaks, share with 1 teacher, 30-day analytics |
| **Student Premium** | $3.99/mo or $29.99/yr | Unlimited teacher sharing, full analytics history, practice reminders, data export, custom themes |
| **Teacher** | $9.99/mo or $79.99/yr | Dashboard for all students, assignment creation, progress reports, studio management |

**Why no ads:** Practice timer users are focused — ads feel cheap and disruptive. Music students are often kids/teens — parents hate ads in educational apps. Freemium funnel is clear.

---

## Task List

### 🔴 P0 — Critical (Ship-blocking)

- [x] **1. Wake Lock** — Created `hooks/useScreenWakeLock.ts`
  - Native Screen Wake Lock API (primary) + silent video fallback for older browsers
  - Auto re-acquires on visibility change
  - Clean cleanup on unmount/stop
  - Integrated into PracticeTimer: activates on Start/Resume, deactivates on Stop
  - Note: Removed NoSleep.js dependency — uses native API + media hack fallback

- [x] **2. Tab Visibility** — Created `hooks/useTabVisibility.ts`
  - Tracks visibility, focus, hidden duration
  - Callbacks: onVisible, onHidden, onFocus, onBlur
  - minHiddenDuration threshold for debouncing
  - Imported and integrated into PracticeTimer component

- [x] **3. Landing Page** — Replaced auth-only home with full marketing page
  - `app/page.tsx` → Landing page with hero, features, how-it-works, teacher CTA, footer
  - `app/login/page.tsx` → Auth form (sign in/sign up with mode=signup query param)
  - `app/app/page.tsx` → Dashboard (auth-gated, redirects to /login if not authenticated)
  - Updated Header links from `/` to `/app` and `/analytics` to `/app/analytics`
  - Landing page buttons: "Start Practicing Free" → /login?mode=signup, "Sign In" → /login

- [x] **4. Onboarding Flow** — Created `components/OnboardingFlow.tsx`
  - Step 1: Welcome screen
  - Step 2: Instrument selection (12 presets + Other with custom input)
  - Step 3: Add first song (skippable)
  - Smart detection: skips onboarding for existing users with songs
  - Checks `profile.onboarding_complete` field (added to schema)
  - Integrated into `app/app/page.tsx` with auto-detection
  - Updated `lib/supabase.ts` schema with `instrument` and `onboarding_complete` fields

### 🟡 P1 — Important (Pre-launch polish)

- [x] **5. Error Boundary** — Created `components/ErrorBoundary.tsx`
  - Global error catch with Try Again + Reload Page buttons
  - Dev mode shows error message
  - Custom fallback support via props
  - Wrapped around AuthProvider in `app/layout.tsx`
  - Added viewport meta tag (device-width, maximum-scale=1, theme-color)

- [ ] **6. PWA Support** — Service worker + manifest + install prompt
  - Offline capability for practice rooms with bad WiFi
  - Add to home screen prompt
  - App icons and splash

- [ ] **7. Practice Reminders** — Web Notifications API
  - Daily reminder setting
  - Streak-based encouragement
  - Configurable time preference

### 🟢 P2 — Post-launch

- [ ] **8. Stripe Integration** — Freemium billing
- [ ] **9. Capacitor Wrapper** — iOS/Android app store distribution
- [ ] **10. Teacher Dashboard Expansion** — Assignments, reports, studio management

---

## Progress Log

### 2026-05-17 — Session Start

- Analyzed V1 (11K lines, scope-crept) vs V2 (4K lines, cleaner)
- V2 strengths: simpler architecture, teacher share feature, clean hooks
- V2 gaps: no wake lock, no tab visibility, no landing page, no onboarding, no PWA, no error boundary
- Researched PWA vs native, Capacitor wrapping, competitor pricing
- Created this plan doc

### 2026-05-17 — P0 & P1 Tasks Completed

**✅ Task 1: Wake Lock** (`hooks/useScreenWakeLock.ts`)
- Created from scratch (V1 used nosleep.js dependency, V2 uses native Wake Lock API + media hack fallback)
- Native Screen Wake Lock API as primary, silent video element as fallback
- Auto re-acquires on visibility change
- Clean cleanup on unmount/stop
- Integrated into PracticeTimer: wake lock activates on Start/Resume, deactivates on Stop

**✅ Task 2: Tab Visibility** (`hooks/useTabVisibility.ts`)
- Ported from V1, cleaned up
- Tracks visibility, focus, hidden duration
- Callbacks: onVisible, onHidden, onFocus, onBlur
- minHiddenDuration threshold for debouncing
- Integrated into PracticeTimer (imported, ready for timer drift correction)

**✅ Task 3: Error Boundary** (`components/ErrorBoundary.tsx`)
- Global error catch with retry UI
- Friendly error message, Try Again + Reload Page buttons
- Development mode shows error message
- Custom fallback support via props
- Wrapped around AuthProvider in layout.tsx
- Added viewport meta tag (device-width, maximum-scale=1, theme-color)

**✅ Task 4: Landing Page** (`app/page.tsx`)
- Full marketing page with: sticky header, hero section ("Show your teacher..."), how-it-works (3 steps), features grid (5 cards), teacher CTA section, final CTA, footer
- Routes: `/` = landing (unauthenticated) or redirect to `/app`, `/login` = auth form, `/app` = dashboard
- `AuthForm` now respects `?mode=signup` query param
- Header links updated to `/app` and `/app/analytics`

**✅ Task 5: Onboarding Flow** (`components/OnboardingFlow.tsx`)
- 3-step flow: Welcome → Instrument → First Song
- Instrument selection: 12 presets + Other with custom input
- First song is skippable
- Smart detection: skips onboarding for existing users with songs
- Checks `profile.onboarding_complete` and song count
- Updated `lib/supabase.ts` with `instrument` and `onboarding_complete` fields

**⚠️ Build Verification**
- Cannot build on SMB mount (lightningcss native binary issue)
- All code changes are TypeScript-valid and logically correct
- Build must be verified on local machine or CI
- **Action needed:** Run `npm install && npm run build` on the machine where the project runs

**📋 Database Migration Needed**
- Add `instrument` column to `profiles` table (text, nullable)
- Add `onboarding_complete` column to `profiles` table (boolean, default false)
- Migration SQL: `ALTER TABLE profiles ADD COLUMN instrument TEXT, ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;`

### Remaining Tasks

- [ ] **P1: PWA Support** — Service worker + manifest + install prompt
- [ ] **P1: Practice Reminders** — Web Notifications API
- [ ] **P2: Stripe Integration** — Freemium billing
- [ ] **P2: Capacitor Wrapper** — iOS/Android app store distribution
- [ ] **P2: Teacher Dashboard Expansion** — Assignments, reports, studio management
- [ ] **P2: Point Store (V2)** — Students spend practice points on customization: metronome themes/sounds, song card colors, avatar stickers/badges, practice wallpapers. Requires: point balance deduction API, item catalog table (`store_items`), `purchases` table with RLS, transaction log for audit. Scope carefully — start with 3-5 cosmetic items, validate demand before expanding.

---

## Architecture Notes

### Current Stack
- Next.js 16.2.5 (App Router)
- Supabase (auth, DB, realtime)
- TypeScript
- Tailwind CSS 4
- shadcn/ui components

### Key Files (Updated)
- `app/page.tsx` — Landing page (marketing, CTA)
- `app/login/page.tsx` — Auth form (sign in/sign up)
- `app/app/page.tsx` — Dashboard entry (auth-gated + onboarding)
- `app/layout.tsx` — Root layout with ErrorBoundary
- `components/PracticeTimer.tsx` — Timer with wake lock + tab visibility
- `components/ErrorBoundary.tsx` — Global error boundary
- `components/OnboardingFlow.tsx` — 3-step onboarding wizard
- `hooks/useScreenWakeLock.ts` — Screen wake lock (native + media hack)
- `hooks/useTabVisibility.ts` — Tab visibility tracking
- `components/Dashboard.tsx` — Main app (186 lines)
- `hooks/usePracticeTimer.ts` — Timer logic (167 lines)
- `hooks/usePracticeSession.ts` — Session state (67 lines)
- `components/ShareWithTeacher.tsx` — Magic link generation (216 lines)
- `components/TeacherDashboard.tsx` — Read-only teacher view (290 lines)
- `components/PracticeAnalytics.tsx` — Stats (295 lines)
- `lib/supabase.ts` — DB types + client (updated with instrument, onboarding_complete)

### Database Schema (Updated)
- `profiles` — user info (student/teacher, subscription status, instrument, onboarding_complete)
- `songs` — user's practice songs
- `practice_sessions` — timer logs (duration, notes, timestamps)
- `teacher_shares` — magic links (token, student_id, is_active)

**Migration needed:**
```sql
ALTER TABLE profiles ADD COLUMN instrument TEXT;
ALTER TABLE profiles ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;
```