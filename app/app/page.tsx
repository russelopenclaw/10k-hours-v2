'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import Dashboard from '@/components/Dashboard'
import OnboardingFlow from '@/components/OnboardingFlow'
import { createClient } from '@/lib/supabase'

export default function AppPage() {
  const { user, profile, loading } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading && user && profile) {
      // Check if user has completed onboarding
      // If onboarding_complete field doesn't exist yet, check if they have any songs
      const hasCompletedOnboarding = 'onboarding_complete' in profile 
        ? (profile as Record<string, unknown>).onboarding_complete === true
        : false
      
      // Also check if they have songs (existing users shouldn't see onboarding)
      if (hasCompletedOnboarding) {
        setNeedsOnboarding(false)
      } else {
        // Check if user has any songs — if yes, skip onboarding
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

  return <Dashboard />
}