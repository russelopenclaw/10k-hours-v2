'use client'

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
import MetronomeControl from '@/components/MetronomeControl'

type Song = Database['public']['Tables']['songs']['Row']

interface PracticeTimerProps {
  song: Song
  onStop: () => void
  onEditSong?: (song: Song) => void
  onSongUpdated?: (updatedSong: Partial<Song>) => void
  onPracticeCompleted?: () => void
}

export default function PracticeTimer({ song, onStop, onEditSong, onSongUpdated, onPracticeCompleted }: PracticeTimerProps) {
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
    formatTime
  } = usePracticeTimer({
    song,
    userId: user?.id || '',
    onSongUpdated,
    onPracticeCompleted
  })

  // Keep screen on during practice, off when stopped
  // Tab visibility tracks background/foreground for timer accuracy
  useTabVisibility({
    onVisible: () => {
      // Timer continues correctly — usePracticeTimer handles drift via wall clock
    },
  })

  // Enable wake lock when practice starts, disable when stopped
  const handleStartWithWakeLock = async () => {
    await enableWakeLock()
    handlePlayPause()
  }

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
    if (!isRunning) return 'text-gray-600'
    if (isPaused) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="flex flex-col space-y-4">
      <Card className="shadow-md bg-white w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg sm:text-xl text-blue-700 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Practice Timer</span>
              <span className={`ml-2 text-sm font-normal ${getStatusColor()}`}>
                ({getStatusText()})
              </span>
            </CardTitle>

            {/* Edit Song Button */}
            {onEditSong && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEditSong(song)}
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
            <div className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold text-blue-600 tracking-wider leading-none">
              {formatTime(seconds)}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
            <Button
              onClick={isRunning && !isPaused ? handlePlayPause : (!isRunning ? handleStartWithWakeLock : handleResumeWithWakeLock)}
              size="lg"
              variant={isRunning && !isPaused ? 'destructive' : 'default'}
              className="w-full sm:w-auto min-w-[140px]"
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
              className="w-full sm:w-auto min-w-[140px]"
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
              className="px-4 sm:px-3"
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
              <Label htmlFor="song-notes" className="text-sm font-medium">
                Song Notes
              </Label>
              <Textarea
                id="song-notes"
                placeholder="Add notes about this song, techniques, or things to remember..."
                value={songNotes}
                onChange={(e) => setSongNotes(e.target.value)}
                className="min-h-[120px] sm:min-h-[100px] text-base sm:text-sm"
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
          className="bg-white w-full"
          onSave={handleMetronomeSettingsSave}
        />
      </div>
    </div>
  )
}