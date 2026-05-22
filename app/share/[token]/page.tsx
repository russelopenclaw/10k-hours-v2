'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TeacherDashboard from '@/components/TeacherDashboard'
import { Database } from '@/lib/supabase'

type Song = Database['public']['Tables']['songs']['Row']
type PracticeSession = Database['public']['Tables']['practice_sessions']['Row']

interface ShareData {
  profile: { full_name: string | null; email: string }
  songs: Song[]
  sessions: PracticeSession[]
}

export default function SharePage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/share/${token}`)
        if (!res.ok) throw new Error('Share link not found or has been revoked')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load share data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Share Link Not Found</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const calculateStreak = () => {
    if (!data.sessions.length) return 0
    const uniqueDates = new Set(data.sessions.map(s => new Date(s.created_at).toDateString()))
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      if (uniqueDates.has(checkDate.toDateString())) streak++
      else if (i > 0) break
    }
    return streak
  }

  return (
    <TeacherDashboard
      studentName={data.profile?.full_name || data.profile?.email || 'Student'}
      songs={data.songs}
      sessions={data.sessions}
      streakDays={calculateStreak()}
    />
  )
}