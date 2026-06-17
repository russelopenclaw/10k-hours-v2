'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Flame, Clock, Calendar, Users, Plus, X, Crown, ArrowRight, Loader2, LogOut, ClipboardList, Lock, Key, Mail, User, ChevronDown, PenLine } from 'lucide-react'
import TeacherDashboard from '@/components/TeacherDashboard'
import StudentComparison from '@/components/StudentComparison'
import AssignmentModal from '@/components/AssignmentModal'
import ChangePasswordDialog from '@/components/ChangePasswordDialog'
import ChangeEmailDialog from '@/components/ChangeEmailDialog'
import ChangeDisplayNameDialog from '@/components/ChangeDisplayNameDialog'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Song = Database['public']['Tables']['songs']['Row']
type PracticeSession = Database['public']['Tables']['practice_sessions']['Row']

export interface StudentWithStats {
  profile: Profile
  sessions: PracticeSession[]
  songs: Song[]
  streakDays: number
  totalMinutesThisWeek: number
  sessionsThisWeek: number
}

const FREE_STUDENT_LIMIT = 3

export default function TeacherRoster() {
  const { user, profile, signOut, updatePassword, updateEmail, updateDisplayName } = useAuth()
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangeDisplayName, setShowChangeDisplayName] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignToStudent, setAssignToStudent] = useState<StudentWithStats | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [addInput, setAddInput] = useState('')
  const [addError, setAddError] = useState('')

  const supabase = createClient()
  const isPro = profile?.subscription_status === 'premium'
  const studentCount = students.length
  const atFreeLimit = !isPro && studentCount >= FREE_STUDENT_LIMIT
  const lockedStudentCount = !isPro ? Math.max(0, studentCount - FREE_STUDENT_LIMIT) : 0
  const hasLockedStudents = lockedStudentCount > 0

  const handleUpgrade = async (plan: 'monthly' | 'annual' = 'monthly') => {
    setUpgrading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/stripe/checkout?plan=${plan}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data.error)
      }
    } catch (err) {
      console.error('Upgrade failed:', err)
    } finally {
      setUpgrading(false)
    }
  }

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
    if (!user || !addInput.trim()) return
    setAdding(true)
    setAddError('')

    try {
      const input = addInput.trim()

      // Determine if it's a short code (CAD-XXXX) or a URL
      let shortCode: string | undefined
      let token: string | undefined

      if (input.startsWith('CAD-')) {
        shortCode = input.toUpperCase()
      } else if (input.match(/\/share\//)) {
        // Extract from URL: /share/CAD-XXXX or /share/uuid
        const tokenMatch = input.match(/\/share\/([a-zA-Z0-9-]+)/)
        if (!tokenMatch) {
          setAddError('Invalid link. Paste the full share link or the code (e.g. CAD-4X7K).')
          return
        }
        const extracted = tokenMatch[1]
        if (extracted.startsWith('CAD-')) {
          shortCode = extracted.toUpperCase()
        } else {
          token = extracted
        }
      } else {
        setAddError('Enter a share code (e.g. CAD-4X7K) or the full share link.')
        return
      }

      // Use server-side API to add student (bypasses RLS)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setAddError('Session expired. Please refresh the page and try again.')
        return
      }

      const res = await fetch('/api/teacher/add-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ token, shortCode })
      })

      const data = await res.json()

      if (!res.ok) {
        setAddError(data.error || 'Something went wrong.')
        return
      }

      setShowAddModal(false)
      setAddInput('')
      await fetchRoster() // Refresh roster
    } catch (err) {
      setAddError('Something went wrong. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!user) return
    // Remove from roster
    await supabase
      .from('teacher_students')
      .delete()
      .eq('teacher_id', user.id)
      .eq('student_id', studentId)
    // Also revoke the student's share that was claimed by this teacher
    await supabase
      .from('teacher_shares')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('claimed_by', user.id)
      .eq('student_id', studentId)
      .eq('is_active', true)
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
    const isSelectedLocked = !isPro && students.indexOf(selectedStudent) >= FREE_STUDENT_LIMIT
    if (isSelectedLocked) {
      return (
        <div className="min-h-screen bg-[#0F1115]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={() => setSelectedStudent(null)}
              className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F5F7FA] mb-6 text-sm transition-colors"
            >
              ← Back to Roster
            </button>
            <div className="text-center py-16">
              <Lock className="h-12 w-12 text-[#525252] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#F5F7FA] mb-2">
                🔒 Upgrade to view {selectedStudent.profile.full_name || selectedStudent.profile.email.split('@')[0]}&apos;s details
              </h2>
              <p className="text-sm text-[#9CA3AF] mb-6 max-w-md mx-auto">
                Upgrade to Teacher Pro to unlock all students and their full practice data.
              </p>
              <Button className="bg-[#5e6ad2] hover:bg-[#4f5bb5] text-white" onClick={() => handleUpgrade()} disabled={upgrading}>
                {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade to Teacher Pro'}
              </Button>
            </div>
          </div>
        </div>
      )
    }
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
              <span className="text-xs text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-full border border-[#22D3EE]/20">Teacher Portal</span>
              {isPro && (
                <span className="text-xs text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded-full border border-[#fbbf24]/20 flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Pro
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-[120px] truncate">{profile?.full_name || 'Teacher'}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="font-medium text-sm">{profile?.full_name || 'Teacher'}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setShowChangeDisplayName(true)}>
                      <PenLine className="h-4 w-4 mr-2" />
                      Change Display Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowChangeEmail(true)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Change Email
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  {isPro && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession()
                          const res = await fetch('/api/stripe/portal', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${session?.access_token}` },
                          })
                          const data = await res.json()
                          if (data.url) window.location.href = data.url
                        } catch (err) { console.error('Portal error:', err) }
                      }}>
                        <Crown className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
              {!isPro && studentCount <= FREE_STUDENT_LIMIT && (
                <span className="text-[#6B7280]"> · {FREE_STUDENT_LIMIT - studentCount} free slot{FREE_STUDENT_LIMIT - studentCount !== 1 ? 's' : ''} remaining</span>
              )}
              {hasLockedStudents && (
                <span className="text-[#ef4444]/80"> · {lockedStudentCount} locked</span>
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
                    {hasLockedStudents
                      ? `Your free plan includes 3 students. ${lockedStudentCount} student${lockedStudentCount !== 1 ? 's are' : ' is'} locked.`
                      : atFreeLimit
                        ? 'Student limit reached'
                        : `Free plan: ${FREE_STUDENT_LIMIT - studentCount} slot${FREE_STUDENT_LIMIT - studentCount !== 1 ? 's' : ''} left`}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {hasLockedStudents
                      ? 'Upgrade to Teacher Pro to unlock all students.'
                      : 'Upgrade to Teacher Pro for unlimited students, weekly digests, and more.'}
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-[#5e6ad2] hover:bg-[#4f5bb5] text-white shrink-0" onClick={() => handleUpgrade()} disabled={upgrading}>
                {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Trial Countdown Banner */}
        {(() => {
          const trialEndDate = profile?.trial_end ? new Date(profile.trial_end) : null
          const trialDaysRemaining = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
          const isTrial = isPro && trialEndDate && trialEndDate > new Date()
          return isTrial ? (
            <div className="bg-[#22D3EE]/5 border border-[#22D3EE]/20 rounded-lg p-3 mb-6">
              <p className="text-sm text-[#22D3EE] text-center">
                🎓 You're on a 14-day free trial. {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining.
              </p>
            </div>
          ) : null
        })()}

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
                Ask your student for their share code (e.g. CAD-4X7K) or share link, then add them here.
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
              {students.map((student, index) => {
                const isLocked = !isPro && index >= FREE_STUDENT_LIMIT
                return (
                <div
                  key={student.profile.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.04] transition-colors items-center ${isLocked ? 'opacity-50 cursor-default' : 'hover:bg-white/[0.02] cursor-pointer'}`}
                  onClick={isLocked ? undefined : () => setSelectedStudent(student)}
                >
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isLocked ? 'bg-[#27272a] text-[#525252]' : 'bg-[#22D3EE]/10 text-[#22D3EE]'}`}>
                      {(student.profile.full_name || student.profile.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F5F7FA] truncate">
                        {student.profile.full_name || student.profile.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-[#6B7280] truncate">{student.profile.instrument || '—'}</p>
                    </div>
                  </div>
                  {isLocked ? (
                    <>
                      <div className="col-span-6 flex items-center justify-center gap-1 text-sm text-[#525252]">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Upgrade to view</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <Lock className="h-4 w-4 text-[#525252]" />
                      </div>
                    </>
                  ) : (
                    <>
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
                            setAssignToStudent(student)
                            setShowAssignModal(true)
                          }}
                          className="p-1.5 text-[#6B7280] hover:text-[#5e6ad2] transition-colors"
                          title="Assign piece"
                        >
                          <ClipboardList className="h-4 w-4" />
                        </button>
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
                    </>
                  )}
                </div>
                )})}
            </CardContent>
          </Card>
        )}

        {/* Student Comparison View */}
        {!loading && students.length >= 2 && (isPro || students.length <= FREE_STUDENT_LIMIT) && (
          <div className="mt-6">
            <StudentComparison students={students} />
          </div>
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
              Enter the share code your student gave you (e.g. CAD-4X7K) or paste their share link.
            </p>

            <input
              type="text"
              value={addInput}
              onChange={(e) => { setAddInput(e.target.value); setAddError('') }}
              placeholder="CAD-4X7K or https://www.cadent.online/share/CAD-4X7K"
              className="w-full bg-[#0d0d0f] border border-[#27272a] rounded-md px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#22D3EE] min-h-[44px] mb-3"
              autoFocus
            />

            {addError && (
              <p className="text-sm text-[#ef4444] mb-3">{addError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => { setShowAddModal(false); setAddInput(''); setAddError('') }}
                className="text-[#9CA3AF] hover:text-[#F5F7FA]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={!addInput.trim() || adding}
                className="bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] gap-2"
              >
                {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Student
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Piece Modal */}
      {showAssignModal && assignToStudent && (
        <AssignmentModal
          student={assignToStudent}
          teacherId={user!.id}
          onClose={() => { setShowAssignModal(false); setAssignToStudent(null) }}
          onAssigned={() => fetchRoster()}
        />
      )}

      {/* Settings Dialogs */}
      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onUpdatePassword={updatePassword}
      />
      <ChangeEmailDialog
        isOpen={showChangeEmail}
        onClose={() => setShowChangeEmail(false)}
        currentEmail={user?.email || ''}
        onUpdateEmail={updateEmail}
      />
      <ChangeDisplayNameDialog
        isOpen={showChangeDisplayName}
        onClose={() => setShowChangeDisplayName(false)}
        currentName={profile?.full_name || ''}
        onUpdateDisplayName={updateDisplayName}
      />
    </div>
  )
}