'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Song = Database['public']['Tables']['songs']['Row']

interface PracticeSession {
  startTime: Date
  pauses: { start: Date; end?: Date }[]
}

export interface UsePracticeTimerOptions {
  song: Song
  userId: string
  onSongUpdated?: (fields: Partial<Song>) => void
  onPracticeCompleted?: () => void
}

export function usePracticeTimer({ song, userId, onSongUpdated, onPracticeCompleted }: UsePracticeTimerOptions) {
  const supabase = createClient()
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [songNotes, setSongNotes] = useState(song.notes || '')
  const [showNotes, setShowNotes] = useState(false)

  const sessionRef = useRef<PracticeSession | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Sync notes when song changes
  useEffect(() => {
    setSongNotes(song.notes || '')
  }, [song.id, song.notes])

  // Initialize session
  useEffect(() => {
    sessionRef.current = { startTime: new Date(), pauses: [] }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Timer interval
  useEffect(() => {
    if (isRunning && !isPaused) {
      startTimeRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isPaused])

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handlePlayPause = useCallback(async () => {
    if (!isRunning) {
      setIsRunning(true)
      setIsPaused(false)
      if (!sessionRef.current) {
        sessionRef.current = { startTime: new Date(), pauses: [] }
      }
    } else if (isPaused) {
      setIsPaused(false)
      if (sessionRef.current?.pauses.length) {
        const lastPause = sessionRef.current.pauses[sessionRef.current.pauses.length - 1]
        if (!lastPause.end) lastPause.end = new Date()
      }
    } else {
      setIsPaused(true)
      sessionRef.current?.pauses.push({ start: new Date() })
    }
  }, [isRunning, isPaused])

  const handleStop = useCallback(async () => {
    if (seconds > 0) {
      setIsSaving(true)
      try {
        const endTime = new Date()
        const session = sessionRef.current
        let totalPauseTime = 0
        if (session) {
          session.pauses.forEach(pause => {
            const pauseEnd = pause.end || endTime
            totalPauseTime += pauseEnd.getTime() - pause.start.getTime()
          })
        }

        const totalTime = endTime.getTime() - (session?.startTime?.getTime() || endTime.getTime())
        const practiceTime = Math.max(0, totalTime - totalPauseTime)
        const durationMinutes = Math.max(1, Math.round(practiceTime / (1000 * 60)))

        const { error } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: userId,
            song_id: song.id,
            duration_minutes: durationMinutes,
            notes: songNotes.trim() || null,
            start_time: session?.startTime?.toISOString() || null,
            end_time: endTime.toISOString(),
          })

        if (error) throw error
        onPracticeCompleted?.()
      } catch (err) {
        console.error('Error saving practice session:', err)
      } finally {
        setIsSaving(false)
      }
    }

    setIsRunning(false)
    setIsPaused(false)
    setSeconds(0)
    sessionRef.current = { startTime: new Date(), pauses: [] }
  }, [seconds, songNotes, supabase, userId, song.id, onPracticeCompleted])

  const handleMetronomeSettingsSave = useCallback(async (settings: { bpm: number }) => {
    if (settings.bpm !== song.metronome_bpm) {
      try {
        const { error } = await supabase
          .from('songs')
          .update({ metronome_bpm: settings.bpm })
          .eq('id', song.id)
        if (error) throw error
        onSongUpdated?.({ metronome_bpm: settings.bpm })
      } catch (err) {
        console.error('Error saving BPM:', err)
      }
    }
  }, [song.id, song.metronome_bpm, supabase, onSongUpdated])

  // Save notes on stop
  const saveNotes = useCallback(async () => {
    if (songNotes !== song.notes && songNotes.trim()) {
      try {
        await supabase.from('songs').update({ notes: songNotes }).eq('id', song.id)
        onSongUpdated?.({ notes: songNotes })
      } catch (err) {
        console.error('Error saving notes:', err)
      }
    }
  }, [songNotes, song.notes, song.id, supabase, onSongUpdated])

  return {
    seconds, isRunning, isPaused, isSaving, songNotes, showNotes,
    setSongNotes, setShowNotes, handlePlayPause, handleStop, handleMetronomeSettingsSave,
    formatTime, saveNotes,
  }
}