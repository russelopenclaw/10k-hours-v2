'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type PostgresChangePayload = RealtimePostgresChangesPayload<Record<string, unknown>>

interface RealtimeSubscriptionConfig {
  /** Table name to subscribe to (e.g., 'assignments') */
  table: string
  /** Optional filter, e.g., 'student_id=eq.abc123' */
  filter?: string
  /** Event type: INSERT, UPDATE, DELETE, or '*' for all */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  /** Callback when a matching event arrives */
  onPayload: (payload: PostgresChangePayload) => void
  /** Only subscribe when true (default: true). Set false to pause. */
  enabled?: boolean
  /**
   * Access token for authenticating the realtime channel.
   * Required for RLS-protected tables — without it, postgres_changes
   * events are silently filtered out.
   */
  accessToken?: string
}

/**
 * Hook for subscribing to Supabase Realtime postgres_changes.
 *
 * IMPORTANT: For tables with RLS policies, you MUST pass `accessToken`
 * so the realtime channel can authenticate. Otherwise, events are silently
 * dropped by RLS checks.
 *
 * Usage:
 *   const { getSession } = useAuth()
 *   // ...
 *   useRealtimeSubscription({
 *     table: 'assignments',
 *     filter: `student_id=eq.${userId}`,
 *     event: 'INSERT',
 *     onPayload: (payload) => ...,
 *     accessToken: session?.access_token,
 *   })
 */
export function useRealtimeSubscription({
  table,
  filter,
  event = '*',
  onPayload,
  enabled = true,
  accessToken,
}: RealtimeSubscriptionConfig) {
  const callbackRef = useRef(onPayload)
  callbackRef.current = onPayload

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return
    // Guard: Supabase Realtime requires browser APIs (WebSocket)
    if (typeof window === 'undefined') return

    let channel: RealtimeChannel
    try {
      const supabase = createClient()
      const channelName = `realtime:${table}${filter ? `:${filter}` : ''}`

      const ch = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            filter,
          },
          (payload: PostgresChangePayload) => {
            try {
              callbackRef.current(payload)
            } catch (err) {
              console.error(`[Realtime] Error in callback for ${table}:`, err)
            }
          }
        )

      // Set auth token for RLS-protected tables.
      // Without this, postgres_changes events are silently dropped.
      if (accessToken) {
        ch.updateJoinPayload({ access_token: accessToken })
      }

      ch.subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${table}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Channel error on ${table}`)
        }
      })

      channel = ch
      channelRef.current = ch
    } catch (err) {
      console.error(`[Realtime] Failed to subscribe to ${table}:`, err)
      return
    }

    return () => {
      const ch = channelRef.current
      if (ch) {
        ch.unsubscribe()
        try {
          const supabase = createClient()
          supabase.removeChannel(ch)
        } catch {
          // Cleanup best-effort
        }
        channelRef.current = null
      }
    }
  }, [table, filter, event, enabled, accessToken])
}

/**
 * Convenience hook: subscribe to INSERT events on a table.
 * Returns the new row in the callback.
 */
export function useRealtimeInsert<T = Record<string, unknown>>(
  table: string,
  filter: string | undefined,
  onInsert: (row: T) => void,
  enabled = true,
  accessToken?: string,
) {
  useRealtimeSubscription({
    table,
    filter,
    event: 'INSERT',
    onPayload: (payload) => {
      if (payload.new) {
        onInsert(payload.new as T)
      }
    },
    enabled,
    accessToken,
  })
}

/**
 * Convenience hook: subscribe to UPDATE events on a table.
 * Returns both new and old rows in the callback.
 */
export function useRealtimeUpdate<T = Record<string, unknown>>(
  table: string,
  filter: string | undefined,
  onUpdate: (newRow: T, oldRow: Partial<T>) => void,
  enabled = true,
  accessToken?: string,
) {
  useRealtimeSubscription({
    table,
    filter,
    event: 'UPDATE',
    onPayload: (payload) => {
      if (payload.new && payload.old) {
        onUpdate(payload.new as T, payload.old as Partial<T>)
      }
    },
    enabled,
    accessToken,
  })
}