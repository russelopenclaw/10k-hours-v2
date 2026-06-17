'use client'

import { useAuth } from '@/components/AuthProvider'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TeacherRoster from '@/components/TeacherRoster'
import { Loader2 } from 'lucide-react'

export default function TeacherRosterContent() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

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

  return <TeacherRoster />
}