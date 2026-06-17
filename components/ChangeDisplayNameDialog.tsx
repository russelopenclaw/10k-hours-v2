'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ChangeDisplayNameDialogProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  onUpdateDisplayName: (name: string) => Promise<void>
}

export default function ChangeDisplayNameDialog({
  isOpen,
  onClose,
  currentName,
  onUpdateDisplayName,
}: ChangeDisplayNameDialogProps) {
  const [name, setName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Display name cannot be empty')
      return
    }

    setIsSubmitting(true)
    try {
      await onUpdateDisplayName(trimmed)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update display name')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName(currentName)
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Display Name</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-green-600 font-medium">Display name updated successfully.</p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Name'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}