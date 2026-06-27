'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Music, BarChart3, ClipboardList, Bell } from 'lucide-react'
import { Database } from '@/lib/supabase'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import type { PostgresChangePayload } from '@/hooks/useRealtimeSubscription'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import Header from '@/components/Header'
import SongLibrary from '@/components/SongLibrary'
import PracticeTimer, { PracticeTimerHandle } from '@/components/PracticeTimer'
import PracticeAnalytics from '@/components/PracticeAnalytics'
import AddSongDialog from '@/components/AddSongDialog'
import EditSongDialog from '@/components/EditSongDialog'
import ShareWithTeacher from '@/components/ShareWithTeacher'
import StudentAssignments from '@/components/StudentAssignments'
import ConsentBanner from '@/components/ConsentBanner'
import * as Sentry from '@sentry/nextjs'

type Song = Database['public']['Tables']['songs']['Row']
type Assignment = Database['public']['Tables']['assignments']['Row']

// Once the dashboard has loaded data once in this browser session,
// never show the full-page spinner again. This prevents the infinite-spinner
// bug on back-button navigation. Uses sessionStorage to persist across
// full page navigations (Playwright goBack does a full page load).
let _dashboardDataLoadedInSession = false

function markLoaded(): void {
  _dashboardDataLoadedInSession = true
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('cadent-loaded', '1')
  }
}

