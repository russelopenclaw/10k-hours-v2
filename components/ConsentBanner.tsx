'use client'

import { useConsent } from '@/hooks/useConsent'
import { Shield } from 'lucide-react'

/**
 * Shows a banner when a user under 13 hasn't had their parent verify yet.
 * This gates features like leaderboard, recording, and media attachments.
 * The banner explains why features are limited and links to parent verification.
 */
export default function ConsentBanner() {
  const { isRestricted, consentStatus, loading } = useConsent()

  if (loading || !isRestricted) return null

  return (
    <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
      <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-amber-200">
          {consentStatus === 'pending'
            ? 'Parent verification pending'
            : 'Account restricted'}
        </p>
        <p className="text-xs text-amber-200/70">
          {consentStatus === 'pending'
            ? 'We sent a verification email to your parent or guardian. Some features will be available once they confirm.'
            : 'Your parent or guardian has not confirmed your account. Some features are limited for your safety. Ask your teacher or parent to contact support.'}
        </p>
      </div>
    </div>
  )
}