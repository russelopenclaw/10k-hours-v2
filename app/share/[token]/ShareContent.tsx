'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TeacherDashboard from '@/components/TeacherDashboard'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Song = Database['public']['Tables']['songs']['Row']
type PracticeSession = Database['public']['Tables']['practice_sessions']['Row']

interface ShareData {
  profile: { full_name: string | null; email: string }
  songs: Song[]
  sessions: PracticeSession[]
  student_id: string
}

export default function SharePage() {
  const params = useParams()
  const token = params.token as string
  const { user, profile } = useAuth()
  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoAdded, setAutoAdded] = useState(false)

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

  // Auto-add student to teacher's roster when a logged-in teacher visits a share link
  useEffect(() => {
    if (!user || !profile || profile.user_type !== 'teacher' || !data?.student_id || autoAdded) return

    const autoAddStudent = async () => {
      const supabase = createClient()

      // Check if already on roster
      const { data: existing } = await supabase
        .from('teacher_students')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', data.student_id)
        .single()

      if (existing) {
        setAutoAdded(true)
        return
      }

      // Add to roster (respect free tier limit)
      const { error: insertError } = await supabase
        .from('teacher_students')
        .insert({
          teacher_id: user.id,
          student_id: data.student_id,
        })

      if (!insertError) {
        setAutoAdded(true)
      }
    }

    autoAddStudent()
  }, [user, profile, data, autoAdded])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1115]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1115]">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Share Link Not Found</h2>
          <p className="text-[#9CA3AF]">{error}</p>
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
    <div className="min-h-screen bg-[#0F1115]">
      {/* Auto-add banner for logged-in teachers */}
      {user && profile?.user_type === 'teacher' && autoAdded && (
        <div className="bg-[#22D3EE]/10 border-b border-[#22D3EE]/20 px-4 py-2 text-center">
          <p className="text-sm text-[#22D3EE]">
            ✅ Student added to your roster.{' '}
            <a href="/app/teacher" className="underline font-medium hover:text-[#67E8F9]">
              View all students →
            </a>
          </p>
        </div>
      )}
      {user && profile?.user_type === 'teacher' && !autoAdded && data?.student_id && (
        <div className="bg-[#fbbf24]/10 border-b border-[#fbbf24]/20 px-4 py-2 text-center">
          <p className="text-sm text-[#fbbf24]">
            Adding student to your roster...
          </p>
        </div>
      )}
      <TeacherDashboard
        studentName={data.profile?.full_name || data.profile?.email || 'Student'}
        songs={data.songs}
        sessions={data.sessions}
        streakDays={calculateStreak()}
      />
    </div>
  )
}