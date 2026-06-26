'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Play, Pause, Square, Settings, StickyNote, Clock } from 'lucide-react'
import { Database } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { usePracticeTimer } from '@/hooks/usePracticeTimer'
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock'
import { useTabVisibility } from '@/hooks/useTabVisibility'
import { useIdleDetection } from '@/hooks/useIdleDetection'
import MetronomeControl from '@/components/MetronomeControl'
import IdlePrompt from '@/components/IdlePrompt'

type Song = Database['public']['Tables']['songs']['Row']

interface PracticeTimerProps {
  song: Song
  onStop: () => void
  onEditSong?: (song: Song) => void
  onSongUpdated?: (updatedSong: Partial<Song>) => void
  onPracticeCompleted?: () => void
  autoStart?: boolean
}

export default function PracticeTimer({ song, onStop, onEditSong, onSongUpdated, onPracticeCompleted, autoStart }: PracticeTimerProps) {
  const { user } = useAuth()
  const { enableWakeLock, disableWakeLock } = useScreenWakeLock()

  const {
    seconds,
    isRunning,
    isPaused,
    songNotes,
    showNotes,
    isSaving,
    setSongNotes,
    setShowNotes,
    handlePlayPause,
    handleStop,
    handleMetronomeSettingsSave,
    formatTime,
    saveNotes
  } = usePracticeTimer({
    song,
    userId: user?.id || '',
    onSongUpdated,
    onPracticeCompleted
  })

  // Idle detection: only active when timer is running and not paused
  const { isIdle, idleDuration, resetIdle } = useIdleDetection({
    idleTimeout: 5 * 60 * 1000, // 5 minutes
    enabled: isRunning && !isPaused,
  })

  // Handle idle "Still practicing" response
  const handleStillPracticing = () => {
    resetIdle()
  }

  // Handle idle auto-pause (grace period expired)
  const handleIdleStop = async () => {
    await handleStop()
    await disableWakeLock()
    onStop()
  }

  useTabVisibility({
    onVisible: () => {},
  })

  // Space bar start/pause: only when not typing in a textarea or input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      // Ignore if a dialog/modal is open
      if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"]')) return
      // Ignore if modifier keys are held (don't interfere with browser shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.code === 'Space') {
        e.preventDefault()
        if (!isRunning) {
          handleStartWithWakeLock()
        } else if (isPaused) {
          handleResumeWithWakeLock()
        } else {
          handlePlayPause()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, isPaused, handlePlayPause]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartWithWakeLock = async () => {
    await enableWakeLock()
    handlePlayPause()
  }

  // Auto-start practice when autoStart is true (e.g. from "Start Practice" button on song card)
  useEffect(() => {
    if (autoStart && !isRunning) {
      enableWakeLock().then(() => handlePlayPause())
    }
  }, [autoStart]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResumeWithWakeLock = async () => {
    await enableWakeLock()
    handlePlayPause()
  }

  const handleStopWithWakeLock = async () => {
    await handleStop()
    await disableWakeLock()
    onStop()
  }

  const getStatusText = () => {
    if (!isRunning) return 'Ready to practice'
    if (isPaused) return 'Paused'
    return 'Practicing'
  }

  const getStatusColor = () => {
    if (!isRunning) return 'text-[#9CA3AF]'
    if (isPaused) return 'text-[#F59E0B]'
    return 'text-[#34D399]'
  }

  return (
    <div className="flex flex-col space-y-4">
      <Card className="card-elevated bg-[#181B22] border-white/[0.06] w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg sm:text-xl text-[#F5F7FA] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#22D3EE]/[0.1] flex items-center justify-center">
                <Clock className="h-4 w-4 text-[#22D3EE]" />
              </div>
              <span className="flex items-center gap-2 truncate">
                <div
                  className="w-3 h-3 rounded-full shrink-0 border border-white/[0.1]"
                  style={{ backgroundColor: song.color || '#22D3EE' }}
                />
                <span className="truncate">{song.title}</span>
              </span>
              <span className={`ml-2 text-sm font-normal ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </CardTitle>

            {onEditSong && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEditSong(song)}
                className="text-[#9CA3AF] hover:text-[#F5F7FA]"
                title="Edit Song"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-6 sm:space-y-8 px-4 sm:px-6">
          {/* Timer Display */}
          <div className="py-4 sm:py-6">
            <div className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold text-[#22D3EE] tracking-wider leading-none glow-primary">
              {formatTime(seconds)}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
            <Button
              onClick={isRunning && !isPaused ? handlePlayPause : (!isRunning ? handleStartWithWakeLock : handleResumeWithWakeLock)}
              size="lg"
              className={`w-full sm:w-auto min-w-[140px] h-11 ${
                isRunning && !isPaused
                  ? 'bg-[#F59E0B]/[0.1] text-[#F59E0B] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/20'
                  : 'bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover'
              }`}
            >
              {!isRunning ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  <span>Start Practice</span>
                </>
              ) : isPaused ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  <span>Pause</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleStopWithWakeLock}
              variant="outline"
              size="lg"
              disabled={seconds === 0 || isSaving}
              className="w-full sm:w-auto min-w-[140px] h-11 border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-white/[0.15]"
            >
              <Square className="h-4 w-4 mr-2" />
              <span>{isSaving ? 'Saving...' : 'Stop & Save'}</span>
            </Button>
          </div>

          {/* Notes Toggle */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className="text-[#9CA3AF] hover:text-[#F5F7FA] px-4 sm:px-3"
            >
              <StickyNote className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-xs">
                {showNotes ? 'Hide Notes' : 'Add Notes'}
              </span>
            </Button>
          </div>

          {/* Song Notes */}
          {showNotes && (
            <div className="space-y-3 text-left">
              <Label htmlFor="song-notes" className="text-sm font-medium text-[#9CA3AF]">
                Song Notes
              </Label>
              <Textarea
                id="song-notes"
                placeholder="Add notes about this song, techniques, or things to remember..."
                value={songNotes}
                onChange={(e) => setSongNotes(e.target.value)}
                onBlur={() => saveNotes()}
                className="min-h-[120px] sm:min-h-[100px] text-base sm:text-sm bg-[#0F1115] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40"
                style={{ fontSize: '16px' }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metronome Control */}
      <div className="w-full">
        <MetronomeControl
          initialBpm={song.metronome_bpm || 120}
          className="bg-[#181B22] border-white/[0.06] w-full"
          onSave={handleMetronomeSettingsSave}
        />
      </div>

      {/* Idle detection prompt */}
      <IdlePrompt
        isIdle={isIdle}
        idleDuration={idleDuration}
        onStillPracticing={handleStillPracticing}
        onStop={handleIdleStop}
      />
    </div>
  )
}