'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Clock, Target, ChevronRight, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Assignment = Database['public']['Tables']['assignments']['Row']

export default function StudentAssignments() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAssignments = async () => {
    if (!user) return
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/teacher/assignments?role=student', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      if (res.ok && data.assignments) {
        setAssignments(data.assignments)
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [user])

  const updateStatus = async (assignmentId: string, newStatus: 'in_progress' | 'completed') => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
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
        setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a))
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-[#22D3EE] animate-spin" />
      </div>
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
                      {assignment.due_at && (
                        <span>📅 Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    {assignment.notes && (
                      <p className="text-xs text-[#6B7280] mt-1 italic">{assignment.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pl-8">
                  {assignment.status === 'assigned' && (
                    <button
                      onClick={() => updateStatus(assignment.id, 'in_progress')}
                      className="text-xs px-3 py-1 bg-[#f59e0b]/10 text-[#f59e0b] rounded-full hover:bg-[#f59e0b]/20 transition-colors"
                    >
                      Start Practicing
                    </button>
                  )}
                  {assignment.status === 'in_progress' && (
                    <button
                      onClick={() => updateStatus(assignment.id, 'completed')}
                      className="text-xs px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] rounded-full hover:bg-[#22c55e]/20 transition-colors"
                    >
                      Mark Complete
                    </button>
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