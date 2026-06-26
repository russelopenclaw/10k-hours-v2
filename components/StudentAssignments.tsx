'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Clock, Target, CheckCircle2, Circle, Loader2, RefreshCw, Plus, Paperclip, Download, FileText, Image } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Assignment = Database['public']['Tables']['assignments']['Row']

interface AttachmentInfo {
  name: string
  size?: number
  type?: string
  url: string
}

export default function StudentAssignments({ onAssignmentsLoaded, onAddToLibrary }: { onAssignmentsLoaded?: (assignments: Assignment[]) => void, onAddToLibrary?: (assignment: Assignment) => void }) {
  const { user, getSession } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [attachments, setAttachments] = useState<Record<string, AttachmentInfo | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const session = await getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/teacher/assignments?role=student', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      if (res.ok && data.assignments) {
        setAssignments(data.assignments)
        onAssignmentsLoaded?.(data.assignments)

        // Fetch attachments for each assignment
        data.assignments.forEach(async (a: Assignment) => {
          try {
            const attRes = await fetch(`/api/assignments/${a.id}/attachment`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
            })
            const attData = await attRes.json()
            if (attRes.ok && attData.attachment) {
              setAttachments(prev => ({ ...prev, [a.id]: attData.attachment }))
            }
          } catch {
            // Attachment fetch is non-critical, just skip
          }
        })
      } else {
        setError('Failed to load assignments')
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
      setError('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Don't fetch until user is available
    if (!user) {
      setLoading(false)
      return
    }
    fetchAssignments()
    // Safety: never spin forever
    const timeout = setTimeout(() => setLoading(false), 10000)
    return () => clearTimeout(timeout)
  }, [user])

  const updateStatus = async (assignmentId: string, newStatus: 'in_progress' | 'completed') => {
    try {
      const session = await getSession()
      if (!session) return

      const res = await fetch('/api/teacher/assignments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: assignmentId, status: newStatus })
      })

      if (res.ok) {
        const updated = assignments.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a)
        setAssignments(updated)
        onAssignmentsLoaded?.(updated)
      }
    } catch (err) {
      console.error('Failed to update assignment:', err)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Circle className="h-5 w-5 text-[#6B7280]" />
      case 'in_progress': return <Clock className="h-5 w-5 text-[#f59e0b]" />
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
      default: return <Circle className="h-5 w-5 text-[#6B7280]" />
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigned'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      default: return status
    }
  }

  // Goal date urgency: red (overdue), yellow (0-3 days), green (4+ days)
  const goalDateDot = (dueAt: string | null) => {
    if (!dueAt) return null
    const now = new Date()
    const due = new Date(dueAt)
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilDue < 0) return { color: '#ef4444', label: `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}` }
    if (daysUntilDue <= 3) return { color: '#f59e0b', label: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}` }
    return { color: '#22c55e', label: `Due in ${daysUntilDue} days` }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-[#22D3EE] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-[#181B22] border-white/[0.06]">
        <CardContent className="p-12 text-center">
          <ClipboardList className="h-12 w-12 text-[#27272a] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#F5F7FA] mb-2">Couldn't load assignments</h3>
          <p className="text-sm text-[#9CA3AF] mb-4">{error}</p>
          <button
            onClick={() => fetchAssignments()}
            className="inline-flex items-center gap-2 text-sm text-[#22D3EE] hover:text-[#67E8F9]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  if (assignments.length === 0) {
    return (
      <Card className="bg-[#181B22] border-white/[0.06]">
        <CardContent className="p-12 text-center">
          <ClipboardList className="h-12 w-12 text-[#27272a] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#F5F7FA] mb-2">No assignments yet</h3>
          <p className="text-sm text-[#9CA3AF]">
            Your teacher can assign practice pieces with goals and target tempos. They&apos;ll appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  const active = assignments.filter(a => a.status !== 'completed')
  const completed = assignments.filter(a => a.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Active Assignments */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#9CA3AF] uppercase tracking-wide">Active</h3>
          {active.map(assignment => (
            <Card key={assignment.id} className="bg-[#181B22] border-white/[0.06] hover:border-white/[0.12] transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {statusIcon(assignment.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-[#F5F7FA] truncate">{assignment.title}</h4>
                      <span className="text-xs text-[#6B7280] ml-2 shrink-0">{statusLabel(assignment.status)}</span>
                    </div>
                    {assignment.goal && (
                      <div className="flex items-center gap-1 mt-1">
                        <Target className="h-3 w-3 text-[#5e6ad2]" />
                        <p className="text-xs text-[#9CA3AF]">{assignment.goal}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280]">
                      {assignment.tempo && (
                        <span>🎯 {assignment.tempo} BPM</span>
                      )}
                      {(() => {
                        const dot = goalDateDot(assignment.due_at)
                        if (dot) {
                          return (
                            <span className="flex items-center gap-1.5" title={dot.label}>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot.color }} />
                              <span>{dot.label}</span>
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                    {assignment.notes && (
                      <p className="text-xs text-[#6B7280] mt-1 italic">{assignment.notes}</p>
                    )}
                    {/* Attachment */}
                    {attachments[assignment.id] && (
                      <a
                        href={attachments[assignment.id]!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-white/[0.12] transition-colors"
                      >
                        {attachments[assignment.id]!.type?.startsWith('image/') ? (
                          <Image className="h-3.5 w-3.5 text-blue-400" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span className="truncate max-w-[140px]">{attachments[assignment.id]!.name}</span>
                        <Download className="h-3 w-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pl-8">
                  {assignment.status === 'assigned' && (
                    <>
                      {onAddToLibrary && !assignment.song_id && (
                        <button
                          onClick={() => onAddToLibrary(assignment)}
                          className="text-xs px-3 py-1 bg-[#22D3EE]/10 text-[#22D3EE] rounded-full hover:bg-[#22D3EE]/20 transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add to Library
                        </button>
                      )}
                    </>
                  )}
                  {assignment.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => updateStatus(assignment.id, 'completed')}
                        className="text-xs px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] rounded-full hover:bg-[#22c55e]/20 transition-colors"
                      >
                        Mark Complete
                      </button>
                      {onAddToLibrary && !assignment.song_id && (
                        <button
                          onClick={() => onAddToLibrary(assignment)}
                          className="text-xs px-3 py-1 bg-[#22D3EE]/10 text-[#22D3EE] rounded-full hover:bg-[#22D3EE]/20 transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add to Library
                        </button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Assignments */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide">Completed</h3>
          {completed.map(assignment => (
            <Card key={assignment.id} className="bg-[#181B22] border-white/[0.06] opacity-60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {statusIcon(assignment.status)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-[#9CA3AF] truncate">{assignment.title}</h4>
                    {assignment.goal && (
                      <p className="text-xs text-[#525252]">{assignment.goal}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}