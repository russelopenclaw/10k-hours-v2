'use client'

import { useState } from 'react'
import { useConsent } from '@/hooks/useConsent'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Shield, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Shows a banner when a user under 13 hasn't had their parent verify yet.
 * Allows them to generate a consent link to share with their parent.
 */
export default function ConsentBanner() {
  const { consentStatus, isRestricted, loading } = useConsent()
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [consentUrl, setConsentUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  if (loading || !isRestricted) return null

  const handleGenerateLink = async () => {
    setGenerating(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate consent link')
        return
      }

      setConsentUrl(data.consent_url)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!consentUrl) return
    await navigator.clipboard.writeText(consentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#F59E0B]/[0.08] border border-[#F59E0B]/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-[#F59E0B] shrink-0" />
        <h3 className="text-sm font-medium text-[#F59E0B]">Parental Consent Required</h3>
      </div>
      <p className="text-xs text-[#9CA3AF]">
        Because you are under 13, a parent or guardian needs to approve your account.
        Some features are limited until consent is given.
      </p>

      {!consentUrl ? (
        <Button
          onClick={handleGenerateLink}
          disabled={generating}
          size="sm"
          className="bg-[#F59E0B] hover:bg-[#F59E0B]/80 text-[#0B0D10] font-medium"
        >
          {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Get Consent Link
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[#9CA3AF]">Share this link with your parent or guardian:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#0B0D10] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-[#9CA3AF] truncate">
              {consentUrl}
            </div>
            <Button
              onClick={handleCopy}
              size="sm"
              variant="outline"
              className="shrink-0 border-white/[0.06]"
            >
              {copied ? <Check className="h-3 w-3 text-[#22C55E]" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  )
}