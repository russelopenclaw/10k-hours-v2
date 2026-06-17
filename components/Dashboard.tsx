'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Music, BarChart3, ClipboardList } from 'lucide-react'
import { Database } from '@/lib/supabase'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import Header from '@/components/Header'
import SongLibrary from '@/components/SongLibrary'
import PracticeTimer from '@/components/PracticeTimer'
import PracticeAnalytics from '@/components/PracticeAnalytics'
import AddSongDialog from '@/components/AddSongDialog'
import EditSongDialog from '@/components/EditSongDialog'
import ShareWithTeacher from '@/components/ShareWithTeacher'
import StudentAssignments from '@/components/StudentAssignments'

type Song = Database['public']['Tables']['songs']['Row']

export default function Dashboard() {
  const { user, profile, signOut, updatePassword, updateEmail } = useAuth()
  const supabase = createClient()

  // Data state
  const [songs, setSongs] = useState<Song[]>([])
  const [practiceTimes, setPracticeTimes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [showAddSong, setShowAddSong] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [sharedWithTeacher, setSharedWithTeacher] = useState<string | null>(null)

  // Practice session state
  const {
    selectedSong,
    startPractice,
    stopPractice,
    updateSelectedSong,
  } = usePracticeSession()

  // Fetch songs and practice times
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false)
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
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchData()

    // Safety timeout: never spin forever
    const timeout = setTimeout(() => setLoading(false), 10000)
    return () => clearTimeout(timeout)
  }, [fetchData])

  // Fetch share status
  useEffect(() => {
    if (!user) return
    const fetchShareStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
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
  }, [user, supabase])

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

  if (loading) {
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
        sharedWithTeacher={sharedWithTeacher}
        onShareClick={() => setShowShare(true)}
        onUpdatePassword={updatePassword}
        onUpdateEmail={updateEmail}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Practice Timer */}
        {selectedSong && (
          <div className="mb-8">
            <PracticeTimer
              song={selectedSong}
              onStop={stopPractice}
              onEditSong={(song) => setEditingSong(song)}
              onSongUpdated={handlePracticeSongUpdated}
              onPracticeCompleted={handlePracticeCompleted}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs defaultValue="library" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-[#181B22] border border-white/[0.06] rounded-xl p-1">
            <TabsTrigger value="library" className="flex items-center justify-center gap-2 rounded-lg data-active:bg-[#22D3EE]/[0.1] data-active:text-[#22D3EE]">
              <Music className="h-4 w-4" />
              <span>Library</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center justify-center gap-2 rounded-lg data-active:bg-[#22D3EE]/[0.1] data-active:text-[#22D3EE]">
              <ClipboardList className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center justify-center gap-2 rounded-lg data-active:bg-[#22D3EE]/[0.1] data-active:text-[#22D3EE]">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <SongLibrary
              songs={songs}
              practiceTimes={practiceTimes}
              selectedSongId={selectedSong?.id || null}
              onSelectSong={() => {}}
              onEditSong={(song) => setEditingSong(song)}
              onStartPractice={startPractice}
              onAddSong={() => setShowAddSong(true)}
            />
          </TabsContent>

          <TabsContent value="assignments">
            <StudentAssignments />
          </TabsContent>

          <TabsContent value="analytics">
            <PracticeAnalytics />
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