'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Database } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'

type Song = Database['public']['Tables']['songs']['Row']

const songColors = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
]

interface EditSongDialogProps {
  isOpen: boolean
  onClose: () => void
  onSongUpdated: (song: Song) => void
  onSongDeleted: (songId: string) => void
  song: Song | null
}

export default function EditSongDialog({
  isOpen,
  onClose,
  onSongUpdated,
  onSongDeleted,
  song,
}: EditSongDialogProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [color, setColor] = useState(songColors[0])
  const [bpm, setBpm] = useState(120)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (song) {
      setTitle(song.title)
      setArtist(song.artist || '')
      setColor(songColors.includes(song.color) ? song.color : songColors[0])
      setBpm(song.metronome_bpm || 120)
      setNotes(song.notes || '')
      setConfirmDelete(false)
    }
  }, [song])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !song || !title.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const { data: updatedSong, error: updateError } = await supabase
        .from('songs')
        .update({
          title: title.trim(),
          artist: artist.trim() || null,
          color,
          metronome_bpm: bpm,
          notes: notes.trim() || null,
        })
        .eq('id', song.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      onSongUpdated(updatedSong)
      onClose()
    } catch (err: unknown) {
      console.error('Error updating song:', err)
      setError(err instanceof Error ? err.message : 'Failed to update song')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!song) return

    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .eq('id', song.id)

      if (deleteError) {
        throw deleteError
      }

      onSongDeleted(song.id)
      onClose()
    } catch (err: unknown) {
      console.error('Error deleting song:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete song')
      setConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!song) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Song</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-4">
          {error && (
            <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="title" className="text-sm font-medium mb-2 block">Song Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              required
              disabled={isSubmitting}
              className="h-12 text-base sm:h-8 sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="artist" className="text-sm font-medium mb-2 block">Artist (Optional)</Label>
            <Input
              id="artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
              disabled={isSubmitting}
              className="h-12 text-base sm:h-8 sm:text-sm"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">BPM: {bpm}</Label>
            <Slider
              min={40}
              max={200}
              step={1}
              value={[bpm]}
              onValueChange={(value) => setBpm(typeof value === 'number' ? value : value[0])}
              className="mt-2"
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>40</span>
              <span>200</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Color</Label>
            <div className="flex flex-wrap gap-3">
              {songColors.map((songColor) => (
                <button
                  key={songColor}
                  type="button"
                  className={`w-11 h-11 sm:w-9 sm:h-9 rounded-full border-2 transition-all ${
                    color === songColor
                      ? 'border-foreground scale-110'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: songColor }}
                  onClick={() => setColor(songColor)}
                  disabled={isSubmitting}
                  aria-label={`Select color ${songColor}`}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium mb-2 block">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this song..."
              className="min-h-[120px] text-base sm:text-sm resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-11 sm:h-8 text-base sm:text-sm order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="h-11 sm:h-8 text-base sm:text-sm order-1 sm:order-2"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <Button
              type="button"
              variant={confirmDelete ? 'destructive' : 'outline'}
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="w-full h-11 sm:h-8 text-base sm:text-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete Song'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}