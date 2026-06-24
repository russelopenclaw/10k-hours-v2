'use client'

import { useState, useCallback } from 'react'
import { Database } from '@/lib/supabase'

type Song = Database['public']['Tables']['songs']['Row']

export interface PracticeSessionState {
  selectedSong: Song | null
  isPracticing: boolean
}

export interface PracticeSessionActions {
  selectSong: (song: Song | null) => void
  startPractice: (song: Song) => void
  stopPractice: () => void
  updateSelectedSong: (fields: Partial<Song>) => void
}

export interface UsePracticeSessionOptions {
  onPracticeCompleted?: () => void
  onSongUpdate?: (song: Song) => void
}

export type UsePracticeSessionReturn = PracticeSessionState & PracticeSessionActions & { autoStart: boolean }

/**
 * Hook for managing practice session state
 * Handles song selection, practice state, and callbacks
 */
export function usePracticeSession(
  options: UsePracticeSessionOptions = {}
): UsePracticeSessionReturn {
  const { onSongUpdate } = options

  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [autoStart, setAutoStart] = useState(false)

  const selectSong = useCallback((song: Song | null) => {
    setSelectedSong(song)
    setAutoStart(false)
  }, [])

  const startPractice = useCallback((song: Song) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setSelectedSong(song)
    setAutoStart(true)
  }, [])

  const stopPractice = useCallback(() => {
    setSelectedSong(null)
    setAutoStart(false)
  }, [])

  const updateSelectedSong = useCallback((fields: Partial<Song>) => {
    setSelectedSong(prev => {
      if (!prev) return null
      const updatedSong = { ...prev, ...fields }
      onSongUpdate?.(updatedSong)
      return updatedSong
    })
  }, [onSongUpdate])

  return {
    selectedSong,
    isPracticing: selectedSong !== null,
    autoStart,
    selectSong,
    startPractice,
    stopPractice,
    updateSelectedSong,
  }
}