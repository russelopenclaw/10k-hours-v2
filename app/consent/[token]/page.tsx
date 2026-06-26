'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConsentPage() {
  const params = useParams()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [valid, setValid] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<'approved' | 'denied' | null>(null)

  useEffect(() => {
    if (!token) return

    const checkToken = async () => {
      try {
        const res = await fetch(`/api/consent/verify?token=${token}`)
        const data = await res.json()

        if (!res.ok || !data.valid) {
          setError(data.error || 'This consent link is invalid or has expired.')
          return
        }

        setValid(true)
        setStudentName(data.student_name)
      } catch {
        setError('Failed to verify consent link. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    checkToken()
  }, [token])

  const handleConsent = async (approved: boolean) => {
    setVerifying(true)
    setError('')

    try {
      const res = await fetch('/api/consent/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, approved })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to process consent. Please try again.')
        return
      }

      setResult(approved ? 'approved' : 'denied')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#9CA3AF]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verifying consent link...
        </div>
      </div>
    )
  }

  if (error && !valid) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-[#ef4444]/10 rounded-2xl flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8 text-[#ef4444]" />
          </div>
          <h1 className="text-xl font-bold text-[#F5F7FA]">Link Invalid</h1>
          <p className="text-[#9CA3AF]">{error}</p>
          <p className="text-xs text-[#6B7280]">
            If you believe this is an error, please ask the student to generate a new consent link.
          </p>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            result === 'approved' ? 'bg-[#22C55E]/10' : 'bg-[#ef4444]/10'
          }`}>
            {result === 'approved' ? (
              <CheckCircle className="h-8 w-8 text-[#22C55E]" />
            ) : (
              <XCircle className="h-8 w-8 text-[#ef4444]" />
            )}
          </div>
          <h1 className="text-xl font-bold text-[#F5F7FA]">
            {result === 'approved' ? 'Consent Approved' : 'Consent Denied'}
          </h1>
          <p className="text-[#9CA3AF]">
            {result === 'approved'
              ? `You have approved consent for ${studentName} to use Cadent. They can now access all features.`
              : `You have denied consent for ${studentName}. Their account will have limited features.`
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-[#22D3EE]/[0.08] rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-[#22D3EE]" />
          </div>
          <h1 className="text-xl font-bold text-[#F5F7FA]">Parental Consent</h1>
          <p className="text-[#9CA3AF]">
            <strong className="text-[#F5F7FA]">{studentName}</strong> is under 13 and needs your permission to use Cadent.
          </p>
        </div>

        {/* What you're consenting to */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium text-[#F5F7FA]">What you are consenting to:</h2>
          <ul className="text-sm text-[#9CA3AF] space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span>Your child can practice music and track their progress</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span>Their practice data (time, songs, streaks) is visible to their teacher</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span>They appear on a class leaderboard by display name only</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-[#ef4444] shrink-0 mt-0.5" />
              <span>No personal data is shared publicly or sold to third parties</span>
            </li>
          </ul>
        </div>

        {/* Safety notice */}
        <div className="bg-[#F59E0B]/[0.05] border border-[#F59E0B]/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-[#F59E0B] mb-1">Safety Information</h3>
          <ul className="text-xs text-[#9CA3AF] space-y-1">
            <li>Cadent uses display names only; no real names or emails are shown publicly</li>
            <li>Display names are filtered for inappropriate language</li>
            <li>Teachers cannot send files directly; only PDF/image assignment attachments</li>
            <li>You can revoke consent at any time by contacting support</li>
            <li>All content can be reported through the app</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => handleConsent(true)}
            disabled={verifying}
            className="w-full bg-[#22C55E] hover:bg-[#22C55E]/80 text-white font-medium h-11"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            I Approve
          </Button>
          <Button
            onClick={() => handleConsent(false)}
            disabled={verifying}
            variant="outline"
            className="w-full border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 font-medium h-11"
          >
            I Do Not Approve
          </Button>
        </div>

        <p className="text-xs text-center text-[#6B7280]">
          By approving, you confirm you are the parent or legal guardian of this student.
        </p>

        {error && (
          <p className="text-sm text-center text-[#ef4444]">{error}</p>
        )}
      </div>
    </div>
  )
}