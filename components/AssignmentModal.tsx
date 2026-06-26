'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import { Loader2, Upload, X, FileText, Image } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { validateAttachment, MAX_FILE_SIZE_LABEL, ALLOWED_EXTENSIONS, generateAttachmentPath } from '@/lib/attachments'
import type { StudentWithStats } from './TeacherRoster'

interface AssignmentModalProps {
  student: StudentWithStats
  teacherId: string
  onClose: () => void
  onAssigned: () => void
}

export default function AssignmentModal({ student, teacherId, onClose, onAssigned }: AssignmentModalProps) {
  const { getSession } = useAuth()
  const [title, setTitle] = useState('')
  const [tempo, setTempo] = useState('')
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const session = await getSession()
      if (!session) {
        setError('You must be logged in. Please refresh and try again.')
        return
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

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
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const data = await res.json()

      if (!res.ok) {
        console.error('[AssignmentModal] API error:', res.status, data.error)
        setError(data.error || 'Failed to create assignment.')
        return
      }

      // Upload attachment if one was selected
      if (attachment && data.assignment?.id) {
        const supabase = createClient()
        const filePath = generateAttachmentPath(teacherId, data.assignment.id, attachment.name)
        const { error: uploadError } = await supabase.storage
          .from('assignment-attachments')
          .upload(filePath, attachment, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('[AssignmentModal] Upload error:', uploadError)
          // Assignment was created, attachment failed — don't block
          setError('Assignment created, but file upload failed. You can re-attach it later.')
        }
      }

      onAssigned()
      onClose()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.')
      } else {
        console.error('[AssignmentModal] Unexpected error:', err)
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateAttachment(file)
    if (!validation.valid) {
      setAttachmentError(validation.error || 'Invalid file')
      setAttachment(null)
      return
    }

    setAttachmentError('')
    setAttachment(file)
  }

  const handleRemoveFile = () => {
    setAttachment(null)
    setAttachmentError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="h-4 w-4 text-red-400" />
    return <Image className="h-4 w-4 text-blue-400" />
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

          {/* File Attachment */}
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Attachment (optional)</label>
            <p className="text-xs text-[#6B7280] mb-2">PDF or image, up to {MAX_FILE_SIZE_LABEL}</p>
            {!attachment ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-[#27272a] rounded-lg p-4 text-center text-sm text-[#9CA3AF] hover:border-[#5e6ad2] hover:text-[#F5F7FA] transition-colors"
              >
                <Upload className="h-5 w-5 mx-auto mb-1" />
                Click to attach a file
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#0d0d0f] border border-[#27272a] rounded-lg p-3">
                {fileIcon(attachment.name)}
                <span className="text-sm text-[#F5F7FA] truncate flex-1">{attachment.name}</span>
                <span className="text-xs text-[#6B7280] shrink-0">
                  {(attachment.size / (1024 * 1024)).toFixed(1)} MB
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-[#6B7280] hover:text-[#ef4444] transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            {attachmentError && (
              <p className="text-xs text-[#ef4444] mt-1">{attachmentError}</p>
            )}
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