'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Trophy, Flame } from 'lucide-react'

interface DayStreakAchievementProps {
  onPracticeComplete?: () => void
}

export default function DayStreakAchievement({ }: DayStreakAchievementProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [streak, setStreak] = useState(0)
  const [showAchievement, setShowAchievement] = useState(false)
  const [, setIsFirstPracticeToday] = useState(false)

  useEffect(() => {
    if (user) {
      calculateStreak()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const handlePracticeComplete = () => {
      checkFirstPracticeToday()
    }

    window.addEventListener('practiceSessionCompleted', handlePracticeComplete)
    return () => window.removeEventListener('practiceSessionCompleted', handlePracticeComplete)
  }, [user])

  const calculateStreak = async () => {
    if (!user) return

    try {
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching practice sessions:', error)
        return
      }

      if (!sessions || sessions.length === 0) {
        setStreak(0)
        return
      }

      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const uniqueDates = new Set<string>()
      sessions.forEach((session: { created_at: string }) => {
        const sessionDate = new Date(session.created_at)
        sessionDate.setHours(0, 0, 0, 0)
        uniqueDates.add(sessionDate.toISOString())
      })

      const sortedDates = Array.from(uniqueDates).sort().reverse()

      for (let i = 0; i < sortedDates.length; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)

        if (sortedDates.includes(checkDate.toISOString())) {
          currentStreak++
        } else {
          break
        }
      }

      setStreak(currentStreak)
    } catch (error) {
      console.error('Error calculating streak:', error)
    }
  }

  const checkFirstPracticeToday = async () => {
    if (!user) return

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: todaySessions, error } = await supabase
        .from('practice_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      if (error) {
        console.error('Error checking today sessions:', error)
        return
      }

      if (todaySessions && todaySessions.length === 1) {
        setIsFirstPracticeToday(true)
        await calculateStreak()
        setShowAchievement(true)

        setTimeout(() => {
          setShowAchievement(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Error checking first practice today:', error)
    }
  }

  if (streak === 0) return null

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all duration-500 ${
      showAchievement
        ? 'bg-[#22D3EE]/20 text-[#22D3EE] shadow-[0_0_20px_rgba(34,211,238,0.2)] scale-110'
        : 'bg-white/[0.04] text-[#9CA3AF] border border-white/[0.06]'
    }`}>
      <div className={`transition-all duration-500 ${showAchievement ? 'animate-bounce' : ''}`}>
        {showAchievement ? (
          <Trophy className="h-5 w-5 text-[#F59E0B]" />
        ) : (
          <Flame className="h-4 w-4" />
        )}
      </div>
      <span className={`font-semibold text-sm transition-all duration-500 hidden sm:inline ${
        showAchievement ? 'text-[#22D3EE]' : 'text-[#9CA3AF]'
      }`}>
        {streak} Day Streak
      </span>
      <span className={`font-semibold text-sm transition-all duration-500 sm:hidden ${
        showAchievement ? 'text-[#22D3EE]' : 'text-[#9CA3AF]'
      }`}>
        {streak}d
      </span>
      {showAchievement && (
        <div className="text-xs font-medium animate-pulse text-[#22D3EE]">
          Keep it up!
        </div>
      )}
    </div>
  )
}