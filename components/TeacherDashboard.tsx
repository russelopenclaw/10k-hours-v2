'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, TrendingUp, Music, Flame } from 'lucide-react'
import { Database } from '@/lib/supabase'

type Song = Database['public']['Tables']['songs']['Row']
type PracticeSession = Database['public']['Tables']['practice_sessions']['Row']

interface TeacherDashboardProps {
  studentName: string
  songs: Song[]
  sessions: PracticeSession[]
  streakDays: number
}

export default function TeacherDashboard({ studentName, songs, sessions, streakDays }: TeacherDashboardProps) {
  const totalMinutes = useMemo(() =>
    sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
    [sessions]
  )

  const totalSessions = sessions.length

  const averageSessionLength = useMemo(() =>
    totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    [totalMinutes, totalSessions]
  )

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const songStats = useMemo(() => {
    const songMap = sessions.reduce((acc, session) => {
      const song = songs.find(s => s.id === session.song_id)
      if (song) {
        if (!acc[song.id]) {
          acc[song.id] = {
            title: song.title,
            totalMinutes: 0,
            sessionCount: 0,
            lastPracticed: session.created_at,
            color: song.color,
          }
        }
        acc[song.id].totalMinutes += session.duration_minutes || 0
        acc[song.id].sessionCount += 1
        if (new Date(session.created_at) > new Date(acc[song.id].lastPracticed)) {
          acc[song.id].lastPracticed = session.created_at
        }
      }
      return acc
    }, {} as Record<string, { title: string; totalMinutes: number; sessionCount: number; lastPracticed: string; color: string }>)

    return Object.entries(songMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 10)
  }, [sessions, songs])

  const recentSessions = useMemo(() =>
    sessions.slice(0, 10),
    [sessions]
  )

  const chartData = useMemo(() => {
    const now = new Date()
    const data: Array<{ label: string; totalMinutes: number }> = []

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayMinutes = sessions
        .filter(s => s.created_at.startsWith(dateStr))
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

      data.push({
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalMinutes: dayMinutes
      })
    }

    return data
  }, [sessions])

  const maxChartMinutes = Math.max(...chartData.map(d => d.totalMinutes), 30)

  return (
    <div className="min-h-screen bg-[#0F1115]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F7FA]">{studentName}</h1>
            <p className="text-[#9CA3AF] mt-1">Practice Dashboard</p>
          </div>
          {streakDays > 0 && (
            <div className="flex items-center gap-2 bg-[#22D3EE]/[0.08] text-[#22D3EE] px-4 py-2 rounded-full border border-[#22D3EE]/20">
              <Flame className="h-5 w-5" />
              <span className="font-semibold">{streakDays} day streak</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#181B22] border-white/[0.06] card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#22D3EE]/[0.08] rounded-lg">
                  <Clock className="h-5 w-5 text-[#22D3EE]" />
                </div>
                <div>
                  <p className="text-sm text-[#9CA3AF]">Total Practice Time</p>
                  <p className="text-2xl font-bold text-[#F5F7FA]">{formatDuration(totalMinutes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#181B22] border-white/[0.06] card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#34D399]/[0.08] rounded-lg">
                  <Calendar className="h-5 w-5 text-[#34D399]" />
                </div>
                <div>
                  <p className="text-sm text-[#9CA3AF]">Total Sessions</p>
                  <p className="text-2xl font-bold text-[#F5F7FA]">{totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#181B22] border-white/[0.06] card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#A78BFA]/[0.08] rounded-lg">
                  <TrendingUp className="h-5 w-5 text-[#A78BFA]" />
                </div>
                <div>
                  <p className="text-sm text-[#9CA3AF]">Avg Session Length</p>
                  <p className="text-2xl font-bold text-[#F5F7FA]">{averageSessionLength} min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Practice Chart */}
        <Card className="mb-8 bg-[#181B22] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-[#F5F7FA]">Practice Time (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col-reverse justify-between text-xs text-[#6B7280]">
                {[0, Math.round(maxChartMinutes * 0.25), Math.round(maxChartMinutes * 0.5), Math.round(maxChartMinutes * 0.75), maxChartMinutes].map(value => (
                  <div key={value} className="text-right pr-1">
                    {value}m
                  </div>
                ))}
              </div>
              <div className="ml-12">
                <div className="flex items-end justify-between h-48 border-b border-l border-white/[0.06] gap-px">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                      <div
                        className="w-full bg-[#22D3EE] rounded-t transition-all duration-200 hover:bg-[#67E8F9]"
                        style={{
                          height: `${Math.max((item.totalMinutes / maxChartMinutes) * 180, item.totalMinutes > 0 ? 4 : 0)}px`,
                        }}
                        title={`${item.label}: ${formatDuration(item.totalMinutes)}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-[#6B7280]">30 days ago</span>
                  <span className="text-xs text-[#6B7280]">Today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Practiced Songs */}
        <Card className="mb-8 bg-[#181B22] border-white/[0.06]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-[#22D3EE]" />
              <CardTitle className="text-[#F5F7FA]">Most Practiced Songs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {songStats.length > 0 ? (
              <div className="space-y-3">
                {songStats.map((song, index) => (
                  <div key={song.id} className="flex items-center justify-between p-3 bg-[#0F1115] rounded-xl border border-white/[0.04]">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: song.color }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#9CA3AF]">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-sm text-[#F5F7FA]">{song.title}</p>
                          <p className="text-xs text-[#6B7280]">
                            Last practiced: {new Date(song.lastPracticed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold text-sm text-[#F5F7FA]">{formatDuration(song.totalMinutes)}</p>
                      <p className="text-xs text-[#6B7280]">{song.sessionCount} sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#9CA3AF] text-center py-6">No song practice data available yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="mb-8 bg-[#181B22] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-[#F5F7FA]">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-2">
                {recentSessions.map((session) => {
                  const song = songs.find(s => s.id === session.song_id)
                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-[#0F1115] rounded-xl border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        {song && (
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: song.color }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm text-[#F5F7FA]">{song?.title || 'Unknown Song'}</p>
                          <p className="text-xs text-[#6B7280]">
                            {new Date(session.created_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-[#22D3EE]/[0.08] text-[#22D3EE] border-[#22D3EE]/20">
                        {formatDuration(session.duration_minutes || 0)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[#9CA3AF] text-center py-6">No practice sessions recorded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-sm text-[#6B7280]">
            Shared via <span className="font-semibold text-[#9CA3AF]">Cadent</span>
          </p>
        </div>
      </div>
    </div>
  )
}