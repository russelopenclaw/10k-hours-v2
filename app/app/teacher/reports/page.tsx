'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle, Loader2, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'

interface Report {
  id: string
  content_type: string
  content_id: string | null
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter: { id: string; display_name: string | null; full_name: string | null } | null
  reported_user: { id: string; display_name: string | null; full_name: string | null } | null
}

export default function ReportsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchReports = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch('/api/reports', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load reports')
          return
        }

        setReports(data.reports || [])
      } catch {
        setError('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [user])

  const handleUpdate = async (id: string, status: 'dismissed' | 'escalated') => {
    setUpdating(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id, status })
      })

      if (res.ok) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      }
    } catch {
      // Non-critical, just keep the current state
    } finally {
      setUpdating(null)
    }
  }

  const getName = (p: Report['reporter'] | Report['reported_user']) => {
    if (!p) return 'Unknown'
    return p.display_name || p.full_name || 'Anonymous'
  }

  const reasonLabel: Record<string, string> = {
    inappropriate_content: 'Inappropriate content',
    offensive_language: 'Offensive language',
    spam: 'Spam',
    harassment: 'Harassment',
    other: 'Other',
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">Pending</span>
      case 'dismissed': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#6B7280]/10 text-[#6B7280] border border-[#6B7280]/20">Dismissed</span>
      case 'escalated': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20">Escalated</span>
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0D10]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/app/teacher" className="text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#F5F7FA]">Content Reports</h1>
            <p className="text-sm text-[#9CA3AF]">Review reports about your students</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-[#22D3EE] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#9CA3AF]">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-[#6B7280] mx-auto mb-3" />
            <h3 className="text-lg font-medium text-[#F5F7FA] mb-1">No reports</h3>
            <p className="text-sm text-[#9CA3AF]">
              When students report content, it will appear here for your review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <Card key={report.id} className="bg-[#181B22] border-white/[0.06]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                      <span className="text-sm font-medium text-[#F5F7FA]">
                        {reasonLabel[report.reason] || report.reason}
                      </span>
                    </div>
                    {statusBadge(report.status)}
                  </div>

                  <div className="text-xs text-[#9CA3AF] space-y-1">
                    <p>Reported by: <strong className="text-[#F5F7FA]">{getName(report.reporter)}</strong></p>
                    <p>Reported user: <strong className="text-[#F5F7FA]">{getName(report.reported_user)}</strong></p>
                    <p>Content type: {report.content_type}</p>
                    <p>Reported: {new Date(report.created_at).toLocaleDateString()}</p>
                  </div>

                  {report.description && (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                      <p className="text-xs text-[#9CA3AF] italic">{report.description}</p>
                    </div>
                  )}

                  {report.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#6B7280]/30 text-[#6B7280] hover:bg-[#6B7280]/10 hover:text-[#9CA3AF]"
                        disabled={updating === report.id}
                        onClick={() => handleUpdate(report.id, 'dismissed')}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border border-[#ef4444]/30"
                        disabled={updating === report.id}
                        onClick={() => handleUpdate(report.id, 'escalated')}
                      >
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        Escalate
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}