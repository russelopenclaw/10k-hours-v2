'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IdlePromptProps {
  /** Whether the user appears idle */
  isIdle: boolean
  /** How long they've been idle in ms */
  idleDuration: number
  /** Callback when user confirms they're still practicing */
  onStillPracticing: () => void
  /** Callback when user wants to stop (or auto-stopped) */
  onStop: () => void
  /** Grace period in ms before auto-pausing. Default: 60 seconds */
  gracePeriodMs?: number
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'less than a minute'
  if (minutes === 1) return '1 minute'
  return `${minutes} minutes`
}

/**
 * Shows a dialog when the user appears idle during practice.
 * If they don't respond within the grace period, auto-pauses.
 */
export default function IdlePrompt({
  isIdle,
  idleDuration,
  onStillPracticing,
  onStop,
  gracePeriodMs = 60_000,
}: IdlePromptProps) {
  const [dismissed, setDismissed] = useState(false)
  const [graceCountdown, setGraceCountdown] = useState(Math.ceil(gracePeriodMs / 1000))

  // Reset dismissed state when idle state changes
  useEffect(() => {
    if (isIdle) {
      setDismissed(false)
      setGraceCountdown(Math.ceil(gracePeriodMs / 1000))
    }
  }, [isIdle, gracePeriodMs])

  // Grace period countdown
  useEffect(() => {
    if (!isIdle || dismissed) return

    const timer = setInterval(() => {
      setGraceCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          onStop()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isIdle, dismissed, onStop, gracePeriodMs])

  if (!isIdle || dismissed) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#181B22] border border-white/[0.06] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/[0.08] rounded-xl flex items-center justify-center border border-amber-500/20">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F5F7FA]">Still practicing?</h3>
            <p className="text-sm text-[#9CA3AF]">
              No activity detected for {formatDuration(idleDuration)}
            </p>
          </div>
        </div>

        <div className="bg-amber-500/[0.06] border border-amber-500/10 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80">
            Practice time only counts while you're active. If you don't respond, the timer will pause in {graceCountdown}s.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => {
              setDismissed(true)
              onStillPracticing()
            }}
            className="flex-1 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover"
          >
            Yes, I'm practicing
          </Button>
          <Button
            variant="outline"
            onClick={onStop}
            className="flex-1 border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA]"
          >
            Stop timer
          </Button>
        </div>
      </div>
    </div>
  )
}