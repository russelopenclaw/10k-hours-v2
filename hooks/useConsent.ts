'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

type ConsentStatus = 'not_required' | 'pending' | 'verified' | 'denied'

interface ConsentInfo {
  consentStatus: ConsentStatus
  isUnder13: boolean
  isRestricted: boolean // true if features should be gated
  loading: boolean
}

/**
 * Hook to check if the current user has verified parent consent.
 * Used to gate features like public leaderboard, recording, media attachments.
 *
 * isRestricted = true means the user is under 13 and hasn't had their parent verify yet.
 * When consentStatus is 'not_required' (13+), isRestricted is false.
 * When consentStatus is 'verified', isRestricted is false (parent approved).
 */
export function useConsent(): ConsentInfo {
  const { user } = useAuth()
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('not_required')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchConsent = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('consent_status')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setConsentStatus(data?.consent_status || 'not_required')
      } catch (err) {
        console.error('Error fetching consent status:', err)
        // Default to not_required so features aren't accidentally locked
        setConsentStatus('not_required')
      } finally {
        setLoading(false)
      }
    }

    fetchConsent()
  }, [user])

  const isUnder13 = consentStatus === 'pending' || consentStatus === 'denied'
  const isRestricted = consentStatus === 'pending' || consentStatus === 'denied'

  return {
    consentStatus,
    isUnder13,
    isRestricted,
    loading,
  }
}