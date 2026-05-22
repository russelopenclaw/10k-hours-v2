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
  const [loading, setLoading] = useState(true)
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

  const fetchData = useCallback(async () => {
    if (!user) return

    setLoading(true)

    try {
      const now = new Date()
      const startDate = new Date()

      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
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
      setLoading(false)
    }
  }, [user, timeRange, processData, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleRefresh = () => {
      fetchData()
    }

    window.addEventListener('refreshAnalytics', handleRefresh)
    return () => {
      window.removeEventListener('refreshAnalytics', handleRefresh)
    }
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Practice Analytics</h2>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No practice data yet</h3>
          <p className="text-gray-500">Start a practice session to see your analytics here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Practice Analytics</h2>
        <Select value={timeRange} onValueChange={(value) => setTimeRange((value ?? 'month') as 'week' | 'month' | 'year')}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Practice</p>
                <p className="text-2xl font-bold">{formatDuration(totalMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Practice Streak</p>
                <p className="text-2xl font-bold">{streakDays} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold">{averageSessionLength}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Music className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PracticeChart sessions={sessions} songs={songs} />

      <Card>
        <CardHeader>
          <CardTitle>Most Practiced Songs</CardTitle>
        </CardHeader>
        <CardContent>
          {songData.length > 0 ? (
            <div className="space-y-3">
              {songData.map((song, index) => (
                <div key={song.songId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{song.songTitle}</p>
                      <p className="text-sm text-gray-500">
                        Last practiced: {formatDate(song.lastPracticed)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatDuration(song.totalMinutes)}</p>
                    <p className="text-sm text-gray-500">{song.sessionCount} sessions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No song practice data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}