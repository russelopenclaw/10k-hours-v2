'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Trophy, Medal, Music, Flame, Star, ArrowLeft } from 'lucide-react'
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

  useEffect(() => {
    if (!user) return

    const fetchLeaderboard = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch(`/api/leaderboard?period=${period}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load leaderboard')
          return
        }

        setEntries(data.leaderboard || [])
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError('Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [user, period])

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
          <div>
            <h1 className="text-xl font-bold text-[#F5F7FA]">Leaderboard</h1>
            <p className="text-sm text-[#9CA3AF]">See who's been practicing the most</p>
          </div>
        </div>

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
              Students will appear here once they start practicing.
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
        </div>
      </div>
    </div>
  )
}