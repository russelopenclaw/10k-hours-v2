'use client'

import { Database } from '@/lib/supabase'
import SongCard from '@/components/SongCard'
import { Button } from '@/components/ui/button'
import { Plus, Music } from 'lucide-react'

type Song = Database['public']['Tables']['songs']['Row']

interface SongLibraryProps {
  songs: Song[]
  practiceTimes: Record<string, number>
  selectedSongId: string | null
  onSelectSong: (song: Song) => void
  onEditSong: (song: Song) => void
  onStartPractice: (song: Song) => void
  onAddSong: () => void
}

export default function SongLibrary({
  songs,
  practiceTimes,
  selectedSongId,
  onSelectSong,
  onEditSong,
  onStartPractice,
  onAddSong,
}: SongLibraryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[#F5F7FA]">My Songs</h1>
        <Button onClick={onAddSong} size="sm" className="gap-2 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover">
          <Plus className="h-4 w-4" />
          Add Song
        </Button>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-12 bg-[#181B22] rounded-2xl border border-white/[0.06]">
          <div className="w-16 h-16 bg-[#22D3EE]/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music className="h-8 w-8 text-[#22D3EE]" />
          </div>
          <h3 className="text-lg font-medium text-[#F5F7FA] mb-2">No songs yet</h3>
          <p className="text-[#9CA3AF] mb-4">Add your first song to start practicing</p>
          <Button onClick={onAddSong} className="gap-2 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9]">
            <Plus className="h-4 w-4" />
            Add Your First Song
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3">
          {songs.map(song => (
            <SongCard
              key={song.id}
              song={song}
              totalTime={practiceTimes[song.id] || 0}
              isSelected={selectedSongId === song.id}
              onSelect={onSelectSong}
              onEdit={onEditSong}
              onStartPractice={onStartPractice}
            />
          ))}
        </div>
      )}
    </div>
  )
}