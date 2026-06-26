'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Trophy, Medal, Music, Flame, Star, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  user_id: string
  display_name: string
  instrument: string | null
  total_coins_earned: number
  practice_days: number
  current_streak: number
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibility, setVisibility] = useState(true)
  const [isTeacher, setIsTeacher] = useState(false)
  const [updatingVisibility, setUpdatingVisibility] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchProfileAndLeaderboard = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Check if teacher or student to determine view param
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single()

        const teacher = profile?.user_type === 'teacher'
        setIsTeacher(teacher)

        const viewParam = teacher ? 'teacher' : 'student'
        const res = await fetch(`/api/leaderboard?period=${period}&view=${viewParam}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load leaderboard')
          return
        }

        setEntries(data.leaderboard || [])
        // Students get their visibility setting back from the API
        if (!teacher && data.visibility !== undefined) {
          setVisibility(data.visibility)
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError('Failed to load leader board')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileAndLeaderboard()
  }, [user, period])

  const toggleVisibility = useCallback(async () => {
    if (!user || updatingVisibility) return
    setUpdatingVisibility(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const newValue = !visibility
      const res = await fetch('/api/leaderboard/visibility', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ leaderboard_visibility: newValue })
      })

      if (!res.ok) {
        const data = await res.json()
        console.error('Failed to update visibility:', data.error)
        return
      }

      setVisibility(newValue)
    } catch (err) {
      console.error('Error toggling visibility:', err)
    } finally {
      setUpdatingVisibility(false)
    }
  }, [user, visibility, updatingVisibility])

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
    if (index === 1) return 'bg-[#9CA3AF]/10 border-[#9CA3AF]/30 text-[#9CA3AF]'
    if (index === 2) return 'bg-[#CD7F32]/10 border-[#CD7F32]/30 text-[#CD7F32]'
    return 'bg-white/[0.02] border-white/[0.06] text-[#F5F7FA]'
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-[#F59E0B]" />
    if (index === 1) return <Medal className="h-5 w-5 text-[#9CA3AF]" />
    if (index === 2) return <Medal className="h-5 w-5 text-[#CD7F32]" />
    return <span className="text-sm font-mono text-[#6B7280] w-5 text-center">{index + 1}</span>
  }

  return (
    <div className="min-h-screen bg-[#0B0D10]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/app" className="text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#F5F7FA]">Leader Board</h1>
            <p className="text-sm text-[#9CA3AF]">
              {isTeacher ? 'All students in your studio' : 'See who\'s been practicing the most'}
            </p>
          </div>
        </div>

        {/* Student visibility toggle */}
        {!isTeacher && (
          <div className="mb-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <button
              onClick={toggleVisibility}
              disabled={updatingVisibility}
              className="w-full flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex items-center gap-2">
                {visibility ? (
                  <Eye className="h-4 w-4 text-[#22D3EE]" />
                ) : (
                  <EyeOff className="h-4 w-4 text-[#6B7280]" />
                )}
                <div className="text-left">
                  <span className={visibility ? 'text-[#F5F7FA]' : 'text-[#9CA3AF]'}>
                    {visibility ? 'Visible on leader board' : 'Hidden from leader board'}
                  </span>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {visibility
                      ? 'Other students can see your points and rank'
                      : 'Only you and your teacher can see your practice data'}
                  </p>
                </div>
              </div>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${
                visibility ? 'bg-[#22D3EE]/30' : 'bg-white/[0.06]'
              }`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                  visibility ? 'left-5 bg-[#22D3EE]' : 'left-0.5 bg-[#6B7280]'
                }`} />
              </div>
            </button>
          </div>
        )}

        {/* Period Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === '7d'
                ? 'bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/30'
                : 'bg-white/[0.02] text-[#9CA3AF] border border-white/[0.06] hover:text-[#F5F7FA]'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === '30d'
                ? 'bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/30'
                : 'bg-white/[0.02] text-[#9CA3AF] border border-white/[0.06] hover:text-[#F5F7FA]'
            }`}
          >
            Last 30 Days
          </button>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/[0.04] rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/[0.04] rounded w-1/3 mb-2" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/4" />
                  </div>
                  <div className="h-5 bg-white/[0.04] rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#9CA3AF]">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-[#6B7280] mx-auto mb-3" />
            <h3 className="text-lg font-medium text-[#F5F7FA] mb-1">No practice data yet</h3>
            <p className="text-sm text-[#9CA3AF]">
              {isTeacher
                ? 'Students will appear here once they start practicing.'
                : 'Start practicing to see yourself on the leader board!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`rounded-xl border p-4 transition-all ${getRankStyle(index)}`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="shrink-0 flex items-center justify-center w-8">
                    {getRankIcon(index)}
                  </div>

                  {/* Avatar / Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{entry.display_name}</span>
                      {entry.instrument && (
                        <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                          <Music className="h-3 w-3" />
                          {entry.instrument}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {entry.current_streak > 0 && (
                        <span className="flex items-center gap-1 text-xs text-[#F59E0B]">
                          <Flame className="h-3 w-3" />
                          {entry.current_streak}d streak
                        </span>
                      )}
                      <span className="text-xs text-[#6B7280]">
                        {entry.practice_days} {entry.practice_days === 1 ? 'day' : 'days'} practiced
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="shrink-0 flex items-center gap-1.5 bg-[#F59E0B]/10 px-3 py-1.5 rounded-full">
                    <Star className="h-4 w-4 text-[#F59E0B]" />
                    <span className="font-bold text-sm text-[#F59E0B] tabular-nums">
                      {entry.total_coins_earned.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">How points work</h3>
          <ul className="text-xs text-[#6B7280] space-y-1">
            <li>1 minute of practice = 1 point</li>
            <li>3-day streak: 1.5x multiplier</li>
            <li>7-day streak: 2x multiplier</li>
            <li>14-day streak: 3x multiplier</li>
            <li>30-day streak: 5x multiplier</li>
          </ul>
          {!isTeacher && (
            <p className="text-xs text-[#6B7280] mt-3 pt-3 border-t border-white/[0.06]">
              You can choose to show or hide your points from other students.
              Your teacher can always see your practice data.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}