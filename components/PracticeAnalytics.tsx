'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, TrendingUp, Music, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Database } from '@/lib/supabase'
import PracticeChart from './PracticeChart'

type PracticeSession = Database['public']['Tables']['practice_sessions']['Row']
type Song = Database['public']['Tables']['songs']['Row']

interface SongPracticeData {
  songId: string
  songTitle: string
  totalMinutes: number
  sessionCount: number
  lastPracticed: string
}

const calculateStreak = (sessions: PracticeSession[]): number => {
  if (sessions.length === 0) return 0
  const uniqueDates = new Set(
    sessions.map(session => new Date(session.created_at).toDateString())
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const dateString = checkDate.toDateString()
    if (uniqueDates.has(dateString)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export default function PracticeAnalytics() {
  const { user } = useAuth()
  const supabase = createClient()

  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [songData, setSongData] = useState<SongPracticeData[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [averageSessionLength, setAverageSessionLength] = useState(0)
  const [streakDays, setStreakDays] = useState(0)

  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const processData = useCallback((sessionsData: PracticeSession[], songsData: Song[]) => {
    const total = sessionsData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    const count = sessionsData.length
    const avg = count > 0 ? Math.round(total / count) : 0
    const streak = calculateStreak(sessionsData)

    setTotalMinutes(total)
    setTotalSessions(count)
    setAverageSessionLength(avg)
    setStreakDays(streak)

    const songMap = sessionsData.reduce((acc, session) => {
      const song = songsData.find(s => s.id === session.song_id)
      if (song) {
        if (!acc[song.id]) {
          acc[song.id] = {
            songId: song.id,
            songTitle: song.title || 'Unknown Song',
            totalMinutes: 0,
            sessionCount: 0,
            lastPracticed: session.created_at
          }
        }
        acc[song.id].totalMinutes += session.duration_minutes || 0
        acc[song.id].sessionCount += 1
        if (new Date(session.created_at) > new Date(acc[song.id].lastPracticed)) {
          acc[song.id].lastPracticed = session.created_at
        }
      }
      return acc
    }, {} as Record<string, SongPracticeData>)

    setSongData(Object.values(songMap).sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 10))
  }, [])

  const fetchData = useCallback(async (isInitial = false) => {
    if (!user) {
      setInitialLoading(false)
      return
    }
    // Only show full spinner on first load, not on time range changes
    if (isInitial) setInitialLoading(true)

    try {
      const now = new Date()
      const startDate = new Date()
      switch (timeRange) {
        case 'week': startDate.setDate(now.getDate() - 7); break
        case 'month': startDate.setMonth(now.getMonth() - 1); break
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break
      }
      startDate.setHours(0, 0, 0, 0)

      const { data: sessionsData } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', user.id)

      if (sessionsData && songsData) {
        setSessions(sessionsData)
        setSongs(songsData)
        processData(sessionsData, songsData)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setInitialLoading(false)
    }
  }, [user, timeRange, processData, supabase])

  useEffect(() => {
    if (!user) {
      setInitialLoading(false)
      return
    }
    fetchData(true)
    // Safety: never spin forever on initial load
    const timeout = setTimeout(() => setInitialLoading(false), 10000)
    return () => clearTimeout(timeout)
  }, [user]) // Only re-fetch when user changes, not timeRange

  // Re-fetch when time range changes (without spinner)
  useEffect(() => {
    if (user && !initialLoading) {
      fetchData(false)
    }
  }, [timeRange])

  useEffect(() => {
    const handleRefresh = () => fetchData(false)
    window.addEventListener('refreshAnalytics', handleRefresh)
    return () => window.removeEventListener('refreshAnalytics', handleRefresh)
  }, [fetchData])

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#22D3EE]" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 bg-[#181B22] rounded-2xl border border-white/[0.06]">
          <div className="w-16 h-16 bg-[#22D3EE]/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-[#22D3EE]" />
          </div>
          <h3 className="text-lg font-medium text-[#F5F7FA] mb-2">No practice data yet</h3>
          <p className="text-[#9CA3AF]">Start a practice session to see your analytics here</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { icon: Clock, label: 'Total Practice', value: formatDuration(totalMinutes), color: '#22D3EE' },
    { icon: Calendar, label: 'Practice Streak', value: `${streakDays} days`, color: '#34D399' },
    { icon: TrendingUp, label: 'Avg Session', value: `${averageSessionLength}m`, color: '#A78BFA' },
    { icon: Music, label: 'Sessions', value: totalSessions.toString(), color: '#F59E0B' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#F5F7FA]">Practice Analytics</h2>
        <Select value={timeRange} onValueChange={(value) => setTimeRange((value ?? 'month') as 'week' | 'month' | 'year')}>
          <SelectTrigger className="w-32 bg-[#181B22] border-white/[0.06] text-[#F5F7FA]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#181B22] border-white/[0.06]">
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="bg-[#181B22] border-white/[0.06] card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm text-[#9CA3AF]">{label}</p>
                  <p className="text-2xl font-bold text-[#F5F7FA]">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PracticeChart sessions={sessions} songs={songs} />

      <Card className="bg-[#181B22] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-[#F5F7FA]">Most Practiced Songs</CardTitle>
        </CardHeader>
        <CardContent>
          {songData.length > 0 ? (
            <div className="space-y-3">
              {songData.map((song, index) => (
                <div key={song.songId} className="flex items-center justify-between p-3 bg-[#0F1115] rounded-xl border border-white/[0.04]">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#22D3EE]/[0.08] rounded-lg">
                      <span className="text-sm font-bold text-[#22D3EE]">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#F5F7FA]">{song.songTitle}</p>
                      <p className="text-sm text-[#9CA3AF]">
                        Last practiced: {formatDate(song.lastPracticed)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#F5F7FA]">{formatDuration(song.totalMinutes)}</p>
                    <p className="text-sm text-[#9CA3AF]">{song.sessionCount} sessions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#9CA3AF] text-center py-8">No song practice data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}