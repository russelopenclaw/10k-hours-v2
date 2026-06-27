'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Clock, Loader2 } from 'lucide-react'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ReminderSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile | null
  accessToken: string | null
}

export default function ReminderSettingsDialog({
  isOpen,
  onClose,
  profile,
  accessToken,
}: ReminderSettingsDialogProps) {
  const [enabled, setEnabled] = useState(profile?.reminder_enabled ?? false)
  const [time, setTime] = useState(profile?.reminder_time ?? '19:00')
  const [saving, setSaving] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setEnabled(profile?.reminder_enabled ?? false)
      setTime(profile?.reminder_time ?? '19:00')
      setError('')
      // Check notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionStatus(Notification.permission)
      }
    }
  }, [isOpen, profile])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('Notifications are not supported in this browser')
      return
    }
    const result = await Notification.requestPermission()
    setPermissionStatus(result)
    if (result === 'denied') {
      setError('Notifications are blocked. Please enable them in your browser settings.')
    }
  }

  const handleSave = async () => {
    if (!accessToken) {
      setError('Not authenticated')
      return
    }

    setSaving(true)
    setError('')

    try {
      // If enabling reminders, ensure notification permission
      if (enabled && permissionStatus !== 'granted') {
        await requestPermission()
        if (Notification.permission !== 'granted') {
          setError('Please enable notifications to receive practice reminders')
          setSaving(false)
          return
        }
      }

      // Register push subscription if enabling and we have service worker
      let pushSubscription = null
      if (enabled && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // Web push requires a VAPID key — for now we store the subscription for future use
            applicationServerKey: undefined,
          })
          pushSubscription = subscription.toJSON()
        } catch (err) {
          // Push subscription failed — still save the reminder settings
          console.warn('[Reminders] Push subscription failed:', err)
        }
      }

      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reminder_enabled: enabled,
          reminder_time: time,
          ...(pushSubscription && { push_subscription: pushSubscription }),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  // Format time for display (19:00 → 7:00 PM)
  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#181B22] border border-white/[0.08] rounded-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-[#F5F7FA] mb-1">Practice Reminders</h2>
        <p className="text-sm text-[#9CA3AF] mb-6">
          Get a daily nudge to keep your streak going.
        </p>

        {/* Enable/disable toggle */}
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            {enabled ? (
              <Bell className="h-5 w-5 text-[#22D3EE]" />
            ) : (
              <BellOff className="h-5 w-5 text-[#6B7280]" />
            )}
            <div>
              <p className="text-sm font-medium text-[#F5F7FA]">Daily reminder</p>
              <p className="text-xs text-[#6B7280]">
                {enabled ? 'You\'ll get a notification at your chosen time' : 'Reminders are off'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-[#22D3EE]' : 'bg-[#374151]'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Time picker (only shown when enabled) */}
        {enabled && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-[#9CA3AF]" />
              <p className="text-sm font-medium text-[#F5F7FA]">Reminder time</p>
            </div>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-[#0B0D10] border border-white/[0.08] rounded-lg px-3 py-2 text-[#F5F7FA] text-sm focus:border-[#22D3EE] focus:outline-none"
            />
            <p className="text-xs text-[#6B7280] mt-2">
              Your reminder will arrive at {formatTime(time)} in your local time.
            </p>
          </div>
        )}

        {/* Permission status */}
        {enabled && permissionStatus !== 'granted' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
            <p className="text-sm text-yellow-400">
              {permissionStatus === 'denied'
                ? 'Notifications are blocked. Enable them in your browser settings to receive reminders.'
                : 'You need to allow notifications to receive practice reminders.'}
            </p>
            {permissionStatus === 'default' && (
              <button
                onClick={requestPermission}
                className="mt-2 text-sm text-[#22D3EE] hover:text-[#67E8F9] font-medium"
              >
                Allow notifications
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-white/[0.15] text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 rounded-xl bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}