export default function Dashboard() {
  const { user, profile, signOut, updatePassword, updateEmail, updateDisplayName, getSession } = useAuth()
  const supabase = createClient()

  // Access token for Realtime auth (RLS requires it)
  const [accessToken, setAccessToken] = useState<string | undefined>()

  // Fetch access token for Realtime subscriptions
  useEffect(() => {
    if (!user) return
    getSession().then(session => {
      if (session?.access_token) {
        setAccessToken(session.access_token)
      }
    })
  }, [user, getSession])

  // Data state
  const [songs, setSongs] = useState<Song[]>([])
  const [practiceTimes, setPracticeTimes] = useState<Record<string, number>>({})
  // Only show full-page spinner on first visit; skip on re-mount (back button)
  const [loading, setLoading] = useState(true)
  const [skipSpinner, setSkipSpinner] = useState(false)

  // Check sessionStorage after mount — if we've loaded before in this tab,
  // skip the spinner immediately. Can't check in useState (SSR mismatch).
  useEffect(() => {
    if (window.sessionStorage.getItem('cadent-loaded') === '1' || _dashboardDataLoadedInSession) {
      setSkipSpinner(true)
      setLoading(false)
    }
  }, [])

  // Dialog state
  const [showAddSong, setShowAddSong] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [sharedWithTeacher, setSharedWithTeacher] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('library')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [newAssignmentNotification, setNewAssignmentNotification] = useState<string | null>(null)
  // Track which assignment IDs the student has acknowledged (by visiting the tab or interacting)
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set())

  // Practice session state
  const {
    selectedSong,
    autoStart,
    selectSong,
    startPractice,
    stopPractice,
    switchSong,
    updateSelectedSong,
  } = usePracticeSession()

  // Ref to PracticeTimer so we can call stopAndSave when switching songs
  const timerRef = useRef<PracticeTimerHandle>(null)

  // Fetch songs, practice times, and assignments
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      markLoaded()
      return
    }

    try {
      const [songsRes, sessionsRes] = await Promise.all([
        supabase.from('songs').select('*').eq('user_id', user.id).order('position'),
        supabase.from('practice_sessions').select('*').eq('user_id', user.id),
      ])

      setSongs(songsRes.data || [])

      const timeMap: Record<string, number> = {}
      ;(sessionsRes.data || []).forEach((s: { song_id: string; duration_minutes: number }) => {
        timeMap[s.song_id] = (timeMap[s.song_id] || 0) + s.duration_minutes
      })
      setPracticeTimes(timeMap)

      // Fetch assignments for badge count (don't wait for tab visit)
      if (profile?.user_type === 'student') {
        const session = await getSession()
        if (session) {
          const res = await fetch('/api/teacher/assignments?role=student', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          const data = await res.json()
          if (res.ok && data.assignments) {
            setAssignments(data.assignments)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      Sentry.captureException(error, { tags: { component: 'Dashboard', action: 'fetchData' } })
    } finally {
      setLoading(false)
      // Mark that we've loaded data — never show full-page spinner again
      markLoaded()
    }
  }, [user, supabase, profile?.user_type, getSession])

  useEffect(() => {
    fetchData()

    // Safety timeout: never spin forever — report to Sentry if we hit it
    const timeout = setTimeout(() => {
      if (loading) {
        Sentry.captureMessage('Dashboard spinner stuck for 10s — data fetch did not resolve', {
          level: 'warning',
          tags: { component: 'Dashboard', issue: 'infinite-spinner' },
        })
      }
      setLoading(false)
    }, 10000)

    // Handle bfcache restore: re-fetch data when page is restored from back/forward cache
    // But DON'T show spinner — data will update in place
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setLoading(false)
        fetchData()
      }
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [fetchData])

  // Fetch share status
  useEffect(() => {
    if (!user) return
    const fetchShareStatus = async () => {
      try {
        const session = await getSession()
        if (!session) return
        const res = await fetch('/api/student/share-status', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const data = await res.json()
        if (data.status === 'claimed' && data.teacher?.name) {
          setSharedWithTeacher(data.teacher.name)
        } else {
          setSharedWithTeacher(null)
        }
      } catch {
        setSharedWithTeacher(null)
      }
    }
    fetchShareStatus()
  }, [user, getSession])

  // Realtime: teacher shares — claim or revoke updates header live
  useRealtimeSubscription({
    table: 'teacher_shares',
    filter: user ? `student_id=eq.${user.id}` : undefined,
    event: 'UPDATE',
    onPayload: (payload: PostgresChangePayload) => {
      const row = payload.new as Record<string, unknown>
      const oldRow = payload.old as Record<string, unknown> | undefined
      if (row.claimed_by && !oldRow?.claimed_by) {
        // Share was just claimed — refetch to get teacher's name
        const refreshShare = async () => {
          const session = await getSession()
          if (!session) return
          const res = await fetch('/api/student/share-status', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          const data = await res.json()
          if (data.status === 'claimed' && data.teacher?.name) {
            setSharedWithTeacher(data.teacher.name)
          }
        }
        refreshShare()
      } else if (row.is_active === false) {
        // Share was revoked
        setSharedWithTeacher(null)
      }
    },
    enabled: !!user,
    accessToken,
  })

  // Realtime: assignment changes (new assignment or status update)
  useRealtimeSubscription({
    table: 'assignments',
    filter: user ? `student_id=eq.${user.id}` : undefined,
    event: '*',
    onPayload: (payload: PostgresChangePayload) => {
      const eventType = payload.eventType
      const row = payload.new as Record<string, unknown>
      if (eventType === 'INSERT') {
        setAssignments(prev => {
          // Avoid duplicates (in case fetch also caught it)
          if (prev.some(a => a.id === row.id as string)) return prev
          return [{ ...row, id: row.id as string } as Assignment, ...prev]
        })
        // Show notification for new assignment
        const title = (row.title as string) || 'New assignment'
        setNewAssignmentNotification(title)
        // Auto-dismiss after 8 seconds
        setTimeout(() => setNewAssignmentNotification(null), 8000)
      } else if (eventType === 'UPDATE') {
        setAssignments(prev =>
          prev.map(a => a.id === row.id ? { ...a, ...row } as Assignment : a)
        )
      } else if (eventType === 'DELETE') {
        setAssignments(prev => prev.filter(a => a.id !== (payload.old as Record<string, unknown>).id))
      }
    },
    enabled: !!user,
    accessToken,
  })

  const handleSongCreated = (newSong: Song) => {
    setSongs(prev => [...prev, newSong])
  }

  const handleSongUpdated = (updatedSong: Song) => {
    setSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s))
  }

  const handleSongDeleted = (songId: string) => {
    setSongs(prev => prev.filter(s => s.id !== songId))
    if (selectedSong?.id === songId) {
      stopPractice()
    }
  }

  const handleAddAssignmentToLibrary = useCallback(async (assignment: Assignment) => {
    if (!user) return
    const supabase = createClient()
    // Create a song from the assignment's title and tempo
    const { data: newSong, error } = await supabase
      .from('songs')
      .insert({
        user_id: user.id,
        title: assignment.title,
        metronome_bpm: assignment.tempo || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[Dashboard] Failed to add assignment to library:', error)
      return
    }

    if (newSong) {
      setSongs(prev => [...prev, newSong as Song])

      // Link the song back to the assignment
      const session = await getSession()
      if (session) {
        await fetch('/api/teacher/assignments', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ id: assignment.id, song_id: newSong.id }),
        })

        // Update local assignments state so the UI reflects the linked song
        setAssignments(prev =>
          prev.map(a => a.id === assignment.id ? { ...a, song_id: (newSong as Song).id } : a)
        )
      }

      // Switch to library tab so the student sees the new song
      setActiveTab('library')
    }
  }, [user, getSession])

  const handlePracticeSongUpdated = useCallback((fields: Partial<Song>) => {
    updateSelectedSong(fields)
    if (selectedSong) {
      const updatedSong = { ...selectedSong, ...fields } as Song
      handleSongUpdated(updatedSong)
    }
  }, [selectedSong, updateSelectedSong])

  const handlePracticeCompleted = useCallback(() => {
    fetchData()
    window.dispatchEvent(new Event('practiceSessionCompleted'))
  }, [fetchData])

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading && !skipSpinner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1115]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1115]">
      <Header
        profile={profile}
        userEmail={user?.email}
        accessToken={accessToken ?? null}
        sharedWithTeacher={sharedWithTeacher}
        onShareClick={() => setShowShare(true)}
        onUpdatePassword={updatePassword}
        onUpdateEmail={updateEmail}
        onUpdateDisplayName={updateDisplayName}
        onSignOut={handleSignOut}
      />

      {/* Parental consent banner for under-13 users */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-3">
        <ConsentBanner />
      </div>

      {/* New assignment notification banner */}
      {newAssignmentNotification && (
        <div
          className="fixed top-4 right-4 z-50 bg-[#5e6ad2] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right-full cursor-pointer max-w-sm"
          onClick={() => {
            setActiveTab('assignments')
            setNewAssignmentNotification(null)
          }}
        >
          <Bell className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">New Assignment!</p>
            <p className="text-xs opacity-80 truncate">{newAssignmentNotification}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setNewAssignmentNotification(null) }}
            className="ml-2 opacity-60 hover:opacity-100 text-white text-lg leading-none shrink-0"
          >×</button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Practice Timer */}
        {selectedSong && (
          <div className="mb-8">
            <PracticeTimer
              ref={timerRef}
              song={selectedSong}
              onStop={stopPractice}
              onEditSong={(song) => setEditingSong(song)}
              onSongUpdated={handlePracticeSongUpdated}
              onPracticeCompleted={handlePracticeCompleted}
              autoStart={autoStart}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab)
          // Acknowledge all active assignments when visiting the Assignments tab
          if (tab === 'assignments') {
            setAcknowledgedIds(prev => {
              const next = new Set(prev)
              assignments.filter(a => a.status !== 'completed').forEach(a => next.add(a.id))
              return next
            })
          }
        }} defaultValue="library" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-[#181B22] border border-white/[0.06] rounded-xl p-1">
            <TabsTrigger value="library" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-[#22D3EE]/[0.1] data-[state=active]:text-[#22D3EE]">
              <Music className="h-4 w-4" />
              <span>Library</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-[#22D3EE]/[0.1] data-[state=active]:text-[#22D3EE]">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-[#22D3EE]/[0.1] data-[state=active]:text-[#22D3EE] relative">
              <ClipboardList className="h-4 w-4" />
              <span>Assignments</span>
              {(() => {
                // Badge: unacknowledged active assignments not yet added to library
                const unacknowledged = assignments.filter(a =>
                  a.status !== 'completed' && !a.song_id && !acknowledgedIds.has(a.id)
                )
                return unacknowledged.length > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#22D3EE] text-[#0F1115] text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unacknowledged.length}
                  </span>
                ) : null
              })()}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <SongLibrary
              songs={songs}
              practiceTimes={practiceTimes}
              selectedSongId={selectedSong?.id || null}
              onSelectSong={selectedSong ? async (song) => {
                // Save current practice session before switching
                await timerRef.current?.stopAndSave()
                switchSong(song)
              } : selectSong}
              onEditSong={(song) => setEditingSong(song)}
              onStartPractice={startPractice}
              onAddSong={() => setShowAddSong(true)}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <PracticeAnalytics />
          </TabsContent>

          <TabsContent value="assignments">
            <StudentAssignments onAssignmentsLoaded={setAssignments} onAddToLibrary={handleAddAssignmentToLibrary} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <AddSongDialog
        isOpen={showAddSong}
        onClose={() => setShowAddSong(false)}
        onSongCreated={handleSongCreated}
      />

      <EditSongDialog
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        onSongUpdated={handleSongUpdated}
        onSongDeleted={handleSongDeleted}
        song={editingSong}
      />

      <ShareWithTeacher
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </div>
  )
}