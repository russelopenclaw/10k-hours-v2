'use client'

import { useState } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Settings, Clock } from 'lucide-react'
import { Database } from '@/lib/supabase'

type Song = Database['public']['Tables']['songs']['Row']

interface SongCardProps {
  song: Song
  totalTime: number
  isSelected: boolean
  onSelect: (song: Song) => void
  onEdit: (song: Song) => void
  onStartPractice: (song: Song) => void
}

export default function SongCard({
  song,
  totalTime = 0,
  isSelected = false,
  onSelect,
  onEdit,
  onStartPractice,
}: SongCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleClick = () => {
    onSelect(song)
  }

  const handleStartPractice = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    onStartPractice(song)
    setTimeout(() => setIsLoading(false), 500)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(song)
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] min-h-[120px] sm:min-h-[100px] ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-5 h-5 sm:w-4 sm:h-4 rounded-full shrink-0 border border-gray-200"
            style={{ backgroundColor: song.color }}
          />
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{song.title}</CardTitle>
            {song.artist && (
              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
            )}
          </div>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleEdit}
            title="Edit Song"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-medium">{formatTime(totalTime)}</span>
          </div>
          {song.metronome_bpm && (
            <div className="text-muted-foreground font-medium">
              {song.metronome_bpm} BPM
            </div>
          )}
        </div>

        {song.notes && (
          <div className="bg-muted rounded-lg p-3 sm:p-2">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {song.notes.substring(0, 120)}
              {song.notes.length > 120 && '...'}
            </p>
          </div>
        )}

        <Button
          onClick={handleStartPractice}
          className="w-full h-11 sm:h-9 text-base sm:text-sm font-medium"
          disabled={isLoading}
        >
          <Play className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          {isLoading ? 'Starting...' : 'Start Practice'}
        </Button>
      </CardContent>
    </Card>
  )
}