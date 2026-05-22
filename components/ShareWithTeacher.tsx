'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Database } from '@/lib/supabase'
import { Link2, Copy, Check, Trash2, Plus } from 'lucide-react'

type TeacherShare = Database['public']['Tables']['teacher_shares']['Row']

interface ShareWithTeacherProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function ShareWithTeacher({ isOpen, onClose }: ShareWithTeacherProps = {}) {
  const { user } = useAuth()
  const supabase = createClient()

  const [shares, setShares] = useState<TeacherShare[]>([])
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isOpen !== undefined ? isOpen : internalOpen
  const setOpen = onClose ? (value: boolean) => { if (!value) onClose() } : setInternalOpen
  const [teacherName, setTeacherName] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchShares = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('teacher_shares')
      .select('*')
      .eq('student_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) {
      setShares(data)
    }
  }, [user, supabase])

  useEffect(() => {
    if (open) {
      fetchShares()
    }
  }, [open, fetchShares])

  const handleCreate = async () => {
    if (!user || !teacherName.trim()) return

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('teacher_shares')
        .insert({
          student_id: user.id,
          teacher_name: teacherName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setShares(prev => [data, ...prev])
        setTeacherName('')
      }
    } catch (error) {
      console.error('Error creating share link:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (shareId: string) => {
    setRevokingId(shareId)
    try {
      const { error } = await supabase
        .from('teacher_shares')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', shareId)

      if (error) throw error

      setShares(prev => prev.filter(s => s.id !== shareId))
    } catch (error) {
      console.error('Error revoking share link:', error)
    } finally {
      setRevokingId(null)
    }
  }

  const handleCopy = async (token: string, shareId: string) => {
    const url = `${window.location.origin}/share/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(shareId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value: boolean) => { if (!value) onClose?.() ; setInternalOpen(value) }}>
      {isOpen === undefined && (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Link2 className="size-4 mr-1.5" />
          Share with Teacher
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Progress</DialogTitle>
          <DialogDescription>
            Create a link to share your practice data with your teacher. They will be able to see your practice history, songs, and stats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new share link */}
          <div className="space-y-2">
            <Label htmlFor="teacher-name">Teacher&apos;s Name</Label>
            <div className="flex gap-2">
              <Input
                id="teacher-name"
                placeholder="e.g. Mr. Johnson"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && teacherName.trim()) {
                    handleCreate()
                  }
                }}
              />
              <Button onClick={handleCreate} disabled={!teacherName.trim() || creating}>
                <Plus className="size-4 mr-1" />
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>

          {/* Existing share links */}
          {shares.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Active Share Links</h4>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{share.teacher_name || 'Unnamed Teacher'}</p>
                        <Badge variant="secondary" className="shrink-0">Active</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Created {new Date(share.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                        {`${window.location.origin}/share/${share.token}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopy(share.token, share.id)}
                        title="Copy link"
                      >
                        {copiedId === share.id ? (
                          <Check className="size-4 text-green-600" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleRevoke(share.id)}
                        disabled={revokingId === share.id}
                        title="Revoke access"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shares.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No active share links yet. Create one above to share your progress with a teacher.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}