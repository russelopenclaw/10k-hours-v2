'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, Clock, Calendar, Users, Plus, X, Crown, ArrowRight, Loader2, LogOut, Settings } from 'lucide-react'
import TeacherDashboard from '@/components/TeacherDashboard'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Song = Database['public']['Tables']['songs']['Row']
type PracticeSession = Database['public']['Tables']['practice_sessions']['Row']

interface StudentWithStats {
  profile: Profile
  sessions: PracticeSession[]
  songs: Song[]
  streakDays: number
  totalMinutesThisWeek: number
  sessionsThisWeek: number
}

const FREE_STUDENT_LIMIT = 3

export default function TeacherRoster() {
  const { user, profile } = useAuth()
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addLink, setAddLink] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  const supabase = createClient()
  const isPro = profile?.subscription_status === 'premium'
  const studentCount = students.length
  const atFreeLimit = !isPro && studentCount >= FREE_STUDENT_LIMIT

  const fetchRoster = useCallback(async () => {
    if (!user) return
    try {
      // Get all students on this teacher's roster
      const { data: rosterEntries } = await supabase
        .from('teacher_students')
        .select('student_id')
        .eq('teacher_id', user.id)

      if (!rosterEntries || rosterEntries.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const studentIds = rosterEntries.map((r: { student_id: string }) => r.student_id)

      // Fetch all student profiles
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

      // Fetch all songs for these students
      const { data: allSongs } = await supabase
        .from('songs')
        .select('*')
        .in('user_id', studentIds)

      // Fetch all practice sessions for these students (last 60 days)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      const { data: allSessions } = await supabase
        .from('practice_sessions')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      // Build student stats
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay()) // start of this week (Sunday)
      weekStart.setHours(0, 0, 0, 0)

      const studentsWithStats: StudentWithStats[] = (studentProfiles || []).map((sp: Profile) => {
        const studentSongs = (allSongs || []).filter((s: Song) => s.user_id === sp.id)
        const studentSessions = (allSessions || []).filter((s: PracticeSession) => s.user_id === sp.id)

        // Calculate streak
        const uniqueDates = new Set(
          studentSessions.map((s: PracticeSession) => new Date(s.created_at).toDateString())
        )
        let streak = 0
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(now)
          checkDate.setDate(now.getDate() - i)
          if (uniqueDates.has(checkDate.toDateString())) streak++
          else if (i > 0) break
        }

        // This week's stats
        const weekSessions = studentSessions.filter((s: PracticeSession) => new Date(s.created_at) >= weekStart)
        const totalMinutesThisWeek = weekSessions.reduce((sum: number, s: PracticeSession) => sum + (s.duration_minutes || 0), 0)

        return {
          profile: sp,
          sessions: studentSessions,
          songs: studentSongs,
          streakDays: streak,
          totalMinutesThisWeek,
          sessionsThisWeek: weekSessions.length,
        }
      })

      // Sort by most recently active
      studentsWithStats.sort((a, b) => {
        const aLast = a.sessions[0]?.created_at || ''
        const bLast = b.sessions[0]?.created_at || ''
        return bLast.localeCompare(aLast)
      })

      setStudents(studentsWithStats)
    } catch (err) {
      console.error('Failed to fetch roster:', err)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchRoster()
  }, [fetchRoster])

  const handleAddStudent = async () => {
    if (!user || !addLink.trim()) return
    setAdding(true)
    setAddError('')

    try {
      // Extract token from magic link
      const tokenMatch = addLink.match(/\/share\/([a-zA-Z0-9-]+)/)
      if (!tokenMatch) {
        setAddError('Invalid link. Paste the full share link your student gave you.')
        setAdding(false)
        return
      }

      const token = tokenMatch[1]

      // Look up the share to get the student_id
      const { data: share } = await supabase
        .from('teacher_shares')
        .select('student_id, is_active')
        .eq('token', token)
        .single()

      if (!share) {
        setAddError('Share link not found. Make sure the link is correct and hasn\'t been revoked.')
        setAdding(false)
        return
      }

      if (!share.is_active) {
        setAddError('This share link has been revoked by the student.')
        setAdding(false)
        return
      }

      // Check if already on roster
      const { data: existing } = await supabase
        .from('teacher_students')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', share.student_id)
        .single()

      if (existing) {
        setAddError('This student is already on your roster.')
        setAdding(false)
        return
      }

      // Check free limit
      if (atFreeLimit) {
        setAddError(`Free teachers can have up to ${FREE_STUDENT_LIMIT} students. Upgrade to Teacher Pro for unlimited students.`)
        setAdding(false)
        return
      }

      // Add to roster
      const { error: insertError } = await supabase
        .from('teacher_students')
        .insert({
          teacher_id: user.id,
          student_id: share.student_id,
        })

      if (insertError) {
        setAddError('Failed to add student. Please try again.')
        setAdding(false)
        return
      }

      setShowAddModal(false)
      setAddLink('')
      fetchRoster() // Refresh roster
    } catch (err) {
      setAddError('Something went wrong. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!user) return
    await supabase
      .from('teacher_students')
      .delete()
      .eq('teacher_id', user.id)
      .eq('student_id', studentId)
    fetchRoster()
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  // If a student is selected, show their detailed view
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-[#0F1115]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F5F7FA] mb-6 text-sm transition-colors"
          >
            ← Back to Roster
          </button>
          <TeacherDashboard
            studentName={selectedStudent.profile.full_name || selectedStudent.profile.email}
            songs={selectedStudent.songs}
            sessions={selectedStudent.sessions}
            streakDays={selectedStudent.streakDays}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Top Nav */}
      <header className="bg-[#0F1115]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/cadent-logo-sm.png" alt="Cadent" className="h-8 w-8" />
              <h1 className="text-lg font-bold text-[#F5F7FA]">Cadent</h1>
              <span className="text-xs text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-full border border-[#22D3EE]/20">Teacher</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#9CA3AF] hidden sm:inline">{profile?.email}</span>
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
                className="p-2 text-[#6B7280] hover:text-[#F5F7FA] transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F7FA]">My Students</h1>
            <p className="text-[#9CA3AF] mt-1">
              {studentCount} student{studentCount !== 1 ? 's' : ''}
              {!isPro && (
                <span className="text-[#6B7280]"> · {FREE_STUDENT_LIMIT - studentCount} free slot{FREE_STUDENT_LIMIT - studentCount !== 1 ? 's' : ''} remaining</span>
              )}
            </p>
          </div>
          <Button
            onClick={() => atFreeLimit ? null : setShowAddModal(true)}
            className={`${atFreeLimit ? 'bg-[#27272a] text-[#6B7280] cursor-not-allowed' : 'bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9]'} gap-2`}
            disabled={atFreeLimit}
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>

        {/* Upgrade Banner for Free Teachers */}
        {!isPro && studentCount > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-[#5e6ad2]/10 to-[#22D3EE]/10 border-[#5e6ad2]/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-[#fbbf24]" />
                <div>
                  <p className="text-sm font-medium text-[#F5F7FA]">
                    {atFreeLimit ? 'Student limit reached' : `Free plan: ${FREE_STUDENT_LIMIT - studentCount} slot${FREE_STUDENT_LIMIT - studentCount !== 1 ? 's' : ''} left`}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">Upgrade to Teacher Pro for unlimited students, weekly digests, and more.</p>
                </div>
              </div>
              <Button size="sm" className="bg-[#5e6ad2] hover:bg-[#4f5bb5] text-white shrink-0">
                Upgrade
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Student Roster Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-[#22D3EE] animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <Card className="bg-[#181B22] border-white/[0.06]">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-[#27272a] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#F5F7FA] mb-2">No students yet</h3>
              <p className="text-sm text-[#9CA3AF] mb-6 max-w-md mx-auto">
                Add students by pasting the share link they give you. You can also visit a student&apos;s share link while logged in to auto-add them.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Student
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#181B22] border-white/[0.06]">
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.06] text-xs text-[#71717a] uppercase tracking-wide font-medium">
                <div className="col-span-4">Student</div>
                <div className="col-span-2 text-center">Streak</div>
                <div className="col-span-2 text-center">This Week</div>
                <div className="col-span-2 text-center">Sessions</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Student Rows */}
              {students.map((student) => (
                <div
                  key={student.profile.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#22D3EE]/10 flex items-center justify-center text-[#22D3EE] text-sm font-bold shrink-0">
                      {(student.profile.full_name || student.profile.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F5F7FA] truncate">
                        {student.profile.full_name || student.profile.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-[#6B7280] truncate">{student.profile.instrument || '—'}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    {student.streakDays > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm text-[#22D3EE]">
                        <Flame className="h-3.5 w-3.5" />
                        {student.streakDays}d
                      </span>
                    ) : (
                      <span className="text-sm text-[#525252]">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-sm text-[#9CA3AF]">
                    {formatDuration(student.totalMinutesThisWeek)}
                  </div>
                  <div className="col-span-2 text-center text-sm text-[#9CA3AF]">
                    {student.sessionsThisWeek}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedStudent(student)
                      }}
                      className="p-1.5 text-[#6B7280] hover:text-[#22D3EE] transition-colors"
                      title="View details"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveStudent(student.profile.id)
                      }}
                      className="p-1.5 text-[#6B7280] hover:text-[#ef4444] transition-colors"
                      title="Remove from roster"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-8 mt-4">
          <p className="text-sm text-[#6B7280]">
            Student data shared via <span className="font-semibold text-[#9CA3AF]">Cadent</span>
          </p>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151518] border border-[#27272a] rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-2">Add Student</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">
              Paste the share link your student gave you. You can find it in their app under &quot;Share with Teacher.&quot;
            </p>

            <input
              type="text"
              value={addLink}
              onChange={(e) => { setAddLink(e.target.value); setAddError('') }}
              placeholder="https://www.cadent.online/share/abc123..."
              className="w-full bg-[#0d0d0f] border border-[#27272a] rounded-md px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#22D3EE] min-h-[44px] mb-3"
              autoFocus
            />

            {addError && (
              <p className="text-sm text-[#ef4444] mb-3">{addError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => { setShowAddModal(false); setAddLink(''); setAddError('') }}
                className="text-[#9CA3AF] hover:text-[#F5F7FA]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={!addLink.trim() || adding}
                className="bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] gap-2"
              >
                {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Student
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}