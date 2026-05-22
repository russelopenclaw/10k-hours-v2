'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface TabVisibilityState {
  isVisible: boolean
  isFocused: boolean
  lastVisibleAt: number | null
  lastHiddenAt: number | null
  hiddenDuration: number
}

export interface UseTabVisibilityOptions {
  onVisible?: () => void
  onHidden?: () => void
  onFocus?: () => void
  onBlur?: () => void
  /** Only trigger callbacks if hidden for at least this many ms */
  minHiddenDuration?: number
}

/**
 * Hook to detect tab visibility and focus changes.
 * Used by the practice timer to handle:
 * - Timer drift when tab is backgrounded
 * - Re-acquiring wake lock when tab becomes visible again
 * - Pausing/resuming behavior based on tab state
 */
export function useTabVisibility(options: UseTabVisibilityOptions = {}) {
  const {
    onVisible,
    onHidden,
    onFocus,
    onBlur,
    minHiddenDuration = 0,
  } = options

  const [state, setState] = useState<TabVisibilityState>({
    isVisible: typeof document !== 'undefined' ? !document.hidden : true,
    isFocused: typeof document !== 'undefined' ? document.hasFocus() : true,
    lastVisibleAt: Date.now(),
    lastHiddenAt: null,
    hiddenDuration: 0,
  })

  const lastHiddenAtRef = useRef<number | null>(null)
  const callbacksRef = useRef({ onVisible, onHidden, onFocus, onBlur })

  // Keep callbacks ref current
  useEffect(() => {
    callbacksRef.current = { onVisible, onHidden, onFocus, onBlur }
  }, [onVisible, onHidden, onFocus, onBlur])

  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden
    const now = Date.now()

    setState(prev => {
      const hiddenDuration = lastHiddenAtRef.current
        ? now - lastHiddenAtRef.current
        : 0

      if (isVisible) {
        lastHiddenAtRef.current = null

        if (hiddenDuration >= minHiddenDuration) {
          setTimeout(() => callbacksRef.current.onVisible?.(), 0)
        }

        return {
          ...prev,
          isVisible: true,
          lastVisibleAt: now,
          hiddenDuration,
        }
      } else {
        lastHiddenAtRef.current = now
        setTimeout(() => callbacksRef.current.onHidden?.(), 0)

        return {
          ...prev,
          isVisible: false,
          lastHiddenAt: now,
        }
      }
    })
  }, [minHiddenDuration])

  const handleFocus = useCallback(() => {
    const now = Date.now()
    const hiddenDuration = lastHiddenAtRef.current
      ? now - lastHiddenAtRef.current
      : 0

    setState(prev => ({
      ...prev,
      isFocused: true,
      lastVisibleAt: now,
      hiddenDuration,
    }))

    if (hiddenDuration >= minHiddenDuration) {
      setTimeout(() => callbacksRef.current.onFocus?.(), 0)
    }

    lastHiddenAtRef.current = null
  }, [minHiddenDuration])

  const handleBlur = useCallback(() => {
    const now = Date.now()
    lastHiddenAtRef.current = now

    setState(prev => ({
      ...prev,
      isFocused: false,
      lastHiddenAt: now,
    }))

    setTimeout(() => callbacksRef.current.onBlur?.(), 0)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Set initial state
    handleVisibilityChange()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [handleVisibilityChange, handleFocus, handleBlur])

  return state
}