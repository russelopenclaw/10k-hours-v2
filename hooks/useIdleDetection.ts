'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseIdleDetectionOptions {
  /** Milliseconds of inactivity before considering user idle. Default: 5 minutes */
  idleTimeout?: number
  /** Milliseconds between activity checks. Default: 10 seconds */
  checkInterval?: number
  /** Whether idle detection is active. Set to false when timer is not running */
  enabled?: boolean
}

export interface IdleState {
  /** Whether the user appears to be idle */
  isIdle: boolean
  /** How long the user has been idle in ms (0 if not idle) */
  idleDuration: number
  /** Timestamp of last user activity */
  lastActivityAt: number | null
  /** Manually mark the user as active (e.g., after they click "Still practicing") */
  resetIdle: () => void
}

/**
 * Detects user inactivity during a practice session.
 * Monitors: mousemove, mousedown, keydown, touchstart, scroll
 * Ignores: mousemove with no movement (jitter from background processes)
 *
 * Usage: Call from the practice timer component. When isIdle becomes true,
 * show a "Still practicing?" dialog. If the user confirms, call resetIdle().
 * If they don't respond within a grace period, auto-pause the timer.
 */
export function useIdleDetection({
  idleTimeout = 5 * 60 * 1000, // 5 minutes
  checkInterval = 10 * 1000,    // 10 seconds
  enabled = true,
}: UseIdleDetectionOptions = {}): IdleState {
  const [isIdle, setIsIdle] = useState(false)
  const [idleDuration, setIdleDuration] = useState(0)
  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now())

  const lastActivityRef = useRef<number>(Date.now())
  const lastMousePos = useRef<{ x: number; y: number } | null>(null)
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    setLastActivityAt(lastActivityRef.current)
  }, [])

  // Track mouse movement (with jitter filter)
  useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (e: MouseEvent) => {
      // Filter out tiny movements (background jitter)
      if (lastMousePos.current) {
        const dx = e.clientX - lastMousePos.current.x
        const dy = e.clientY - lastMousePos.current.y
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      recordActivity()
    }

    const handleInteraction = () => recordActivity()

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleInteraction, { passive: true })
    window.addEventListener('keydown', handleInteraction, { passive: true })
    window.addEventListener('touchstart', handleInteraction, { passive: true })
    window.addEventListener('scroll', handleInteraction, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('scroll', handleInteraction)
    }
  }, [enabled, recordActivity])

  // Check idle status periodically
  useEffect(() => {
    if (!enabled) {
      setIsIdle(false)
      setIdleDuration(0)
      return
    }

    checkTimerRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastActivityRef.current

      if (elapsed >= idleTimeout) {
        setIsIdle(true)
        setIdleDuration(elapsed)
      } else {
        setIsIdle(false)
        setIdleDuration(0)
      }
    }, checkInterval)

    return () => {
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current)
      }
    }
  }, [enabled, idleTimeout, checkInterval])

  const resetIdle = useCallback(() => {
    lastActivityRef.current = Date.now()
    setLastActivityAt(lastActivityRef.current)
    setIsIdle(false)
    setIdleDuration(0)
  }, [])

  return { isIdle, idleDuration, lastActivityAt, resetIdle }
}