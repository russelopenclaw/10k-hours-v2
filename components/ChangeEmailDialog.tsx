'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ChangeEmailDialogProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
  onUpdateEmail: (email: string) => Promise<void>
}

export default function ChangeEmailDialog({
  isOpen,
  onClose,
  currentEmail,
  onUpdateEmail,
}: ChangeEmailDialogProps) {
  const [newEmail, setNewEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newEmail === currentEmail) {
      setError('New email must be different from your current email')
      return
    }

    setIsSubmitting(true)
    try {
      await onUpdateEmail(newEmail)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNewEmail('')
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Email</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-green-600 font-medium">Verification emails sent.</p>
            <p className="text-sm text-gray-600">
              Check both your old email ({currentEmail}) and your new email ({newEmail}) to confirm the change.
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Email</Label>
              <p className="text-sm text-gray-500">{currentEmail}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="Enter new email address"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Change Email'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}