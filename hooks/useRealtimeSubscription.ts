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
}

/**
 * Hook for subscribing to Supabase Realtime postgres_changes.
 *
 * Usage:
 *   useRealtimeSubscription({
 *     table: 'assignments',
 *     filter: `student_id=eq.${userId}`,
 *     event: 'INSERT',
 *     onPayload: (payload) => setAssignments(prev => [...prev, payload.new as Assignment]),
 *   })
 *
 * Handles cleanup on unmount, deduplicates channel names,
 * and skips subscription when enabled=false.
 */
export function useRealtimeSubscription({
  table,
  filter,
  event = '*',
  onPayload,
  enabled = true,
}: RealtimeSubscriptionConfig) {
  const callbackRef = useRef(onPayload)
  callbackRef.current = onPayload

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return
    // Guard: Supabase Realtime requires browser APIs (WebSocket)
    if (typeof window === 'undefined') return

    let channel: RealtimeChannel | null = null
    try {
      const supabase = createClient()
      const channelName = `realtime:${table}${filter ? `:${filter}` : ''}`

      channel = supabase
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
        .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to ${table}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[Realtime] Channel error on ${table}`)
          }
        })

      channelRef.current = channel
    } catch (err) {
      console.error(`[Realtime] Failed to subscribe to ${table}:`, err)
      return
    }

    return () => {
      if (channel) {
        channel.unsubscribe()
        try {
          const supabase = createClient()
          supabase.removeChannel(channel)
        } catch {
          // Cleanup best-effort
        }
        channelRef.current = null
      }
    }
  }, [table, filter, event, enabled])
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
  })
}