'use client'

import { useAuth } from '@/components/AuthProvider'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TeacherRoster from '@/components/TeacherRoster'
import { Loader2 } from 'lucide-react'

export default function TeacherRosterContent() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const upgraded = searchParams.get('upgraded')
  const [waitingForUpgrade, setWaitingForUpgrade] = useState(upgraded === 'true')
  const polledOnce = useRef(false)

  // When returning from Stripe with ?upgraded=true, poll for the profile update.
  // The webhook updates subscription_status in Supabase, but it might not
  // have processed yet when the page loads. Poll every 2s for up to 30s.
  useEffect(() => {
    if (upgraded !== 'true' || !user || polledOnce.current) return
    polledOnce.current = true

    if (profile?.subscription_status === 'premium') {
      // Webhook already processed — clean up URL and stop waiting
      setWaitingForUpgrade(false)
      window.history.replaceState({}, '', '/app/teacher')
      return
    }

    let attempts = 0
    const maxAttempts = 15 // 30 seconds max
    const interval = setInterval(async () => {
      attempts++
      // Re-fetch profile from Supabase
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      if (data?.subscription_status === 'premium') {
        // Webhook processed — refresh AuthProvider profile and stop waiting
        // AuthProvider will pick up the change on next render cycle
        window.location.reload()
        clearInterval(interval)
      } else if (attempts >= maxAttempts) {
        // Give up polling — show the page anyway
        setWaitingForUpgrade(false)
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [upgraded, user, profile?.subscription_status])

  useEffect(() => {
    if (loading || !user || !profile) return

    if (profile.user_type !== 'teacher') {
      router.replace('/app')
    }
  }, [user, profile, loading, router])

  // Show spinner while auth or profile is loading
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#22D3EE] animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.replace('/login?next=/app/teacher')
    return null
  }

  if (profile.user_type !== 'teacher') {
    return null // Will redirect to /app
  }

  if (waitingForUpgrade) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-[#22D3EE] animate-spin" />
        <p className="text-[#9CA3AF] text-sm">Processing your upgrade…</p>
      </div>
    )
  }

  return <TeacherRoster />
}