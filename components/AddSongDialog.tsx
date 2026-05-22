'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Database } from '@/lib/supabase'

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

interface AddSongDialogProps {
  isOpen: boolean
  onClose: () => void
  onSongCreated: (song: Song) => void
}

export default function AddSongDialog({
  isOpen,
  onClose,
  onSongCreated,
}: AddSongDialogProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [color, setColor] = useState(songColors[0])
  const [bpm, setBpm] = useState(120)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const { data: existingSongs } = await supabase
        .from('songs')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nextPosition = existingSongs && existingSongs.length > 0
        ? (existingSongs[0] as any).position + 1
        : 0

      const { data: newSong, error: insertError } = await supabase
        .from('songs')
        .insert({
          user_id: user.id,
          title: title.trim(),
          artist: artist.trim() || null,
          color,
          metronome_bpm: bpm,
          notes: notes.trim() || null,
          position: nextPosition,
        } as any)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      onSongCreated(newSong)

      setTitle('')
      setArtist('')
      setColor(songColors[0])
      setBpm(120)
      setNotes('')
      onClose()
    } catch (err: unknown) {
      console.error('Error creating song:', err)
      setError(err instanceof Error ? err.message : 'Failed to create song')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Song</DialogTitle>
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

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end pt-4 border-t">
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
              {isSubmitting ? 'Creating...' : 'Add Song'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}