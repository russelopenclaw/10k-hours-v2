'use client'

import { useCallback } from 'react'
import { getErrorMessage } from '@/lib/errors'

export function useErrorHandler() {
  const handleError = useCallback((err: unknown, fallbackMessage = 'An error occurred') => {
    const message = getErrorMessage(err)
    console.error(message || fallbackMessage)
  }, [])

  const handleAsync = useCallback(async (fn: () => Promise<void>, fallbackMessage = 'An error occurred'): Promise<boolean> => {
    try {
      await fn()
      return true
    } catch (err) {
      const message = getErrorMessage(err)
      console.error(message || fallbackMessage)
      return false
    }
  }, [])

  return { handleError, handleAsync, getErrorMessage }
}