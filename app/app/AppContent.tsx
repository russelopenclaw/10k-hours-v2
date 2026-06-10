'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import Dashboard from '@/components/Dashboard'
import OnboardingFlow from '@/components/OnboardingFlow'
import InstallPrompt from '@/components/InstallPrompt'
import { createClient } from '@/lib/supabase'

export default function AppPage() {
  const { user, profile, loading } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading && user && profile) {
      // Teachers go to their dedicated dashboard
      if (profile.user_type === 'teacher') {
        window.location.href = '/app/teacher'
        return
      }
      // If onboarding_complete is true, skip onboarding
      if (profile.onboarding_complete) {
        setNeedsOnboarding(false)
      } else {
        // Check if user has any songs — if yes, skip onboarding
        // (existing users from before the onboarding flow)
        const checkSongs = async () => {
          const supabase = createClient()
          const { data } = await supabase
            .from('songs')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

          setNeedsOnboarding(!data || data.length === 0)
        }
        checkSongs()
      }
    }
  }, [user, profile, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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