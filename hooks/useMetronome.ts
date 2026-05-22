'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface MetronomeSettings {
  bpm: number
  volume: number
  sound: 'click' | 'beep' | 'wood' | 'digital'
  accent: boolean
  timeSignature: number
}

export default function useMetronome() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [settings, setSettings] = useState<MetronomeSettings>({
    bpm: 120,
    volume: 1.0,
    sound: 'click',
    accent: true,
    timeSignature: 4
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const beatCountRef = useRef(0)
  const [currentBeat, setCurrentBeat] = useState(0)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const createSound = useCallback((frequency: number, duration: number, volume: number) => {
    if (!audioContextRef.current) {
      console.error('No audio context available')
      return
    }

    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      // Set sound type based on settings
      let freq = frequency
      switch (settings.sound) {
        case 'click':
          oscillator.type = 'square'
          freq = frequency * 2
          break
        case 'beep':
          oscillator.type = 'sine'
          break
        case 'wood':
          oscillator.type = 'sawtooth'
          freq = frequency * 0.5
          break
        case 'digital':
          oscillator.type = 'triangle'
          break
      }

      oscillator.frequency.setValueAtTime(freq, audioContextRef.current.currentTime)
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration)

      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration)
    } catch (error) {
      console.error('Error creating sound:', error)
    }
  }, [settings.sound])

  const playBeat = useCallback(() => {
    const isAccentBeat = settings.accent && (beatCountRef.current % settings.timeSignature === 0)
    const frequency = isAccentBeat ? 800 : 400
    const volume = settings.volume * (isAccentBeat ? 1.2 : 1)
    const duration = 0.1

    createSound(frequency, duration, volume)
    beatCountRef.current++
  }, [settings.accent, settings.timeSignature, settings.volume, createSound])

  // Add a ref to prevent double start calls
  const startInProgressRef = useRef(false)

  const start = useCallback(async () => {
    if (isPlaying || startInProgressRef.current) {
      return
    }

    startInProgressRef.current = true

    try {
      // Initialize audio context if not available
      if (!audioContextRef.current && typeof window !== 'undefined') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (!audioContextRef.current) {
        throw new Error('Audio context not available')
      }

      // Resume audio context if suspended (required by browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      setIsPlaying(true)
      beatCountRef.current = 0

      const interval = 60000 / settings.bpm

      // Play first beat immediately
      playBeat()

      intervalRef.current = setInterval(() => {
        // Play beat with current settings
        const isAccentBeat = settings.accent && (beatCountRef.current % settings.timeSignature === 0)
        const frequency = isAccentBeat ? 800 : 400
        const volume = settings.volume * (isAccentBeat ? 1.2 : 1)
        const duration = 0.1

        createSound(frequency, duration, volume)
        beatCountRef.current++

        setCurrentBeat(beatCountRef.current % settings.timeSignature + 1)
      }, interval)
    } catch (error) {
      console.error('Failed to start metronome:', error)
      setIsPlaying(false)
      throw error
    } finally {
      startInProgressRef.current = false
    }
  }, [isPlaying, settings.bpm, settings.accent, settings.timeSignature, settings.volume, playBeat, createSound])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
    setCurrentBeat(0)
  }, [])

  // Add a ref to prevent double execution
  const toggleInProgressRef = useRef(false)

  const toggle = useCallback(async () => {
    // Prevent double execution
    if (toggleInProgressRef.current) {
      return
    }

    toggleInProgressRef.current = true

    try {
      if (isPlaying) {
        stop()
      } else {
        await start()
      }
    } finally {
      // Reset the flag after a short delay to allow state to update
      setTimeout(() => {
        toggleInProgressRef.current = false
      }, 100)
    }
  }, [isPlaying, start, stop])

  // Test function to verify audio is working
  const testSound = useCallback(async () => {
    try {
      // Initialize audio context if needed
      if (!audioContextRef.current && typeof window !== 'undefined') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (!audioContextRef.current) {
        throw new Error('Audio context not available')
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // Play a loud, clear test tone
      createSound(440, 0.5, 1.0) // A4 note for 0.5 seconds at full volume
    } catch (error) {
      console.error('Test sound failed:', error)
    }
  }, [createSound])

  const updateSettings = useCallback((newSettings: Partial<MetronomeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))

    // If BPM changed while playing, restart with new tempo
    if (newSettings.bpm && isPlaying) {
      stop()
      setTimeout(() => start(), 50) // Small delay to ensure clean restart
    }
  }, [isPlaying, start, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    isPlaying,
    currentBeat,
    settings,
    start,
    stop,
    toggle,
    updateSettings,
    testSound
  }
}