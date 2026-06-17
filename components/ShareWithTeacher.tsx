'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Share2, Link2, Copy, Check, X, Clock, UserCheck } from 'lucide-react'

interface ShareData {
  id: string
  shortCode: string
  token: string
  expiresAt: string
}

interface ClaimedData {
  name: string
  email: string | null
}

type ShareStatus = 'loading' | 'none' | 'active' | 'claimed' | 'expired'

interface ShareWithTeacherProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function ShareWithTeacher({ isOpen, onClose }: ShareWithTeacherProps = {}) {
  const { user } = useAuth()
  const supabase = createClient()

  const [status, setStatus] = useState<ShareStatus>('loading')
  const [activeShare, setActiveShare] = useState<ShareData | null>(null)
  const [claimedTeacher, setClaimedTeacher] = useState<ClaimedData | null>(null)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isOpen !== undefined ? isOpen : internalOpen
  const setOpen = onClose ? (value: boolean) => { if (!value) onClose() } : setInternalOpen

  const [creating, setCreating] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')

  // Fetch current share status
  const fetchStatus = useCallback(async () => {
    if (!user) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/student/share-status', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()

      if (data.status === 'active' && data.share) {
        setStatus('active')
        setActiveShare(data.share)
      } else if (data.status === 'claimed' && data.teacher) {
        setStatus('claimed')
        setClaimedTeacher(data.teacher)
      } else if (data.status === 'expired') {
        setStatus('expired')
      } else {
        setStatus('none')
      }
    } catch (error) {
      console.error('Error fetching share status:', error)
      setStatus('none')
    }
  }, [user, supabase])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Countdown timer for active share
  useEffect(() => {
    if (status !== 'active' || !activeShare) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const expires = new Date(activeShare.expiresAt).getTime()
      const diff = expires - now

      if (diff <= 0) {
        setTimeLeft('Expired')
        setStatus('expired')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [status, activeShare])

  const handleCreate = async () => {
    if (!user) return
    setCreating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/student/share', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()

      if (data.share) {
        setStatus('active')
        setActiveShare(data.share)
      } else if (data.message && data.share === undefined) {
        // Already has an active share, refresh
        await fetchStatus()
      }
    } catch (error) {
      console.error('Error creating share:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async () => {
    if (!user) return
    setRevoking(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/student/share', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      if (res.ok) {
        setStatus('none')
        setActiveShare(null)
        setClaimedTeacher(null)
      }
    } catch (error) {
      console.error('Error revoking share:', error)
    } finally {
      setRevoking(false)
    }
  }

  const handleCopy = async (text: string, field: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const shareUrl = activeShare?.shortCode
    ? `${window.location.origin}/share/${activeShare.shortCode}`
    : activeShare?.token
    ? `${window.location.origin}/share/${activeShare.token}`
    : ''

  // Determine what the button should show
  const getButtonContent = () => {
    if (status === 'claimed' && claimedTeacher) {
      return (
        <>
          <UserCheck className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Sharing with {claimedTeacher.name}</span>
          <span className="sm:hidden">Sharing</span>
        </>
      )
    }
    return (
      <>
        <Share2 className="size-4 mr-1.5" />
        <span className="hidden sm:inline">Share with Teacher</span>
        <span className="sm:hidden">Share</span>
      </>
    )
  }

  const getButtonStyle = () => {
    if (status === 'claimed' && claimedTeacher) {
      return 'border-[#22D3EE]/30 text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/40'
    }
    return 'border-white/[0.06] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-[#22D3EE]/20'
  }

  return (
    <>
      {/* Header button */}
      {isOpen === undefined && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInternalOpen(true)}
          className={`gap-2 ${getButtonStyle()}`}
        >
          {getButtonContent()}
        </Button>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(value: boolean) => { if (!value) onClose?.(); setInternalOpen(value) }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-[#151518] border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-[#F5F7FA]">
              {status === 'claimed' ? 'Sharing with Teacher' : 'Share with Teacher'}
            </DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              {status === 'claimed'
                ? 'Your teacher can see your practice data. You can stop sharing at any time.'
                : 'Create a code to let your teacher see your practice data.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* State: No active share — Create one */}
            {(status === 'none' || status === 'expired' || status === 'loading') && status !== 'loading' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-[#22D3EE]/10 flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-8 w-8 text-[#22D3EE]" />
                </div>
                <p className="text-sm text-[#9CA3AF] mb-4">
                  {status === 'expired'
                    ? 'Your previous code has expired. Create a new one to share with your teacher.'
                    : 'Create a share code to let your teacher see your practice data. The code expires in 24 hours and can only be used once.'}
                </p>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9]"
                >
                  {creating ? 'Creating...' : 'Create Share Code'}
                </Button>
              </div>
            )}

            {/* Loading state */}
            {status === 'loading' && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#22D3EE]" />
              </div>
            )}

            {/* State: Active share — Show code and link */}
            {status === 'active' && activeShare && (
              <div className="space-y-4">
                {/* Short code */}
                <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-lg p-4">
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium mb-2">Your share code</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-mono font-bold text-[#22D3EE] tracking-widest">
                      {activeShare.shortCode}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(activeShare.shortCode, 'code')}
                      className="text-[#9CA3AF] hover:text-[#F5F7FA]"
                    >
                      {copiedField === 'code' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Shareable link */}
                <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-lg p-4">
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium mb-2">Or share this link</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#9CA3AF] font-mono truncate flex-1 select-all">
                      {shareUrl}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(shareUrl, 'link')}
                      className="text-[#9CA3AF] hover:text-[#F5F7FA] shrink-0"
                    >
                      {copiedField === 'link' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expiry countdown */}
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Expires in {timeLeft} · One-time use</span>
                </div>

                {/* Revoke button */}
                <Button
                  variant="ghost"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="w-full text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  {revoking ? 'Revoking...' : 'Revoke Code'}
                </Button>
              </div>
            )}

            {/* State: Claimed — Teacher has added the student */}
            {status === 'claimed' && claimedTeacher && (
              <div className="space-y-4">
                <div className="bg-[#22D3EE]/5 border border-[#22D3EE]/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#22D3EE]/10 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-[#22D3EE]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#F5F7FA]">{claimedTeacher.name}</p>
                      <p className="text-xs text-[#9CA3AF]">Can view your practice data</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="w-full text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  {revoking ? 'Removing...' : 'Stop Sharing'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}