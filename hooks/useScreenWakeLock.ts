'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Wake Lock Sentinel type for the Screen Wake Lock API
 */
interface WakeLockSentinel {
  released: boolean
  release(): Promise<void>
  addEventListener(type: 'release', listener: () => void): void
  removeEventListener(type: 'release', listener: () => void): void
}

/**
 * Custom hook to keep the screen awake during practice sessions.
 * 
 * Uses the Screen Wake Lock API (primary) with a media hack fallback
 * for browsers that don't support it (mainly older iOS Safari).
 * 
 * Must be called in response to a user gesture (click/touch) for
 * the Wake Lock API to work.
 */
export function useScreenWakeLock() {
  const [isWakeLockActive, setIsWakeLockActive] = useState(false)
  const [isWakeLockSupported, setIsWakeLockSupported] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const mediaRef = useRef<HTMLVideoElement | null>(null)
  const isActiveRef = useRef(false)

  // Check wake lock support on mount
  useEffect(() => {
    const hasNativeWakeLock = typeof navigator !== 'undefined' && 'wakeLock' in navigator
    // We consider it supported if native wake lock is available or we can fall back to media hack
    setIsWakeLockSupported(hasNativeWakeLock || typeof document !== 'undefined')
  }, [])

  /**
   * Enable wake lock. Call this in response to a user gesture
   * (e.g., when starting a practice timer).
   */
  const enableWakeLock = useCallback(async (): Promise<boolean> => {
    let success = false

    // Method 1: Native Screen Wake Lock API
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as unknown as { wakeLock: { request(type: string): Promise<WakeLockSentinel> } }).wakeLock.request('screen')
        wakeLockRef.current = wakeLock
        success = true
        setIsWakeLockActive(true)
        isActiveRef.current = true

        wakeLock.addEventListener('release', () => {
          wakeLockRef.current = null
          // Only update state if we haven't re-acquired via visibility change
          if (isActiveRef.current) {
            // Try to re-acquire
            enableWakeLock()
          } else {
            setIsWakeLockActive(false)
          }
        })
      } catch (err) {
        // Wake lock request can fail if not triggered by user gesture
        // or if the browser doesn't support it in this context
        if (process.env.NODE_ENV === 'development') {
          console.warn('Native wake lock failed:', err)
        }
      }
    }

    // Method 2: Media hack fallback (plays a silent video to keep screen on)
    if (!success && typeof document !== 'undefined') {
      try {
        const video = document.createElement('video')
        video.setAttribute('playsinline', '')
        video.setAttribute('muted', '')
        // Tiny silent video data URI
        video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA0RtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCByMjYwMSBhMGNkN2QzIC0gSC4yNjQvTVBFRy00IEFWQzEyOCAtIEVudHJvcHkvb3BlbnNvdXJjZSAtIDMuMC42IC0gMQA0Qk1hdmM0NTYwODI0NTE3MTMwMDAwMjE1MDA3NzQwMDAwMDIwMDA5MDAwMDAyMDAwNTkwMDAwMG1wMnY0NTYwODI0NTE3MTMwMDAwMjE1MDA3NzQwMDAwMDIwMDA5MDAwMDAyMDAwNTkwMDAwMGNtMzI2ODI0NTE3MTMwMDAwMjE1MDA3NzQwMDAwMDIwMDA5MDAwMDAyMDAwNTkwMDAwMHZ0c3Y0NTYwODI0NTE3MTMwMDAwMjE1MDA3NzQwMDAwMDIwMDA5MDAwMDAyMDAwNTkwMDAwMG1kYXQ0NTYwODI0NTE3MTMwMDAwMjE1MDA3NzQwMDAwMDIwMDA5MDAwMDAyMDAwNTkwMDAwMHdhdnY0NTYwODI0NTE3MTMwMDAwMjE1MDA3NzQwMDAwMDIwMDA5MDAwMDAyMDAwNTkwMDAwMA=='
        video.style.position = 'fixed'
        video.style.top = '-1px'
        video.style.left = '-1px'
        video.style.width = '1px'
        video.style.height = '1px'
        video.style.opacity = '0'
        video.muted = true
        video.playsInline = true
        video.loop = true
        
        // Some browsers require the video to be in the DOM
        document.body.appendChild(video)
        await video.play()
        mediaRef.current = video
        success = true
        setIsWakeLockActive(true)
        isActiveRef.current = true
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Media wake lock fallback failed:', err)
        }
      }
    }

    if (!success) {
      setIsWakeLockActive(false)
    }

    return success
  }, [])

  /**
   * Disable wake lock. Call this when stopping a practice timer.
   */
  const disableWakeLock = useCallback(async (): Promise<void> => {
    isActiveRef.current = false

    // Release native wake lock
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release()
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to release native wake lock:', err)
        }
      }
      wakeLockRef.current = null
    }

    // Remove media hack element
    if (mediaRef.current) {
      try {
        mediaRef.current.pause()
        mediaRef.current.remove()
        mediaRef.current.src = ''
        mediaRef.current = null
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to clean up media wake lock:', err)
        }
      }
    }

    setIsWakeLockActive(false)
  }, [])

  // Re-acquire wake lock when page becomes visible again
  // (browsers release wake locks when tabs are backgrounded)
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActiveRef.current) {
        enableWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enableWakeLock])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        isActiveRef.current = false
        if (wakeLockRef.current && !wakeLockRef.current.released) {
          wakeLockRef.current.release()
        }
        if (mediaRef.current) {
          mediaRef.current.pause()
          mediaRef.current.remove()
        }
      }
    }
  }, [])

  return {
    isWakeLockSupported,
    isWakeLockActive,
    enableWakeLock,
    disableWakeLock,
  }
}