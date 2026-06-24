'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Dashboard from '@/components/Dashboard'
import OnboardingFlow from '@/components/OnboardingFlow'
import TeacherOnboardingWizard from '@/components/TeacherOnboardingWizard'
import InstallPrompt from '@/components/InstallPrompt'
import { createClient } from '@/lib/supabase'

// Once AppContent has rendered past the loading state in this
// browser session, never show the full-page spinner again.
// Uses sessionStorage so it survives full page navigations (back button).
function hasAppContentLoadedBefore(): boolean {
  if (typeof window !== 'undefined' && window.sessionStorage.getItem('cadent-app-loaded') === '1') return true
  return false
}

function markAppLoaded(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('cadent-app-loaded', '1')
  }
}

export default function AppPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)
  const [needsTeacherOnboarding, setNeedsTeacherOnboarding] = useState(false)

  useEffect(() => {
    if (loading || !user) return

    // Profile hasn't loaded yet — don't block, but wait briefly
    // This prevents the infinite spinner when profile fetch is slow
    if (!profile) return

    // Teachers: show onboarding wizard if not yet onboarded, otherwise go to dashboard
    if (profile.user_type === 'teacher') {
      if (profile.teacher_onboarded) {
        router.push('/app/teacher')
      } else {
        setNeedsTeacherOnboarding(true)
      }
      // Mark onboarding as resolved so we don't show the student spinner
      setNeedsOnboarding(false)
      return
    }
    // If onboarding_complete is true, skip onboarding
    if (profile.onboarding_complete) {
      setNeedsOnboarding(false)
    } else {
      // Check if user has any songs — if yes, skip onboarding
      // (existing users from before the onboarding flow)
      const checkSongs = async () => {
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('songs')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

          setNeedsOnboarding(!data || data.length === 0)
        } catch (error) {
          console.error('Error checking songs:', error)
          setNeedsOnboarding(false) // Assume existing user on error
        }
      }
      checkSongs()
    }
  }, [user, profile, loading])

  // Skip full-page spinner on re-mount if we've loaded before in this tab session.
  // Can't use sessionStorage in useState (SSR hydration mismatch), so we use
  // useEffect to immediately clear loading if the flag is set.
  const [skipSpinner, setSkipSpinner] = useState(false)
  useEffect(() => {
    if (window.sessionStorage.getItem('cadent-app-loaded') === '1') {
      setSkipSpinner(true)
    }
  }, [])

  // Safety: never show the spinner for more than 15 seconds.
  // If auth hasn't resolved by then, clear the flag and let the
  // !user redirect handle it (sends to /login).
  const [forceReady, setForceReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => {
      console.warn('[AppContent] Auth spinner timeout (15s) — forcing ready state')
      setForceReady(true)
    }, 15000)
    return () => clearTimeout(t)
  }, [])

  if ((loading || !profile) && !skipSpinner && !forceReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Past the loading spinner — mark as loaded for this session
  markAppLoaded()

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  // Still checking onboarding status
  if (needsOnboarding === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Teacher onboarding wizard
  if (needsTeacherOnboarding) {
    return (
      <TeacherOnboardingWizard
        onComplete={() => {
          setNeedsTeacherOnboarding(false)
          router.push('/app/teacher')
        }}
      />
    )
  }

  if (needsOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => setNeedsOnboarding(false)}
      />
    )
  }

  return (
    <>
      <Dashboard />
      <InstallPrompt />
    </>
  )
}