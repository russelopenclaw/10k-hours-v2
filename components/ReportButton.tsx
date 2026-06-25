'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Flag, X } from 'lucide-react'

interface ReportButtonProps {
  contentType: 'assignment' | 'attachment' | 'display_name' | 'profile' | 'other'
  contentId: string
  className?: string
}

const REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'offensive', label: 'Offensive or hurtful' },
  { value: 'spam', label: 'Spam or irrelevant' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'other', label: 'Other' },
] as const

export default function ReportButton({ contentType, contentId, className = '' }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reason) return

    setSubmitting(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: reportError } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          content_type: contentType,
          content_id: contentId,
          reason,
          description: description.trim() || null,
        })

      if (reportError) throw reportError
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting report:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setReason('')
    setDescription('')
    setError('')
    setSubmitted(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`text-[#6B7280] hover:text-[#9CA3AF] transition-colors ${className}`}
        title="Report this content"
        aria-label="Report this content"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleClose}>
          <div
            className="bg-[#181B22] border border-white/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-green-500/[0.08] rounded-full flex items-center justify-center mx-auto">
                  <Flag className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#F5F7FA]">Report Submitted</h3>
                <p className="text-sm text-[#9CA3AF]">
                  Thank you. We'll review this content and take appropriate action.
                </p>
                <Button onClick={handleClose} className="bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9]">
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#F5F7FA]">Report Content</h3>
                  <button onClick={handleClose} className="text-[#6B7280] hover:text-[#F5F7FA]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                        reason === r.value
                          ? 'border-[#22D3EE]/40 bg-[#22D3EE]/[0.08] text-[#22D3EE]'
                          : 'border-white/[0.06] text-[#9CA3AF] hover:border-white/[0.12] hover:text-[#F5F7FA]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Tell us more (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0F1115] border border-white/[0.06] rounded-xl p-3 text-sm text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 focus-visible:outline-none resize-none"
                />

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                    className="bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}