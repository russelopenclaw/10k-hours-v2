'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { StudentWithStats } from './TeacherRoster'

interface AssignmentModalProps {
  student: StudentWithStats
  teacherId: string
  onClose: () => void
  onAssigned: () => void
}

export default function AssignmentModal({ student, teacherId, onClose, onAssigned }: AssignmentModalProps) {
  const [title, setTitle] = useState('')
  const [tempo, setTempo] = useState('')
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const supabase = (await import('@/lib/supabase')).createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('You must be logged in.')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          student_id: student.profile.id,
          title: title.trim(),
          tempo: tempo ? parseInt(tempo) : null,
          goal: goal.trim() || null,
          notes: notes.trim() || null,
          due_at: dueDate || null,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create assignment.')
        setSubmitting(false)
        return
      }

      onAssigned()
      onClose()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#151518] border border-[#27272a] rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-[#F5F7FA] mb-1">Assign Piece</h2>
        <p className="text-sm text-[#9CA3AF] mb-4">
          Assign a practice piece to <span className="text-[#22D3EE]">{student.profile.full_name || student.profile.email.split('@')[0]}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Piece Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Moonlight Sonata, 1st Movement"
              className="w-full bg-[#0d0d0f] border border-[#27272a] rounded-md px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#5e6ad2] min-h-[44px]"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">Target Tempo (BPM)</label>
              <input
                type="number"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                placeholder="e.g., 120"
                className="w-full bg-[#0d0d0f] border border-[#27272a] rounded-md px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#5e6ad2] min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0d0d0f] border border-[#27272a] rounded-md px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#5e6ad2] min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Play from memory with correct fingering"
              className="w-full bg-[#0d0d0f] border border-[#27272a] rounded-md px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#5e6ad2] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional instructions..."
              rows={2}
              className="w-full bg-[#0d0d0f] border border-[#27272a] rounded-md px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#5e6ad2] resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-[#ef4444]">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#F5F7FA]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || submitting}
              className="bg-[#5e6ad2] hover:bg-[#4f5bb5] text-white gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}